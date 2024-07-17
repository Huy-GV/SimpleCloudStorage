import { Injectable } from '@nestjs/common';
import {
	DatabaseService,
	TransactionClientAlias,
} from '../database/database.service';
import { S3InterfaceService } from '../s3-interface/s3-interface.service';
import { EmptyResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { CreateDirectoryViewModel } from '../data/viewModels/createDirectoryViewModel';
import { UpdateFileNameViewModel } from '../data/viewModels/updateFileNameViewModel';

@Injectable()
export class FileMetadataWriter {
	constructor(
		private readonly database: DatabaseService,
		private readonly s3Service: S3InterfaceService,
	) {}

	async createDirectory(
		userId: number,
		viewModel: CreateDirectoryViewModel,
	): Promise<Result> {
		if (!await this.userExists(userId)) {
			return new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${userId} not found`,
			);
		}

		return await this.database.$transaction(async (transaction) => {
			const filesWithIdenticalNameInSharedDirectoryCount =
				await transaction.file.count({
					where: {
						name: viewModel.name,
						parentFileId: viewModel.parentDirectoryId,
						ownerUserId: userId
					},
				});

			if (filesWithIdenticalNameInSharedDirectoryCount > 0) {
				return new EmptyResult(
					ResultCode.InvalidArguments,
					`File or directory with name '${viewModel.name}' already exists in the current directory`,
				);
			}

			await transaction.file.create({
				data: {
					name: viewModel.name,
					parentFileId: viewModel.parentDirectoryId,
					ownerUserId: userId,
					sizeKb: 0,
					uri: '',
					creationTime: new Date(),
					isDirectory: true,
				},
			});

			return new EmptyResult(ResultCode.Success);
		});
	}

	private async userExists(userId: number) {
		return userId != null && this.database.user.findFirst({ where: { id: userId } }).then(Boolean);
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
		return await this.database.$transaction(async (transaction) => {
			const newFileName = viewModel.newFileName;
			const filesWithIdenticalNameInSharedDirectory =
				await transaction.file.count({
					where: {
						name: newFileName,
						parentFileId: viewModel.parentDirectoryId,
					},
				});

			if (filesWithIdenticalNameInSharedDirectory > 0) {
				return new EmptyResult(
					ResultCode.InvalidArguments,
					`File or directory with name '${newFileName}' already exist in the upload directory`,
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

			return new EmptyResult(ResultCode.Success);
		});
	}

	async deleteFiles(fileIds: number[], userId: number): Promise<EmptyResult> {
		return await this.database.$transaction(async (transaction) => {
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

			return new EmptyResult(ResultCode.Success);
		});
	}
}
