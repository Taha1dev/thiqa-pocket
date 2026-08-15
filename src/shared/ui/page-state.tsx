import type { ReactNode } from "react"

interface PageStateProps {
  readonly message: string
  readonly action?: ReactNode
  readonly role?: "alert" | "status"
}

export function PageState({ message, action, role }: PageStateProps) {
  return (
    <div
      className="flex min-h-40 flex-col items-start justify-center gap-4 rounded-xl border bg-card p-6"
      role={role}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
