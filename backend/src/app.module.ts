import { Logger, Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';
import { S3InterfaceModule } from './s3-interface/s3-interface.module';

const resolveEnvFile = () => {
	new Logger(AppModule.name).log(`Using environment '${process.env.NODE_ENV}'`)
	if (!process.env.NODE_ENV) {
		return '.env.development.local'
	}

	return `.env.${process.env.NODE_ENV}`
}

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: resolveEnvFile(),
			isGlobal: true,
		}),
		AuthenticationModule,
		FileStorageModule,
		DatabaseModule,
		S3InterfaceModule,
	],
	controllers: [],
	providers: [DatabaseService],
})
export class AppModule {}
