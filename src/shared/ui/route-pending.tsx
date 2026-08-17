import { useTranslation } from "react-i18next"

import { BrandMark } from "@/shared/ui/brand-mark"

export function RoutePending() {
  const { t } = useTranslation("common")

  return (
    <div className="route-pending fixed inset-0 z-50 grid min-h-svh place-items-center bg-background/70 px-6 backdrop-blur-xl backdrop-saturate-125">
      <span aria-live="polite" className="sr-only" role="status">
        {t("states.loading")}
      </span>

      <div
        aria-hidden="true"
        className="relative grid size-28 place-items-center"
      >
        <span className="absolute inset-0 rounded-full border border-border/70 shadow-[0_14px_36px_var(--surface-shadow)]" />
        <span
          className="route-pending__spinner absolute inset-1 animate-spin rounded-full border-2 border-transparent border-e-primary/30 border-t-primary motion-reduce:animate-none"
          data-slot="route-pending-spinner"
        />
        <span className="grid size-16 place-items-center rounded-2xl border border-border/65 bg-card/85 shadow-lg backdrop-blur-md">
          <BrandMark className="size-11 shadow-sm" />
        </span>
      </div>
    </div>
  )
}
