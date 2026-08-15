import { createBrowserRouter, type RouteObject } from "react-router"

import { AuthenticatedLayout } from "@/app/layouts/authenticated-layout"
import { routePaths } from "@/app/router/paths"
import { RouteErrorBoundary } from "@/app/router/route-error-boundary"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { RootRedirect } from "@/features/auth/root-redirect"
import { RoutePending } from "@/shared/ui/route-pending"

export const appRoutes = [
  {
    path: routePaths.root,
    element: <RootRedirect />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: routePaths.login,
    lazy: () => import("@/features/auth/login-route"),
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
            lazy: () => import("@/features/dashboard/dashboard-route"),
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.transaction,
            lazy: () =>
              import("@/features/transactions/transaction-detail-route"),
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.transfer,
            lazy: () => import("@/features/money-movement/transfer-route"),
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.topUp,
            lazy: () => import("@/features/money-movement/top-up-route"),
            HydrateFallback: RoutePending,
          },
          {
            path: routePaths.assistant,
            lazy: () => import("@/features/assistant/assistant-route"),
            HydrateFallback: RoutePending,
          },
        ],
      },
    ],
  },
  {
    path: routePaths.notFound,
    lazy: () => import("@/features/auth/not-found-route"),
    HydrateFallback: RoutePending,
    errorElement: <RouteErrorBoundary />,
  },
] satisfies RouteObject[]

export const appRouter = createBrowserRouter(appRoutes)
