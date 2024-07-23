import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from '../../src/authentication/authentication.controller';
import { AuthenticationService } from '../../src/authentication/authentication.service';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../src/database/database.module';

describe('AuthenticationController', () => {
	let controller: AuthenticationController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthenticationController],
			imports: [DatabaseModule, JwtModule],
			providers: [AuthenticationService]
		}).compile();

		controller = module.get<AuthenticationController>(AuthenticationController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
