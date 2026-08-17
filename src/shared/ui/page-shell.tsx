import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PageShellProps {
  readonly title: string
  readonly description: string
  readonly children?: ReactNode
  readonly size?: "default" | "wide"
}

export function PageShell({
  title,
  description,
  children,
  size = "default",
}: PageShellProps) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full flex-col gap-6 sm:gap-8",
        size === "wide" ? "max-w-7xl" : "max-w-5xl"
      )}
    >
      <header className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </header>
      {children}
    </section>
  )
}
