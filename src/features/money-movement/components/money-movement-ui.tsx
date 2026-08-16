import { Check, CheckCircle } from "@phosphor-icons/react"
import type { ReactNode, Ref } from "react"
import { Link } from "react-router"

import { routePaths } from "@/app/router/paths"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface SummaryRow {
  readonly label: string
  readonly value: ReactNode
}

interface FlowProgressProps {
  readonly current: "details" | "review"
  readonly detailsLabel: string
  readonly reviewLabel: string
}

export function FlowProgress({
  current,
  detailsLabel,
  reviewLabel,
}: FlowProgressProps) {
  const isReview = current === "review"

  return (
    <ol className="mb-7 flex items-center gap-3 text-xs font-medium text-muted-foreground sm:text-sm">
      <li
        aria-current={!isReview ? "step" : undefined}
        className={cn(
          "flex items-center gap-2",
          !isReview && "text-foreground"
        )}
      >
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full border financial-value",
            isReview
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary text-primary"
          )}
        >
          {isReview ? <Check aria-hidden="true" className="size-3.5" /> : "1"}
        </span>
        {detailsLabel}
      </li>
      <li aria-hidden="true" className="h-px flex-1 bg-border" />
      <li
        aria-current={isReview ? "step" : undefined}
        className={cn("flex items-center gap-2", isReview && "text-foreground")}
      >
        <span
          className={cn(
            "grid size-6 place-items-center rounded-full border financial-value",
            isReview && "border-primary text-primary"
          )}
        >
          2
        </span>
        {reviewLabel}
      </li>
    </ol>
  )
}

export function MoneyMovementPanel({
  children,
}: {
  readonly children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70 bg-card p-5 elevated-surface sm:p-7 lg:p-8">
      {children}
    </div>
  )
}

export function SummaryList({
  rows,
}: {
  readonly rows: readonly SummaryRow[]
}) {
  return (
    <dl>
      {rows.map((row, index) => (
        <div key={row.label}>
          {index > 0 ? <Separator /> : null}
          <div className="grid gap-1 py-3.5 sm:grid-cols-[minmax(8rem,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-6">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 text-sm font-medium sm:text-end">
              {row.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

interface MoneyMovementReceiptProps {
  readonly title: string
  readonly description: string
  readonly amount: ReactNode
  readonly rows: readonly SummaryRow[]
  readonly dashboardLabel: string
  readonly repeatLabel: string
  readonly onRepeat: () => void
  readonly headingRef?: Ref<HTMLHeadingElement>
}

export function MoneyMovementReceipt({
  title,
  description,
  amount,
  rows,
  dashboardLabel,
  repeatLabel,
  onRepeat,
  headingRef,
}: MoneyMovementReceiptProps) {
  return (
    <MoneyMovementPanel>
      <div
        className="animate-in duration-150 fade-in motion-reduce:animate-none"
        role="status"
      >
        <header className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-status-completed text-status-completed-foreground">
            <CheckCircle aria-hidden="true" className="size-7" weight="fill" />
          </span>
          <h2
            className="mt-4 scroll-mt-40 text-xl font-semibold tracking-[-0.02em] outline-none sm:scroll-mt-28"
            ref={headingRef}
            tabIndex={-1}
          >
            {title}
          </h2>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-5">{amount}</div>
        </header>

        <div className="mt-7 rounded-2xl bg-muted/55 px-4 sm:px-5">
          <SummaryList rows={rows} />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            className={buttonVariants({ variant: "default", size: "lg" })}
            to={routePaths.dashboard}
          >
            {dashboardLabel}
          </Link>
          <Button size="lg" type="button" variant="outline" onClick={onRepeat}>
            {repeatLabel}
          </Button>
        </div>
      </div>
    </MoneyMovementPanel>
  )
}

export function MoneyMovementSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70 bg-card p-5 sm:p-7 lg:p-8"
    >
      <div className="mb-7 flex items-center gap-3">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-px flex-1 rounded-none" />
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full" />
      <div className="mt-7 space-y-5">
        {[0, 1, 2].map((item) => (
          <div className="space-y-2" key={item}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}
