import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: 'software-development' })
  slug!: string;
}

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
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'excel' })
  slug!: string;
}

// The reference list also says which categories a tag belongs to; a profile's tags do not.
export class ReferenceTagDto extends TagDto {
  @ApiProperty({
    type: [String],
    example: ['software-development', 'business'],
    description: 'Slugs of the categories the tag belongs to, in sort order',
  })
  categories!: string[];
}

export class ReferenceResponseDto {
  @ApiProperty({ type: [CategoryDto] })
  categories!: CategoryDto[];

  @ApiProperty({ type: [CityDto] })
  cities!: CityDto[];

  @ApiProperty({ type: [ReferenceTagDto] })
  tags!: ReferenceTagDto[];
}
