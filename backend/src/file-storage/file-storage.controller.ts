import { Controller, Get, Post, Put, Delete, Param, Body, Req, UploadedFile, UseInterceptors, Res, StreamableFile, Headers, NotFoundException } from '@nestjs/common';
import { USER_CONTEXT_KEY } from 'src/authentication/constants';
import { FileStorageService } from './file-storage.service';
import { FileDto } from 'src/data/dtos/fileDto';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { AllowAnonymous } from 'src/authentication/authentication.decorator';
import * as archiver from 'archiver';
import { createReadStream, createWriteStream, existsSync, } from 'fs';
import { Readable, pipeline } from 'stream';
import { Response } from 'express';
import axios from 'axios';
import { mkdir, rm, unlink } from 'fs/promises';
import { DatabaseService } from 'src/database/database.service';
import { S3InterfaceService } from 'src/s3-interface/s3-interface.service';

@Controller('files')
export class FileStorageController {
	constructor(
		private readonly fileStorage: FileStorageService,
		private readonly database: DatabaseService,
		private readonly s3: S3InterfaceService) { }

	@Get()
	async getAllFiles(@Req() request: Request): Promise<FileDto[]> {
		const userId = request[USER_CONTEXT_KEY].sub;
		return await this.fileStorage.getAllFiles(userId);
	}

	@Post()
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Req() request: Request): Promise<string> {

		const viewModel: UploadFileViewModel = {
			file: file
		};

		const userId: number = request[USER_CONTEXT_KEY].sub;
		await this.fileStorage.uploadFile(viewModel, userId)

		return 'Create a file';
	}

	@Put(':id')
	async updateFileName(
		@Req() request: Request,
		@Body() viewModel: UpdateFileNameViewModel): Promise<string> {

		await this.fileStorage.updateFileName(viewModel, request[USER_CONTEXT_KEY].sub)
		return `Update file with ID: ${viewModel.id}`;
	}

	@Delete('')
	async deleteFiles(
		@Req() request: Request,
		@Body() viewModel: DeleteFilesViewModel): Promise<string> {

		await this.fileStorage.deleteFiles(viewModel.fileIds, request[USER_CONTEXT_KEY].sub)
		return `Delete file with ID: ${viewModel.fileIds}`;
	}

	@Post('/download')
	async getFile(
		@Req() request: Request,
		@Res({ passthrough: true }) res: Response,
		@Body() body: DownloadFileViewModel): Promise<StreamableFile> {
		try {
			const fileName = this.createDownloadFileName(request[USER_CONTEXT_KEY].username);

			// set up download directory
			const tempDirectoryPath = process.cwd() + `/downloaded_files//${fileName}`;
			if (!existsSync(tempDirectoryPath)) {
				await mkdir(tempDirectoryPath, { recursive: true });
			}

			const archive = archiver('zip', { zlib: { level: 9 } });

			const downloadDirectoryStream = createWriteStream(`${tempDirectoryPath}.zip`);
			archive.pipe(downloadDirectoryStream);

			const files = await this.database.file.findMany({
				where: {
					ownerUserId: request[USER_CONTEXT_KEY].sub,
					id: {
						in: body.fileIds
					}
				},
				select: {
					uri: true,
					name: true
				}
			})

			if (files.length != body.fileIds.length) {
				throw new NotFoundException();
			}

			for (const file of files) {
				const presignedUrl = await this.s3.getPublicUrl(file.uri);

				// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
				const response = await axios({
					method: 'get',
					url: presignedUrl,
					responseType: 'stream',
				});

				const downloadedFileStream = response.data;
				const filePath = tempDirectoryPath + `//${file.name}`;
				console.log(filePath)

				await new Promise<void>((resolve, reject) => {
					const fileWriteStream = createWriteStream(filePath);
					downloadedFileStream.pipe (fileWriteStream);
					fileWriteStream.on('close', () => resolve());
					fileWriteStream.on('error', (err) => reject(err));
				});

				const fileReadStream = createReadStream(filePath);
				archive.append(fileReadStream, { name: file.name })
			}

			// await Promise.all(
			// 	files
			// 		.map(async x => {
			// 			const presignedUrl = await this.s3.getPublicUrl(x.uri);

			// 			// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
			// 			const response = await axios(presignedUrl);
			// 			const downloadedFileStream = response.data;
			// 			const filePath = tempDirectoryPath + `//${x.name}`;
			// 			console.log(filePath)
			// 			await new Promise<void>((resolve, reject) => {
			// 				pipeline(downloadedFileStream, createWriteStream(filePath), (err) => {
			// 					if (err) {
			// 						reject(err);
			// 					} else {
			// 						resolve();
			// 					}
			// 				});
			// 			});

			// 			const fileReadStream = createReadStream(filePath);
			// 			archive.append(fileReadStream, { name: x.name })
			// 		}))

			await archive.finalize();
			const readStream = createReadStream(`${tempDirectoryPath}.zip`);

			readStream.on('close', async () => {
				await unlink(`${tempDirectoryPath}.zip`);
				await rm(tempDirectoryPath, { recursive: true, force: true })
			})

			res.setHeader('Content-Type', 'application/json')
			res.setHeader('Content-Disposition', `attachment; filename=${fileName}.zip`)

			const streamableFile = new StreamableFile(readStream);
			return streamableFile;
		}
		catch (error) {
			console.error('Error zipping files:', error);
		}
	}

	private createDownloadFileName(userName: string) {
		const timestamp = new Date().toISOString().replace(/:/g, '-');
		return `${userName}_${timestamp}`;
	}
}
