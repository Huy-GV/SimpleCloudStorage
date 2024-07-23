import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '../../src/file/file.controller';
import { FileMetadataWriter } from '../../src/file/file-metadata-writer.service';
import { FileMetadataReader } from '../../src/file/file-metadata-reader.service';
import { FileTransporter } from '../../src/file/file-transporter.service';
import { DatabaseModule } from '../../src/database/database.module';
import { S3InterfaceModule } from '../../src/s3-interface/s3-interface.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('FileController', () => {
	let controller: FileController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FileController],
			imports: [
				DatabaseModule,
				S3InterfaceModule,
				{
					module: ConfigModule,
					global: true
				},
			],
			providers: [FileMetadataWriter, FileMetadataReader, FileTransporter, ConfigService],
		}).compile();

		controller = module.get<FileController>(FileController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
