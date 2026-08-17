import { z } from "zod"

export interface LoginValidationMessages {
  readonly emailRequired: string
  readonly emailInvalid: string
  readonly passwordRequired: string
  readonly passwordMinimum: string
}

export function createLoginSchema(messages: LoginValidationMessages) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: messages.emailRequired })
      .email({ message: messages.emailInvalid }),
    password: z
      .string()
      .min(1, { message: messages.passwordRequired })
      .min(8, { message: messages.passwordMinimum }),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
