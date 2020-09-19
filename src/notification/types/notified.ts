import { ApiProperty } from '@nestjs/swagger';
import { Interest } from './interest';

export class Notified {
  @ApiProperty({ type: Interest, required: false })
  relatedInterest?: Interest;
  @ApiProperty({
    description: 'The date for which a notification was issued',
    example: new Date().toUTCString(),
  })
  date: string;
  @ApiProperty({
    description:
      'The period, before the date, for which a notification was issued',
    example: 'week',
  })
  period: string;
}
