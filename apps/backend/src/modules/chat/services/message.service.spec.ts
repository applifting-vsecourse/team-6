import { ChatMessage } from '@/modules/chat/domain/message';
import { MessageRepository } from '@/modules/chat/repositories/message.repository';
import { MessageService } from '@/modules/chat/services/message.service';
import { ValidationFailedException } from '@/shared/errors/validation.pipe';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { mock, type MockProxy } from 'jest-mock-extended';

const message: ChatMessage = {
  id: 1,
  kind: 'USER',
  authorId: 'u1',
  authorName: 'A',
  authorUsername: 'a',
  body: 'Hi',
  createdAt: new Date(),
};

describe('MessageService', () => {
  const setup = (): {
    repository: MockProxy<MessageRepository>;
    service: MessageService;
  } => {
    const repository = mock<MessageRepository>();
    return { repository, service: new MessageService(repository) };
  };

  it('lists the messages of an active kvintet', async () => {
    const { repository, service } = setup();
    repository.findAccess.mockResolvedValue({ kvintetId: 'k1', active: true });
    repository.list.mockResolvedValue([message]);

    await expect(service.list('u1', { after: 0 })).resolves.toEqual([message]);
    expect(repository.list).toHaveBeenCalledWith('k1', { after: 0 });
  });

  it('refuses a caller outside any kvintet with 403', async () => {
    const { repository, service } = setup();
    repository.findAccess.mockResolvedValue(null);

    await expect(service.list('u1', {})).rejects.toThrow(ForbiddenException);
    await expect(service.send('u1', 'Hi')).rejects.toThrow(ForbiddenException);
  });

  it('refuses a forming kvintet with the kvintet_not_active code', async () => {
    const { repository, service } = setup();
    repository.findAccess.mockResolvedValue({ kvintetId: 'k1', active: false });

    const error = await service.send('u1', 'Hi').catch((e) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toMatchObject({ code: 'kvintet_not_active' });
    await expect(service.list('u1', {})).rejects.toThrow(ConflictException);
    expect(repository.send).not.toHaveBeenCalled();
  });

  it('rejects after and before together', async () => {
    const { service } = setup();

    await expect(service.list('u1', { after: 1, before: 5 })).rejects.toThrow(
      ValidationFailedException,
    );
  });

  it('maps the locked re-check to the same errors as the first check', async () => {
    const { repository, service } = setup();
    repository.findAccess.mockResolvedValue({ kvintetId: 'k1', active: true });

    repository.send.mockResolvedValueOnce({ result: 'not_member' });
    await expect(service.send('u1', 'Hi')).rejects.toThrow(ForbiddenException);

    repository.send.mockResolvedValueOnce({ result: 'not_active' });
    await expect(service.send('u1', 'Hi')).rejects.toThrow(ConflictException);

    repository.send.mockResolvedValueOnce({ result: 'sent', message });
    await expect(service.send('u1', 'Hi')).resolves.toEqual(message);
  });
});
