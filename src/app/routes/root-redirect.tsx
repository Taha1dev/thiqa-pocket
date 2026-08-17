import { Navigate } from "react-router"

import { routePaths } from "@/app/routes/paths"
import { useAuthStore } from "@/features/auth/store"
import { RoutePending } from "@/shared/ui/route-pending"

export function RootRedirect() {
  const token = useAuthStore((state) => state.token)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  if (!hasHydrated) {
    return <RoutePending />
  }

  return (
    <Navigate to={token ? routePaths.dashboard : routePaths.login} replace />
  )
}
