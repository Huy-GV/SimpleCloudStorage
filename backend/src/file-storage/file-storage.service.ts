import { Injectable } from '@nestjs/common';
import { FileDto } from 'src/data/dtos/fileDto';
import { Result } from 'src/data/enums/Result';
import { UpdateFileNameViewModel } from 'src/data/viewModels/updateFileNameViewModel';
import { DatabaseService } from 'src/database/database.service';
import * as AWS from 'aws-sdk'
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileStorageService {

    constructor(private readonly database: DatabaseService, private readonly config: ConfigService) {
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

    async uploadFile(uploadFileViewModel: UploadFileViewModel, userId: number) {
        // TODO: move aws to another module
        const awsCredentials = {
            accessKeyId: this.config.get<string>('ACCESS_KEY'),
            secretAccessKey: this.config.get<string>('SECRET_KEY'),
        };

        const region = this.config.get<string>('REGION');
        const bucket = this.config.get<string>('BUCKET');

        const s3Client = new AWS.S3({
            credentials: awsCredentials,
            region: region,
        });

        const objectKey = Date.now() + '_' + uploadFileViewModel.file.originalname;

        const params = {
            Bucket: bucket,
            Key: objectKey,
            Body: uploadFileViewModel.file.buffer, // Assuming 'file' contains the file buffer
        };

        // TODO: build the URI for s3
        s3Client.putObject(params, (error, data) => {
            if (error) {
                console.error("Error uploading object:", error);
            } else {
                console.log("Successfully uploaded object:", data);
            }
        });

        // TODO: check for success
        const newFile = await this.database.file.create({
            data: {
                name: uploadFileViewModel.file.originalname,
                uri: '/test',
                ownerUserId: userId,
            }
        })
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

    async deleteFile(fileId: number, userId: number): Promise<Result> {
        // TODO: handle errors here
        await this.database.file.delete({
            where: {
                ownerUserId: userId,
                id: fileId,
            }
        });

        // TODO: sync with s3

        return Result.Success;
    }

    async deleteFiles(fileIds: number[], userId): Promise<Result> {
        // TODO: handle errors here
        await this.database.file.deleteMany({
            where: {
                ownerUserId: userId,
                id: {
                    in: fileIds
                }
            }
        });

        // TODO: sync with s3

        return Result.Success;
    }
}
