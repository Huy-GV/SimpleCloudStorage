import { Controller, Get, Post, Put, Delete, Param, Body, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { USER_CONTEXT_KEY } from 'src/authentication/constants';
import { FileStorageService } from './file-storage.service';
import { FileDto } from 'src/data/dtos/fileDto';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { FileInterceptor } from '@nestjs/platform-express/multer';

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
	uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Req() request: Request): string {

		const viewModel: UploadFileViewModel = {
			file: file
		};

		const userId: number = request[USER_CONTEXT_KEY].sub;
		this.fileStorage.uploadFile(viewModel, userId)

		return 'Create a file';
	}

	@Put(':id')
	async updateFileName(
		@Req() request: Request,
		@Body() viewModel: UpdateFileNameViewModel): Promise<string> {

		await this.fileStorage.updateFileName(viewModel, request[USER_CONTEXT_KEY].sub)
		return `Update file with ID: ${viewModel.id}`;
	}

	@Delete(':id')
	async deleteFile(
		@Req() request: Request,
		@Param('id') id: number): Promise<string> {

		await this.fileStorage.deleteFile(id, request[USER_CONTEXT_KEY].sub)
		return `Delete file with ID: ${id}`;
	}

	@Delete('')
	async deleteFiles(
		@Req() request: Request,
		@Body() viewModel: DeleteFilesViewModel): Promise<string> {

		await this.fileStorage.deleteFiles(viewModel.fileIds, request[USER_CONTEXT_KEY].sub)
		return `Delete file with ID: ${viewModel.fileIds}`;
	}
}
