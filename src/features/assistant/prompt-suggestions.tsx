import { ChatCircleDots, Sparkle } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

const suggestionKeys = [
  "suggestions.transferMonth",
  "suggestions.largestExpense",
  "suggestions.topUpMonth",
  "suggestions.spendingSummary",
] as const

export function PromptSuggestions({
  disabled,
  onSelect,
}: {
  readonly disabled: boolean
  readonly onSelect: (question: string) => void
}) {
  const { t } = useTranslation("assistant")

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-1 py-8 text-center sm:py-10">
      <div className="relative mb-5 grid size-14 place-items-center rounded-2xl bg-brand-petrol text-brand-petrol-foreground shadow-[0_16px_40px_-22px_var(--brand-petrol)]">
        <ChatCircleDots aria-hidden="true" className="size-6" weight="fill" />
        <span className="absolute -inset-e-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-gold text-brand-gold-foreground ring-4 ring-background">
          <Sparkle aria-hidden="true" className="size-3" weight="fill" />
        </span>
      </div>
      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        {t("intro.badge")}
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
        {t("intro.title")}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("intro.description")}
      </p>
      <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
        {suggestionKeys.map((key) => {
          const question = t(key)

          return (
            <button
              className="min-h-14 pressable rounded-2xl border border-border/75 bg-card px-4 py-3 text-start text-sm leading-5 font-medium hover:border-primary/40 hover:bg-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
              disabled={disabled}
              key={key}
              type="button"
              onClick={() => onSelect(question)}
            >
              <span dir="auto">{question}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
