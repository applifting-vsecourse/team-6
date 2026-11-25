import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header, empty cells for null, ISO dates and plain values', () => {
    expect(
      toCsv(
        ['a', 'b', 'c', 'd'],
        [[1, null, new Date('2026-11-21T10:00:00Z'), true]],
      ),
    ).toBe('a;b;c;d\n1;;2026-11-21T10:00:00.000Z;true');
  });
});
