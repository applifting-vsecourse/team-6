import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ example: 121 })
  id!: number;

  @ApiProperty({ enum: ['USER', 'SYSTEM'], example: 'USER' })
  kind!: 'USER' | 'SYSTEM';

  @ApiProperty({ example: 'usr_123', nullable: true })
  authorId!: string | null;

  @ApiProperty({ example: 'Jana Nováková', nullable: true })
  authorName!: string | null;

  @ApiProperty({ example: 'jana', nullable: true })
  authorUsername!: string | null;

  @ApiProperty({ example: 'Thursday works for me.' })
  body!: string;

  @ApiProperty({ example: '2026-10-22T18:02:00.000Z' })
  createdAt!: string;
}
