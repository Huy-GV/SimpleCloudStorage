import { Controller, Get } from '@nestjs/common';

@Controller('file-storage')
export class FileStorageController {
  constructor() {}

  @Get()
  getHello(): string {
    return null
  }
}
