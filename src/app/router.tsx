import { createBrowserRouter, type RouteObject } from "react-router"

import { AuthenticatedLayout } from "@/app/layout"
import { ProtectedRoute } from "@/app/routes/protected-route"
import { RootRedirect } from "@/app/routes/root-redirect"
import { routePaths } from "@/app/routes/paths"
import { RouteErrorBoundary } from "@/app/routes/route-error-boundary"
import { RoutePending } from "@/shared/ui/route-pending"

export const appRoutes = [
  {
    path: routePaths.root,
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: routePaths.login,
    lazy: async () => {
      const { LoginPage } = await import("@/features/auth/page")
      return { Component: LoginPage }
    },
    HydrateFallback: RoutePending,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          {
            path: routePaths.dashboard,
            lazy: async () => {
              const { DashboardPage } =
                await import("@/features/dashboard/page")
              return { Component: DashboardPage }
            },
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.transaction,
            lazy: async () => {
              const { TransactionPage } =
                await import("@/features/transactions/page")
              return { Component: TransactionPage }
            },
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.transfer,
            lazy: async () => {
              const { TransferPage } = await import("@/features/transfer/page")
              return { Component: TransferPage }
            },
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.topUp,
            lazy: async () => {
              const { TopUpPage } = await import("@/features/top-up/page")
              return { Component: TopUpPage }
            },
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.assistant,
            lazy: async () => {
              const { AssistantPage } =
                await import("@/features/assistant/page")
              return { Component: AssistantPage }
            },
            HydrateFallback: RoutePending,
          },
        ],
      },
    ],
  },
  {
    path: routePaths.notFound,
    lazy: async () => {
      const { NotFoundPage } = await import("@/app/routes/not-found-page")
      return { Component: NotFoundPage }
    },
    HydrateFallback: RoutePending,
    errorElement: <RouteErrorBoundary />,
  },
] satisfies RouteObject[]

export const appRouter = createBrowserRouter(appRoutes)
