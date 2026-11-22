import { AccountRepository } from '@/modules/account/repositories/account.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  exportData(userId: string): Promise<Record<string, unknown>> {
    return this.accountRepository.exportData(userId);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.accountRepository.deleteAccount(userId);
  }
}
