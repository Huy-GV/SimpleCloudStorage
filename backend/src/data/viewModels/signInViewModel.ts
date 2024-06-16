import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class SignInViewModel {
	@IsNotEmpty()
	@Transform(({ value }) => value.trim())
	readonly userName: string;

	@IsNotEmpty()
	readonly password: string;
}
