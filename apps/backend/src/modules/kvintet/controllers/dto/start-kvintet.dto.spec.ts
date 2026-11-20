import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StartKvintetDto } from './start-kvintet.dto';

const errorsFor = (overrides: Record<string, unknown>): Promise<unknown[]> =>
  validate(
    plainToInstance(StartKvintetDto, {
      title: 'Topic',
      categorySlugs: ['languages'],
      description: 'We practise speaking.',
      ...overrides,
    }),
  );

describe('StartKvintetDto', () => {
  it.each([[['languages']], [['software-development', 'business', 'leisure']]])(
    'accepts %j',
    async (categorySlugs) => {
      await expect(errorsFor({ categorySlugs })).resolves.toHaveLength(0);
    },
  );

  it.each([
    ['missing', undefined],
    ['a single string', 'languages'],
    ['empty', []],
    [
      'more than three',
      ['software-development', 'business', 'leisure', 'languages'],
    ],
    ['repeated', ['languages', 'languages']],
    ['an empty slug', ['']],
  ])('rejects categories that are %s', async (_label, categorySlugs) => {
    await expect(errorsFor({ categorySlugs })).resolves.toHaveLength(1);
  });

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['only spaces', '   '],
    ['281 characters long', 'a'.repeat(281)],
  ])('rejects a description that is %s', async (_label, description) => {
    await expect(errorsFor({ description })).resolves.toHaveLength(1);
  });

  it('accepts a description of 280 characters', async () => {
    await expect(
      errorsFor({ description: 'a'.repeat(280) }),
    ).resolves.toHaveLength(0);
  });
});
