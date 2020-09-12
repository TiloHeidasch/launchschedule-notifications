import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenInterest, TokenInterestSchema } from './tokenInterest.schema';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://' +
        (process.env.mongo || '10.0.0.12') +
        '/launchschedule-notifications',
    ),
    MongooseModule.forFeature([
      { name: TokenInterest.name, schema: TokenInterestSchema },
    ]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
