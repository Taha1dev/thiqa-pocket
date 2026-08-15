import { Link, useRouteError } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/router/paths"
import { buttonVariants } from "@/components/ui/button"

export function RouteErrorBoundary() {
  useRouteError()
  const { t } = useTranslation("common")

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <section
        className="flex max-w-md flex-col items-start gap-4"
        role="alert"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("routeError.title")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("routeError.description")}
        </p>
        <Link className={buttonVariants()} to={routePaths.dashboard}>
          {t("actions.backToDashboard")}
        </Link>
      </section>
    </main>
  )
}
