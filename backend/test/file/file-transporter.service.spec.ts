import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';
import { FileTransporter } from '../../src/file/file-transporter.service';

describe('FileTransporter', () => {
	let service: FileTransporter;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [FileTransporter, S3InterfaceService, DatabaseService, ConfigService]
		}).compile();

		service = module.get<FileTransporter>(FileTransporter);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
