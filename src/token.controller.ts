import { Controller, Get, Post, Body, Logger, Param, Put } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) { }
  logger: Logger = new Logger('AppController', true);

  @Get()
  async getAllTokens() {
    this.logger.log('getAllTokens');
    return this.tokenService.getAllTokens();
  }
  @Get(':token')
  async getInterestsForToken(@Param() token) {
    this.logger.log('getInterestsForToken, token:' + token);
    return await this.tokenService.getInterestsForToken(token);
  }

  @Get('/interest')
  async getAllTokenInterests() {
    this.logger.log('getAllTokenInterests');
    return this.tokenService.getAllTokenInterests();
  }
  @Get('/interest/:interest')
  async getTokensForInterest(@Param() interest) {
    this.logger.log('getTokensForInterest, interest:' + JSON.stringify(interest));
    return await this.tokenService.getTokensForInterest(interest);
  }
  @Get('/interest/:interest/amount')
  async getAmountForInterest(@Param() interest) {
    this.logger.log('getAmountForInterest, interest:' + JSON.stringify(interest));
    return (await this.tokenService.getTokensForInterest(interest)).length;
  }
  @Put('/interest')
  putRegistrationTokenForInterest(@Body() body) {
    this.logger.log('putRegistrationTokenForInterest, body:' + JSON.stringify(body));
    return this.tokenService.saveTokenForInterest(body.token, body.interest);
  }
}
