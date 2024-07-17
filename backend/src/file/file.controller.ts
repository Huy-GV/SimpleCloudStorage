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
	Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express/multer";
import { USER_CONTEXT_KEY } from "../authentication/constants";
import { FileDto } from "../data/dtos/fileDto";
import { CreateDirectoryViewModel } from "../data/viewModels/createDirectoryViewModel";
import { DeleteFilesViewModel } from "../data/viewModels/deleteFilesViewModel";
import { DownloadFileViewModel } from "../data/viewModels/downloadFilesViewModel";
import { UpdateFileNameViewModel } from "../data/viewModels/updateFileNameViewModel";
import { UploadFileViewModel } from "../data/viewModels/uploadFileViewModel";
import { throwHttpExceptionOnFailure, convertToHttpStatusCode } from "../utils/httpCodeConvertor";
import { FileTransporter } from "./file-transporter.service";
import { FileMetadataReader } from "./file-metadata-reader.service";
import { FileMetadataWriter } from "./file-metadata-writer.service";

@Controller("files")
export class FileController {
	constructor(
		private readonly fileMetadataReader: FileMetadataReader,
		private readonly fileMetadataWriter: FileMetadataWriter,
		private readonly fileTransporter: FileTransporter
	) { }

	@Get("/:directoryId")
		async getAllFilesInDirectory(
		@Req() request: Request,
		@Param("directoryId", new ParseIntPipe()) directoryId?: number | null,
		): Promise<FileDto[]> {
			const userId = request[USER_CONTEXT_KEY].sub;
			return await this.fileMetadataReader.getAllFiles(userId, directoryId ?? null);
		}

	@Get()
	async getAllFilesInRootDirectory(
		@Req() request: Request,
	): Promise<FileDto[]> {
		const userId = request[USER_CONTEXT_KEY].sub;
		return await this.fileMetadataReader.getAllFiles(userId, null);
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
		const result = await this.fileTransporter.uploadFile(
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
		const result = await this.fileMetadataWriter.createDirectory(userId, viewModel);

		throwHttpExceptionOnFailure(result);
	}

	@Put("/update-name")
	async updateFileName(
		@Req() request: Request,
		@Body() viewModel: UpdateFileNameViewModel,
	): Promise<void> {
		const result = await this.fileMetadataWriter.updateFileName(
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
  	const result = await this.fileMetadataWriter.deleteFiles(
  		viewModel.fileIds,
  		request[USER_CONTEXT_KEY].sub,
  	);

  	throwHttpExceptionOnFailure(result);
  }

	@Post("/download")
	async getFile(
		@Req() request: Request,
		@Res({ passthrough: true }) response: Response,
		@Body() body: DownloadFileViewModel,
	): Promise<StreamableFile> {
  		const result = await this.fileTransporter.downloadFiles(
			body,
			request[USER_CONTEXT_KEY].sub,
		);

		response.set({
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="download.zip"',
		});

		response.status(convertToHttpStatusCode(result));

		return result.data;
 	}
}
