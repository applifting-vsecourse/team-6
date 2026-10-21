import { PrismaModule } from '@/core/prisma/prisma.module';
import { ReferenceController } from '@/modules/reference/controllers/reference.controller';
import { ReferenceRepository } from '@/modules/reference/repositories/reference.repository';
import { ReferenceService } from '@/modules/reference/services/reference.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  controllers: [ReferenceController],
  providers: [ReferenceService, ReferenceRepository],
})
export class ReferenceModule {}
