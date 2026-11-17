import { PrismaService } from '@/core/prisma/prisma.service';
import {
  CityEntity,
  TagEntity,
} from '@/modules/reference/domain/reference.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCities(): Promise<CityEntity[]> {
    const cities = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
    return cities.map((c) => new CityEntity(c.id, c.name, c.lat, c.lng));
  }

  async findAllTags(): Promise<TagEntity[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { slug: 'asc' },
      include: {
        categories: {
          orderBy: { category: { sortOrder: 'asc' } },
          select: { category: { select: { slug: true } } },
        },
      },
    });
    return tags.map(
      (t) =>
        new TagEntity(
          String(t.id),
          t.slug,
          t.categories.map((c) => c.category.slug),
        ),
    );
  }

  async findCategories(): Promise<{ slug: string }[]> {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true },
    });
  }
}
