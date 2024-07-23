import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../src/database/database.service';
import { S3InterfaceService } from '../../src/s3-interface/s3-interface.service';
import { FileTransporter } from '../../src/file/file-transporter.service';
import { createMockDbContext, DatabaseContext } from '../mocks/database-mock';
import { ResultCode } from '../../src/data/results/resultCode';
import { randomBytes, randomInt } from 'crypto';
import { UploadFileViewModel } from '../../src/data/viewModels/uploadFileViewModel';
import { DataResult, EmptyResult } from '../../src/data/results/result';
import { SilentLoggerService } from '../mocks/silent-logger';

describe('FileTransporter', () => {
	let service: FileTransporter;
	let s3Service: S3InterfaceService;
	let mockDbContext = createMockDbContext();
	let context = mockDbContext as DatabaseContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FileTransporter,
				S3InterfaceService,
				{
					provide: DatabaseService,
					useValue: context.databaseService
				},
				ConfigService
			]
		}).compile();

		module.useLogger(new SilentLoggerService());
		service = module.get<FileTransporter>(FileTransporter);
		s3Service = module.get<S3InterfaceService>(S3InterfaceService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('uploadFile()', () => {
		it('should return Unauthorized if user is not found', async () => {
			const userId = randomInt(1, 10000);
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(null)
			const result = await service.uploadFile(userId, new UploadFileViewModel());
			expect(result).toEqual(new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${userId} not found`,
			));
		});

		it('should return Unauthorized if user id is null', async () => {
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(null)
			const result = await service.uploadFile(null, new UploadFileViewModel());
			expect(result).toEqual(new EmptyResult(
				ResultCode.Unauthorized,
				`User ID ${null} not found`,
			));
		});

		it('should return error code from S3 service', async () => {
			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			};

			const file = {
				originalname: randomBytes(10).toString('hex')
			} as Express.Multer.File

			const viewModel: UploadFileViewModel = {
				file: file,
				directoryFileId: randomInt(1, 10000)
			}

			mockDbContext.databaseService.user.findFirst.mockResolvedValue(user);

			jest.spyOn(mockDbContext.databaseService, '$transaction').mockImplementation((callback) => {
				const transaction = {
					file: {
						count: jest.fn().mockResolvedValue(0)
					},
				};

				return callback(transaction as any);
			});

			const failureCodes = Object.values(ResultCode).filter(
				value => typeof value === 'number' && value !== ResultCode.Success
			);

			const randomResultCode = failureCodes.at(randomInt(0, failureCodes.length)) as ResultCode;

			jest.spyOn(s3Service, 'uploadFile').mockImplementationOnce((file: Express.Multer.File, userId: number) => {
				return new Promise((resolve) => { resolve(new DataResult(randomResultCode)) });
			});

			const result = await service.uploadFile(user.id, viewModel);
			const expected = new DataResult(randomResultCode);

			expect(result).toEqual(expected);
		});

		it('should succeed', async () => {
			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			};

			const file = {
				originalname: randomBytes(10).toString('hex')
			} as Express.Multer.File

			const viewModel: UploadFileViewModel = {
				file: file,
				directoryFileId: randomInt(1, 10000)
			}

			mockDbContext.databaseService.user.findFirst.mockResolvedValue(user);

			jest.spyOn(mockDbContext.databaseService, '$transaction').mockImplementation((callback) => {
				const transaction = {
					file: {
						count: jest.fn().mockResolvedValue(0),
						create: jest.fn().mockResolvedValue({})
					},
				};

				return callback(transaction as any);
			});

			jest.spyOn(s3Service, 'uploadFile').mockImplementationOnce((file: Express.Multer.File, userId: number) => {
				return new Promise((resolve) => { resolve(new DataResult(ResultCode.Success, randomBytes(10).toString('hex'))) });
			});

			const result = await service.uploadFile(user.id, viewModel);
			const expected = new EmptyResult(ResultCode.Success);

			expect(result).toEqual(expected);
		})
	});
});
