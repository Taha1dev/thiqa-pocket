import {
  ChatCircleDots,
  House,
  PaperPlaneTilt,
  PlusCircle,
} from "@phosphor-icons/react"
import { NavLink } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/router/paths"
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
      <ul className="flex items-center gap-1 rounded-2xl bg-muted/55 p-1">
        {navigationItems.map((item) => (
          <li key={item.path}>
            <NavLink
              className={({ isActive }) =>
                cn(
                  "relative block pressable rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-card/75 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isActive &&
                    "bg-card text-foreground shadow-[0_1px_2px_var(--surface-shadow)] after:absolute after:inset-x-1/2 after:-bottom-0.5 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary rtl:after:translate-x-1/2"
                )
              }
              to={item.path}
            >
              {t(item.translationKey)}
            </NavLink>
          </li>
        ))}
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
                    "group flex min-h-14 pressable flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
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
