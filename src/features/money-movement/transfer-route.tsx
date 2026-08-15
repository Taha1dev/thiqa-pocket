import { useTranslation } from "react-i18next"

import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

export function Component() {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <PageShell
      title={t("transfer.title")}
      description={t("transfer.description")}
    >
      <PageState message={t("common:states.empty")} />
    </PageShell>
  )
}
