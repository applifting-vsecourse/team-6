import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { locales } from "@/i18n"
import { cn } from "@/lib/utils"

type LanguageSwitcherProps = {
  className?: string
  // "text": "CS / EN" in the desktop header. "pills": the mobile menu row.
  variant?: "text" | "pills"
}

/** "CS / EN" text toggle from the design. The active language is the dark one. */
export function LanguageSwitcher({ className, variant = "text" }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  if (variant === "pills") {
    return (
      <div
        role="group"
        aria-label={t("common.language")}
        className={cn("flex items-center gap-2", className)}
      >
        {locales.map((locale) => {
          const isActive = i18n.resolvedLanguage === locale.code
          return (
            <Button
              key={locale.code}
              size="sm"
              variant={isActive ? "default" : "outline"}
              lang={locale.code}
              aria-pressed={isActive}
              onClick={() => void i18n.changeLanguage(locale.code)}
              className="h-8 rounded-full px-3.5 text-sm font-normal"
            >
              {locale.nativeName}
            </Button>
          )
        })}
      </div>
    )
  }

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
