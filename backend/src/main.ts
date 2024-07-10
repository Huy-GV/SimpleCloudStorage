import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const config = app.get(ConfigService);

	app.enableCors({
		origin: true,
		credentials: true,
		preflightContinue: false
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
		}),
	);

	app.setGlobalPrefix('/api/v1')
	app.use(cookieParser());
	const port = config.get<number>('SERVER_PORT');
	new Logger(AppModule.name).log(`Server listening on port: ${port}`)
	await app.listen(port);
}

bootstrap();
