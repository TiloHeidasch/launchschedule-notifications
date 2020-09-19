import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { Notification, NotificationSchema } from './types/notification.schema';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://' + (process.env.mongo || '10.0.0.12') + '/notifications',
    ),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
