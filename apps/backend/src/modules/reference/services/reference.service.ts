import { Reference } from '@/modules/reference/domain/reference';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferenceService {
  constructor(private readonly repository: ReferenceRepository) {}

  async get(): Promise<Reference> {
    return { categories: await this.repository.findCategories() };
  }
}
