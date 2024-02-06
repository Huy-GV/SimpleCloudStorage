import { SetMetadata } from "@nestjs/common";
import { ALLOW_ANONYMOUS_KEY } from "./constants";

export const AllowAnonymous = () => SetMetadata(ALLOW_ANONYMOUS_KEY, true);
