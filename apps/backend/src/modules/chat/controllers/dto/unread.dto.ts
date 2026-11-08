import { ApiProperty } from '@nestjs/swagger';

export class UnreadDto {
  @ApiProperty({
    example: true,
    description: 'False while the kvintet is forming: it has no chat yet.',
  })
  active!: boolean;

  @ApiProperty({
    example: 2,
    description: "Messages from other members that the caller hasn't read.",
  })
  count!: number;
}
