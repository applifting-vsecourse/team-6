// BetterAuth words its errors in English; show Czech and never echo server wording.
const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Účet s tímto e-mailem už existuje.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Účet s tímto e-mailem už existuje.",
  USERNAME_IS_ALREADY_TAKEN: "Toto uživatelské jméno je už obsazené.",
  PASSWORD_TOO_SHORT: "Heslo musí mít alespoň 8 znaků.",
}

const FALLBACK = "Registrace se nezdařila."

export function signUpErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  return (code ? MESSAGES[code] : undefined) ?? FALLBACK
}
