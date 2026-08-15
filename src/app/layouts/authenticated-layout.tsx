import { useQuery } from "@tanstack/react-query"
import { NavLink, Outlet } from "react-router"
import { useTranslation } from "react-i18next"

import { AppAccountMenu } from "@/app/layouts/app-account-menu"
import {
  DesktopNavigation,
  MobileNavigation,
} from "@/app/layouts/app-navigation"
import { routePaths } from "@/app/router/paths"
import { walletRepository } from "@/infrastructure/wallet/json-wallet-repository"
import { walletQueryOptions } from "@/infrastructure/wallet/wallet-queries"
import { BrandMark } from "@/shared/ui/brand-mark"
import { LanguageSwitcher } from "@/shared/ui/language-switcher"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

function BrandLink() {
  const { t } = useTranslation("common")

  return (
    <NavLink
      aria-label={t("accessibility.brandHome")}
      className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      to={routePaths.dashboard}
    >
      <BrandMark className="size-8 shadow-sm" />
      <span className="truncate text-sm font-semibold tracking-[-0.01em] sm:text-base">
        {t("productName")}
      </span>
    </NavLink>
  )
}

export function AuthenticatedLayout() {
  const { t } = useTranslation("common")
  const walletQuery = useQuery(walletQueryOptions(walletRepository))

  return (
    <div className="min-h-svh bg-background">
      <a
        className="fixed inset-s-3 top-3 z-50 -translate-y-24 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
        href="#main-content"
      >
        {t("accessibility.skipToContent")}
      </a>

      <header className="sticky top-0 z-40 hidden border-b app-chrome lg:block">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 xl:px-8">
          <BrandLink />
          <DesktopNavigation />
          <div className="flex items-center justify-end gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <AppAccountMenu user={walletQuery.data} />
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-40 border-b app-chrome lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <BrandLink />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AppAccountMenu includeLanguage user={walletQuery.data} />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="px-4 py-6 pb-[calc(6.25rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:px-8 lg:pb-10"
      >
        <Outlet />
      </main>

      <MobileNavigation />
    </div>
  )
}
