import { useTranslation } from "react-i18next"

import { Skeleton } from "@/components/ui/skeleton"

export function RoutePending() {
  const { t } = useTranslation("common")

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-6 p-6 sm:gap-8 sm:p-8">
      <span className="sr-only" role="status">
        {t("states.loading")}
      </span>
      <header aria-hidden="true" className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </header>
      <div
        aria-hidden="true"
        className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7"
      >
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full" />
        <div className="mt-7 space-y-5">
          {[0, 1, 2].map((item) => (
            <div className="space-y-2" key={item}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
