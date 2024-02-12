import { Injectable } from '@nestjs/common';
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

        // TODO: check for success
        const newFile = await this.database.file.create({
            data: {
                name: uploadFileViewModel.file.originalname,
                uri: uri,
                ownerUserId: userId,
            }
        })

        return Result.Success;
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
