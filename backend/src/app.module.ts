import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';
import { S3InterfaceModule } from './s3-interface/s3-interface.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.dev.env',
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
