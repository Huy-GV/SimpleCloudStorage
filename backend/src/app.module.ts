import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthenticationController } from './authentication/authentication.controller';
import { FileStorageModule } from './file-storage/file-storage.module';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from './database/database.module';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.dev.env',
    }),
    AuthenticationModule,
    FileStorageModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [DatabaseService],
})
export class AppModule {}
