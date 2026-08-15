import { afterEach, describe, expect, it } from "vitest"

import i18n, { setAppLanguage } from "@/i18n/config"
import { APP_LANGUAGE_STORAGE_KEY } from "@/i18n/language"

describe("application language", () => {
  afterEach(async () => {
    window.localStorage.removeItem(APP_LANGUAGE_STORAGE_KEY)
    await setAppLanguage("en")
  })

  it("synchronizes the root language and direction on initialization", () => {
    expect(document.documentElement.lang).toBe("en")
    expect(document.documentElement.dir).toBe("ltr")
  })

  it("updates and persists Arabic immediately", async () => {
    await setAppLanguage("ar")

    expect(i18n.resolvedLanguage).toBe("ar")
    expect(document.documentElement.lang).toBe("ar")
    expect(document.documentElement.dir).toBe("rtl")
    expect(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe("ar")
  })
})
