import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';
import { FileMetadataWriter } from '../../src/file/file-metadata-writer.service';
import { createMockDbContext, DatabaseContext } from '../mocks/database-mock';
import { CreateDirectoryViewModel } from '../../src/data/viewModels/createDirectoryViewModel';
import { EmptyResult } from '../../src/data/results/result';
import { ResultCode } from '../../src/data/results/resultCode';
import { randomBytes, randomInt } from 'crypto';

describe('FileMetadataWriter', () => {
	let service: FileMetadataWriter;
	let mockDbContext = createMockDbContext();
	let context = mockDbContext as unknown as DatabaseContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FileMetadataWriter,
				S3InterfaceService,
				{
					provide: DatabaseService,
					useValue: context.databaseService
				},
				ConfigService
			]
		}).compile();

		service = module.get<FileMetadataWriter>(FileMetadataWriter);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('createDirectory()', () => {
		it('should return Unauthorized if user is not found', async () => {
			const userId = randomInt(1, 1000);;
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(null)
			const result = await service.createDirectory(userId, new CreateDirectoryViewModel());
			expect(result).toEqual(new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${userId} not found`,
			));
		});

		it('should return Unauthorized if user id is null', async () => {
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(null)
			const result = await service.createDirectory(null, new CreateDirectoryViewModel());
			expect(result).toEqual(new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${null} not found`,
			));
		});

		it('should return InvalidArguments if directory with identical name exists in parent directory', async () => {
			const userId = randomInt(1, 1000);;
			const fileName = randomBytes(10).toString('hex');
			const parentDirectoryId = randomInt(1000);
			const viewModel: CreateDirectoryViewModel = {
				parentDirectoryId,
				name: fileName
			}

			mockDbContext.databaseService.user.findFirst.mockResolvedValue({
				id: userId,
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			});

			jest.spyOn(mockDbContext.databaseService, '$transaction').mockImplementation((callback) => {
				const transaction = {
					file: {
						count: jest.fn().mockResolvedValue(randomInt(1, 100000))
					},
				};

				return callback(transaction as any);
			});

			const result = await service.createDirectory(userId, viewModel);
			const expected = new EmptyResult(
				ResultCode.InvalidArguments,
				`File or directory with name '${viewModel.name}' already exists in the current directory`,
			);

			expect(result).toEqual(expected);
		});

		it('should succeed if directory name is unique in parent directory', async () => {
			const userId = randomInt(1, 1000);
			const fileName = randomBytes(10).toString('hex');
			const parentDirectoryId = randomInt(1000);
			const viewModel: CreateDirectoryViewModel = {
				parentDirectoryId,
				name: fileName
			}

			mockDbContext.databaseService.user.findFirst.mockResolvedValue({
				id: userId,
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			});

			jest.spyOn(mockDbContext.databaseService, '$transaction').mockImplementation((callback) => {
				const transaction = {
					file: {
						count: jest.fn().mockResolvedValue(0),
						create: jest.fn().mockResolvedValue({})
					},
				};

				return callback(transaction as any);
			});

			const result = await service.createDirectory(userId, viewModel);
			const expected = new EmptyResult(ResultCode.Success);

			expect(result).toEqual(expected);
		});
	})
});
