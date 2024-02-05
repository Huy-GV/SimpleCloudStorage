import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AUTH_HEADER_KEY, IS_PUBLIC_KEY, JWT_COOKIE_KEY, USER_CONTEXT_KEY } from "./constants";

@Injectable()
export class AuthenticationGuard implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector) {
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [
                context.getHandler(),
                context.getClass(),
            ]
        );

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractJwt(request);
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: process.env.JWT_SECRET,
                }
            );

            // TODO: build a complex User model by loading info from the db?
            request[USER_CONTEXT_KEY] = payload;
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }

    private extractJwt(request: Request): string | null {
        if (request.cookies[JWT_COOKIE_KEY]) {

            // try extracting the token from cookies first
            return request.cookies[JWT_COOKIE_KEY]
        }

        const authHeader = request.headers[AUTH_HEADER_KEY];
        if (!authHeader || typeof authHeader != 'string') {
            return null
        }

        const authHeaderString = request.headers[AUTH_HEADER_KEY].toString();
        return this.extractJwtFromAuthHeader(authHeaderString)
    }

    private extractJwtFromAuthHeader(authHeaderString: string) {
        const [type, token] = authHeaderString?.split(' ') ?? [];
        return type === 'Bearer' ? token : null;
    }
}
