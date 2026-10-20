// BetterAuth words its errors in English and never says which half was wrong. Only the
// invalid-credentials code is blamed on the user; network and server errors must not be.
export function signInErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  return code === "INVALID_EMAIL_OR_PASSWORD"
    ? "Přihlášení se nezdařilo. Nesprávný e-mail nebo heslo."
    : "Přihlášení se nezdařilo. Zkuste to prosím znovu."
}
