import { Controller, Get, Post, Body, Logger, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('token')
export class AppController {
  constructor(private readonly appService: AppService) { }
  logger: Logger = new Logger('AppController', true);

  @Get()
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'GET')
  @Header('Access-Control-Allow-Headers', 'Origin, Authorization, Methods, Content-Type')
  @Header('Access-Control-Allow-Credentials', 'true')
  getRegistrationTokens() {
    this.logger.log('getRegistrationTokens');
    return this.appService.getAllTokens();
  }
  @Post()
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST')
  @Header('Access-Control-Allow-Headers', 'Origin, Methods, Content-Type')
  @Header('Access-Control-Allow-Credentials', 'true')
  pushRegistrationToken(@Body() body) {
    this.logger.log('pushRegistrationToken, body:' + JSON.stringify(body));
    return this.appService.saveToken(body.token);
  }
}
