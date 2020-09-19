import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);
  app.enableCors();

  const options = new DocumentBuilder()
    .setTitle('Launchschedule Notifications')
    .setDescription(
      'An API to store notifications and tokens for Launchschedule',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(80);
}
bootstrap();
