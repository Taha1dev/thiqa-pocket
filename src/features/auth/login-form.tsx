import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleNotch, LockKey, ShieldCheck } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createLoginSchema, type LoginFormValues } from "@/features/auth/schema"
import {
  authenticateMockCredentials,
  demoCredentials,
} from "@/features/auth/mock-auth"

interface LoginFormProps {
  readonly onAuthenticated: (token: string) => void
  readonly authenticate?: (
    credentials: LoginFormValues
  ) => Promise<string | null>
}

export function LoginForm({
  onAuthenticated,
  authenticate = authenticateMockCredentials,
}: LoginFormProps) {
  const { t } = useTranslation("auth")
  const schema = useMemo(() =>
    createLoginSchema({
      emailRequired: t("login.validation.emailRequired"),
      emailInvalid: t("login.validation.emailInvalid"),
      passwordRequired: t("login.validation.passwordRequired"),
      passwordMinimum: t("login.validation.passwordMinimum"),
    }),
    [t]
  )
  const {
    formState: { errors, isSubmitting },
    handleSubmit, register, resetField, setError, setFocus,
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(schema),
    shouldFocusError: true,
  })

  const onSubmit = handleSubmit(
    async (values) => {
      let token: string | null

      try {
        token = await authenticate(values)
      } catch {

        setError("root.request", {
          type: "server",
          message: t("login.errors.requestFailed"),
        })
        sileo.error({
          title: t("login.notifications.unavailable.title"),
          description: t("login.notifications.unavailable.description"),
        })
        return
      }

      if (!token) {
        setError("root.credentials", {
          type: "server",
          message: t("login.errors.incorrectCredentials"),
        })
        resetField("password")
        setFocus("email")
        sileo.error({
          title: t("login.notifications.failed.title"),
          description: t("login.notifications.failed.description"),
        })
        return
      }

      sileo.success({
        title: t("login.notifications.success.title"),
        description: t("login.notifications.success.description"),
      })
      onAuthenticated(token)
    })

  const submissionError =
    errors.root?.credentials?.message ?? errors.root?.request?.message

  return (
    <>
      <div className="mb-7 flex flex-col gap-2">
        <span className="mb-1 grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
          <LockKey aria-hidden="true" className="size-5" />
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.035em]">
          {t("login.title")}
        </h1>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          {t("login.description")}
        </p>
      </div>

      <form noValidate onSubmit={onSubmit}>
        <FieldGroup className="gap-5">
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="login-email">
              {t("login.fields.email")}
            </FieldLabel>
            <Input
              id="login-email"
              autoComplete="email"
              dir="ltr"
              inputMode="email"
              placeholder={t("login.fields.emailPlaceholder")}
              type="email"
              aria-describedby={errors.email ? "login-email-error" : undefined}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError id="login-email-error">
              {errors.email?.message}
            </FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="login-password">
              {t("login.fields.password")}
            </FieldLabel>
            <Input
              id="login-password"
              autoComplete="current-password"
              className="localized-placeholder-direction"
              dir="auto"
              placeholder={t("login.fields.passwordPlaceholder")}
              type="password"
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <FieldError id="login-password-error">
              {errors.password?.message}
            </FieldError>
          </Field>

          {submissionError ? (
            <FieldError id="login-submission-error">
              {submissionError}
            </FieldError>
          ) : null}

          <Button
            className="w-full"
            disabled={isSubmitting}
            size="lg"
            type="submit"
          >
            {isSubmitting ? (
              <CircleNotch
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <ShieldCheck aria-hidden="true" data-icon="inline-start" />
            )}
            {isSubmitting ? t("login.submitting") : t("login.action")}
          </Button>
        </FieldGroup>
      </form>

      <aside
        className="mt-6 rounded-2xl bg-muted/70 p-4"
        aria-label={t("login.demo.title")}
      >
        <p className="text-xs font-semibold text-foreground">
          {t("login.demo.title")}
        </p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("login.demo.description")}
        </p>
        <dl className="mt-3 grid gap-2 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("login.fields.email")}</dt>
            <dd>
              <bdi className="financial-value font-medium" dir="ltr">
                {demoCredentials.email}
              </bdi>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("login.fields.password")}
            </dt>
            <dd>
              <bdi className="financial-value font-medium" dir="ltr">
                {demoCredentials.password}
              </bdi>
            </dd>
          </div>
        </dl>
      </aside>
    </>
  )
}
