import { useTranslation } from "react-i18next"

import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

export function Component() {
  const { t } = useTranslation(["transfer", "common"])

  return (
    <PageShell title={t("topUp.title")} description={t("topUp.description")}>
      <PageState message={t("common:states.empty")} />
    </PageShell>
  )
}
