import {
  ChatCircleDots,
  PaperPlaneTilt,
  Plus,
  type IconProps,
} from "@phosphor-icons/react"
import type { ComponentType } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/routes/paths"

interface QuickAction {
  readonly path: string
  readonly translationKey:
    "quickActions.transfer" | "quickActions.topUp" | "quickActions.assistant"
  readonly icon: ComponentType<IconProps>
}

const quickActions: readonly QuickAction[] = [
  {
    path: routePaths.transfer,
    translationKey: "quickActions.transfer",
    icon: PaperPlaneTilt,
  },
  {
    path: routePaths.topUp,
    translationKey: "quickActions.topUp",
    icon: Plus,
  },
  {
    path: routePaths.assistant,
    translationKey: "quickActions.assistant",
    icon: ChatCircleDots,
  },
]

export function QuickActions() {
  const { t } = useTranslation("wallet")

  return (
    <section
      aria-labelledby="quick-actions-title"
      className="rounded-3xl bg-secondary/65 p-4 sm:p-5"
    >
      <h2
        id="quick-actions-title"
        className="mb-3 text-sm font-semibold tracking-[-0.01em] sm:mb-4"
      >
        {t("quickActions.title")}
      </h2>
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <li key={action.path}>
              <Link
                className="group flex min-h-20 pressable flex-col items-center justify-center gap-2 rounded-2xl bg-card/75 p-2.5 text-center text-xs font-medium hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:text-sm lg:min-h-16 lg:flex-row lg:justify-start lg:px-3 lg:text-start"
                to={action.path}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon aria-hidden="true" className="size-[1.05rem]" />
                </span>
                <span>{t(action.translationKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
