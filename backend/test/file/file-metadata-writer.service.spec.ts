import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';
import { FileMetadataWriter } from '../../src/file/file-metadata-writer.service';

describe('FileMetadataWriter', () => {
	let service: FileMetadataWriter;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileMetadataWriter, S3InterfaceService, DatabaseService, ConfigService]
		}).compile();

		service = module.get<FileMetadataWriter>(FileMetadataWriter);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
