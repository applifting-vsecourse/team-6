import { AccountRepository } from '@/modules/account/repositories/account.repository';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly kvintetRepository: KvintetRepository,
  ) {}

  async deleteAccount(userId: string): Promise<void> {
    const membership = await this.kvintetRepository.findMembership(userId);
    if (membership) {
      await this.kvintetRepository.leave(membership.kvintetId, userId);
    }
    await this.accountRepository.deleteUser(userId);
  }
}
