import { Body, Controller, ForbiddenException, Get, Post } from '@nestjs/common';
import { SignInViewModel } from 'src/data/viewmodels/signInViewModel';
import { SignUpViewModel } from 'src/data/viewmodels/signUpViewModel';
import { AuthenticationService } from './authentication.service';
import { JwtTokenViewModel } from 'src/data/viewmodels/jwtTokenViewmodel';

@Controller('auth')
export class AuthenticationController {
    constructor(private readonly jwtAuthenticator: AuthenticationService) {}

    @Post('sign-in')
    async signIn(@Body() viewModel: SignInViewModel): Promise<JwtTokenViewModel> {
        const token = await this.jwtAuthenticator.signIn(viewModel);
        if (!token) {
            throw new ForbiddenException("Sign In Failed");
        }

        return token
    }

    @Post('sign-up')
    async signUp(@Body() viewModel: SignUpViewModel): Promise<JwtTokenViewModel>  {
        const token = await this.jwtAuthenticator.signUp(viewModel);
        if (!token) {
            throw new ForbiddenException("Sign Up Failed");
        }

        return token
    }
}
