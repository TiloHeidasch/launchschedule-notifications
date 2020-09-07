import { Controller, Get, Post, Body, Logger, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller("token")
export class AppController {
  constructor(private readonly appService: AppService) { }
  logger: Logger = new Logger('AppController', true);

  @Get()
  @Header('Access-Control-Allow-Origin', '*')
  getRegistrationTokens() {
    this.logger.log('getRegistrationTokens');
    return this.appService.getAllTokens();
  }
  @Post()
  @Header('Access-Control-Allow-Origin', '*')
  pushRegistrationToken(@Body() body) {
    this.logger.log('pushRegistrationToken, body:' + body);
    return this.appService.saveToken(body.token);
  }
}
