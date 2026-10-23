import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FeedQueryDto {
  /** Slug of a category from GET /reference; omit to list every category. */
  @ApiPropertyOptional({ example: 'technology' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;
}
