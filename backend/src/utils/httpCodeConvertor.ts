import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { ResultCode } from 'src/data/results/resultCode';

export default function throwHttpExceptionOnFailure(result: ResultCode) {
    switch (result) {
    case ResultCode.InvalidState:
        throw new ConflictException();
    case ResultCode.Unauthorized:
        throw new ForbiddenException();
    case ResultCode.NotFound:
        throw new NotFoundException();
    case ResultCode.Success:
        return;
    }
}
