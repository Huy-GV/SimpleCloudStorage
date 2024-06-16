import { Transform, Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class UploadFileViewModel {
	readonly file: Express.Multer.File;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Transform(x => {
		// FormData values are not correctly parsed, especially 'null' to Number | null
		const rawValue = x.obj[x.key];
		return rawValue == 'null' || rawValue == null ? null : Number.parseInt(rawValue)
	})
	readonly directoryFileId: number | null;
}
