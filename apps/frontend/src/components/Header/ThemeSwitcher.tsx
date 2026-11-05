import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { SEGMENT_GROUP_CLASS, SEGMENT_ITEM_CLASS } from "@/components/Header/segmented"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
      <ToggleGroup
        type="single"
        spacing={1}
        value={theme}
        // Radix reports "" when the selected item is clicked again; a theme is always chosen.
        onValueChange={(value) => value && setTheme(value as Theme)}
        aria-label={t("common.theme")}
        className={cn(SEGMENT_GROUP_CLASS, className)}
      >
        {THEMES.map(({ value, labelKey }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className={SEGMENT_ITEM_CLASS}
          >
            {t(labelKey)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
