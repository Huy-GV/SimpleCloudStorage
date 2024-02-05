import { Injectable } from '@nestjs/common';
import { SignInViewModel } from 'src/data/viewModels/signInViewModel';
import { JwtService } from '@nestjs/jwt';
import { SignUpViewModel } from 'src/data/viewModels/signUpViewModel';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtDto } from 'src/data/dtos/jwtDto';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly database: DatabaseService,
		private readonly jwtService: JwtService) {
	}

	async signUp (signUpViewModel: SignUpViewModel): Promise<JwtDto|null> {
		const user = await this.database.user.create({
			data: {
				name: signUpViewModel.userName,
				password: await bcrypt.hash(signUpViewModel.password, 5),
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

	async signIn(signInViewModel: SignInViewModel): Promise<JwtDto|null> {
		const user = await this.database.user.findFirst({
			where: {
				name: signInViewModel.userName
			}
		});

		if (!user) {
			return null;
		}

		const isPasswordValid = await bcrypt.compare(
			signInViewModel.password,
			user.password
		);

		if (!isPasswordValid) {
			return null;
		}

		const payload = {
			sub: user.id,
			username: user.name
		};

		return {
			token: await this.jwtService.signAsync(payload),
		};
  	}
}
