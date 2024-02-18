import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as archiver from 'archiver';
import axios from 'axios';
import { existsSync, createWriteStream, createReadStream } from 'fs';
import { mkdir, rm, unlink } from 'fs/promises';
import { join } from 'path';
import { FileDto } from 'src/data/dtos/fileDto';
import { DataResult, EmptyResult, Result } from 'src/data/results/result';
import { ResultCode } from 'src/data/results/resultCode';
import { CreateDirectoryViewModel } from 'src/data/viewModels/createDirectoryViewModel';
import { DownloadFileViewModel } from 'src/data/viewModels/downloadFilesViewModel';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { UploadFileViewModel } from 'src/data/viewModels/uploadFileViewModel';
import {
	DatabaseService,
	TransactionClientAlias,
} from 'src/database/database.service';
import { S3InterfaceService } from 'src/s3-interface/s3-interface.service';

@Injectable()
export class FileStorageService {
	private readonly logger = new Logger(FileStorageService.name);

	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
	) {}

	async getAllFiles(
		userId: number,
		parentFileId: number | null,
	): Promise<FileDto[]> {
		const files = await this.database.file.findMany({
			where: {
				ownerUserId: userId,
				parentFileId: parentFileId,
			},
		});

		return files.map((x) => ({
			id: x.id,
			name: x.name,
			uploadDate: x.creationTime,
			size: x.sizeKb,
			isDirectory: x.isDirectory,
		}));
	}

	async createDirectory(
		userId: number,
		viewModel: CreateDirectoryViewModel,
	): Promise<Result> {
		const filesWithIdenticalNameInSharedDirectoryCount =
			await this.database.file.count({
				where: {
					name: viewModel.name.trim(),
					parentFileId: viewModel.parentDirectoryId,
				},
			});

		if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
			return new EmptyResult(
				ResultCode.InvalidArguments,
				`File or directory with name ${viewModel.name} already exists in the upload directory`,
			);
		}

		await this.database.file.create({
			data: {
				name: viewModel.name.trim(),
				parentFileId: viewModel.parentDirectoryId,
				ownerUserId: userId,
				sizeKb: 0,
				uri: '',
				creationTime: new Date(),
				isDirectory: true,
			},
		});

		return new EmptyResult(ResultCode.Success);
	}

	async uploadFile(
		userId: number,
		viewModel: UploadFileViewModel,
		parentFileId: number | null,
	): Promise<Result> {
		try {
			await this.database.$transaction(async (transaction) => {
				const filesWithIdenticalNameInSharedDirectoryCount =
					await transaction.file.count({
						where: {
							name: viewModel.file.originalname,
							parentFileId: parentFileId,
						},
					});

				if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
					throw new Error(
						`File or directory with name ${viewModel.file.originalname} already exists in the upload directory`,
					);
				}

				const s3UploadResult = await this.s3Service.uploadFile(
					viewModel.file,
				);
				if (!s3UploadResult.successful) {
					throw new Error(s3UploadResult.statusText);
				}

				await transaction.file.create({
					data: {
						name: viewModel.file.originalname,
						parentFileId: viewModel.directoryFileId,
						uri: s3UploadResult.data,
						ownerUserId: userId,
						creationTime: new Date(),
						sizeKb: viewModel.file.size / 1000,
						isDirectory: false,
					},
				});
			});
		} catch (e: any) {
			this.logger.error(
				`Failed to upload file named '${viewModel.file.originalname}' to directory ID '${viewModel.directoryFileId}', ${e.message}`,
			);

			return new EmptyResult(ResultCode.InvalidState, e.message ?? '');
		}

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
			this.logger.error(`User ID ${userId} not found`);
			return new DataResult(ResultCode.Unauthorized);
		}

		const directoryName = this.createTemporaryDirectoryName(user.id);
		const tempDirectoryPath = join(
			process.cwd(),
			'downloaded_files',
			directoryName,
		);

		await this.ensureDirectoryExisted(tempDirectoryPath);
		const fullZipFilePath = `${tempDirectoryPath}.zip`;

		try {
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
			for (const file of files) {
				if (file.isDirectory) {
					await this.addDirectoryToZip(
						file,
						archive,
						tempDirectoryPath,
						rootZipFileName,
					);
				} else {
					await this.addFileToZip(
						file,
						archive,
						tempDirectoryPath,
						rootZipFileName,
					);
				}
			}

			await archive.finalize();
			const readStream = createReadStream(`${tempDirectoryPath}.zip`);

			// delete the temporary directory and zip file
			readStream.on('close', async () => {
				await this.ensureTemporaryFilesDeleted(
					fullZipFilePath,
					tempDirectoryPath,
				);
			});

			return new DataResult(
				ResultCode.Success,
				new StreamableFile(readStream),
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
		directoryFile: { id: number; name: string; uri: string },
		archive: archiver.Archiver,
		tempParentDirectoryPath: string,
		zipParentDirectoryPath: string,
	) {
		const currentTempDirectoryPath = join(
			tempParentDirectoryPath,
			directoryFile.name,
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

		if (files.filter((x) => !x.isDirectory).length == 0) {
			// if the directory does not contain non-directory files, we append its name to the zip path
			archive.directory(
				currentTempDirectoryPath,
				currentZipDirectoryPath,
			);
		} else {
			// otherwise, adding child files will include the directory in the zip path
			archive.directory(currentTempDirectoryPath, zipParentDirectoryPath);
		}

		for (const file of files) {
			if (file.isDirectory) {
				await this.addDirectoryToZip(
					file,
					archive,
					currentTempDirectoryPath,
					currentZipDirectoryPath,
				);
			} else {
				await this.addFileToZip(
					file,
					archive,
					currentTempDirectoryPath,
					currentZipDirectoryPath,
				);
			}
		}
	}

	private async addFileToZip(
		file: { name: string; uri: string },
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
		const tempFilePath = `${tempDirectoryPath}//${file.name}`;
		const zipFilePath = `${zipDirectoryPath}//${file.name}`;

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
		const timestamp = new Date().toISOString().replace(/:/g, '-');
		return `${userId}_${timestamp}`;
	}

	private async deleteNestedFiles(
		userId: number,
		directoryToDeleteId: number,
		transaction: TransactionClientAlias,
	): Promise<EmptyResult[]> {
		const filesToDelete = await transaction.file.findMany({
			where: {
				parentFileId: directoryToDeleteId,
				ownerUserId: userId,
			},
			select: {
				uri: true,
				isDirectory: true,
				id: true,
			},
		});

		const s3Urls = filesToDelete
			.filter((x) => !x.isDirectory)
			.map((x) => x.uri);

		const s3Result = await this.s3Service.deleteObjects(s3Urls);
		if (!s3Result.successful) {
			return [new EmptyResult(s3Result.code)];
		}

		const directories = filesToDelete.filter((x) => x.isDirectory);

		const resultCollections = await Promise.all(
			directories.map((x) =>
				this.deleteNestedFiles(userId, x.id, transaction),
			),
		);
		return resultCollections.flatMap((x) => x);
	}

	async updateFileName(
		viewModel: UpdateFileNameViewModel,
		userId: number,
	): Promise<EmptyResult> {
		try {
			await this.database.$transaction(async (transaction) => {
				const newFileName = viewModel.newFileName.trim();
				const filesWithIdenticalNameInSharedDirectory =
					await transaction.file.findMany({
						where: {
							name: newFileName,
							parentFileId: viewModel.parentDirectoryId,
						},
					});

				if (filesWithIdenticalNameInSharedDirectory.length > 0) {
					throw new Error(
						`File or directory with name ${newFileName} already exist in the upload directory`,
					);
				}

				await transaction.file.update({
					where: {
						id: viewModel.id,
						ownerUserId: userId,
					},
					data: {
						name: newFileName,
					},
				});
			});
		} catch (e: any) {
			this.logger.error(`Failed to update file name , ${e.message}`);
			return new EmptyResult(
				ResultCode.UnspecifiedError,
				e.message ?? '',
			);
		}

		return new EmptyResult(ResultCode.Success);
	}

	async deleteFiles(fileIds: number[], userId: number): Promise<EmptyResult> {
		try {
			await this.database.$transaction(async (transaction) => {
				const filesToDelete = await transaction.file.findMany({
					where: {
						id: {
							in: fileIds,
						},
						ownerUserId: userId,
					},
					select: {
						uri: true,
						isDirectory: true,
						id: true,
					},
				});

				if (filesToDelete.length != fileIds.length) {
					return new EmptyResult(ResultCode.InvalidArguments);
				}

				const s3Urls = filesToDelete
					.filter((x) => !x.isDirectory)
					.map((x) => x.uri);

				// if there are directories among the deletion list, delete all of their nested files
				if (s3Urls.length < filesToDelete.length) {
					const directories = filesToDelete.filter(
						(x) => x.isDirectory,
					);
					const resultCollections = await Promise.all(
						directories.map((x) =>
							this.deleteNestedFiles(userId, x.id, transaction),
						),
					);

					const errors = resultCollections
						.flatMap((x) => x)
						.filter((x) => !x.successful);
					if (errors.length > 0) {
						throw new Error(
							'Failed to delete s3 objects: ' + errors,
						);
					}
				}

				const s3Result = await this.s3Service.deleteObjects(s3Urls);
				if (!s3Result.successful) {
					// return new EmptyResult(s3Result.code);
					throw new Error(
						'Failed to delete s3 objects: ' +
							s3Result.code.toString(),
					);
				}

				// deleting the top level files will cascade-delete all nested files, including directories
				await transaction.file.deleteMany({
					where: {
						id: {
							in: fileIds,
						},
						ownerUserId: userId,
					},
				});
			});

			return new EmptyResult(ResultCode.Success);
		} catch (e: any) {
			this.logger.error(
				`Failed to delete files with IDs ${fileIds}, ${e.message}`,
			);
			return new EmptyResult(
				ResultCode.UnspecifiedError,
				e.message ?? '',
			);
		}
	}
}
