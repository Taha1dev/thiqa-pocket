import { useTranslation } from "react-i18next"

import type { MoneyMovementRepository } from "@/data/money-movement-repository"
import type { WalletUser } from "@/domain/wallet"
import {
  FlowProgress,
  MoneyMovementPanel,
} from "@/features/money-movement/components/money-movement-ui"
import { TransferForm } from "@/features/transfer/transfer-form"
import { TransferReceipt } from "@/features/transfer/transfer-receipt"
import { TransferReview } from "@/features/transfer/transfer-review"
import { useTransferFlow } from "@/features/transfer/use-transfer-flow"

interface TransferFlowProps {
  readonly wallet: WalletUser
  readonly repository: MoneyMovementRepository
}

export function TransferFlow({ wallet, repository }: TransferFlowProps) {
  const { t } = useTranslation("transfer")
  const flow = useTransferFlow(wallet, repository)

  if (flow.receipt) {
    return (
      <TransferReceipt
        headingRef={flow.stateHeadingRef}
        locale={flow.locale}
        receipt={flow.receipt}
        onRepeat={flow.startAnotherTransfer}
      />
    )
  }

  return (
    <MoneyMovementPanel>
      <FlowProgress
        current={flow.step}
        detailsLabel={t("steps.details")}
        reviewLabel={t("steps.review")}
      />

      {flow.step === "details" ? (
        <TransferForm
          errors={flow.form.formState.errors}
          headingRef={flow.stateHeadingRef}
          locale={flow.locale}
          maxAmount={flow.maxAmount}
          minAmount={flow.minAmount}
          register={flow.form.register}
          setValue={flow.form.setValue}
          wallet={wallet}
          onSubmit={flow.showReview}
        />
      ) : flow.reviewValues ? (
        <TransferReview
          headingRef={flow.stateHeadingRef}
          locale={flow.locale}
          mutation={flow.mutation}
          values={flow.reviewValues}
          wallet={wallet}
          onConfirm={flow.confirmTransfer}
          onEdit={flow.editTransfer}
        />
      ) : null}
    </MoneyMovementPanel>
  )
}
