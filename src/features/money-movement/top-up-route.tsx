import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { MoneyMovementSkeleton } from "@/features/money-movement/components/money-movement-ui"
import { TopUpFlow } from "@/features/money-movement/components/top-up-flow"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { moneyMovementRepository } from "@/infrastructure/wallet/mock-money-movement-repository"
import {
  transactionsQueryOptions,
  walletQueryOptions,
} from "@/infrastructure/wallet/wallet-queries"
import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

export function Component() {
  const { t } = useTranslation(["transfer", "common"])
  const walletQuery = useQuery(walletQueryOptions(walletRepository))
  const transactionsQuery = useQuery(transactionsQueryOptions(walletRepository))

  if (walletQuery.isPending || transactionsQuery.isPending) {
    return (
      <PageShell title={t("topUp.title")} description={t("topUp.description")}>
        <span className="sr-only" role="status">
          {t("common:states.loading")}
        </span>
        <MoneyMovementSkeleton />
      </PageShell>
    )
  }

  if (walletQuery.isError || transactionsQuery.isError || !walletQuery.data) {
    return (
      <PageShell title={t("topUp.title")} description={t("topUp.description")}>
        <PageState
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void walletQuery.refetch()
                void transactionsQuery.refetch()
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
        wallet={walletQuery.data}
      />
    </PageShell>
  )
}
