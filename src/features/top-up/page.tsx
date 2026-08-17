import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MoneyMovementSkeleton } from "@/features/money-movement/components/money-movement-ui"
import { TopUpFlow } from "@/features/top-up/top-up-flow"
import { moneyMovementRepository } from "@/data/money-movement-repository"
import { walletRepository } from "@/data/wallet-repository"
import { walletDataQueryOptions } from "@/data/wallet-queries"
import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

export function TopUpPage() {
  const { t } = useTranslation(["transfer", "common"])
  const walletDataQuery = useQuery(walletDataQueryOptions(walletRepository))

  if (walletDataQuery.isPending) {
    return (
      <PageShell title={t("topUp.title")} description={t("topUp.description")}>
        <span className="sr-only" role="status">
          {t("common:states.loading")}
        </span>
        <MoneyMovementSkeleton />
      </PageShell>
    )
  }

  if (walletDataQuery.isError || !walletDataQuery.data) {
    return (
      <PageShell title={t("topUp.title")} description={t("topUp.description")}>
        <PageState
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void walletDataQuery.refetch()
              }}
            >
              {t("common:actions.retry")}
            </Button>
          }
          message={t("topUp.errors.walletUnavailable")}
          role="alert"
        />
      </PageShell>
    )
  }

  return (
    <PageShell title={t("topUp.title")} description={t("topUp.description")}>
      <TopUpFlow
        repository={moneyMovementRepository}
        wallet={walletDataQuery.data.wallet}
      />
    </PageShell>
  )
}
