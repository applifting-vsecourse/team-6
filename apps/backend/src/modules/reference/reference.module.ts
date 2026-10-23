import { PrismaModule } from '@/core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { ReferenceController } from './controllers/reference.controller';
import { ReferenceRepository } from './repositories/reference.repository';
import { ReferenceService } from './services/reference.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReferenceController],
  providers: [ReferenceRepository, ReferenceService],
  exports: [ReferenceRepository, ReferenceService],
})
export class ReferenceModule {}
