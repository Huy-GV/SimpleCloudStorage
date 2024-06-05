import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { FileStorageService } from '../../src/file-storage/file-storage.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';

describe('FileStorageService', () => {
	let service: FileStorageService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileStorageService, S3InterfaceService, DatabaseService, ConfigService]
		}).compile();

		service = module.get<FileStorageService>(FileStorageService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
