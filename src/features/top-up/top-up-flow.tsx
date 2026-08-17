import { useTranslation } from "react-i18next"

import type { MoneyMovementRepository } from "@/data/money-movement-repository"
import type { WalletUser } from "@/domain/wallet"
import {
  FlowProgress,
  MoneyMovementPanel,
} from "@/features/money-movement/components/money-movement-ui"
import { TopUpForm } from "@/features/top-up/top-up-form"
import { TopUpReceipt } from "@/features/top-up/top-up-receipt"
import { TopUpReview } from "@/features/top-up/top-up-review"
import { useTopUpFlow } from "@/features/top-up/use-top-up-flow"

interface TopUpFlowProps {
  readonly wallet: WalletUser
  readonly repository: MoneyMovementRepository
}

export function TopUpFlow({ wallet, repository }: TopUpFlowProps) {
  const { t } = useTranslation("transfer")
  const flow = useTopUpFlow(wallet, repository)

  if (flow.receipt) {
    return (
      <TopUpReceipt
        headingRef={flow.stateHeadingRef}
        locale={flow.locale}
        receipt={flow.receipt}
        onRepeat={flow.startAnotherTopUp}
      />
    )
  }

  return (
    <MoneyMovementPanel>
      <FlowProgress
        current={flow.step}
        detailsLabel={t("steps.amount")}
        reviewLabel={t("steps.review")}
      />

      {flow.step === "details" ? (
        <TopUpForm
          errors={flow.form.formState.errors}
          headingRef={flow.stateHeadingRef}
          locale={flow.locale}
          maxAmount={flow.maxAmount}
          minAmount={flow.minAmount}
          register={flow.form.register}
          selectedAmount={flow.selectedAmount}
          setValue={flow.form.setValue}
          onSubmit={flow.showReview}
        />
      ) : flow.reviewAmountMinor !== null ? (
        <TopUpReview
          amountMinor={flow.reviewAmountMinor}
          headingRef={flow.stateHeadingRef}
          locale={flow.locale}
          mutation={flow.mutation}
          wallet={wallet}
          onConfirm={flow.confirmTopUp}
          onEdit={flow.editTopUp}
        />
      ) : null}
    </MoneyMovementPanel>
  )
}
