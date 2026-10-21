import { PrismaModule } from '@/core/prisma/prisma.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { KvintetController } from './controllers/kvintet.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [KvintetController],
})
export class KvintetModule {}
