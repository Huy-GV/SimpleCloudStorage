import { Injectable } from '@nestjs/common';
import { Result } from 'src/data/enums/result';
import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class S3InterfaceService {

    private readonly awsCredentials: { accessKeyId: string, secretAccessKey: string }
    private readonly region: string;
    private readonly bucket: string;
    private readonly s3Client: S3;

    constructor(
        private readonly config: ConfigService,
        private readonly database: DatabaseService) {

        this.awsCredentials = {
            accessKeyId: this.config.get<string>('AWS_ACCESS_KEY'),
            secretAccessKey: this.config.get<string>('AWS_SECRET_KEY'),
        };

        this.region = this.config.get<string>('AWS_REGION');
        this.bucket = this.config.get<string>('AWS_BUCKET');

        this.s3Client = new S3({
            credentials: this.awsCredentials,
            region: this.region,
        });
    }

    async getSignedUri() {
        // TODO: return uri from client
    }

    async uploadFile(fileToUpload: Express.Multer.File): Promise<string | null> {

        const objectKey = Date.now() + '_' + fileToUpload.originalname;
        const putObjectCommand = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: fileToUpload.buffer,
        })

        const s3Result =  await this.s3Client.send(putObjectCommand);
        if (s3Result.$metadata.httpStatusCode != 200 && s3Result.$metadata.httpStatusCode != 201) {
            console.error("Error uploading object: ", s3Result.$metadata.httpStatusCode);
            return null;
        } else {
            console.log("Successfully uploaded object");
        }

        return 'uri'
    }

    private extractS3ObjectProperties(s3Url: string) {
        return '';
    }

    async deleteFile(fileId: number, userId: number): Promise<Result> {
        const fileToDelete = await this.database.file.findUnique({
            where: {
                id: fileId,
                ownerUserId: userId
            }
        });

        if (!fileToDelete) {
            return Result.NotFound;
        }

        const objectKey = this.extractS3ObjectProperties(fileToDelete.uri)
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
        })

        const s3Result =  await this.s3Client.send(deleteObjectCommand);
        if (s3Result.$metadata.httpStatusCode != 200 && s3Result.$metadata.httpStatusCode != 201) {
            console.error("Error deleting object: ", s3Result.$metadata.httpStatusCode);
            return null;
        } else {
            console.log("Successfully deleted object");
        }

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

        const objectKeys = filesToDelete.map(fileToDelete => (this.extractS3ObjectProperties(fileToDelete.uri)))
        const deleteObjectsCommand = new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
                Objects: objectKeys.map(objectKey => ({ Key: objectKey })),
                Quiet: false,
            }
        })

        const s3Result =  await this.s3Client.send(deleteObjectsCommand);
        if (s3Result.$metadata.httpStatusCode != 200 && s3Result.$metadata.httpStatusCode != 201) {
            console.error(`Error deleting ${fileIds.length} objects: `, s3Result.$metadata.httpStatusCode);
            return null;
        } else {
            console.log(`Successfully deleted ${fileIds.length} objects`);
        }

        return Result.Success;
    }
}
