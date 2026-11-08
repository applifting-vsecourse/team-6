import { MeetingFrequency } from '@/modules/profile/domain/profile.entity';
import { TagDto } from '@/modules/reference/controllers/dto/reference-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 'user_123' })
  userId!: string;

  @ApiPropertyOptional({ example: 'Marketingová specialistka' })
  position!: string | null;

  @ApiProperty({
    example: ['software-engineer', 'solution-architect'],
    type: [String],
  })
  roles!: string[];

  @ApiPropertyOptional({ example: 50.0755 })
  latitude!: number | null;

  @ApiPropertyOptional({ example: 14.4378 })
  longitude!: number | null;

  @ApiProperty({ example: ['learn_new', 'share_knowledge'], type: [String] })
  expectations!: string[];

  @ApiPropertyOptional({
    enum: MeetingFrequency,
    example: MeetingFrequency.BIWEEKLY,
  })
  meetingFrequency!: MeetingFrequency | null;

  @ApiProperty({ example: true })
  weekdays!: boolean;

  @ApiProperty({ example: false })
  weekends!: boolean;

  @ApiProperty({ example: false })
  mornings!: boolean;

  @ApiProperty({ example: false })
  afternoons!: boolean;

  @ApiProperty({ example: true })
  evenings!: boolean;

  @ApiPropertyOptional({ example: 'city_praha' })
  cityId!: string | null;

  @ApiPropertyOptional({ example: 'Praha' })
  cityName!: string | null;

  @ApiPropertyOptional({ example: 10 })
  radiusKm!: number | null;

  @ApiPropertyOptional({ example: 'Raději se potkávám v angličtině.' })
  note!: string | null;

  @ApiPropertyOptional({ example: '2026-10-21T12:00:00.000Z' })
  onboardingCompletedAt!: Date | null;

  @ApiProperty({ type: [TagDto] })
  teaches!: TagDto[];

  @ApiProperty({ type: [TagDto] })
  learns!: TagDto[];

  @ApiProperty({ type: [TagDto] })
  interests!: TagDto[];
}
