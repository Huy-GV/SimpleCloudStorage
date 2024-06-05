import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { ResultCode } from '../data/results/resultCode';
import { Result } from '../data/results/result';
export default function throwHttpExceptionOnFailure(result: Result) {
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
