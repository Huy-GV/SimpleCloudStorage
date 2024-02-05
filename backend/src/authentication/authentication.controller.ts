import { Body, Controller, ForbiddenException, Post, Request, Res } from '@nestjs/common';
import { SignInViewModel } from 'src/data/viewModels/signInViewModel';
import { SignUpViewModel } from 'src/data/viewModels/signUpViewModel';
import { AuthenticationService } from './authentication.service';
import { AllowAnonymous } from './authentication.decorator';
import { Response } from 'express';
import { JWT_COOKIE_KEY } from './constants';
import { JwtDto } from 'src/data/dtos/jwtDto';

@Controller('auth')
export class AuthenticationController {
    constructor(private readonly jwtAuthenticator: AuthenticationService) {}

    @AllowAnonymous()
    @Post('sign-in')
    async signIn(
            @Body() viewModel: SignInViewModel,
            @Res({ passthrough: true }) response: Response): Promise<JwtDto> {

        const tokenDto = await this.jwtAuthenticator.signIn(viewModel);
        if (!tokenDto) {
            throw new ForbiddenException("Sign In Failed");
        }

        response.cookie(JWT_COOKIE_KEY, tokenDto.token, { httpOnly: true })

        return tokenDto
    }

    @AllowAnonymous()
    @Post('sign-up')
    async signUp(
        @Body() viewModel: SignUpViewModel,
        @Res() response: Response): Promise<JwtDto>  {

        const tokenDto = await this.jwtAuthenticator.signUp(viewModel);
        if (!tokenDto) {
            throw new ForbiddenException("Sign Up Failed");
        }

        response.cookie(JWT_COOKIE_KEY, tokenDto.token, { httpOnly: true })

        return tokenDto
    }
}
