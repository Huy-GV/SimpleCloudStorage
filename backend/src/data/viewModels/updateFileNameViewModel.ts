import { Optional } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsNumberString, ValidateIf } from "class-validator";

export class UpdateFileNameViewModel {
	readonly id: number;

	@IsNotEmpty()
	readonly newFileName: string;

	@Optional()
	@IsNumber()
	@Type(() => Number)
	@ValidateIf(x => x.parentDirectoryId !== null)
	readonly parentDirectoryId: number | null;
}
