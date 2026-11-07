// The integration tests wipe tables, so they only ever talk to a database whose
// name ends in `_test`, never to the one in DATABASE_URL.
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://quacker:quacker@localhost:5433/quacker_test';

if (!new URL(testDatabaseUrl).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL must point at a database named *_test');
}
