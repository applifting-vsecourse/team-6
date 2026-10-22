import {
  CityEntity,
  TagEntity,
} from '@/modules/reference/domain/reference.entity';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import { Injectable } from '@nestjs/common';

export type ReferenceData = {
  cities: CityEntity[];
  tags: TagEntity[];
  categories: { slug: string }[];
};

@Injectable()
export class ReferenceService {
  constructor(private readonly referenceRepository: ReferenceRepository) {}

  async getReferenceData(): Promise<ReferenceData> {
    const [cities, tags, categories] = await Promise.all([
      this.referenceRepository.findAllCities(),
      this.referenceRepository.findAllTags(),
      this.referenceRepository.findCategories(),
    ]);

    return { cities, tags, categories };
  }

  async get(): Promise<ReferenceData> {
    return this.getReferenceData();
  }
}
