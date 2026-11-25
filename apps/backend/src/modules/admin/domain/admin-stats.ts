// Aggregated numbers only: no ids, names or message content ever go in here.
export type AdminStats = {
  users: { registered: number; onboarded: number; activeToday: number };
  kvintets: {
    total: number;
    active: number;
    /** Forming with 1–2 members. */
    formingSmall: number;
    /** Forming with 3–4 members: can vote to start. */
    formingReady: number;
  };
};
