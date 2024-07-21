import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as archiver from 'archiver';
import { existsSync, createWriteStream, createReadStream, ReadStream } from 'fs';
import { mkdir, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { DatabaseService } from '../database/database.service';
import { S3InterfaceService } from '../s3-interface/s3-interface.service';
import { EmptyResult, DataResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { DownloadFileViewModel } from '../data/viewModels/downloadFilesViewModel';
import { UploadFileViewModel } from '../data/viewModels/uploadFileViewModel';
import { randomUUID } from 'crypto';

@Injectable()
export class FileTransporter {
	private readonly logger = new Logger(FileTransporter.name);

	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
		private readonly config: ConfigService
	) {}

	async uploadFile(
		userId: number,
		viewModel: UploadFileViewModel,
	): Promise<Result> {
		if (!await this.userExists(userId)) {
			return new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${userId} not found`,
			);
		}

		return await this.database.$transaction(async (transaction) => {
			const savedName = viewModel.file.originalname;

			const filesWithIdenticalNameInSharedDirectoryCount =
				await transaction.file.count({
					where: {
						name: savedName,
						parentFileId: viewModel.directoryFileId,
						ownerUserId: userId
					},
				});

			if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
				return new EmptyResult(
					ResultCode.InvalidArguments,
					`File or directory with name '${savedName}' already exists in the upload directory`,
				);
			}

			const s3UploadResult = await this.s3Service.uploadFile(viewModel.file, userId);
			if (!s3UploadResult.successful) {
				throw new Error(s3UploadResult.statusText);
			}

			try {
				await transaction.file.create({
					data: {
						name: savedName,
						parentFileId: viewModel.directoryFileId,
						uri: s3UploadResult.data,
						ownerUserId: userId,
						creationTime: new Date(),
						sizeKb: viewModel.file.size / 1000,
						isDirectory: false,
					},
				});

			} catch (error) {
				this.logger.error(`Failed to add file to database: ${error}`);
				this.logger.log(`Deleting uploaded S3 file`);
				const deleteResult = await this.s3Service.deleteObjects([s3UploadResult.data]);
				if (!deleteResult.successful) {
					this.logger.log(`Failed to delete recently upload file: ${deleteResult.statusText}`);
				}

				return new EmptyResult(ResultCode.UnspecifiedError);
			}


			return new EmptyResult(ResultCode.Success);
		}, {
			timeout: 20000
		});
	}

	private expandEnvVariables(path: string) {
        return path.replace(/%([^%]+)%/g, (_, n) => process.env[n])
    }

	async downloadFiles(
		downloadFileViewModel: DownloadFileViewModel,
		userId: number,
	): Promise<Result<StreamableFile>> {
		if (!await this.userExists(userId)) {
			return new DataResult(
				ResultCode.Unauthorized,
				null,
				`User ID ${userId} not found`,
			);
		}

		const tempDirectoryName = `${userId}_${randomUUID()}`;
		const downloadDirectoryPath = this.config.get<string>('DOWNLOAD_DIR', join(process.cwd(), 'downloads'));

		const tempDirectoryPath = join(
			this.expandEnvVariables(downloadDirectoryPath),
			tempDirectoryName,
		);

		const fullZipFilePath = `${tempDirectoryPath}.zip`;

		try {
			await this.ensureDirectoryExisted(tempDirectoryPath);
			const archive = archiver('zip', { zlib: { level: 9 } });
			const downloadDirectoryStream = createWriteStream(fullZipFilePath);
			archive.pipe(downloadDirectoryStream);

			const files = await this.database.file.findMany({
				where: {
					ownerUserId: userId,
					id: {
						in: downloadFileViewModel.fileIds,
					},
				},
				select: {
					id: true,
					uri: true,
					name: true,
					isDirectory: true,
				},
			});

			if (files.length != downloadFileViewModel.fileIds.length) {
				return new DataResult(ResultCode.NotFound);
			}

			const rootZipFileName = '';
			await this.downloadFilesInDirectory(files, archive, tempDirectoryPath, rootZipFileName)
			await archive.finalize();
			const downloadStream = this.createStreamableZipFile(tempDirectoryPath, fullZipFilePath);
			return new DataResult(
				ResultCode.Success,
				new StreamableFile(downloadStream),
			);
		} catch (e) {
			this.logger.error('Error zipping files: ' + e);
			await this.ensureTemporaryFilesDeleted(
				fullZipFilePath,
				tempDirectoryPath,
			);

			return new DataResult(ResultCode.InvalidState);
		}
	}

	private createStreamableZipFile(tempDirectoryPath: string, fullZipFilePath: string) {
		const readStream = createReadStream(`${tempDirectoryPath}.zip`);

		// delete the temporary directory and zip file
		readStream.on('close', async () => {
			await this.ensureTemporaryFilesDeleted(
				fullZipFilePath,
				tempDirectoryPath,
			);
		});

		readStream.on('error', (e) => {
			this.logger.error(`Error downloading files '${e.name}': '${e.message}'`);
		});

		return readStream;
	}

	private async downloadFilesInDirectory(
		files: {
			id: number;
			name: string;
			uri: string;
			isDirectory: boolean;
		}[],
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		zipDirectoryPath: string
	) {
		for (const [index, file] of files.entries()) {
			await this.addDownloadEntryToZip(index.toString(), file, archive, tempDirectoryPath, zipDirectoryPath)
		}
	}

	private async userExists(userId: number) {
		return userId != null && this.database.user.findFirst({ where: { id: userId } }).then(Boolean);
	}

	private async addDownloadEntryToZip(
		tempEntryName: string,
		file: {
			id: number,
			uri: string,
			name: string,
			isDirectory: boolean,
		},
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		zipDirectoryPath: string,
	) {
		if (file.isDirectory) {
			await this.addDirectoryToZip(
				file,
				tempEntryName,
				archive,
				tempDirectoryPath,
				zipDirectoryPath,
			);
		} else {
			await this.addFileToZip(
				file,
				tempEntryName,
				archive,
				tempDirectoryPath,
				zipDirectoryPath,
			);
		}
	}

	private async ensureTemporaryFilesDeleted(
		zipFilePath: string,
		tempDirectoryPath: string,
	) {
		try {
			await unlink(zipFilePath);
		} catch (e) {
			this.logger.error(
				`Failed to delete temporary zip file at '${zipFilePath}': ${e}`,
			);
		}

		try {
			await rm(tempDirectoryPath, { recursive: true, force: true });
		} catch (e) {
			this.logger.error(
				`Failed to delete temporary download directory at '${tempDirectoryPath}': ${e}`,
			);
		}
	}

	private async ensureDirectoryExisted(directoryPath: string) {
		if (!existsSync(directoryPath)) {
			await mkdir(directoryPath, { recursive: true });
		}
	}

	private async addDirectoryToZip(
		directoryFile: { id: number; name: string; },
		tempDirectoryName: string,
		archive: archiver.Archiver,
		tempParentDirectoryPath: string,
		zipParentDirectoryPath: string,
	): Promise<void> {
		/*
		index within the parent directory is used instead of the current file name
		to minimize the path length of the temporary download directory
		*/
		const currentTempDirectoryPath = join(
			tempParentDirectoryPath,
			tempDirectoryName,
		);

		const currentZipDirectoryPath = join(
			zipParentDirectoryPath,
			directoryFile.name,
		);

		await this.ensureDirectoryExisted(currentTempDirectoryPath);

		const files = await this.database.file.findMany({
			where: {
				parentFileId: directoryFile.id,
			},
			select: {
				id: true,
				uri: true,
				name: true,
				isDirectory: true,
			},
		});

		// archive.directory() does not work if directory is empty
		archive.append('', { name: `${currentZipDirectoryPath}/` });
		await this.downloadFilesInDirectory(files, archive, currentTempDirectoryPath, currentZipDirectoryPath);
	}

	private async addFileToZip(
		file: { name: string; uri: string },
		tempFileName: string,
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		zipDirectoryPath: string,
	) {
		const downloadedFileStream = await this.s3Service.downloadFile(file.uri);

		/*
		index within the parent directory is used instead of the current file name
		to minimize the path length of the temporary download directory
		*/
		const tempFilePath = join(tempDirectoryPath, tempFileName);
		const zipFilePath = join(zipDirectoryPath, file.name);

		// wait until the s3 object is written to the temporary directory
		await new Promise<void>((resolve, reject) => {
			const fileWriteStream = createWriteStream(tempFilePath);
			downloadedFileStream.pipe(fileWriteStream);
			fileWriteStream.on('close', resolve);
			fileWriteStream.on('error', reject);
		});

		const tempFileReadStream = createReadStream(tempFilePath);
		archive.append(tempFileReadStream, { name: zipFilePath });
	}
}
