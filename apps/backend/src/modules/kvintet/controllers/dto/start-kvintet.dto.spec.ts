import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StartKvintetDto } from './start-kvintet.dto';

const errorsFor = (categorySlugs: unknown): Promise<unknown[]> =>
  validate(plainToInstance(StartKvintetDto, { title: 'Topic', categorySlugs }));

describe('StartKvintetDto', () => {
  it.each([[['languages']], [['software-development', 'business', 'leisure']]])(
    'accepts %j',
    async (categorySlugs) => {
      await expect(errorsFor(categorySlugs)).resolves.toHaveLength(0);
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
    await expect(errorsFor(categorySlugs)).resolves.toHaveLength(1);
  });

  it.each([
    [280, 0],
    [281, 1],
  ])(
    'with a description of %i characters reports %i errors',
    async (length, errors) => {
      const dto = plainToInstance(StartKvintetDto, {
        title: 'Topic',
        categorySlugs: ['languages'],
        description: 'a'.repeat(length),
      });
      await expect(validate(dto)).resolves.toHaveLength(errors);
    },
  );
});
