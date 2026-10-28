import { AccountRepository } from '@/modules/account/repositories/account.repository';
import { AccountService } from '@/modules/account/services/account.service';
import { KvintetRepository } from '@/modules/kvintet/repositories/kvintet.repository';
import { mock } from 'jest-mock-extended';

type Membership = NonNullable<
  Awaited<ReturnType<KvintetRepository['findMembership']>>
>;

describe('AccountService', () => {
  const accountRepository = mock<AccountRepository>();
  const kvintetRepository = mock<KvintetRepository>();
  const service = new AccountService(accountRepository, kvintetRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes user directly when user has no kvintet membership', async () => {
    kvintetRepository.findMembership.mockResolvedValue(null);
    accountRepository.deleteUser.mockResolvedValue(undefined);

    await service.deleteAccount('user-1');

    expect(kvintetRepository.findMembership).toHaveBeenCalledWith('user-1');
    expect(kvintetRepository.leave).not.toHaveBeenCalled();
    expect(accountRepository.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('runs the leave flow before deleting user when user is a kvintet member', async () => {
    const membership = {
      kvintetId: 'kvintet-99',
      userId: 'user-1',
      joinedAt: new Date(),
      kvintet: {
        id: 'kvintet-99',
        status: 'FORMING',
        title: 'Kvintet 99',
        createdAt: new Date(),
        activatedAt: null,
      },
    } as unknown as Membership;

    kvintetRepository.findMembership.mockResolvedValue(membership);
    kvintetRepository.leave.mockResolvedValue(undefined);
    accountRepository.deleteUser.mockResolvedValue(undefined);

    await service.deleteAccount('user-1');

    expect(kvintetRepository.findMembership).toHaveBeenCalledWith('user-1');
    expect(kvintetRepository.leave).toHaveBeenCalledWith(
      'kvintet-99',
      'user-1',
    );
    expect(accountRepository.deleteUser).toHaveBeenCalledWith('user-1');
  });
});
