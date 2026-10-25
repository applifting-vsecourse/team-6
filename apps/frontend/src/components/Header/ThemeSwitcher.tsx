import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useTheme, type Theme } from "@/lib/theme"
import { cn } from "@/lib/utils"

type ThemeSwitcherProps = {
  className?: string
  // "icon": moon/sun button in the desktop header. "pills": the mobile menu row.
  variant?: "icon" | "pills"
}

const THEMES: { value: Theme; labelKey: "common.themeLight" | "common.themeDark" }[] = [
  { value: "light", labelKey: "common.themeLight" },
  { value: "dark", labelKey: "common.themeDark" },
]

export function ThemeSwitcher({ className, variant = "icon" }: ThemeSwitcherProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  if (variant === "pills") {
    return (
      <div
        role="group"
        aria-label={t("common.theme")}
        className={cn("flex items-center gap-2", className)}
      >
        {THEMES.map(({ value, labelKey }) => {
          const isActive = theme === value
          return (
            <Button
              key={value}
              size="sm"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              onClick={() => setTheme(value)}
              className="h-8 rounded-full px-3.5 text-sm font-normal"
            >
              {t(labelKey)}
            </Button>
          )
        })}
      </div>
    )
  }

  const next = theme === "dark" ? "light" : "dark"
  const Icon = theme === "dark" ? Moon : Sun

  return (
    <Button
      variant="ghost"
      aria-label={t(next === "dark" ? "layout.switchToDark" : "layout.switchToLight")}
      onClick={() => setTheme(next)}
      className={cn(
        "size-8 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground",
        className,
      )}
    >
      <Icon
        aria-hidden
        className="size-4.5"
      />
    </Button>
  )
}
