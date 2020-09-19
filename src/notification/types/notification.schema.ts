import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Interest } from './interest';
import { Notified } from './notified';

@Schema()
export class Notification extends Document {
  @Prop()
  @ApiProperty({ description: 'The interest', type: Interest })
  interest: Interest;
  @Prop()
  @ApiProperty({ description: 'The FCM token of the end user' })
  token: string;
  @Prop()
  @ApiProperty({
    description: 'Array of notified occurences for this Notification',
    type: [Notified],
    required: false,
  })
  notified?: Notified[];
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
