import { Module } from '@nestjs/common';
import { S3InterfaceService } from './s3-interface.service';

@Module({
  providers: [S3InterfaceService],
  exports: [S3InterfaceService]
})
export class S3InterfaceModule {}
