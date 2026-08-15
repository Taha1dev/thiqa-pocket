export const APP_LANGUAGE_STORAGE_KEY = "thiqa.locale"
export const supportedLanguages = ["en", "ar"] as const

export type AppLanguage = (typeof supportedLanguages)[number]

export function isAppLanguage(value: string | null): value is AppLanguage {
  return (
    value !== null && supportedLanguages.some((language) => language === value)
  )
}

export const languageStorage = {
  get(): AppLanguage | null {
    if (typeof window === "undefined") {
      return null
    }

    const storedLanguage = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
    return isAppLanguage(storedLanguage) ? storedLanguage : null
  },
  set(language: AppLanguage): void {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language)
  },
}

export function getInitialAppLanguage(): AppLanguage {
  const storedLanguage = languageStorage.get()
  if (storedLanguage) {
    return storedLanguage
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("ar")
  ) {
    return "ar"
  }

  return "en"
}

export function syncDocumentLanguage(language: string): void {
  if (typeof document === "undefined") {
    return
  }

  const appLanguage: AppLanguage = language.toLowerCase().startsWith("ar")
    ? "ar"
    : "en"
  document.documentElement.lang = appLanguage
  document.documentElement.dir = appLanguage === "ar" ? "rtl" : "ltr"
}
