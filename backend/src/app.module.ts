import { Logger, Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { FileModule } from './file/file.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';
import { S3InterfaceModule } from './s3-interface/s3-interface.module';
import { AppController } from './app.controller';
import { ensureValidDatabaseUrl, resolveEnvFile, validateEnvConfiguration } from './configuration/validateEnvConfiguration';

ensureValidDatabaseUrl();

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: resolveEnvFile(),
			isGlobal: true,
			validate: validateEnvConfiguration
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
