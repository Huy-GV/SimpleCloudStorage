import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous } from "./authentication/authentication.decorator";

@AllowAnonymous()
@Controller("health")
export class AppController {
    constructor() { }

    @Get("")
    healthCheck(): string {
        return "Server Running"
    }
}
