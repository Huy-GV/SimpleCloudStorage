import { Controller, Get, Post, Put, Delete, Param, Body, Req, UploadedFile, UseInterceptors, Res, StreamableFile, Headers } from '@nestjs/common';
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

@Controller('files')
export class FileStorageController {
	constructor(private readonly fileStorage: FileStorageService) {}

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

	@AllowAnonymous()
	@Get('/download')
	async getFile(
		@Req() request: Request,
		@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
		try {
			const fileName = this.createFileName(request[USER_CONTEXT_KEY])

			// set up download directory
			const folderPath = process.cwd() + `/downloaded_files//${fileName}`;
			if (!existsSync(folderPath)) {
				await mkdir(folderPath, { recursive: true });
			}

			const downloadDirectory = createWriteStream(process.cwd() + `\\${fileName}.zip`);
			const archive = archiver('zip', { zlib: { level: 9 } });
			archive.pipe(downloadDirectory);

			// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
			const response = await axios('https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg');
			const downloadedFileStream = response.data;
			const filePath = folderPath + '/file.jpg';

			await new Promise<void>((resolve, reject) => {
				pipeline(downloadedFileStream, createWriteStream(filePath), (err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});

			const fileReadStream = createReadStream(filePath);

			archive.append(fileReadStream, { name: 'file.jpg' })
			await archive.finalize();
			const readStream = createReadStream(downloadDirectory.path);

			readStream.on('close', async () => {
				await unlink(downloadDirectory.path);
				await rm(folderPath, { recursive: true, force: true })
			})

			res.set({
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename=${fileName}.zip`,
			});

			const streamableFile = new StreamableFile(readStream);
			return streamableFile;
		}
		catch (error) {
			console.error('Error zipping files:', error);
		}
	}

	private createFileName(userName: string) {
		const timestamp = new Date().toISOString().replace(/:/g, '-');
		return `${userName}_${timestamp}`;
	}
}
