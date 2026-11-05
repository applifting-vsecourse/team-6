import { MAX_MESSAGE_ID } from '@/modules/chat/domain/message';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class MarkReadDto {
  /** Id of the newest message the client has shown; the server never moves the mark backwards. */
  @ApiProperty({ example: 121 })
  @IsInt()
  @Min(0)
  @Max(MAX_MESSAGE_ID)
  lastMessageId!: number;
}
