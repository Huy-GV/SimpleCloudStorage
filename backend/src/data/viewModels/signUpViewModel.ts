import { IsEmail, IsNotEmpty } from "class-validator";

export class SignUpViewModel {
	@IsNotEmpty()
	readonly userName: string;

	@IsEmail()
	readonly email: string;

	@IsNotEmpty()
	readonly password: string;
}
