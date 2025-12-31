import { Injectable, Logger } from '@nestjs/common';
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { DataResult, EmptyResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { randomUUID } from 'crypto';

type S3Object = {
  key: string;
  bucket: string;
  region: string;
}

@Injectable()
export class S3InterfaceService {
	private readonly logger: Logger = new Logger(S3InterfaceService.name);
	private readonly region: string;
	private readonly bucket: string;
	private readonly s3Client: S3;

	constructor(
		private readonly config: ConfigService,
	) {
		this.region = this.config.get<string>('REGION_AWS');
		this.bucket = this.config.get<string>('DATA_BUCKET_AWS');

		this.s3Client = new S3({
			region: this.region,
		});
	}

	private formatS3ObjectKey(objectKey: string) {
		return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${objectKey}`;
	}

	async downloadFile(objectUrl: string) {
		const { bucket, key } = this.extractS3ObjectProperties(objectUrl);
		const getObjectCommand = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		const response = await this.s3Client.send(getObjectCommand);
		return response.Body;
	}

	async uploadFile(fileToUpload: Express.Multer.File, userId: number): Promise<Result<string>> {
		const objectKey = `${userId}_${randomUUID()}`
		const putObjectCommand = new PutObjectCommand({
			Bucket: this.bucket,
			Key: objectKey,
			Body: fileToUpload.buffer,
			Metadata: {
				"userId": userId.toString()
			}
		});

		const s3Result = await this.s3Client.send(putObjectCommand);
		if (
			s3Result.$metadata.httpStatusCode != 200 &&
			s3Result.$metadata.httpStatusCode != 201
		) {
			this.logger.error(
				'Error uploading object: ',
				s3Result.$metadata.httpStatusCode,
			);

			return new DataResult(ResultCode.InvalidArguments);
		} else {
			this.logger.log(`Successfully uploaded file '${fileToUpload.originalname}'`);
		}

		return new DataResult(
			ResultCode.Success,
			this.formatS3ObjectKey(objectKey)
		);
	}

	private extractS3ObjectProperties(s3Url: string): S3Object | null {
		const pattern: RegExp = /https:\/\/([^\.]+)\.s3\.([^\.]+)\.amazonaws\.com\/([^\/]+)/;
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

	async deleteObjects(objectUrls: string[]): Promise<EmptyResult> {
		if (objectUrls.length == 0) {
			return new EmptyResult(ResultCode.Success);
		}

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
			this.logger.error(
				`Error deleting ${objectUrls.length} objects: `,
				s3Result.$metadata.httpStatusCode,
			);

			return new EmptyResult(ResultCode.InvalidArguments);
		}

		this.logger.log(`Successfully deleted ${objectUrls.length} objects`);
		return new EmptyResult(ResultCode.Success);
	}
}
