import "i18next"

import assistant from "@/i18n/locales/en/assistant.json"
import auth from "@/i18n/locales/en/auth.json"
import common from "@/i18n/locales/en/common.json"
import transactions from "@/i18n/locales/en/transactions.json"
import transfer from "@/i18n/locales/en/transfer.json"
import wallet from "@/i18n/locales/en/wallet.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof common
      auth: typeof auth
      wallet: typeof wallet
      transactions: typeof transactions
      transfer: typeof transfer
      assistant: typeof assistant
    }
  }
}
