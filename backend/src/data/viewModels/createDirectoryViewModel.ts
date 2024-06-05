import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateDirectoryViewModel {
	@IsNotEmpty()
	readonly name: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly parentDirectoryId: number | null
}
