import { useEffect, useState } from "react"
import { WifiSlashIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

function getOnlineStatus(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}

export function OnlineStatus() {
  const { t } = useTranslation("common")
  const [isOnline, setIsOnline] = useState(getOnlineStatus)

  useEffect(() => {
    const syncOnlineStatus = () => setIsOnline(getOnlineStatus())

    window.addEventListener("online", syncOnlineStatus)
    window.addEventListener("offline", syncOnlineStatus)

    return () => {
      window.removeEventListener("online", syncOnlineStatus)
      window.removeEventListener("offline", syncOnlineStatus)
    }
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <div
      className="pointer-events-auto flex w-full max-w-2xl items-start gap-3 rounded-2xl border bg-card p-3.5 text-card-foreground elevated-surface"
      role="status"
      aria-live="polite"
    >
      <WifiSlashIcon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-muted-foreground"
        weight="bold"
      />
      <p className="text-sm leading-5">{t("pwa.offline.message")}</p>
    </div>
  )
}
