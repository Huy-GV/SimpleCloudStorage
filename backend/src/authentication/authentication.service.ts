import { Injectable } from '@nestjs/common';
import { SignInViewModel } from 'src/data/viewModels/signInViewModel';
import { JwtService } from '@nestjs/jwt';
import { SignUpViewModel } from 'src/data/viewModels/signUpViewModel';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtDto } from 'src/data/dtos/jwtDto';
import { ResultCode } from 'src/data/results/resultCode';
import { DataResult, Result } from 'src/data/results/result';

@Injectable()
export class AuthenticationService {
	constructor(
		private readonly database: DatabaseService,
		private readonly jwtService: JwtService,
	) { }

	async signUp(signUpViewModel: SignUpViewModel): Promise<Result<JwtDto>> {
		const user = await this.database.user.create({
			data: {
				name: signUpViewModel.userName,
				password: await bcrypt.hash(signUpViewModel.password, 5),
				email: signUpViewModel.email,
			},
		});

		const payload = {
			sub: user.id,
			username: user.name,
		};

		const jwtDto = new JwtDto(
			await this.jwtService.signAsync(payload),
		);

		return new DataResult(ResultCode.Success, jwtDto);
	}

	async signIn(signInViewModel: SignInViewModel): Promise<Result<JwtDto>> {
		const user = await this.database.user.findFirst({
			where: {
				name: signInViewModel.userName,
			},
		});

		if (!user) {
			return new DataResult(ResultCode.NotFound);
		}

		const isPasswordValid = await bcrypt.compare(
			signInViewModel.password,
			user.password,
		);

		if (!isPasswordValid) {
			return new DataResult(ResultCode.Unauthorized);
		}

		const payload = {
			sub: user.id,
			username: user.name,
		};

		const jwtDto = new JwtDto(await this.jwtService.signAsync(payload));

		return new DataResult(ResultCode.Success, jwtDto);
	}
}
