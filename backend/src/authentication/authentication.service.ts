import { Injectable } from '@nestjs/common';
import { JwtTokenViewModel } from 'src/data/viewmodels/jwtTokenViewmodel';
import { SignInViewModel } from 'src/data/viewmodels/signInViewModel';
import { JwtService } from '@nestjs/jwt';
import { SignUpViewModel } from 'src/data/viewmodels/signUpViewModel';
import { DatabaseService } from 'src/database/database.service';


@Injectable()
export class AuthenticationService {
	constructor(
		private readonly database: DatabaseService,
		private readonly jwtService: JwtService) {
	}

	async signUp (signUpViewModel: SignUpViewModel): Promise<JwtTokenViewModel|null> {
		const user = await this.database.user.create({
			data: {
				name: signUpViewModel.userName,
				password: signUpViewModel.password,
				email: signUpViewModel.email
			}
		});

		const payload = {
			sub: user.id,
			username: user.name
		};

		return {
			token: await this.jwtService.signAsync(payload),
		};
  	}

	async signIn(signInViewModel: SignInViewModel): Promise<JwtTokenViewModel|null> {
		const user = await this.database.user.findFirst({
			where: {
				name: signInViewModel.userName
			}
		});

		if (!user) {
			return null;
		}

		// TODO: check user password

		const payload = {
			sub: user.id,
			username: user.name
		};

		return {
			token: await this.jwtService.signAsync(payload),
		};
  	}
}
