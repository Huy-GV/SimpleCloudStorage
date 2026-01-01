import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as archiver from 'archiver';
import { join } from 'path';
import { DatabaseService } from '../database/database.service';
import { S3InterfaceService } from '../s3-interface/s3-interface.service';
import { EmptyResult, DataResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { DownloadFileViewModel } from '../data/viewModels/downloadFilesViewModel';
import { UploadFileViewModel } from '../data/viewModels/uploadFileViewModel';
import { Readable } from 'stream';

@Injectable()
export class FileTransporter {
	private readonly logger = new Logger(FileTransporter.name);
	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
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

		const savedName = viewModel.file.originalname;
		const s3UploadResult = await this.s3Service.uploadFile(viewModel.file, userId);
		if (!s3UploadResult.successful) {
			return s3UploadResult;
		}

		try {
			await this.database.file.create({
				data: {
					name: savedName,
					parentFileId: viewModel.directoryFileId,
					uri: s3UploadResult.data!,
					ownerUserId: userId,
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
	}

	async downloadFiles(
		downloadFileViewModel: DownloadFileViewModel,
		userId: number,
	): Promise<Result<StreamableFile | null>> {
		if (!await this.userExists(userId)) {
			return new DataResult(
				ResultCode.Unauthorized,
				null,
				`User ID ${userId} not found`,
			);
		}

		try {
			const archive = archiver('zip', { zlib: { level: 9 } }) as archiver.Archiver;
			archive.on('error', (err) => {
				this.logger.error('Archiver error: ' + err.message);
				archive.destroy();
				throw err;
			});

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
			await this.downloadFilesInDirectory(files, archive, rootZipFileName)

			// removed 'await' to avoid potential deadlock for large files
			archive.finalize();
			return new DataResult(
				ResultCode.Success,
				new StreamableFile(archive),
			);
		} catch (e) {
			this.logger.error('Error zipping files: ' + e);
			return new DataResult(ResultCode.InvalidState);
		}
	}

	private async downloadFilesInDirectory(
		files: {
			id: number;
			name: string;
			uri: string;
			isDirectory: boolean;
		}[],
		archive: archiver.Archiver,
		zipDirectoryPath: string
	) {
		for (const [, file] of files.entries()) {
			await this.addDownloadEntryToZip({ file, archive, zipDirectoryPath });
		}
	}

	private async userExists(userId: number) {
		return userId != null && this.database.user.findFirst({ where: { id: userId } }).then(Boolean);
	}

	private async addDownloadEntryToZip({
		file, archive, zipDirectoryPath,
	}: {
		file: {
			id: number,
			uri: string,
			name: string,
			isDirectory: boolean,
		},
		archive: archiver.Archiver,
		zipDirectoryPath: string,
	}) {
		if (file.isDirectory) {
			await this.addDirectoryToZip({
				directoryFile: file,
				archive,
				zipParentDirectoryPath: zipDirectoryPath,
			});
		} else {
			await this.addFileToZip(
				file,
				archive,
				zipDirectoryPath,
			);
		}
	}

	private async addDirectoryToZip({
		directoryFile,
		archive,
		zipParentDirectoryPath,
	}: {
		directoryFile: { id: number; name: string; },
		archive: archiver.Archiver,
		zipParentDirectoryPath: string,
	}): Promise<void> {
		const currentZipDirectoryPath = join(
			zipParentDirectoryPath,
			directoryFile.name,
		);

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
		await this.downloadFilesInDirectory(files, archive, currentZipDirectoryPath);
	}

	private async addFileToZip(
		file: { name: string; uri: string },
		archive: archiver.Archiver,
		zipDirectoryPath: string,
	) {
		const downloadedFileStream = await this.s3Service.downloadFile(file.uri);
		const zipFilePath = join(zipDirectoryPath, file.name);
		archive.append(downloadedFileStream as Readable, { name: zipFilePath });
	}
}
