import { testDatabaseUrl } from './test-database-url';

process.env.DATABASE_URL = testDatabaseUrl;
process.env.BETTER_AUTH_SECRET ??= 'test-secret-test-secret-test-secret-123';
process.env.SUPERADMIN_EMAIL ??= 'admin@example.com';
process.env.SUPERADMIN_PASSWORD ??= 'adminpassword';
