import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty } from "class-validator";

export class SignUpViewModel {
	@IsNotEmpty()
	@Transform(({ value }) => value.trim())
	readonly userName: string;

	// @IsEmail()
	// @Transform(({ value }) => value.trim())
	// readonly email: string;

	@IsNotEmpty()
	readonly password: string;
}
