import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
	ALLOW_ANONYMOUS_KEY,
	JWT_COOKIE_KEY,
	USER_CONTEXT_KEY,
	BEARER_STR,
} from './constants';
import { ConfigService } from '@nestjs/config';
import { UserContextDto } from '../data/dtos/userContextDto';
import { constants } from 'http2';

@Injectable()
export class AuthenticationGuard implements CanActivate {
	private readonly logger: Logger = new Logger(AuthenticationGuard.name);

	constructor(
		private readonly jwtService: JwtService,
		private readonly reflector: Reflector,
		private readonly config: ConfigService
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const allowAnonymous = this.reflector.getAllAndOverride<boolean>(
			ALLOW_ANONYMOUS_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (allowAnonymous) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractJwt(request);
		if (!token) {
			throw new UnauthorizedException();
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.config.get<string>('JWT_SECRET'),
			});

			request[USER_CONTEXT_KEY] = new UserContextDto(payload.sub, payload.userName);
		} catch (e) {
			this.logger.error(e);
			throw new UnauthorizedException();
		}

		return true;
	}

	private extractJwt(request: Request): string | null {
		const tokenFromCookie = this.extractTokenFromCookie(request);
		if (tokenFromCookie) {
			return tokenFromCookie;
		}

		const tokenFromHeader = this.extractTokenFromAuthHeader(request);
		return tokenFromHeader;
	}

	private extractTokenFromCookie(request: Request): string | null {
		return request.cookies[JWT_COOKIE_KEY] || null;
	}

	private extractTokenFromAuthHeader(request: Request): string | null {
		const authHeader = request.headers[constants.HTTP2_HEADER_AUTHORIZATION];
		if (!authHeader || typeof authHeader !== 'string') {
			return null;
		}

		const [type, token] = authHeader?.split(' ') ?? [];
		return type === BEARER_STR ? token : null;
	}
}
