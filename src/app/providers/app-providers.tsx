import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { Toaster } from "sileo"
import "sileo/styles.css"

import { appRouter } from "@/app/router/router"
import { ThemeProvider } from "@/components/theme-provider"

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
      <Toaster
        position="top-center"
        theme="dark"
        offset={{ top: "max(1rem, env(safe-area-inset-top))" }}
        options={{ duration: 3600, fill: "var(--popover)", roundness: 16 }}
      />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={appRouter} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
