import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../../src/authentication/authentication.service';
import { DatabaseService } from '../../src/database/database.service';
import { createMockDbContext, DatabaseContext } from '../mocks/database-mock';
import { SignInViewModel } from '../../src/data/viewModels/signInViewModel';
import { DataResult } from '../../src/data/results/result';
import { ResultCode } from '../../src/data/results/resultCode';
import { randomBytes, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtDto } from '../../src/data/dtos/jwtDto';
import { SignUpViewModel } from '../../src/data/viewModels/signUpViewModel';
import { SilentLoggerService } from '../mocks/silent-logger';

jest.mock('bcrypt');

describe('AuthenticationService', () => {
	let service: AuthenticationService;
	let jwtService: JwtService;
	let mockDbContext = createMockDbContext();
	let context = mockDbContext as DatabaseContext;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthenticationService,
				JwtService,
				{
					provide: DatabaseService,
					useValue: context.databaseService
				}
			],

		}).compile();
		module.useLogger(new SilentLoggerService());
		service = module.get<AuthenticationService>(AuthenticationService);
		jwtService = module.get<JwtService>(JwtService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('signIn()', () => {
		it('should return NotFound if user is not found', async () => {
			const viewModel = {
				userName: randomBytes(8).toString('hex')
			} as SignInViewModel

			mockDbContext.databaseService.user.findFirst.mockResolvedValue(null);
			const result = await service.signIn(viewModel);
			const expected = new DataResult(ResultCode.Unauthorized, null, `User named ${viewModel.userName} not found`);
			expect(result).toEqual(expected);
		});

		it('should return Unauthorized if password does not match', async () => {
			const randomString = randomBytes(20).toString('hex');
			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomString.substring(0, 10),
			};

			const viewModel = {
				userName: user.name,
				password: randomString.substring(11)
			} as SignInViewModel

			(bcrypt.compare as jest.Mock).mockResolvedValue(false);
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(user);
			const result = await service.signIn(viewModel);
			const expected = new DataResult(ResultCode.Unauthorized, null, `Invalid password for user named ${viewModel.userName}`);
			expect(result).toEqual(expected);
		});

		it('should return Unauthorized if password is null', async () => {
			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			};

			const viewModel = {
				userName: user.name,
				password: null,
			} as SignInViewModel

			mockDbContext.databaseService.user.findFirst.mockResolvedValue(user);
			const result = await service.signIn(viewModel);
			const expected = new DataResult(ResultCode.Unauthorized, null, `Invalid password for user named ${viewModel.userName}`);
			expect(result).toEqual(expected);
		});

		it('should succeed', async () => {
			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			};

			const token = randomBytes(30).toString('hex');

			const viewModel = {
				userName: user.name,
				password: user.password,
			} as SignInViewModel

			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			mockDbContext.databaseService.user.findFirst.mockResolvedValue(user);
			jest.spyOn(jwtService, 'signAsync').mockImplementation(() => {
				return new Promise(resolve => resolve(token))
			});

			const result = await service.signIn(viewModel);
			const expected = new DataResult(
				ResultCode.Success,
				new JwtDto(token)
			);

			expect(result).toEqual(expected);
		});
	})

	describe('signUp()', () => {
		it('should succeed', async () => {
			const viewModel = {
				userName: randomBytes(8).toString('hex')
			} as SignUpViewModel

			const user = {
				id: randomInt(1, 100000),
				name: randomBytes(10).toString('hex'),
				email: randomBytes(10).toString('hex'),
				password: randomBytes(10).toString('hex'),
			};

			const token = randomBytes(30).toString('hex');

			mockDbContext.databaseService.user.create.mockResolvedValue(user);
			jest.spyOn(jwtService, 'signAsync').mockImplementation(() => {
				return new Promise(resolve => resolve(token))
			});

			const result = await service.signUp(viewModel);
			const expected = new DataResult(
				ResultCode.Success,
				new JwtDto(token)
			);

			expect(result).toEqual(expected);
		})
	})
});
