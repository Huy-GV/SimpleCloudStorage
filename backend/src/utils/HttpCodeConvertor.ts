import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Result } from "src/data/enums/result";

export default function throwHttpExceptionOnFailure(result: Result) {
    switch (result) {
        case Result.InvalidState:
            throw new ConflictException();
        case Result.Unauthorized:
            throw new ForbiddenException();
        case Result.NotFound:
            throw new NotFoundException();
        case Result.Success:
            return;
    }
}
