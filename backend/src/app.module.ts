import { Logger, Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { FileModule } from './file/file.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';
import { S3InterfaceModule } from './s3-interface/s3-interface.module';
import { AppController } from './app.controller';

const resolveEnvFile = () => {
	const env = !process.env.NODE_ENV ? '.env.development.local' : `.env.${process.env.NODE_ENV}`;
	new Logger(AppModule.name).log(`Using environment '${env}'`);
	return env;
}

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: resolveEnvFile(),
			isGlobal: true,
		}),
		AuthenticationModule,
		FileModule,
		DatabaseModule,
		S3InterfaceModule,
	],
	controllers: [AppController],
	providers: [DatabaseService],
})
export class AppModule {}
