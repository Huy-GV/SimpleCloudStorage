import { Injectable } from '@nestjs/common';
import { Result } from 'src/data/enums/result';
import {
    DeleteObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface S3Object {
  key: string;
  bucket: string;
  region: string;
}

@Injectable()
export class S3InterfaceService {
    private readonly awsCredentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
    private readonly region: string;
    private readonly bucket: string;
    private readonly s3Client: S3;

    constructor(
    private readonly config: ConfigService,
    private readonly database: DatabaseService,
    ) {
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

    async getPublicUrl(objectUrl: string): Promise<string> {
        const { bucket, key } = this.extractS3ObjectProperties(objectUrl);
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const durationInSeconds = 60 * 60;
        const presignedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
            expiresIn: durationInSeconds,
        });

        return presignedUrl;
    }

    async uploadFile(fileToUpload: Express.Multer.File): Promise<string | null> {
        const objectKey = encodeURI(Date.now() + '_' + fileToUpload.originalname);
        const putObjectCommand = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: fileToUpload.buffer,
        });

        const s3Result = await this.s3Client.send(putObjectCommand);
        if (
            s3Result.$metadata.httpStatusCode != 200 &&
      s3Result.$metadata.httpStatusCode != 201
        ) {
            console.error(
                'Error uploading object: ',
                s3Result.$metadata.httpStatusCode,
            );
            return null;
        } else {
            console.log('Successfully uploaded object');
        }

        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${objectKey}`;
    }

    private extractS3ObjectProperties(s3Url: string): S3Object | null {
        const pattern: RegExp =
      /https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/([^\/]+)/;
        const matches = s3Url.match(pattern);
        if (!matches) {
            return null;
        }

        const bucket: string = matches[1];
        const region: string = matches[2];
        const objectKey: string = matches[3];

        return {
            region: region,
            bucket: bucket,
            key: objectKey,
        };
    }

    async deleteObjects(objectUrls: string[]): Promise<Result> {
        const objectKeys = objectUrls.map(
            (x) => this.extractS3ObjectProperties(x).key,
        );
        const deleteObjectsCommand = new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
                Objects: objectKeys.map((objectKey) => ({ Key: objectKey })),
                Quiet: false,
            },
        });

        const s3Result = await this.s3Client.send(deleteObjectsCommand);
        if (
            s3Result.$metadata.httpStatusCode != 200 &&
      s3Result.$metadata.httpStatusCode != 201
        ) {
            console.error(
                `Error deleting ${objectUrls.length} objects: `,
                s3Result.$metadata.httpStatusCode,
            );
            return null;
        } else {
            console.log(`Successfully deleted ${objectUrls.length} objects`);
        }

        return Result.Success;
    }
}
