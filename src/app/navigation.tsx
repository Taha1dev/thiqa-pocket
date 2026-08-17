import {
  ChatCircleDots,
  House,
  PaperPlaneTilt,
  PlusCircle,
} from "@phosphor-icons/react"
import { NavLink } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/routes/paths"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    path: routePaths.dashboard,
    translationKey: "navigation.dashboard",
    mobileTranslationKey: "mobileNavigation.dashboard",
    icon: House,
  },
  {
    path: routePaths.transfer,
    translationKey: "navigation.transfer",
    mobileTranslationKey: "mobileNavigation.transfer",
    icon: PaperPlaneTilt,
  },
  {
    path: routePaths.topUp,
    translationKey: "navigation.topUp",
    mobileTranslationKey: "mobileNavigation.topUp",
    icon: PlusCircle,
  },
  {
    path: routePaths.assistant,
    translationKey: "navigation.assistant",
    mobileTranslationKey: "mobileNavigation.assistant",
    icon: ChatCircleDots,
  },
] as const

export function DesktopNavigation() {
  const { t } = useTranslation("common")

  return (
    <nav aria-label={t("accessibility.mainNavigation")}>
      <ul className="flex items-center gap-0.5">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.path}>
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "group relative flex min-h-10 pressable items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/55 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActive &&
                      "bg-accent/80 text-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent),0_1px_2px_var(--surface-shadow)] after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  )
                }
                to={item.path}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      aria-hidden="true"
                      className="size-4.5 shrink-0"
                      weight={isActive ? "fill" : "regular"}
                    />
                    <span>{t(item.translationKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileNavigation() {
  const { t } = useTranslation("common")

  return (
    <nav
      aria-label={t("accessibility.mobileNavigation")}
      className="fixed inset-x-0 bottom-0 z-40 border-t app-chrome lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
        {navigationItems.map((item) => {
          const Icon = item.icon

          return (
            <li key={item.path}>
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "group flex min-h-14 pressable flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium text-muted-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    isActive && "font-semibold text-foreground"
                  )
                }
                to={item.path}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "relative grid h-7 min-w-10 place-items-center rounded-xl transition-colors",
                        isActive &&
                          "bg-accent text-accent-foreground after:absolute after:-top-1 after:h-0.5 after:w-4 after:rounded-full after:bg-primary"
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        className="size-[1.15rem]"
                        weight={isActive ? "fill" : "regular"}
                      />
                    </span>
                    <span>{t(item.mobileTranslationKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
