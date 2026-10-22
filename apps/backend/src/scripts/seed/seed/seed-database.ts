import { PrismaService } from '@/core/prisma/prisma.service';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { Config } from '@/shared/config/config.service';
import { createDemoKvintets } from './create-demo-kvintets';
import { createUser } from './create-user';

export const seedDatabase = async (
  prisma: PrismaService,
  config: Config,
  betterAuth: BetterAuth,
): Promise<void> => {
  const auth = betterAuth;

  // `pnpm dev` runs the seed on every start, so never clobber a database that
  // already has data — that would delete the account you just made.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(
      `Database already has ${existingUsers} user(s) — skipping seed. ` +
        'Run `pnpm backend db:reset` to wipe and start over.',
    );
    return;
  }

  // Drop existing database data from all tables
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "session", "account", "verification", "user", "kvintet" RESTART IDENTITY CASCADE;',
    );
  } catch (error) {
    console.error('Error truncating tables:', error);
  }

  console.log('Creating superadmin user');

  // Create a superadmin user. This should be delete in prod app
  await createUser(prisma, auth, {
    email: config.superadminEmail,
    password: config.superadminPassword,
    name: 'Admin (Delete in Prod)',
    username: 'superadmin',
    role: 'admin',
  });

  console.log('Creating example users');

  const duck = await createUser(prisma, auth, {
    email: 'caffeinatedduck@example.com',
    password: 'password1',
    name: 'Caffeinated Duck',
    username: 'CaffeinatedDuck',
  });

  const thinker = await createUser(prisma, auth, {
    email: 'deepduckthoughts@example.com',
    password: 'password2',
    name: 'Deep Duck Thoughts',
    username: 'DeepDuckThoughts',
  });

  const critic = await createUser(prisma, auth, {
    email: 'breadcritic@example.com',
    password: 'password3',
    name: 'The Bread Critic',
    username: 'BreadCritic',
  });

  const season = await createUser(prisma, auth, {
    email: 'migrationseason@example.com',
    password: 'password4',
    name: 'Migration Season',
    username: 'MigrationSeason',
  });

  // Has no profile and no kvintet, so this account sees the full feed.
  await createUser(prisma, auth, {
    email: 'pondadmin@example.com',
    password: 'password5',
    name: 'Pond Admin',
    username: 'PondAdmin',
  });

  console.log('Creating demo kvintets');

  await createDemoKvintets(prisma, [
    {
      title: 'Using AI at work – what really works',
      category: 'technology',
      members: [
        {
          userId: duck.id,
          position: 'Backend developer',
          meetingFrequency: 'BIWEEKLY',
          teach: ['python', 'sql'],
          learn: ['ux-design'],
          interests: ['startups'],
        },
        {
          userId: thinker.id,
          position: 'Data analyst',
          meetingFrequency: 'BIWEEKLY',
          teach: ['statistics'],
          learn: ['public-speaking'],
          interests: ['running'],
        },
        {
          userId: critic.id,
          position: 'Product manager',
          meetingFrequency: 'BIWEEKLY',
          teach: ['roadmapping'],
          learn: ['negotiation'],
          interests: ['board-games'],
        },
      ],
    },
    {
      title: 'From Excel to Python',
      category: 'technology',
      members: [
        {
          userId: season.id,
          position: 'Accountant',
          meetingFrequency: 'WEEKLY',
          teach: ['excel'],
          learn: ['python'],
          interests: ['hiking'],
        },
      ],
    },
  ]);
};
