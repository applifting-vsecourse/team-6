import { PrismaModule } from '@/core/prisma/prisma.module';
import { KvintetModule } from '@/modules/kvintet/kvintet.module';
import { AuthModule } from '@/shared/auth/auth.module';
import { Module } from '@nestjs/common';
import { AccountController } from './controllers/account.controller';
import { AccountRepository } from './repositories/account.repository';
import { AccountService } from './services/account.service';

@Module({
  imports: [PrismaModule, AuthModule, KvintetModule],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository],
  exports: [AccountService, AccountRepository],
})
export class AccountModule {}
