import { PrismaModule } from '@/core/prisma/prisma.module';
import { KvintetController } from '@/modules/kvintet/controllers/kvintet.controller';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { KvintetService } from '@/modules/kvintet/services/kvintet.service';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KvintetController],
  providers: [KvintetService, KvintetRepository],
  exports: [KvintetService, KvintetRepository],
})
export class KvintetModule {}
