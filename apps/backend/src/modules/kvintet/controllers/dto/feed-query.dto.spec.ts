import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FeedQueryDto } from './feed-query.dto';

const errorsFor = (query: object): Promise<unknown[]> =>
  validate(plainToInstance(FeedQueryDto, query));

describe('FeedQueryDto', () => {
  it('accepts no category and a category slug', async () => {
    await expect(errorsFor({})).resolves.toHaveLength(0);
    await expect(errorsFor({ category: 'languages' })).resolves.toHaveLength(0);
  });

  it.each([
    ['empty', ''],
    ['repeated', ['languages', 'leisure']],
  ])('rejects a %s category', async (_label, category) => {
    await expect(errorsFor({ category })).resolves.toHaveLength(1);
  });
});
