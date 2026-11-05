import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { SEGMENT_GROUP_CLASS, SEGMENT_ITEM_CLASS } from "@/components/Header/segmented"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
      <ToggleGroup
        type="single"
        spacing={1}
        value={i18n.resolvedLanguage}
        // Radix reports "" when the selected item is clicked again; a language is always chosen.
        onValueChange={(code) => code && void i18n.changeLanguage(code)}
        aria-label={t("common.language")}
        className={cn(SEGMENT_GROUP_CLASS, className)}
      >
        {locales.map((locale) => (
          <ToggleGroupItem
            key={locale.code}
            value={locale.code}
            lang={locale.code}
            aria-label={locale.nativeName}
            className={cn(SEGMENT_ITEM_CLASS, "uppercase")}
          >
            {locale.code}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    )
  }

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={cn("flex items-center gap-1", className)}
    >
      {locales.map((locale, index) => (
        <Fragment key={locale.code}>
          {index > 0 ? (
            <span
              aria-hidden
              className="font-mono text-meta text-input"
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
            className="h-auto p-0 font-mono text-meta tracking-meta text-muted-foreground uppercase hover:bg-transparent aria-pressed:text-foreground"
          >
            {locale.code}
          </Button>
        </Fragment>
      ))}
    </div>
  )
}
