import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenInterest } from './tokenInterest.schema';

@Controller()
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  logger: Logger = new Logger('TokenController', true);

  @Get('/token')
  async getAllTokens(): Promise<string[]> {
    this.logger.log('getAllTokens');
    return this.tokenService.getAllTokens();
  }
  @Get('/token/:token')
  async getInterestsForToken(@Param() token): Promise<string[]> {
    this.logger.log('getInterestsForToken ' + JSON.stringify(token));
    return await this.tokenService.getInterestsForToken(token.token);
  }

  @Get('/interest')
  async getAllTokenInterests(): Promise<TokenInterest[]> {
    this.logger.log('getAllTokenInterests');
    return this.tokenService.getAllTokenInterests();
  }
  @Get('/interestamounts')
  async getAllTokenInterestAmounts(): Promise<
    { interest: string; amount: number }[]
  > {
    this.logger.log('getAllTokenInterestAmounts');
    return this.tokenService.getAllTokenInterestAmounts();
  }
  @Get('/interest/:interest')
  async getTokensForInterest(
    @Param() interest,
    @Query('notificationType') notificationType,
    @Query('date') date,
    @Query('relatedInterest') relatedInterest,
  ): Promise<string[]> {
    this.logger.log(
      'getTokensForInterest ' +
        JSON.stringify({ interest, notificationType, date, relatedInterest }),
    );
    return await this.tokenService.getTokensForInterest(
      interest.interest,
      notificationType,
      date,
      relatedInterest,
    );
  }
  @Get('/interestamounts/:interest')
  async getAmountForInterest(@Param() interest): Promise<number> {
    this.logger.log('getAmountForInterest ' + JSON.stringify(interest));
    return (await this.tokenService.getTokensForInterest(interest.interest))
      .length;
  }
  @Put('/interest')
  putRegistrationTokenForInterest(@Body() body): Promise<TokenInterest> {
    this.logger.log('putRegistrationTokenForInterest ' + JSON.stringify(body));
    return this.tokenService.saveTokenForInterest(body.token, body.interest);
  }
  @Delete('/interest/:interest/:token')
  deleteRegistrationTokenForInterest(
    @Param() interest,
    @Param() token,
  ): Promise<number> {
    this.logger.log(
      'deleteRegistrationTokenForInterest ' +
        JSON.stringify({ interest, token }),
    );
    return this.tokenService.deleteTokenForInterest(
      token.token,
      interest.interest,
    );
  }
  @Post('/interest/:interest/:token')
  markNotified(@Param() param, @Body() body): Promise<TokenInterest> {
    this.logger.log('markNotified ' + JSON.stringify({ param, body }));
    return this.tokenService.markNotified(
      param.token,
      param.interest,
      body.notificationType,
      body.date,
      body.relatedInterest,
    );
  }
}
