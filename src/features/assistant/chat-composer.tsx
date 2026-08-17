import type { FormEvent, KeyboardEvent } from "react"
import { PaperPlaneTilt } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface ChatComposerProps {
  readonly disabled: boolean
  readonly input: string
  readonly onInputChange: (value: string) => void
  readonly onSubmit: (question: string) => void
}

export function ChatComposer({
  disabled,
  input,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  const { t } = useTranslation("assistant")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(input)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      onSubmit(input)
    }
  }

  return (
    <form
      className="border-t border-border/70 bg-card p-3 sm:p-4"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="assistant-question">
        {t("composer.label")}
      </label>
      <div className="flex items-end gap-2 rounded-2xl border border-input bg-field p-1.5 transition-[border-color,box-shadow,background-color] focus-within:border-ring focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/20">
        <textarea
          aria-describedby="assistant-composer-hint"
          className="localized-placeholder-direction max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-6 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          dir="auto"
          disabled={disabled}
          id="assistant-question"
          maxLength={500}
          placeholder={t("composer.placeholder")}
          rows={1}
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          aria-label={t("composer.send")}
          className="mb-0.5"
          data-testid="assistant-send"
          disabled={disabled || input.trim().length === 0}
          size="icon"
          type="submit"
        >
          <PaperPlaneTilt aria-hidden="true" weight="fill" />
        </Button>
      </div>
      <p
        className="mt-2 px-1 text-xs leading-5 text-muted-foreground"
        id="assistant-composer-hint"
      >
        {t("composer.hint")}
      </p>
    </form>
  )
}
