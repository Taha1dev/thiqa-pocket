import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  readonly token: string | null
  readonly hasHydrated: boolean
  readonly login: (token: string) => void
  readonly logout: () => void
  readonly markHydrated: () => void
}

type PersistedAuthState = Pick<AuthState, "token">

export const useAuthStore = create<AuthState>()(persist<AuthState, [], [], PersistedAuthState>((set) => ({
      token: null,
      hasHydrated: false,
      login: (token) => set({ token }),
      logout: () => set({ token: null }),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "thiqa.auth",
      partialize: ({ token }) => ({ token }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    }
  )
)
