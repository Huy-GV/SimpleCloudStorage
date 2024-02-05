import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // TODO: move to .env
    origin: ["http://localhost:3000"]
  })


  app.use(cookieParser());

  await app.listen(5000);
}

bootstrap();
