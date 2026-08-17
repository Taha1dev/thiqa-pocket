import { ArrowClockwiseIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useRegisterSW } from "virtual:pwa-register/react"

import { Button } from "@/components/ui/button"

export function UpdatePrompt() {
  const { t } = useTranslation("common")
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) {
    return null
  }

  return (
    <div
      className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border bg-card p-3.5 text-card-foreground elevated-surface sm:flex-row sm:items-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <ArrowClockwiseIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
          weight="bold"
        />
        <p className="text-sm leading-5">{t("pwa.update.message")}</p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>
          {t("pwa.update.later")}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            void updateServiceWorker(true).catch(() => undefined)
          }}
        >
          {t("pwa.update.now")}
        </Button>
      </div>
    </div>
  )
}
