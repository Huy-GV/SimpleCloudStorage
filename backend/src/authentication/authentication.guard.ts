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
	AUTH_HEADER_KEY,
	ALLOW_ANONYMOUS_KEY,
	JWT_COOKIE_KEY,
	USER_CONTEXT_KEY,
	BEARER_STR,
} from './constants';
import { ConfigService } from '@nestjs/config';

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

			// TODO: build a complex User model by loading info from the db?
			request[USER_CONTEXT_KEY] = payload;
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
		const authHeader = request.headers[AUTH_HEADER_KEY];
		if (!authHeader || typeof authHeader !== 'string') {
			return null;
		}

		const [type, token] = authHeader?.split(' ') ?? [];
		return type === BEARER_STR ? token : null;
	}
}
