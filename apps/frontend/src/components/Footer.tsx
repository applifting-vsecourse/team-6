import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"

// Placeholder address from the design; replace once a real support mailbox exists.
const SUPPORT_EMAIL = "podpora@kvintet.example"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border bg-background px-4 py-6 md:py-0">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 md:h-16 md:flex-row md:items-center md:gap-6">
        <div className="flex gap-5 text-sm text-body md:gap-6">
          <Link
            to={ROUTES.codeOfConduct}
            className="hover:underline"
          >
            {t("codeOfConduct.title")}
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="hover:underline"
          >
            {t("footer.contactSupport")}
          </a>
        </div>
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase md:ml-auto">
          Kvintet · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
