import { PrismaService } from '@/core/prisma/prisma.service';
import { BetterAuth } from '@/shared/auth/providers/better-auth.provider';
import { Config } from '@/shared/config/config.service';
import {
  createDemoKvintets,
  createDemoProfiles,
  type DemoMember,
} from './create-demo-kvintets';
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

  const jan = await createUser(prisma, auth, {
    email: 'jan.novak@example.com',
    password: 'passwordos',
    name: 'Jan Novák',
    username: 'JanNovak',
  });

  const petra = await createUser(prisma, auth, {
    email: 'petra.svobodova@example.com',
    password: 'passwordos',
    name: 'Petra Svobodová',
    username: 'PetraSvobodova',
  });

  const tomas = await createUser(prisma, auth, {
    email: 'tomas.dvorak@example.com',
    password: 'passwordos',
    name: 'Tomáš Dvořák',
    username: 'TomasDvorak',
  });

  const eva = await createUser(prisma, auth, {
    email: 'eva.cerna@example.com',
    password: 'passwordos',
    name: 'Eva Černá',
    username: 'EvaCerna',
  });

  // One more kvintet owner per category, so the feed's category filter has something to show.
  const lucie = await createUser(prisma, auth, {
    email: 'lucie.prochazkova@example.com',
    password: 'passwordos',
    name: 'Lucie Procházková',
    username: 'LucieProchazkova',
  });

  const martin = await createUser(prisma, auth, {
    email: 'martin.kucera@example.com',
    password: 'passwordos',
    name: 'Martin Kučera',
    username: 'MartinKucera',
  });

  const katerina = await createUser(prisma, auth, {
    email: 'katerina.vesela@example.com',
    password: 'passwordos',
    name: 'Kateřina Veselá',
    username: 'KaterinaVesela',
  });

  // The fourth member of the AI kvintet, so it can already be voted to start.
  const ondrej = await createUser(prisma, auth, {
    email: 'ondrej.marek@example.com',
    password: 'passwordos',
    name: 'Ondřej Marek',
    username: 'OndrejMarek',
  });

  // Five members of an already running kvintet: sign in as any of them.
  const [anna, jakub, david, dana, filip] = await Promise.all(
    [
      ['Anna Horáková', 'AnnaHorakova', 'anna.horakova@example.com'],
      ['Jakub Beneš', 'JakubBenes', 'jakub.benes@example.com'],
      ['David Král', 'DavidKral', 'david.kral@example.com'],
      ['Dana Pokorná', 'DanaPokorna', 'dana.pokorna@example.com'],
      ['Filip Němec', 'FilipNemec', 'filip.nemec@example.com'],
    ].map(([name, username, email]) =>
      createUser(prisma, auth, {
        email,
        password: 'passwordos',
        name,
        username,
      }),
    ),
  );

  // Onboarded but in no kvintet, so these accounts see the full feed.
  const feedUsers: (Omit<DemoMember, 'userId'> & {
    name: string;
    username: string;
    email: string;
  })[] = [
    {
      name: 'Lenka Malá',
      username: 'LenkaMala',
      email: 'lenka.mala@example.com',
      position: 'Project manager',
      roles: ['Project Manager'],
      meetingFrequency: 'WEEKLY',
      teach: ['agile', 'leadership'],
      learn: ['python'],
      interests: ['yoga'],
    },
    {
      name: 'Nathan Němec',
      username: 'NathanNemec',
      email: 'nathan.nemec@example.com',
      position: 'Data engineer',
      roles: ['Data Engineer'],
      meetingFrequency: 'BIWEEKLY',
      teach: ['postgresql', 'python'],
      learn: ['kubernetes'],
      interests: ['gaming'],
    },
    {
      name: 'Martin Bambas',
      username: 'MartinBambas',
      email: 'martin.bambas@example.com',
      position: 'Backend developer',
      roles: ['Backend Developer'],
      meetingFrequency: 'WEEKLY',
      teach: ['nestjs', 'typescript'],
      learn: ['terraform'],
      interests: ['cycling'],
    },
    {
      name: 'Dominik Šimon',
      username: 'DominikSimon',
      email: 'dominik.simon@example.com',
      position: 'UX/UI designer',
      roles: ['UX/UI Designer'],
      meetingFrequency: 'BIWEEKLY',
      teach: ['figma', 'ux-design'],
      learn: ['react'],
      interests: ['photography'],
    },
    {
      name: 'Petr Mráček',
      username: 'PetrMracek',
      email: 'petr.mracek@example.com',
      position: 'Security engineer',
      roles: ['Security Engineer'],
      meetingFrequency: 'MONTHLY',
      teach: ['cybersecurity', 'linux'],
      learn: ['public-speaking'],
      interests: ['bouldering'],
    },
    {
      name: 'David Vokurka',
      username: 'DavidVokurka',
      email: 'david.vokurka@example.com',
      position: 'Product manager',
      roles: ['Product Manager'],
      meetingFrequency: 'WEEKLY',
      teach: ['product-strategy', 'roadmapping'],
      learn: ['sql'],
      interests: ['coffee'],
    },
  ];
  await createDemoProfiles(
    prisma,
    await Promise.all(
      feedUsers.map(async ({ name, username, email, ...profile }) => {
        const user = await createUser(prisma, auth, {
          email,
          password: 'passwordos',
          name,
          username,
        });
        return { ...profile, userId: user.id };
      }),
    ),
  );

  console.log('Creating demo kvintets');

  await createDemoKvintets(prisma, [
    {
      title: 'Using AI at work – what really works',
      categories: ['technology'],
      members: [
        {
          userId: jan.id,
          position: 'Backend developer',
          meetingFrequency: 'BIWEEKLY',
          teach: ['python', 'sql'],
          learn: ['ux-design'],
          interests: ['startups'],
        },
        {
          userId: petra.id,
          position: 'Data analyst',
          meetingFrequency: 'BIWEEKLY',
          teach: ['statistics'],
          learn: ['public-speaking'],
          interests: ['running'],
        },
        {
          userId: tomas.id,
          position: 'Product manager',
          meetingFrequency: 'BIWEEKLY',
          teach: ['roadmapping'],
          learn: ['negotiation'],
          interests: ['board-games'],
        },
        {
          userId: ondrej.id,
          position: 'BI consultant',
          meetingFrequency: 'BIWEEKLY',
          teach: ['sql'],
          learn: ['python'],
          interests: ['cycling'],
        },
      ],
      // Two of four have agreed, so the vote progress is visible.
      votes: 2,
    },
    {
      title: 'From Excel to Python',
      categories: ['technology', 'business'],
      members: [
        {
          userId: eva.id,
          position: 'Accountant',
          meetingFrequency: 'WEEKLY',
          teach: ['excel'],
          learn: ['python'],
          interests: ['hiking'],
        },
      ],
    },
    {
      title: 'Spanish conversation over lunch',
      categories: ['languages'],
      members: [
        {
          userId: lucie.id,
          position: 'Translator',
          meetingFrequency: 'WEEKLY',
          teach: ['copywriting'],
          learn: ['spanish'],
          interests: ['travel'],
        },
      ],
    },
    {
      title: 'Negotiating your first client deal',
      categories: ['business'],
      members: [
        {
          userId: martin.id,
          position: 'Startup founder',
          meetingFrequency: 'BIWEEKLY',
          teach: ['startups'],
          learn: ['negotiation'],
          interests: ['running'],
        },
      ],
    },
    {
      title: 'Cooking together on Sundays',
      categories: ['leisure'],
      members: [
        {
          userId: katerina.id,
          position: 'Graphic designer',
          meetingFrequency: 'MONTHLY',
          teach: ['cooking'],
          learn: ['music'],
          interests: ['board-games'],
        },
      ],
    },
    {
      title: 'Frontend craft circle',
      categories: ['technology'],
      active: true,
      votes: 5,
      members: [
        {
          userId: anna.id,
          position: 'Frontend developer',
          meetingFrequency: 'WEEKLY',
          teach: ['react'],
          learn: ['ux-design'],
          interests: ['coffee'],
        },
        {
          userId: jakub.id,
          position: 'Full-stack developer',
          meetingFrequency: 'WEEKLY',
          teach: ['typescript'],
          learn: ['docker'],
          interests: ['cycling'],
        },
        {
          userId: david.id,
          position: 'Tech lead',
          meetingFrequency: 'WEEKLY',
          teach: ['git'],
          learn: ['public-speaking'],
          interests: ['reading'],
        },
        {
          userId: dana.id,
          position: 'UI designer',
          meetingFrequency: 'WEEKLY',
          teach: ['figma'],
          learn: ['html-css'],
          interests: ['photography'],
        },
        {
          userId: filip.id,
          position: 'DevOps engineer',
          meetingFrequency: 'WEEKLY',
          teach: ['docker'],
          learn: ['react'],
          interests: ['running'],
        },
      ],
    },
    // No demo kvintet in personal-development, so that filter shows the empty state.
  ]);
};
