import { Test, TestingModule } from '@nestjs/testing';
import { FileStorageController } from '../../src/file-storage/file-storage.controller';
import { FileStorageService } from '../../src/file-storage/file-storage.service';

describe('FileStorageController', () => {
	let controller: FileStorageController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FileStorageController],
			providers: [
				{
					provide: FileStorageService,
					useValue: { },
				},
			],
		}).compile();

		controller = module.get<FileStorageController>(FileStorageController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
