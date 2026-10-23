import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ListMessagesQueryDto {
  /** Id of the newest message the client has; returns at most 100 newer ones. */
  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  after?: number;

  /** Id of the oldest message the client has; returns up to 50 older ones. Not combinable with `after`. */
  @ApiPropertyOptional({ example: 71 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  before?: number;
}
