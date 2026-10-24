import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// message.id is a Postgres SERIAL: anything above would fail in the database as a 500.
const MAX_MESSAGE_ID = 2_147_483_647;

export class ListMessagesQueryDto {
  /** Id of the newest message the client has; returns at most 100 newer ones. */
  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MESSAGE_ID)
  after?: number;

  /** Id of the oldest message the client has; returns up to 50 older ones. Not combinable with `after`. */
  @ApiPropertyOptional({ example: 71 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_MESSAGE_ID)
  before?: number;
}
