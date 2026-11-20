import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminStatsRepository } from './repositories/admin-stats.repository';
import { AdminService } from './services/admin.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminStatsRepository],
})
export class AdminModule {}
