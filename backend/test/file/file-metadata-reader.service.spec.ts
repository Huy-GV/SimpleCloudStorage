import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { FileMetadataReader } from '../../src/file/file-metadata-reader.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';

describe('FileMetadataReader', () => {
	let service: FileMetadataReader;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileMetadataReader, S3InterfaceService, DatabaseService, ConfigService]
		}).compile();

		service = module.get<FileMetadataReader>(FileMetadataReader);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
