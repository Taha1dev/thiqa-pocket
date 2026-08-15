import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { setAppLanguage } from "@/i18n/config"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  readonly className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation("common")
  const isArabic = i18n.resolvedLanguage === "ar"

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={t("accessibility.languageSwitcher")}
      className={cn("text-muted-foreground", className)}
      onClick={() => void setAppLanguage(isArabic ? "en" : "ar")}
    >
      {isArabic ? t("actions.switchToEnglish") : t("actions.switchToArabic")}
    </Button>
  )
}
