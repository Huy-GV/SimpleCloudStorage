import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";

export class UpdateFileNameViewModel {
	readonly id: number;

	@IsNotEmpty()
	readonly newFileName: string;

	@IsOptional()
	@IsInt()
	@Type(() => Number)
	@ValidateIf(x => x.parentDirectoryId !== null)
	readonly parentDirectoryId: number | null;
}
