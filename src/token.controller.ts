import { Controller, Get, Post, Body, Logger, Header } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly appService: TokenService) { }
  logger: Logger = new Logger('AppController', true);

  @Get()
  getRegistrationTokens() {
    this.logger.log('getRegistrationTokens');
    return this.appService.getAllTokens();
  }
  @Post()
  pushRegistrationToken(@Body() body) {
    this.logger.log('pushRegistrationToken, body:' + JSON.stringify(body));
    return this.appService.saveToken(body.token);
  }
}
