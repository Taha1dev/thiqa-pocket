import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import arAssistant from "@/i18n/locales/ar/assistant.json"
import arAuth from "@/i18n/locales/ar/auth.json"
import arCommon from "@/i18n/locales/ar/common.json"
import arTransactions from "@/i18n/locales/ar/transactions.json"
import arTransfer from "@/i18n/locales/ar/transfer.json"
import arWallet from "@/i18n/locales/ar/wallet.json"
import enAssistant from "@/i18n/locales/en/assistant.json"
import enAuth from "@/i18n/locales/en/auth.json"
import enCommon from "@/i18n/locales/en/common.json"
import enTransactions from "@/i18n/locales/en/transactions.json"
import enTransfer from "@/i18n/locales/en/transfer.json"
import enWallet from "@/i18n/locales/en/wallet.json"
import {
  getInitialAppLanguage,
  languageStorage,
  supportedLanguages,
  syncDocumentLanguage,
  type AppLanguage,
} from "@/i18n/language"

const initialLanguage = getInitialAppLanguage()

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      wallet: enWallet,
      transactions: enTransactions,
      transfer: enTransfer,
      assistant: enAssistant,
    },
    ar: {
      common: arCommon,
      auth: arAuth,
      wallet: arWallet,
      transactions: arTransactions,
      transfer: arTransfer,
      assistant: arAssistant,
    },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  defaultNS: "common",
  ns: ["common", "auth", "wallet", "transactions", "transfer", "assistant"],
  initAsync: false,
  interpolation: {
    escapeValue: false,
  },
})

syncDocumentLanguage(initialLanguage)
i18n.on("languageChanged", syncDocumentLanguage)

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language)
  languageStorage.set(language)
}

export default i18n
