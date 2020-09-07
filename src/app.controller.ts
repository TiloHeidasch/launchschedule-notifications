import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller("token")
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getRegistrationTokens() {
    return this.appService.getAllTokens();
  }
  @Post()
  pushRegistrationToken(@Body() body) {
    return this.appService.saveToken(body.token);
  }
}
