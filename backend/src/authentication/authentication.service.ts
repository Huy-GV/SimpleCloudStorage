import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { SignUpViewModel } from '../data/viewModels/signUpViewModel';
import { JwtDto } from '../data/dtos/jwtDto';
import { DataResult, Result } from '../data/results/result';
import { ResultCode } from '../data/results/resultCode';
import { SignInViewModel } from '../data/viewModels/signInViewModel';

@Injectable()
export class AuthenticationService {
	private readonly logger = new Logger(AuthenticationService.name);

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
			this.logger.error(`User named ${signInViewModel.userName} not found`);
			return new DataResult(ResultCode.Unauthorized);
		}

		const isPasswordValid = !!signInViewModel.password && await bcrypt.compare(
			signInViewModel.password,
			user.password,
		);

		if (!isPasswordValid) {
			this.logger.error(`Invalid password for user named ${signInViewModel.userName}`);
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
