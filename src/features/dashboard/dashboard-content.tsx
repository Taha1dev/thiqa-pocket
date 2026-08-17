import type { Transaction } from "@/domain/transaction"
import type { WalletUser } from "@/domain/wallet"
import { QuickActions } from "@/features/dashboard/components/quick-actions"
import { TransactionList } from "@/features/dashboard/components/transaction-list"
import { CreditCard } from "@/shared/ui/credit-card"

interface DashboardContentProps {
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
  readonly locale: string
}

export function DashboardContent({
  wallet,
  transactions,
  locale,
}: DashboardContentProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.45fr)] lg:gap-5">
        <CreditCard locale={locale} wallet={wallet} />
        <QuickActions />
      </div>
      <TransactionList locale={locale} transactions={transactions} />
    </>
  )
}
