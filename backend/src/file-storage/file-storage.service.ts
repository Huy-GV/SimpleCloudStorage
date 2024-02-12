import { Injectable, StreamableFile } from '@nestjs/common';
import * as archiver from 'archiver';
import axios from 'axios';
import { existsSync, createWriteStream, createReadStream } from 'fs';
import { mkdir, rm, unlink } from 'fs/promises';
import { FileDto } from 'src/data/dtos/fileDto';
import { Result } from 'src/data/enums/result';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { DatabaseService } from 'src/database/database.service';
import { S3InterfaceService } from 'src/s3-interface/s3-interface.service';

@Injectable()
export class FileStorageService {

    constructor(
        private readonly database: DatabaseService,
        private readonly s3Service: S3InterfaceService) {
    }

    async getAllFiles(userId: number): Promise<FileDto[]> {
        const files = await this.database.file
            .findMany({
                where: {
                    ownerUserId: userId,
                }
            });

        return files.map(x => ({
            id: x.id,
            name: x.name,
        }));
    }

    async uploadFile(uploadFileViewModel: UploadFileViewModel, userId: number): Promise<Result> {

        const uri = await this.s3Service.uploadFile(uploadFileViewModel.file);
        if (!uri) {
            return Result.InvalidState;
        }

        await this.database.file.create({
            data: {
                name: uploadFileViewModel.file.originalname,
                uri: uri,
                ownerUserId: userId,
            }
        })

        return Result.Success;
    }

    async downloadFiles(
        downloadFileViewModel: DownloadFileViewModel,
        userId: number): Promise<{ result: Result, streamableFile: StreamableFile | null }> {

        const user = await this.database.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            return { result: Result.Unauthorized, streamableFile: null }
        }

        const directoryName = this.createTemporaryDirectoryName(user.name);
        const tempDirectoryPath = process.cwd() + `/downloaded_files//${directoryName}`;
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
						in: downloadFileViewModel.fileIds
					}
				},
				select: {
					uri: true,
					name: true
				}
			})

			if (files.length != downloadFileViewModel.fileIds.length) {
                return { result: Result.NotFound, streamableFile: null }
			}

			for (const file of files) {
				await this.addFileToZip(file, archive, tempDirectoryPath);
			}

			await archive.finalize();
			const readStream = createReadStream(`${tempDirectoryPath}.zip`);

			// delete the temporary directory and zip file
			readStream.on('close', async () => {
				await unlink(fullZipFileName);
				await rm(tempDirectoryPath, { recursive: true, force: true })
			})

            return { result: Result.Success, streamableFile: new StreamableFile(readStream) };
		}
		catch (error) {
			console.error('Error zipping files:', error);
		}
    }

    private async addFileToZip(
        file: { name: string; uri: string; },
        archive: archiver.Archiver,
        tempDirectoryPath: string) {

        const presignedUrl = await this.s3Service.getPublicUrl(file.uri);

        // axios is used since node-fetch does not handle imports properly and native fetch does not support NodeJS.ReadableStream
        const response = await axios({
            method: 'get',
            url: presignedUrl,
            responseType: 'stream',
        });

        const downloadedFileStream = response.data;
        const filePath = tempDirectoryPath + `//${file.name}`;

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
        userId: number): Promise<Result> {
        // TODO: handle errors here
        const updatedFile = await this.database.file.update({
            where: {
                id: updateFileNameViewModel.id,
                ownerUserId: userId
            },
            data: {
                name: updateFileNameViewModel.newFileName,
            },
        })

        return Result.Success;
    }

    async deleteFiles(fileIds: number[], userId: number): Promise<Result> {
        const filesToDelete = await this.database.file.findMany({
            where: {
                id: {
                    in: fileIds
                },
                ownerUserId: userId
            }
        });

        if (filesToDelete.length != fileIds.length) {
            return Result.NotFound;
        }

        await this.database.file.deleteMany({
            where: {
                id: {
                    in: fileIds
                },
                ownerUserId: userId
            }
        });

        const s3Result = await this.s3Service.deleteObjects(filesToDelete.map(x => x.uri));
        if (s3Result != Result.Success) {
            return s3Result;
        }

        return Result.Success;
    }
}
