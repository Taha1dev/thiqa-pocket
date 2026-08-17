import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { useTranslation } from "react-i18next"
import { Toaster } from "sileo"
import "sileo/styles.css"

import { appRouter } from "@/app/router"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { OnlineStatus } from "@/shared/ui/online-status"
import { UpdatePrompt } from "@/shared/ui/update-prompt"

function AppToaster() {
  const { theme } = useTheme()
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === "rtl"

  return (
    <Toaster
      position={isRtl ? "top-left" : "top-right"}
      theme={theme}
      offset={{
        top: "max(5.25rem, calc(4.5rem + env(safe-area-inset-top)))",
        left: "max(1rem, env(safe-area-inset-left))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
      options={{
        duration: 3600,
        fill: "var(--toast-surface)",
        roundness: 18,
      }}
    />
  )
}

function PwaNotifications() {
  const { t } = useTranslation("common")

  return (
    <aside
      aria-label={t("accessibility.pwaNotifications")}
      className="pointer-events-none fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 sm:inset-x-6 lg:bottom-6"
    >
      <OnlineStatus />
      <UpdatePrompt />
    </aside>
  )
}

export function AppProviders() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnMount: false,
            // on real production this option could be enabled
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <AppToaster />
      <PwaNotifications />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
