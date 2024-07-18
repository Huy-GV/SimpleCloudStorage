import { UserContextDto } from "./userContextDto";

export interface JwtPayloadDto {
	readonly sub: number,
	readonly userName: string
}

export function jwtPayloadFromUserContext(userContext: UserContextDto): JwtPayloadDto {
    // payload must be a plain object
    return {
        sub: userContext.userId,
        userName: userContext.userName
    }
}
