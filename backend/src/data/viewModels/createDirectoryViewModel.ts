import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class CreateDirectoryViewModel {
    readonly name: string;

	@IsOptional()
	@IsNumber()
	@Type(() => Number)
    readonly parentDirectoryId: number | null
}
