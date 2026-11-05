import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { HOW_IT_WORKS_ANCHOR, ROUTES } from "@/app/routes"
import { SUPPORT_EMAIL } from "@/config/support"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border bg-background px-4 py-6 md:py-0">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2.5 md:h-16 md:flex-row md:items-center md:gap-6">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-body md:gap-6">
          <Link
            to={ROUTES.home}
            hash={HOW_IT_WORKS_ANCHOR}
            className="hover:underline"
          >
            {t("layout.howItWorks")}
          </Link>
          <Link
            to={ROUTES.codeOfConduct}
            className="hover:underline"
          >
            {t("layout.rules")}
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="hover:underline"
          >
            {/* Shorter on a phone, as in the design; display:none text is not read out. */}
            <span className="md:hidden">{t("layout.support")}</span>
            <span className="hidden md:inline">{t("layout.contactSupport")}</span>
          </a>
        </div>
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase md:ml-auto">
          Kvintet · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
