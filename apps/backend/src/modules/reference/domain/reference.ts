import {
  CityEntity,
  TagEntity,
} from '@/modules/reference/domain/reference.entity';

export type Reference = {
  categories: { slug: string }[];
  cities?: CityEntity[];
  tags?: TagEntity[];
};
