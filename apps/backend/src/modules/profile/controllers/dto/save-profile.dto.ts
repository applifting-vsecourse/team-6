import { MeetingFrequency } from '@/modules/profile/domain/profile.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveProfileDto {
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({
    example: ['software-engineer', 'solution-architect'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiProperty({ example: ['tag_excel', 'tag_spanish'] })
  @IsArray()
  @IsString({ each: true })
  teachTagIds!: string[];

  @ApiProperty({ example: ['tag_python', 'tag_sql'] })
  @IsArray()
  @IsString({ each: true })
  learnTagIds!: string[];

  @ApiProperty({ example: ['tag_hiking', 'tag_board_games'] })
  @IsArray()
  @IsString({ each: true })
  interestTagIds!: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  weekdays!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  weekends!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  mornings!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  afternoons!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  evenings!: boolean;

  @ApiPropertyOptional({ example: 'city_praha' })
  @IsOptional()
  @IsString()
  cityId?: string | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  radiusKm?: number | null;

  @ApiPropertyOptional({ example: 50.0755 })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ example: 14.4378 })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ example: ['learn_new', 'share_knowledge'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expectations?: string[];

  @ApiPropertyOptional({
    enum: MeetingFrequency,
    example: MeetingFrequency.BIWEEKLY,
  })
  @IsOptional()
  @IsEnum(MeetingFrequency)
  meetingFrequency?: MeetingFrequency;

  @ApiPropertyOptional({ example: 'Raději se potkávám v angličtině.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Marks onboarding as complete',
  })
  @IsOptional()
  @IsBoolean()
  completeOnboarding?: boolean;
}
