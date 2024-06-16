import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateDirectoryViewModel {
	@IsNotEmpty()
	@Transform(({ value }) => value.trim())
	readonly name: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	readonly parentDirectoryId: number | null
}
