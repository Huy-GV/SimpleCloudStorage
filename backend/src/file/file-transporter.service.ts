import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as archiver from 'archiver';
import axios from 'axios';
import { existsSync, createWriteStream, createReadStream } from 'fs';
import { mkdir, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { DatabaseService } from '../database/database.service';
import { S3InterfaceService } from '../s3-interface/s3-interface.service';
import { EmptyResult, DataResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { DownloadFileViewModel } from '../data/viewModels/downloadFilesViewModel';
import { UploadFileViewModel } from '../data/viewModels/uploadFileViewModel';

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

			const s3UploadResult = await this.s3Service.uploadFile(viewModel.file);
			if (!s3UploadResult.successful) {
				throw new Error(s3UploadResult.statusText);
			}

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

			return new EmptyResult(ResultCode.Success);
		}, {
			timeout: 15000
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

		const tempDirectoryName = this.createTemporaryDirectoryName(userId);
		const downloadDirectoryPath = this.config.get<string>('DOWNLOAD_DIR')
			?? join(process.cwd(), 'downloads');

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
			for (const [index, file] of files.entries()) {
				await this.addDownloadEntryToZip(index, file, archive, tempDirectoryPath, rootZipFileName)
			}

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

	private async userExists(userId: number) {
		return userId != null && this.database.user.findFirst({ where: { id: userId } }).then(Boolean);
	}

	private async addDownloadEntryToZip(
		index: number,
		file: {
			id: number,
			uri: string,
			name: string,
			isDirectory: boolean,
		},
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		rootZipFileName: string,
	) {
		if (file.isDirectory) {
			await this.addDirectoryToZip(
				file,
				index,
				archive,
				tempDirectoryPath,
				rootZipFileName,
			);
		} else {
			await this.addFileToZip(
				file,
				index,
				archive,
				tempDirectoryPath,
				rootZipFileName,
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
		directoryIndex: number,
		archive: archiver.Archiver,
		tempParentDirectoryPath: string,
		zipParentDirectoryPath: string,
	): Promise<void> {
		// index within the parent directory is used instead of the current directory name to keep the path of temporary download directory as short as possible.
		const currentTempDirectoryPath = join(
			tempParentDirectoryPath,
			directoryIndex.toString(),
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

		for (const [index, file] of files.entries()) {
			await this.addDownloadEntryToZip(index, file, archive, currentTempDirectoryPath, currentZipDirectoryPath);
		}
	}

	private async addFileToZip(
		file: { name: string; uri: string },
		index: number,
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		zipDirectoryPath: string,
	) {
		const signedUrl = await this.s3Service.getPublicUrl(file.uri);

		// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
		const response = await axios({
			method: 'get',
			url: signedUrl,
			responseType: 'stream',
		});

		const downloadedFileStream = response.data;

		// index within the parent directory is used instead of the current file name to keep the path of temporary download directory as short as possible.
		const tempFilePath = join(tempDirectoryPath, index.toString());
		const zipFilePath = join(zipDirectoryPath, file.name);

		// wait until the s3 object is written to the temporary directory
		await new Promise<void>((resolve, reject) => {
			const fileWriteStream = createWriteStream(tempFilePath);
			downloadedFileStream.pipe(fileWriteStream);
			fileWriteStream.on('close', resolve);
			fileWriteStream.on('error', reject);
		});

		const fileReadStream = createReadStream(tempFilePath);
		archive.append(fileReadStream, { name: zipFilePath });
	}

	private createTemporaryDirectoryName(userId: number) {
		const timestamp = new Date().getTime();
		return `${userId}_${timestamp}`;
	}
}
