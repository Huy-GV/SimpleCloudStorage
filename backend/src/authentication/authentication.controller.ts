import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Res,
} from '@nestjs/common';
import { SignInViewModel } from 'src/data/viewModels/signInViewModel';
import { SignUpViewModel } from 'src/data/viewModels/signUpViewModel';
import { AuthenticationService } from './authentication.service';
import { AllowAnonymous } from './authentication.decorator';
import { Response } from 'express';
import { JWT_COOKIE_KEY } from './constants';
import { JwtDto } from 'src/data/dtos/jwtDto';
import throwHttpExceptionOnFailure from 'src/utils/httpCodeConvertor';

@Controller('auth')
export class AuthenticationController {
	constructor(
		private readonly jwtAuthenticator: AuthenticationService
	) {	}

	@AllowAnonymous()
	@HttpCode(HttpStatus.NO_CONTENT)
	@Get('sign-out')
	signOut(
		@Res({ passthrough: true }) response: Response,
	): void {
		response.clearCookie(JWT_COOKIE_KEY, {
			httpOnly: true
		});

		return;
	}

	@AllowAnonymous()
	@Post('sign-in')
	async signIn(
		@Body() viewModel: SignInViewModel,
		@Res({ passthrough: true }) response: Response,
	): Promise<JwtDto> {
		const result = await this.jwtAuthenticator.signIn(viewModel);
		throwHttpExceptionOnFailure(result);

		response.cookie(
			JWT_COOKIE_KEY,
			result.data.token,
			{
				httpOnly: true,
				sameSite: 'strict'
			}
		);

		return result.data;
	}

	@AllowAnonymous()
	@Post('sign-up')
	async signUp(
		@Body() viewModel: SignUpViewModel,
		@Res({ passthrough: true }) response: Response,
	): Promise<JwtDto> {
		const result = await this.jwtAuthenticator.signUp(viewModel);
		throwHttpExceptionOnFailure(result);

		response.cookie(
			JWT_COOKIE_KEY,
			result.data.token,
			{
				httpOnly: true,
				sameSite: 'strict'
			}
		);

		return result.data;
	}
}
