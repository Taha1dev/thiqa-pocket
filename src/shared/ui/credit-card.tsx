import { SimCard } from "@phosphor-icons/react"
import { useId, type PointerEvent } from "react"
import { useTranslation } from "react-i18next"

import type { Money } from "@/domain/money"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/shared/formatting/format-money"

export interface CreditCardWallet {
  readonly id: string
  readonly name: string
  readonly balance: Money
}

interface CreditCardProps {
  readonly wallet: CreditCardWallet
  readonly locale: string
  readonly variant?: "live" | "preview"
  readonly className?: string
}

function getWalletSuffix(walletId: string): string {
  return walletId.split("_").at(-1)?.slice(-4) ?? walletId.slice(-4)
}

function updateCardTilt(event: PointerEvent<HTMLElement>): void {
  if (event.pointerType !== "mouse") {
    return
  }

  const card = event.currentTarget
  const bounds = card.getBoundingClientRect()
  const normalizedX = (event.clientX - bounds.left) / bounds.width
  const normalizedY = (event.clientY - bounds.top) / bounds.height
  const rotateX = (0.5 - normalizedY) * 4
  const rotateY = (normalizedX - 0.5) * 5

  card.dataset.tilting = "true"
  card.style.setProperty("--wallet-tilt-x", `${rotateX.toFixed(2)}deg`)
  card.style.setProperty("--wallet-tilt-y", `${rotateY.toFixed(2)}deg`)
}

function resetCardTilt(event: PointerEvent<HTMLElement>): void {
  const card = event.currentTarget
  card.dataset.tilting = "false"
  card.style.setProperty("--wallet-tilt-x", "0deg")
  card.style.setProperty("--wallet-tilt-y", "0deg")
}

export function CreditCard({
  wallet,
  locale,
  variant = "live",
  className,
}: CreditCardProps) {
  const { t } = useTranslation(["wallet", "common"])
  const goldGradientId = `${useId().replace(/:/g, "")}-wallet-gold`
  const walletSuffix = getWalletSuffix(wallet.id)

  return (
    <section
      aria-label={t("balance.label")}
      className={cn(
        "wallet-card-tilt relative isolate flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/16 wallet-card-surface text-wallet-foreground elevated-surface",
        variant === "preview"
          ? "min-h-84 p-5 sm:p-6"
          : "min-h-80 p-6 sm:min-h-88 sm:p-8",
        className
      )}
      data-tilting="false"
      data-variant={variant}
      onPointerLeave={resetCardTilt}
      onPointerMove={updateCardTilt}
    >
      <div
        aria-hidden="true"
        className="wallet-card-shine pointer-events-none absolute -inset-s-20 -top-24 size-72 rounded-full"
      />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        data-wallet-lines=""
        preserveAspectRatio="none"
        viewBox="0 0 800 400"
      >
        <defs>
          <linearGradient id={goldGradientId} x1="0" x2="1" y1="1" y2="0">
            <stop
              offset="0"
              stopColor="var(--wallet-gold)"
              stopOpacity="0.35"
            />
            <stop offset="0.52" stopColor="var(--wallet-gold)" />
            <stop
              offset="1"
              stopColor="var(--wallet-gold)"
              stopOpacity="0.52"
            />
          </linearGradient>
        </defs>
        <path
          d="M -35 350 C 210 438 520 350 845 194"
          fill="none"
          opacity="0.34"
          stroke={`url(#${goldGradientId})`}
          strokeWidth="10"
          vectorEffect="non-scaling-stroke"
          className="filter-[blur(8px)]"
        />
        <path
          d="M -35 350 C 210 438 520 350 845 194"
          fill="none"
          stroke={`url(#${goldGradientId})`}
          strokeWidth="1.35"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 354 430 C 488 340 632 288 842 230"
          fill="none"
          opacity="0.82"
          stroke={`url(#${goldGradientId})`}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <img
            alt=""
            className="h-7 w-9 shrink-0 object-contain"
            height="570"
            src="/thiqa-white-icon.svg"
            width="718"
          />
          <span className="truncate text-sm font-semibold tracking-[-0.01em] sm:text-base">
            {t("common:productName")}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-white/14 bg-white/7 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.12em] text-wallet-muted uppercase backdrop-blur-md">
          {t("balance.virtual")}
        </span>
      </div>

      <div className="relative z-10 mt-7 flex items-center gap-3">
        <span className="wallet-sim-glass flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/24">
          <SimCard
            aria-hidden="true"
            className="size-7 text-brand-gold-foreground"
            weight="fill"
          />
        </span>
        <span aria-hidden="true" className="flex flex-col gap-1 opacity-55">
          <span className="h-px w-4 rounded-full bg-wallet-muted" />
          <span className="h-px w-5 rounded-full bg-wallet-muted" />
          <span className="h-px w-4 rounded-full bg-wallet-muted" />
        </span>
      </div>

      <div className="relative z-10 mt-5">
        <p
          className="text-[0.68rem] font-semibold tracking-[0.12em] text-wallet-muted uppercase"
        >
          {t("balance.label")}
        </p>
        <bdi
          className={cn(
            "mt-1.5 block financial-value font-semibold tracking-[-0.04em]",
            variant === "preview" ? "text-4xl" : "text-4xl sm:text-5xl"
          )}
          dir="ltr"
        >
          {formatMoney(wallet.balance, locale)}
        </bdi>
      </div>

      <bdi
        className="relative z-10 mt-6 block financial-value text-sm font-semibold tracking-[0.22em] text-wallet-foreground/92 sm:text-base"
        dir="ltr"
      >
        {
          "\u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  \u2022\u2022\u2022\u2022  "
        }
        {walletSuffix}
      </bdi>

      <dl className="relative z-10 mt-auto flex flex-wrap items-end gap-x-10 gap-y-3 pt-6 text-xs">
        <div className="min-w-0">
          <dt className="text-[0.65rem] font-semibold tracking-widest text-wallet-muted uppercase">
            {t("balance.holder")}
          </dt>
          <dd className="mt-1.5 truncate font-semibold tracking-[0.03em] text-wallet-foreground uppercase">
            {wallet.name}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.65rem] font-semibold tracking-widest text-wallet-muted uppercase">
            {t("balance.reference")}
          </dt>
          <dd className="mt-1.5 font-semibold text-wallet-foreground">
            {t("balance.personalWallet")}
          </dd>
        </div>
      </dl>
    </section>
  )
}
