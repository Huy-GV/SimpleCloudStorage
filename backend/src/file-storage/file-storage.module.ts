import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileStorageController } from './file-storage.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
	providers: [FileStorageService],
	controllers: [FileStorageController],
	imports: [DatabaseModule]
})
export class FileStorageModule {}
