import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TokenInterest extends Document {
  @Prop()
  token: string;

  @Prop()
  interest: string;

  @Prop()
  lastNotification?: string;

  @Prop()
  relatedInterestsNotifications?: {
    interest: string;
    lastNotification: string;
  }[] = [];
}

export const TokenInterestSchema = SchemaFactory.createForClass(TokenInterest);
