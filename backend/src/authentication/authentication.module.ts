import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core/constants';
import { AuthenticationGuard } from './authentication.guard';

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
		JwtModule.register({
	  		global: true,
	  		secret: `${process.env.JWT_SECRET}`,
	  		signOptions: { expiresIn: '7d' },
		}),
  	]
})
export class AuthenticationModule {}
