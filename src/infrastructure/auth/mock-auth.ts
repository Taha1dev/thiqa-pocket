export const demoCredentials = {
  email: "sara@thiqa.sa",
  password: "Thiqa123!",
} as const

export const mockSessionToken = "thiqa-demo-session" as const

export interface MockLoginCredentials {
  readonly email: string
  readonly password: string
}

export function authenticateMockCredentials(
  credentials: MockLoginCredentials
): Promise<string | null> {
  const isValid =
    credentials.email.trim().toLowerCase() === demoCredentials.email &&
    credentials.password === demoCredentials.password

  return Promise.resolve(isValid ? mockSessionToken : null)
}
