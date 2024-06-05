import { Module } from '@nestjs/common';
import { S3InterfaceService } from './s3-interface.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	providers: [S3InterfaceService],
	exports: [S3InterfaceService],
	imports: [DatabaseModule],
})
export class S3InterfaceModule {}
