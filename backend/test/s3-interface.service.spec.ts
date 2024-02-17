import { Test, TestingModule } from '@nestjs/testing';
import { S3InterfaceService } from '../src/s3-interface/s3-interface.service';

describe('S3InterfaceService', () => {
	let service: S3InterfaceService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [S3InterfaceService],
		}).compile();

		service = module.get<S3InterfaceService>(S3InterfaceService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
