import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/routes/paths"
import { buttonVariants } from "@/components/ui/button"

export function NotFoundPage() {
  const { t } = useTranslation("common")

  return (
    <main className="grid min-h-svh place-items-center p-6">
      <section className="flex max-w-md flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("notFound.title")}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("notFound.description")}
        </p>
        <Link className={buttonVariants()} to={routePaths.root}>
          {t("actions.backToDashboard")}
        </Link>
      </section>
    </main>
  )
}
