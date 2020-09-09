import { NestFactory } from '@nestjs/core';
import { TokenModule } from './token.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenModule);
  app.enableCors();
  await app.listen(80);
}
bootstrap();
