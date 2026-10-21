import {
  CityEntity,
  TagEntity,
} from '@/modules/reference/domain/reference.entity';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferenceService {
  constructor(private readonly referenceRepository: ReferenceRepository) {}

  async getReferenceData(): Promise<{
    cities: CityEntity[];
    tags: TagEntity[];
  }> {
    const [cities, tags] = await Promise.all([
      this.referenceRepository.findAllCities(),
      this.referenceRepository.findAllTags(),
    ]);

    return { cities, tags };
  }
}
