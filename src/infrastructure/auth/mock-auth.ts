import {
  MOCK_REQUEST_DELAYS,
  waitForMockRequest,
  type MockRequestDelay,
} from "@/infrastructure/mock-network/mock-request-delay"

export const demoCredentials = {
  email: "sara@thiqa.sa",
  password: "Thiqa123!",
} as const

export const mockSessionToken = "thiqa-demo-session" as const

export interface MockLoginCredentials {
  readonly email: string
  readonly password: string
}

interface MockAuthenticationOptions {
  readonly delayMs?: number
  readonly requestDelay?: MockRequestDelay
}

export async function authenticateMockCredentials(
  credentials: MockLoginCredentials,
  {
    delayMs = MOCK_REQUEST_DELAYS.auth,
    requestDelay = waitForMockRequest,
  }: MockAuthenticationOptions = {}
): Promise<string | null> {
  await requestDelay(delayMs)

  const isValid =
    credentials.email.trim().toLowerCase() === demoCredentials.email &&
    credentials.password === demoCredentials.password

  return isValid ? mockSessionToken : null
}
