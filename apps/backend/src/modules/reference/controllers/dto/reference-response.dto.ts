import { ApiProperty } from '@nestjs/swagger';

export class CityDto {
  @ApiProperty({ example: 'city_praha' })
  id!: string;

  @ApiProperty({ example: 'Praha' })
  name!: string;

  @ApiProperty({ example: 50.0755 })
  lat!: number;

  @ApiProperty({ example: 14.4378 })
  lng!: number;
}

export class TagDto {
  @ApiProperty({ example: 'tag_excel' })
  id!: string;

  @ApiProperty({ example: 'excel' })
  slug!: string;
}

export class ReferenceResponseDto {
  @ApiProperty({ type: [CityDto] })
  cities!: CityDto[];

  @ApiProperty({ type: [TagDto] })
  tags!: TagDto[];
}
