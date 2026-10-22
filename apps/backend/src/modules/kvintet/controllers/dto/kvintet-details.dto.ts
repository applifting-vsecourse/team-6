import { ApiProperty } from '@nestjs/swagger';

export class KvintetMemberDto {
  @ApiProperty({ example: 'usr_123' })
  userId!: string;

  @ApiProperty({ example: 'Jana Nováková', nullable: true })
  name!: string | null;

  @ApiProperty({ example: 'Marketingová specialistka', nullable: true })
  role!: string | null;

  @ApiProperty({ example: ['Excel', 'španělštinu'] })
  teachTags!: string[];

  @ApiProperty({ example: ['Python', 'SQL'] })
  learnTags!: string[];

  @ApiProperty({ example: ['Turistika', 'Deskové hry'] })
  interestTags!: string[];

  @ApiProperty({ example: false })
  hasVoted!: boolean;

  @ApiProperty({ example: true })
  isCurrentUser!: boolean;
}

export class KvintetVoteStatusDto {
  @ApiProperty({ example: true })
  canVote!: boolean;

  @ApiProperty({ example: false })
  userHasVoted!: boolean;

  @ApiProperty({ example: 3 })
  votedCount!: number;

  @ApiProperty({ example: 4 })
  totalCount!: number;
}

export class KvintetDetailsDto {
  @ApiProperty({ example: 'kv_123' })
  id!: string;

  @ApiProperty({ example: 'AI v práci – co opravdu funguje' })
  title!: string;

  @ApiProperty({ enum: ['FORMING', 'ACTIVE'], example: 'FORMING' })
  status!: 'FORMING' | 'ACTIVE';

  @ApiProperty({ example: '2026-10-21T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z', nullable: true })
  activatedAt!: string | null;

  @ApiProperty({ example: 'PRAHA · VEČERY · JEDNOU ZA 14 DNÍ', nullable: true })
  commonPreferences!: string | null;

  @ApiProperty({ example: 5 })
  capacity!: number;

  @ApiProperty({ example: 1 })
  openSeatsCount!: number;

  @ApiProperty({ type: [KvintetMemberDto] })
  members!: KvintetMemberDto[];

  @ApiProperty({ type: KvintetVoteStatusDto })
  voteStatus!: KvintetVoteStatusDto;
}
