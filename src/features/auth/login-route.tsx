import { Navigate, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"

import { routePaths } from "@/app/router/paths"
import { LoginForm } from "@/features/auth/login-form"
import { useAuthStore } from "@/infrastructure/auth/auth-store"
import { BrandMark } from "@/shared/ui/brand-mark"
import { LanguageSwitcher } from "@/shared/ui/language-switcher"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

function getIntendedPath(state: unknown): string {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return routePaths.dashboard
  }

  const { from } = state
  return typeof from === "string" && from.startsWith("/")
    ? from
    : routePaths.dashboard
}

export function Component() {
  const { t } = useTranslation(["auth", "common"])
  const token = useAuthStore((state) => state.token)
  const login = useAuthStore((state) => state.login)
  const location = useLocation()
  const navigate = useNavigate()

  if (token) {
    return <Navigate to={getIntendedPath(location.state)} replace />
  }

  const handleAuthenticated = (sessionToken: string) => {
    login(sessionToken)
    navigate(getIntendedPath(location.state), { replace: true })
  }

  return (
    <main className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(28rem,0.88fr)]">
      <section className="relative min-h-44 overflow-hidden bg-brand-ink text-brand-ink-foreground sm:min-h-56 lg:min-h-svh">
        <img
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_58%] opacity-75 mix-blend-luminosity"
          src="/ruixen_moon.png"
        />
        <div className="absolute inset-0 bg-brand-petrol/35 mix-blend-color" />
        <div className="absolute inset-0 bg-linear-to-t from-brand-ink via-brand-ink/10 to-transparent" />

        <div className="relative flex h-full min-h-44 flex-col justify-between p-5 sm:min-h-56 sm:p-7 lg:min-h-svh lg:p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <BrandMark className="size-11 shadow-lg ring-1 ring-white/15" />
            <span className="text-sm font-semibold tracking-[-0.01em] sm:text-base">
              {t("common:productName")}
            </span>
          </div>
          <div className="hidden max-w-xl sm:block">
            <p className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl lg:text-4xl">
              {t("auth:login.visual.title")}
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65 lg:text-base lg:leading-7">
              {t("auth:login.visual.description")}
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[calc(100svh-11rem)] items-center justify-center px-5 py-20 sm:min-h-[calc(100svh-14rem)] sm:px-8 lg:min-h-svh lg:px-12 lg:py-24">
        <div className="absolute inset-x-5 top-4 flex items-center justify-end gap-1 sm:inset-x-8 sm:top-6 lg:inset-x-10">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <LoginForm onAuthenticated={handleAuthenticated} />
        </div>
      </section>
    </main>
  )
}
