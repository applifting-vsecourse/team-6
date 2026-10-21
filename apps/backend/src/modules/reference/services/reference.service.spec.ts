import {
  CityEntity,
  TagEntity,
} from '@/modules/reference/domain/reference.entity';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import { ReferenceService } from './reference.service';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let repository: {
    findAllCities: jest.Mock;
    findAllTags: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findAllCities: jest.fn(),
      findAllTags: jest.fn(),
    };
    service = new ReferenceService(
      repository as unknown as ReferenceRepository,
    );
  });

  it('returns cities and tags from repository', async (): Promise<void> => {
    const mockCities = [new CityEntity('c1', 'Praha', 50.07, 14.43)];
    const mockTags = [new TagEntity('t1', 'excel')];

    repository.findAllCities.mockResolvedValue(mockCities);
    repository.findAllTags.mockResolvedValue(mockTags);

    const result = await service.getReferenceData();

    expect(result.cities).toEqual(mockCities);
    expect(result.tags).toEqual(mockTags);
    expect(repository.findAllCities).toHaveBeenCalledTimes(1);
    expect(repository.findAllTags).toHaveBeenCalledTimes(1);
  });
});
