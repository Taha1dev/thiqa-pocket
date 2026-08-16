import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, RouterProvider } from "react-router"
import { beforeEach, describe, expect, it } from "vitest"

import { appRoutes } from "@/app/router/router"
import { ThemeProvider } from "@/components/theme-provider"
import "@/i18n/config"
import { demoCredentials } from "@/infrastructure/auth/mock-auth"
import { useAuthStore } from "@/infrastructure/auth/auth-store"

function renderRouter(router: ReturnType<typeof createMemoryRouter>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

describe("protected routes", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, hasHydrated: true })
  })

  it("redirects unauthenticated visitors to login", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/dashboard"],
    })

    renderRouter(router)

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"))
  })

  it("restores the intended route after login", async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/assistant"],
    })

    renderRouter(router)

    await user.type(
      await screen.findByLabelText("Email address"),
      demoCredentials.email
    )
    await user.type(screen.getByLabelText("Password"), demoCredentials.password)
    await user.click(screen.getByRole("button", { name: "Sign in securely" }))

    expect(
      await screen.findByRole("heading", { name: "Ask Thiqa AI" })
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/assistant")
  })
})
