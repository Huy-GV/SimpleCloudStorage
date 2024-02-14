import { Injectable, StreamableFile } from '@nestjs/common';
import * as archiver from 'archiver';
import axios from 'axios';
import { existsSync, createWriteStream, createReadStream } from 'fs';
import { mkdir, rm, unlink } from 'fs/promises';
import { FileDto } from 'src/data/dtos/fileDto';
import { DataResult, EmptyResult, Result } from 'src/data/results/result';
import { ResultCode } from 'src/data/results/resultCode';
import { DownloadFileViewModel } from 'src/data/viewModels/downloadFilesViewModel';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { UploadFileViewModel } from 'src/data/viewModels/uploadFileViewModel';
import { DatabaseService } from 'src/database/database.service';
import { S3InterfaceService } from 'src/s3-interface/s3-interface.service';

@Injectable()
export class FileStorageService {
	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
	) { }

	async getAllFiles(userId: number): Promise<FileDto[]> {
		const files = await this.database.file.findMany({
			where: {
				ownerUserId: userId,
			},
		});

		return files.map((x) => ({
			id: x.id,
			name: x.name,
			uploadDate: x.creationTime,
			size: x.sizeKb,
		}));
	}

	async uploadFile(
		uploadFileViewModel: UploadFileViewModel,
		userId: number,
	): Promise<Result> {
		const s3UploadResult = await this.s3Service.uploadFile(uploadFileViewModel.file);
		if (!s3UploadResult.successful) {
			return s3UploadResult;
		}

		await this.database.file.create({
			data: {
				name: uploadFileViewModel.file.originalname,
				uri: s3UploadResult.data,
				ownerUserId: userId,
				creationTime: new Date(),
				sizeKb: uploadFileViewModel.file.size / 1000,
			},
		});

		return new EmptyResult(ResultCode.Success);
	}

	async downloadFiles(
		downloadFileViewModel: DownloadFileViewModel,
		userId: number,
	): Promise<Result<StreamableFile>> {
		const user = await this.database.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			return new DataResult(ResultCode.Unauthorized);
		}

		const directoryName = this.createTemporaryDirectoryName(user.name);
		const tempDirectoryPath = `${process.cwd()}/downloaded_files//${directoryName}`;
		const fullZipFileName = `${tempDirectoryPath}.zip`;

		try {
			if (!existsSync(tempDirectoryPath)) {
				await mkdir(tempDirectoryPath, { recursive: true });
			}

			const archive = archiver('zip', { zlib: { level: 9 } });
			const downloadDirectoryStream = createWriteStream(fullZipFileName);
			archive.pipe(downloadDirectoryStream);

			const files = await this.database.file.findMany({
				where: {
					ownerUserId: userId,
					id: {
						in: downloadFileViewModel.fileIds,
					},
				},
				select: {
					uri: true,
					name: true,
				},
			});

			if (files.length != downloadFileViewModel.fileIds.length) {
				return new DataResult(ResultCode.NotFound);
			}

			for (const file of files) {
				await this.addFileToZip(file, archive, tempDirectoryPath);
			}

			await archive.finalize();
			const readStream = createReadStream(`${tempDirectoryPath}.zip`);

			// delete the temporary directory and zip file
			readStream.on('close', async () => {
				await unlink(fullZipFileName);
				await rm(tempDirectoryPath, { recursive: true, force: true });
			});

			return new DataResult(ResultCode.Success, new StreamableFile(readStream));
		} catch (error) {
			console.error('Error zipping files:', error);
		}
	}

	private async addDirectory(
		directoryPath: string
	) {
		if (!existsSync(directoryPath)) {
			await mkdir(directoryPath, { recursive: true });
		}
	}

	private async addFileToZip(
		file: { name: string; uri: string },
		archive: archiver.Archiver,
		directoryPath: string,
	) {
		const presignedUrl = await this.s3Service.getPublicUrl(file.uri);

		// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
		const response = await axios({
			method: 'get',
			url: presignedUrl,
			responseType: 'stream',
		});

		const downloadedFileStream = response.data;
		const filePath = `${directoryPath}//${file.name}`;

		// await until the s3 object is written to the temporary directory
		await new Promise<void>((resolve, reject) => {
			const fileWriteStream = createWriteStream(filePath);
			downloadedFileStream.pipe(fileWriteStream);
			fileWriteStream.on('close', () => resolve());
			fileWriteStream.on('error', (err) => reject(err));
		});

		const fileReadStream = createReadStream(filePath);
		archive.append(fileReadStream, { name: file.name });
	}

	private createTemporaryDirectoryName(userName: string) {
		const timestamp = new Date().toISOString().replace(/:/g, '-');
		return `${userName}_${timestamp}`;
	}

	async updateFileName(
		updateFileNameViewModel: UpdateFileNameViewModel,
		userId: number,
	): Promise<EmptyResult> {
		await this.database.file.update({
			where: {
				id: updateFileNameViewModel.id,
				ownerUserId: userId,
			},
			data: {
				name: updateFileNameViewModel.newFileName,
			},
		});

		return new EmptyResult(ResultCode.Success)
	}

	async deleteFiles(fileIds: number[], userId: number): Promise<EmptyResult> {
		const filesToDelete = await this.database.file.findMany({
			where: {
				id: {
					in: fileIds,
				},
				ownerUserId: userId,
			},
		});

		if (filesToDelete.length != fileIds.length) {
			return new EmptyResult(ResultCode.NotFound);
		}

		await this.database.file.deleteMany({
			where: {
				id: {
					in: fileIds,
				},
				ownerUserId: userId,
			},
		});

		const s3Result = await this.s3Service.deleteObjects(
			filesToDelete.map((x) => x.uri),
		);

		return new EmptyResult(s3Result.code);
	}
}
