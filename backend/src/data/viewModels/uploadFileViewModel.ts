import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional, Validate } from "class-validator";

export class UploadFileViewModel {
	readonly file: Express.Multer.File;

	@IsOptional()
	@Type(() => Number)
	@Transform(x => {
		// FormData values are not correctly parsed, especially 'null' to Number | null
		const rawValue = x.obj[x.key];
		return rawValue == 'null' || rawValue == null ? null : Number.parseInt(rawValue)
	})

	@IsInt()
	readonly directoryFileId: number | null;
}
