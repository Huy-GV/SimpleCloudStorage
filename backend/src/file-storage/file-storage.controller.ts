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
	ParseIntPipe,
} from "@nestjs/common";
import { Request } from "express";
import { FileStorageService } from "./file-storage.service";
import { FileInterceptor } from "@nestjs/platform-express/multer";
import { USER_CONTEXT_KEY } from "../authentication/constants";
import { FileDto } from "../data/dtos/fileDto";
import { CreateDirectoryViewModel } from "../data/viewModels/createDirectoryViewModel";
import { DeleteFilesViewModel } from "../data/viewModels/deleteFilesViewModel";
import { DownloadFileViewModel } from "../data/viewModels/downloadFilesViewModel";
import { UpdateFileNameViewModel } from "../data/viewModels/updateFileNameViewModel";
import { UploadFileViewModel } from "../data/viewModels/uploadFileViewModel";
import throwHttpExceptionOnFailure from "../utils/httpCodeConvertor";

@Controller("files")
export class FileStorageController {
	constructor(private readonly fileStorage: FileStorageService) {}

  @Get("/:directoryId")
	async getAllFilesInDirectory(
    @Req() request: Request,
    @Param("directoryId", new ParseIntPipe()) directoryId?: number | null,
	): Promise<FileDto[]> {
		const userId = request[USER_CONTEXT_KEY].sub;
		return await this.fileStorage.getAllFiles(userId, directoryId ?? null);
	}

  @Get()
  async getAllFilesInRootDirectory(
    @Req() request: Request,
  ): Promise<FileDto[]> {
  	const userId = request[USER_CONTEXT_KEY].sub;
  	return await this.fileStorage.getAllFiles(userId, null);
  }

  @Post("/upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
    @Body() rawViewModel: UploadFileViewModel,
  ): Promise<void> {
	const viewModel = { ...rawViewModel, file: file };
  	const userId: number = request[USER_CONTEXT_KEY].sub;
  	const result = await this.fileStorage.uploadFile(
  		userId,
  		viewModel,
  	);

  	throwHttpExceptionOnFailure(result);
  }

  @Post("/create-directory")
  async createDirectory(
    @Req() request: Request,
    @Body() viewModel: CreateDirectoryViewModel,
  ): Promise<void> {
  	const userId: number = request[USER_CONTEXT_KEY].sub;
  	const result = await this.fileStorage.createDirectory(userId, viewModel);

  	throwHttpExceptionOnFailure(result);
  }

  @Put("/update-name")
  async updateFileName(
    @Req() request: Request,
    @Body() viewModel: UpdateFileNameViewModel,
  ): Promise<void> {
  	const result = await this.fileStorage.updateFileName(
  		viewModel,
  		request[USER_CONTEXT_KEY].sub,
  	);

  	throwHttpExceptionOnFailure(result);
  }

  @Delete("")
  async deleteFiles(
    @Req() request: Request,
    @Body() viewModel: DeleteFilesViewModel,
  ): Promise<void> {
  	const result = await this.fileStorage.deleteFiles(
  		viewModel.fileIds,
  		request[USER_CONTEXT_KEY].sub,
  	);

  	throwHttpExceptionOnFailure(result);
  }

  @Post("/download")
  async getFile(
    @Req() request: Request,
    @Body() body: DownloadFileViewModel,
  ): Promise<StreamableFile> {
  	const result = await this.fileStorage.downloadFiles(
  		body,
  		request[USER_CONTEXT_KEY].sub,
  	);

  	throwHttpExceptionOnFailure(result);

  	return result.data;
  }
}
