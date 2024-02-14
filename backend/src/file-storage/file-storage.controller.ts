import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Req,
	UploadedFile,
	UseInterceptors,
	StreamableFile,
	Param,
} from '@nestjs/common';
import { Request } from 'express';
import { USER_CONTEXT_KEY } from 'src/authentication/constants';
import { FileStorageService } from './file-storage.service';
import { FileDto } from 'src/data/dtos/fileDto';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import throwHttpExceptionIfUnsuccessful from 'src/utils/httpCodeConvertor';
import { DeleteFilesViewModel } from 'src/data/viewModels/deleteFilesViewModel';
import { DownloadFileViewModel } from 'src/data/viewModels/downloadFilesViewModel';
import { UploadFileViewModel } from 'src/data/viewModels/uploadFileViewModel';
import { CreateDirectoryViewModel } from 'src/data/viewModels/createDirectoryViewModel';

@Controller('files')
export class FileStorageController {
	constructor(private readonly fileStorage: FileStorageService) {}

	@Get('/:directoryId?')
	async getAllFiles(
		@Req() request: Request,
		@Param('directoryId') directoryId?: number | null
	): Promise<FileDto[]> {
		const userId = request[USER_CONTEXT_KEY].sub;
		return await this.fileStorage.getAllFiles(userId, directoryId ?? null);
	}

	@Post('/upload')
	@UseInterceptors(FileInterceptor('file'))
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@Req() request: Request,
		@Body() rawViewModel: UploadFileViewModel
	): Promise<void> {

		const viewModel = { ...rawViewModel, file: file}
		const userId: number = request[USER_CONTEXT_KEY].sub;
		const result = await this.fileStorage.uploadFile(userId, viewModel, null);

		throwHttpExceptionIfUnsuccessful(result.code);
	}

	@Post('/create-directory')
	async createDirectory(
		@Req() request: Request,
		@Body() viewModel: CreateDirectoryViewModel
	): Promise<void> {

		const userId: number = request[USER_CONTEXT_KEY].sub;
		const result = await this.fileStorage.createDirectory(userId, viewModel);

		throwHttpExceptionIfUnsuccessful(result.code);
	}

	@Put('/update-name')
	async updateFileName(
		@Req() request: Request,
		@Body() viewModel: UpdateFileNameViewModel,
	): Promise<void> {
		const result = await this.fileStorage.updateFileName(
			viewModel,
			request[USER_CONTEXT_KEY].sub,
		);

		throwHttpExceptionIfUnsuccessful(result.code);
	}

	@Delete('')
	async deleteFiles(
		@Req() request: Request,
		@Body() viewModel: DeleteFilesViewModel,
	): Promise<void> {
		const result = await this.fileStorage.deleteFiles(
			viewModel.fileIds,
			request[USER_CONTEXT_KEY].sub,
		);

		throwHttpExceptionIfUnsuccessful(result.code);
	}

	@Post('/download')
	async getFile(
		@Req() request: Request,
		@Body() body: DownloadFileViewModel,
	): Promise<StreamableFile> {
		const result = await this.fileStorage.downloadFiles(
			body,
			request[USER_CONTEXT_KEY].sub,
		);

		throwHttpExceptionIfUnsuccessful(result.code);

		return result.data;
	}
}
