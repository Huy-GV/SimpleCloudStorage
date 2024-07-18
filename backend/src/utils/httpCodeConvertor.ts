import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	HttpStatus,
	NotFoundException
} from '@nestjs/common';
import { ResultCode } from '../data/results/resultCode';
import { Result } from '../data/results/result';

export function throwHttpExceptionOnFailure(result: Result) {
	if (result.successful) {
		return;
	}

	switch (result.code) {
		case ResultCode.InvalidState:
			throw new ConflictException();
		case ResultCode.Unauthorized:
			throw new ForbiddenException();
		case ResultCode.NotFound:
			throw new NotFoundException();
		case ResultCode.InvalidArguments:
			throw new BadRequestException();
		case ResultCode.Success:
			return;
	}
}

export function convertToHttpStatusCode(result: Result): number {
	if (result.successful) {
		return HttpStatus.OK;
	}

	switch (result.code) {
		case ResultCode.InvalidState:
			return HttpStatus.BAD_REQUEST;
		case ResultCode.Unauthorized:
			return HttpStatus.FORBIDDEN;
		case ResultCode.NotFound:
			return HttpStatus.NOT_FOUND;
		case ResultCode.InvalidArguments:
			return HttpStatus.UNPROCESSABLE_ENTITY;
		case ResultCode.Success:
			return HttpStatus.OK;
		default:
			return HttpStatus.INTERNAL_SERVER_ERROR;
	}
}
