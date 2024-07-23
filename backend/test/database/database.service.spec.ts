import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../../src/database/database.service';
import { PrismaClient } from '@prisma/client';

describe('DatabaseService', () => {
	let service: DatabaseService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [DatabaseService],
		}).compile();

		service = module.get<DatabaseService>(DatabaseService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(service).toBeInstanceOf(PrismaClient)
	});
});
