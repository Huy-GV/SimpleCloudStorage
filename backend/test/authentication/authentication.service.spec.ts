import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from '../../src/authentication/authentication.service';
import { DatabaseService } from '../../src/database/database.service';

describe('AuthenticationService', () => {
	let service: AuthenticationService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthenticationService, DatabaseService, JwtService],
		}).compile();

		service = module.get<AuthenticationService>(AuthenticationService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
