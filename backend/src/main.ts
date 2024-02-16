import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const config = app.get(ConfigService);

	app.enableCors({
		origin: [config.get<string>('CLIENT_URLS')],
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
		}),
	);


	app.use(cookieParser());
	const port = config.get<number>('SERVER_PORT');
	console.log('Server listening on: ', port)
	await app.listen(port);
}

bootstrap();
