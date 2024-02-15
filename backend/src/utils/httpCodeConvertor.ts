import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { Result } from 'src/data/results/result';
import { ResultCode } from 'src/data/results/resultCode';

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
