import { useTranslation } from "react-i18next"

import { PageShell } from "@/shared/ui/page-shell"
import { PageState } from "@/shared/ui/page-state"

export function Component() {
  const { t } = useTranslation("assistant")

  return (
    <PageShell title={t("page.title")} description={t("page.description")}>
      <PageState message={t("empty")} />
    </PageShell>
  )
}
