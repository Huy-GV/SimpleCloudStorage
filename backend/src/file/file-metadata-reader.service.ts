import { Injectable } from "@nestjs/common";
import { FileDto } from "../data/dtos/fileDto";
import { DatabaseService } from "../database/database.service";

@Injectable()
export class FileMetadataReader {
	constructor(
		private readonly database: DatabaseService
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
			orderBy: [
				{
					createdAt: 'desc'
				},
				{
					sizeKb: 'desc'
				}
			]
		});

		return files.map((x) => ({
			id: x.id,
			name: x.name,
			uploadDate: x.createdAt,
			size: x.sizeKb,
			isDirectory: x.isDirectory,
		}));
	}
}
