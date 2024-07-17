import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { AuthenticationModule } from '../src/authentication/authentication.module';
import { DatabaseModule } from '../src/database/database.module';
import { FileModule } from '../src/file/file.module';
import { S3InterfaceModule } from '../src/s3-interface/s3-interface.module';
import { DatabaseService } from '../src/database/database.service';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					// TODO: fix missing environment variables
					envFilePath: jest.fn().mockReturnValue('randomString')(),
					isGlobal: true,
				}),
				AuthenticationModule,
				FileModule,
				DatabaseModule,
				S3InterfaceModule,
				AppModule
			],

			providers: [DatabaseService],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/ (GET)', () => {
		return request(app.getHttpServer())
			.get('/')
			.expect(200)
			.expect('Hello World!');
	});
});
