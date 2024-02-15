import { Injectable, StreamableFile } from '@nestjs/common';
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
import { DatabaseService } from 'src/database/database.service';
import { S3InterfaceService } from 'src/s3-interface/s3-interface.service';

@Injectable()
export class FileStorageService {
	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
	) { }

	async getAllFiles(
		userId: number,
		parentFileId: number | null
	): Promise<FileDto[]> {
		const files = await this.database.file.findMany({
			where: {
				ownerUserId: userId,
				parentFileId: parentFileId
			},
		});

		return files.map((x) => ({
			id: x.id,
			name: x.name,
			uploadDate: x.creationTime,
			size: x.sizeKb,
			isDirectory: x.isDirectory
		}));
	}

	async createDirectory(
		userId: number,
		viewModel: CreateDirectoryViewModel
	): Promise<Result> {

		const filesWithIdenticalNameInSharedDirectoryCount = await this.database.file.count({
			where: {
				name: viewModel.name,
				parentFileId: viewModel.parentDirectoryId,
				isDirectory: true
			}
		})

		if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
			return new EmptyResult(
				ResultCode.InvalidState,
				`Directory with name ${viewModel.name} already exists in the upload directory`);
		}

		await this.database.file.create({
			data: {
				name: viewModel.name,
				parentFileId: viewModel.parentDirectoryId,
				ownerUserId: userId,
				sizeKb: 0,
				uri: '',
				creationTime: new Date(),
				isDirectory: true
			}
		})

		return new EmptyResult(ResultCode.Success);
	}

	async uploadFile(
		userId: number,
		viewModel: UploadFileViewModel,
		parentFileId: number | null
	): Promise<Result> {
		try {
			await this.database.$transaction(async (transaction) => {
				const filesWithIdenticalNameInSharedDirectoryCount = await transaction.file.count({
					where: {
						name: viewModel.file.originalname,
						parentFileId: parentFileId,
						isDirectory: false
					}
				})

				if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
					throw new Error(`File with name ${viewModel.file.originalname} already exists in the upload directory`);
				}

				const s3UploadResult = await this.s3Service.uploadFile(viewModel.file);
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
						isDirectory: false
					},
				});
			})
		} catch (e: any) {
			return new EmptyResult(
				ResultCode.InvalidState,
				e.message ?? '');
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
			return new DataResult(ResultCode.Unauthorized);
		}

		const directoryName = this.createTemporaryDirectoryName(user.id);
		const tempDirectoryPath = `${process.cwd()}/downloaded_files//${directoryName}`;
		const fullZipFileName = `${tempDirectoryPath}.zip`;

		try {

			this.ensureDirectoryExisted(tempDirectoryPath);

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
					id: true,
					uri: true,
					name: true,
					isDirectory: true
				},
			});

			if (files.length != downloadFileViewModel.fileIds.length) {
				return new DataResult(ResultCode.NotFound);
			}

			for (const file of files) {
				if (file.isDirectory) {
					await this.addDirectoryToZip(file, archive, tempDirectoryPath, '')
				} else {
					await this.addFileToZip(file, archive, tempDirectoryPath, '');
				}
			}

			await archive.finalize();
			const readStream = createReadStream(`${tempDirectoryPath}.zip`);

			// delete the temporary directory and zip file
			// readStream.on('close', async () => {
			// 	await unlink(fullZipFileName);
			// 	await rm(tempDirectoryPath, { recursive: true, force: true });
			// });

			return new DataResult(ResultCode.Success, new StreamableFile(readStream));
		} catch (error) {
			console.error('Error zipping files:', error);
			return new DataResult(ResultCode.InvalidState);
		}
	}

	private async ensureDirectoryExisted(
		directoryPath: string
	) {
		if (!existsSync(directoryPath)) {
			await mkdir(directoryPath, { recursive: true });
		}
	}

	private async addDirectoryToZip(
		directoryFile: { id: number, name: string; uri: string },
		archive: archiver.Archiver,
		tempParentDirectoryPath: string,
		zipParentDirectoryPath: string,
	) {
		const currentTempDirectoryPath = tempParentDirectoryPath + `/${directoryFile.name}`;
		const currentZipDirectoryPath = zipParentDirectoryPath + `/${directoryFile.name}`;
		await this.ensureDirectoryExisted(currentTempDirectoryPath);
		archive.directory(currentTempDirectoryPath, zipParentDirectoryPath)
		const files = await this.database.file.findMany({
			where: {
				parentFileId: directoryFile.id
			},
			select: {
				id: true,
				uri: true,
				name: true,
				isDirectory: true
			},
		});

		for (const file of files) {
			if (file.isDirectory) {
				await this.addDirectoryToZip(
					file,
					archive,
					currentTempDirectoryPath,
					currentZipDirectoryPath
				);
			} else {
				await this.addFileToZip(file, archive, currentTempDirectoryPath, currentZipDirectoryPath);
			}
		}
	}

	private async addFileToZip(
		file: { name: string; uri: string },
		archive: archiver.Archiver,
		tempDirectoryPath: string,
		zipDirectoryPath: string
	) {
		const presignedUrl = await this.s3Service.getPublicUrl(file.uri);

		// axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
		const response = await axios({
			method: 'get',
			url: presignedUrl,
			responseType: 'stream',
		});

		const downloadedFileStream = response.data;
		const tempFilePath = `${tempDirectoryPath}//${file.name}`;
		const zipFilePath = `${zipDirectoryPath}//${file.name}`;

		// await until the s3 object is written to the temporary directory
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

	async updateFileName(
		viewModel: UpdateFileNameViewModel,
		userId: number,
	): Promise<EmptyResult> {
		try {
			await this.database.$transaction(async (transaction) => {

				const filesWithIdenticalNameInSharedDirectory = await transaction.file.findMany({
					where: {
						name: viewModel.newFileName,
						parentFileId: viewModel.parentDirectoryId,
					}
				})

				if (filesWithIdenticalNameInSharedDirectory.length == 2) {
					throw new Error(`File and directory with name ${viewModel.newFileName} already exist in the upload directory`)
				}

				const fileToUpdate = await transaction.file.findUnique({
					where: {
						id: viewModel.id
					}
				})

				const directoriesWithDuplicateName = filesWithIdenticalNameInSharedDirectory.length == 1 &&
					filesWithIdenticalNameInSharedDirectory[0].isDirectory == fileToUpdate.isDirectory;

				if (directoriesWithDuplicateName) {
					throw new Error(`File or directory with name ${viewModel.newFileName} already exists in the upload directory`)
				}

				await transaction.file.update({
					where: {
						id: viewModel.id,
						ownerUserId: userId,
					},
					data: {
						name: viewModel.newFileName,
					},
				});
			})
		} catch (e: any) {
			return new EmptyResult(
				ResultCode.InvalidState,
				e.message ?? ''
			);
		}


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
			select: {
				uri: true,
				isDirectory: true
			}
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

		const s3Urls = filesToDelete.filter(x => !x.isDirectory).map(x => x.uri);
		const s3Result = await this.s3Service.deleteObjects(s3Urls);

		return new EmptyResult(s3Result.code);
	}
}
