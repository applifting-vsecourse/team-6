import { AccountRepository } from '@/modules/account/repositories/account.repository';
import { AccountService } from '@/modules/account/services/account.service';
import { mock } from 'jest-mock-extended';

describe('AccountService', () => {
  const accountRepository = mock<AccountRepository>();
  const service = new AccountService(accountRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates account deletion to account repository', async () => {
    accountRepository.deleteAccount.mockResolvedValue(undefined);

    await service.deleteAccount('user-1');

    expect(accountRepository.deleteAccount).toHaveBeenCalledWith('user-1');
  });
});
