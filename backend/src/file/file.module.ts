import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { S3InterfaceModule } from '../s3-interface/s3-interface.module';
import { FileMetadataWriter } from './file-metadata-writer.service';
import { FileMetadataReader } from './file-metadata-reader.service';
import { FileTransporter } from './file-transporter.service';
import { FileController } from './file.controller';

@Module({
	providers: [FileMetadataWriter, FileMetadataReader, FileTransporter],
	controllers: [FileController],
	imports: [DatabaseModule, S3InterfaceModule],
})
export class FileModule {}
