/**
 * Seeded test users from README.md and database seed script.
 * All seeded demo users have password 'passwordos' (except admin which is 'adminpassword').
 */
export const SEEDED_USERS = {
  // Member of proposal "Using AI at work" (has voted to start)
  JAN_NOVAK: {
    email: 'jan.novak@example.com',
    password: 'passwordos',
    name: 'Jan Novák',
  },
  // Member of proposal "Using AI at work" (has voted to start)
  PETRA_SVOBODOVA: {
    email: 'petra.svobodova@example.com',
    password: 'passwordos',
    name: 'Petra Svobodová',
  },
  // Member of proposal "Using AI at work" (has NOT voted yet)
  TOMAS_DVORAK: {
    email: 'tomas.dvorak@example.com',
    password: 'passwordos',
    name: 'Tomáš Dvořák',
  },
  // Member of proposal "Using AI at work" (has NOT voted yet)
  ONDREJ_MAREK: {
    email: 'ondrej.marek@example.com',
    password: 'passwordos',
    name: 'Ondřej Marek',
  },
  // Sole member of proposal "From Excel to Python" (1 of 5)
  EVA_CERNA: {
    email: 'eva.cerna@example.com',
    password: 'passwordos',
    name: 'Eva Černá',
  },
  // Member of the active kvintet "Frontend craft circle"
  ANNA_HORAKOVA: {
    email: 'anna.horakova@example.com',
    password: 'passwordos',
    name: 'Anna Horáková',
  },
  // Onboarded user in no kvintet
  LENKA_MALA: {
    email: 'lenka.mala@example.com',
    password: 'passwordos',
    name: 'Lenka Malá',
  },
  // Onboarded user in no kvintet
  NATHAN_NEMEC: {
    email: 'nathan.nemec@example.com',
    password: 'passwordos',
    name: 'Nathan Němec',
  },
  // Onboarded user in no kvintet
  MARTIN_BAMBAS: {
    email: 'martin.bambas@example.com',
    password: 'passwordos',
    name: 'Martin Bambas',
  },
  // Superadmin
  ADMIN: {
    email: 'admin@example.com',
    password: 'adminpassword',
    name: 'Admin',
  },
};

/**
 * Generate unique random user data for registration tests.
 */
export function generateRandomUser(prefix = 'test') {
  const unique = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    email: `${prefix}-${unique}@example.com`,
    password: 'Password123!',
    name: `User ${unique}`,
    username: `u${unique.replace('-', '')}`,
  };
}

/**
 * Generate unique proposal data for kvintet creation tests.
 */
export function generateRandomProposal(prefix = 'Auto Proposal') {
  const unique = `${Date.now()}`;
  return {
    title: `${prefix} ${unique}`,
    description: `This is an automated regression test proposal description for ${unique}.`,
    categorySlugs: ['data-ai', 'software-development'],
  };
}
