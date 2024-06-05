import { IsNotEmpty } from "class-validator";

export class SignInViewModel {
	@IsNotEmpty()
	readonly userName: string;

	@IsNotEmpty()
	readonly password: string;
}
