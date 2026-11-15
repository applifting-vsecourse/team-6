import { ApiProperty } from '@nestjs/swagger';

export class AdminUserStatsDto {
  @ApiProperty({ example: 42 })
  registered!: number;

  @ApiProperty({ example: 30, description: 'Finished onboarding' })
  onboarded!: number;

  @ApiProperty({
    example: 7,
    description: 'Users with a session created or refreshed since 00:00 UTC',
  })
  activeToday!: number;
}

export class AdminKvintetStatsDto {
  @ApiProperty({ example: 6 })
  total!: number;

  @ApiProperty({ example: 1, description: 'Started kvintets' })
  active!: number;

  @ApiProperty({ example: 4, description: 'Forming, 1–2 members' })
  formingSmall!: number;

  @ApiProperty({
    example: 1,
    description: 'Forming, 3–4 members (can vote to start)',
  })
  formingReady!: number;
}

// Aggregated numbers only: no ids, names or message content ever go in here.
export class AdminStatsDto {
  @ApiProperty({ type: AdminUserStatsDto })
  users!: AdminUserStatsDto;

  @ApiProperty({ type: AdminKvintetStatsDto })
  kvintets!: AdminKvintetStatsDto;
}
