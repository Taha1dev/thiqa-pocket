import { Navigate, Outlet, useLocation } from "react-router"

import { routePaths } from "@/app/router/paths"
import { useAuthStore } from "@/infrastructure/auth/auth-store"
import { RoutePending } from "@/shared/ui/route-pending"

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const location = useLocation()

  if (!hasHydrated) {
    return <RoutePending />
  }

  if (!token) {
    const intendedPath = `${location.pathname}${location.search}${location.hash}`
    return (
      <Navigate to={routePaths.login} replace state={{ from: intendedPath }} />
    )
  }

  return <Outlet />
}
