import { ApiProperty } from '@nestjs/swagger';

export class Interest {
  @ApiProperty({
    description: 'The type of the object that the user is interested in',
    examples: ['launch', 'event', 'agency', 'rocket'],
    example: 'launch',
  })
  type: string;
  @ApiProperty({
    description: 'The id of the object that the user is interested in',
    examples: ['1', '123', 'b8741d6a-bf47-44eb-b740-f091b5fd3c62'],
    example: 'b8741d6a-bf47-44eb-b740-f091b5fd3c62',
  })
  id: string;
}
export class InterestAmount {
  @ApiProperty({ description: 'The interest', type: Interest })
  interest: Interest;
  @ApiProperty({
    description: 'The amount of datasets for the given interest',
    example: 5,
  })
  amount: number;
}
