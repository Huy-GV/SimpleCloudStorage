import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileStorageController } from './file-storage.controller';
import { DatabaseModule } from 'src/database/database.module';
import { S3InterfaceModule } from 'src/s3-interface/s3-interface.module';

@Module({
	providers: [FileStorageService],
	controllers: [FileStorageController],
	imports: [DatabaseModule, S3InterfaceModule]
})
export class FileStorageModule {}
