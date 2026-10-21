import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories(): Promise<{ slug: string }[]> {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true },
    });
  }
}
