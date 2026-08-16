import { useState, type KeyboardEvent } from "react"
import { CaretDown, Check } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { setAppLanguage } from "@/i18n/config"
import type { AppLanguage } from "@/i18n/language"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  readonly className?: string
}

const locales = [
  { language: "ar", labelKey: "languages.arabic" },
  { language: "en", labelKey: "languages.english" },
] as const

function LocaleFlag({ language }: { readonly language: AppLanguage }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm shadow-[0_0_0_1px_rgb(0_0_0/8%)]"
    >
      {language === "ar" ? (
        <svg className="size-full" viewBox="0 0 30 20">
          <rect fill="#006c35" height="20" width="30" />
          <path
            d="M8 7h14M10 10h10"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.35"
          />
          <path
            d="M8 14h14l-2 1"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      ) : (
        <svg className="size-full" viewBox="0 0 30 20">
          <rect fill="white" height="20" width="30" />
          {[0, 4, 8, 12, 16].map((y) => (
            <rect fill="#b22234" height="2" key={y} width="30" y={y} />
          ))}
          <rect fill="#3c3b6e" height="10" width="13" />
          {[3, 7, 11].flatMap((x) =>
            [2.5, 5, 7.5].map((y) => (
              <circle cx={x} cy={y} fill="white" key={`${x}-${y}`} r="0.65" />
            ))
          )}
        </svg>
      )}
    </span>
  )
}

function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    return
  }

  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitemradio"]')
  )
  if (items.length === 0) {
    return
  }

  event.preventDefault()
  const currentIndex = items.indexOf(document.activeElement as HTMLElement)
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : event.key === "ArrowDown"
          ? (currentIndex + 1 + items.length) % items.length
          : (currentIndex - 1 + items.length) % items.length

  items[nextIndex]?.focus()
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation("common")
  const [open, setOpen] = useState(false)
  const activeLanguage: AppLanguage =
    i18n.resolvedLanguage === "ar" ? "ar" : "en"
  const activeLocale = locales.find(
    (locale) => locale.language === activeLanguage
  )!

  const selectLanguage = async (language: AppLanguage) => {
    await setAppLanguage(language)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            aria-label={t("accessibility.languageSwitcher")}
            className={cn("max-w-full gap-2 px-2.5 text-foreground", className)}
            size="sm"
            variant="ghost"
          />
        }
      >
        <LocaleFlag language={activeLocale.language} />
        <span className="truncate text-xs font-medium sm:text-sm">
          {t(activeLocale.labelKey)}
        </span>
        <CaretDown
          aria-hidden="true"
          className="size-3 text-muted-foreground"
        />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-48 gap-1 rounded-2xl p-2"
        sideOffset={8}
      >
        <PopoverTitle className="sr-only">
          {t("accessibility.languageMenu")}
        </PopoverTitle>
        <div
          aria-label={t("accessibility.languageMenu")}
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          {locales.map((locale) => {
            const isActive = locale.language === activeLanguage

            return (
              <Button
                aria-checked={isActive}
                className={cn(
                  "mb-0.5 w-full justify-start gap-2.5 px-2.5 last:mb-0",
                  isActive && "bg-muted font-semibold"
                )}
                key={locale.language}
                role="menuitemradio"
                type="button"
                variant="ghost"
                onClick={() => void selectLanguage(locale.language)}
              >
                <LocaleFlag language={locale.language} />
                <span className="flex-1 text-start">{t(locale.labelKey)}</span>
                {isActive ? (
                  <Check aria-hidden="true" className="size-4 text-primary" />
                ) : null}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
