// Placeholder address from the design; replace once a real support mailbox exists.
const SUPPORT_EMAIL = "podpora@kvintet.example"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-6 md:py-0">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 md:h-16 md:flex-row md:items-center md:gap-6">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-sm text-body hover:underline"
        >
          Kontaktovat podporu
        </a>
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase md:ml-auto">
          Kvintet · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
