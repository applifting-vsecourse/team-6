import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class StartKvintetDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  /** 1–3 distinct category slugs from GET /reference. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  categorySlugs!: string[];

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class StartedKvintetDto {
  id!: string;
}
