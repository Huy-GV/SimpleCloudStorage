import { Type } from "class-transformer";
import { IsOptional, ValidateIf } from "class-validator";

export class UploadFileViewModel {
	readonly file: Express.Multer.File;

	@IsOptional()
	@ValidateIf(x => x.directoryFileId !== null)
	@Type(() => Number)
	readonly directoryFileId: number | null;
}
