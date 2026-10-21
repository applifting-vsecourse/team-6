import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { locales } from "@/i18n"
import { cn } from "@/lib/utils"

/** "CS / EN" text toggle from the design. The active language is the dark one. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn("flex items-center gap-1.5", className)}
    >
      {locales.map((locale, index) => (
        <Fragment key={locale.code}>
          {index > 0 ? (
            <span
              aria-hidden
              className="font-mono text-xs text-input"
            >
              /
            </span>
          ) : null}
          <Button
            variant="ghost"
            lang={locale.code}
            aria-label={locale.nativeName}
            aria-pressed={i18n.resolvedLanguage === locale.code}
            onClick={() => void i18n.changeLanguage(locale.code)}
            className="h-auto p-0 font-mono text-xs tracking-meta text-muted-foreground uppercase hover:bg-transparent aria-pressed:text-foreground"
          >
            {locale.code}
          </Button>
        </Fragment>
      ))}
    </div>
  )
}
