import { useTranslation } from "react-i18next"

export function RoutePending() {
  const { t } = useTranslation("common")

  return (
    <div className="grid min-h-svh place-items-center p-6" role="status">
      <p className="text-sm text-muted-foreground">{t("states.loading")}</p>
    </div>
  )
}
