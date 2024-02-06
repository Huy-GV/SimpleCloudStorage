import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core/constants';
import { AuthenticationGuard } from './authentication.guard';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
	AuthenticationService,
	{
	  	provide: APP_GUARD,
	  	useClass: AuthenticationGuard,
	},
  ],
  controllers: [AuthenticationController],
  imports: [
		DatabaseModule,
	  	JwtModule.registerAsync({
			global: true,
		  	useFactory: (configService: ConfigService) => ({
				signOptions: { expiresIn: '7d' },
			  	secret: configService.get<string>('JWT_SECRET'),
			}),
			inject: [ConfigService],
		}),
  	]
})
export class AuthenticationModule {}
