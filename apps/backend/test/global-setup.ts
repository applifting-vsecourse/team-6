import { execFileSync } from 'node:child_process';
import { testDatabaseUrl } from './test-database-url';

// Brings the test database to the current schema before any suite runs.
export default function globalSetup(): void {
  execFileSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: 'inherit',
    },
  );
}
