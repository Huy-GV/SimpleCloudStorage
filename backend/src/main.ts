import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const config = app.get(ConfigService);

	const originsString =	config.getOrThrow<string>('CORS_ALLOWED_ORIGINS') || '';
	const allowedOrigins = originsString
		.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);

	app.enableCors({
		origin: allowedOrigins.length > 0 ? allowedOrigins : false,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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
	const port = config.getOrThrow<number>('SERVER_PORT');
	new Logger(AppModule.name).log(`Server listening on port: ${port}`)
	await app.listen(port);
}

bootstrap();
