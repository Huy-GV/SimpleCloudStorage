import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '../../src/file/file.controller';
import { FileMetadataWriter } from '../../src/file/file-metadata-writer.service';
import { FileMetadataReader } from '../../src/file/file-metadata-reader.service';
import { FileTransporter } from '../../src/file/file-transporter.service';

describe('FileController', () => {
	let controller: FileController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FileController],
			providers: [
				{
					provide: FileMetadataWriter,
					useValue: { },
				},
				{
					provide: FileMetadataReader,
					useValue: { },
				},
				{
					provide: FileTransporter,
					useValue: { },
				},
			],
		}).compile();

		controller = module.get<FileController>(FileController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
