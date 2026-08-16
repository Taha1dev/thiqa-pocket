import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { useTranslation } from "react-i18next"
import { Toaster } from "sileo"
import "sileo/styles.css"

import { appRouter } from "@/app/router/router"
import { ThemeProvider, useTheme } from "@/components/theme-provider"

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

export function AppProviders() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnMount: false,
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <AppToaster />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
