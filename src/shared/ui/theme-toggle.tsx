import { CircleHalfTilt } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  readonly className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation("common")

  const handleToggle = () => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        document.documentElement.classList.contains("dark"))

    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      aria-label={t("accessibility.themeToggle")}
      className={cn("text-muted-foreground", className)}
      size="icon-sm"
      title={t("accessibility.themeToggle")}
      variant="ghost"
      onClick={handleToggle}
    >
      <CircleHalfTilt aria-hidden="true" />
    </Button>
  )
}
