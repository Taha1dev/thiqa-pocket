import { SignOut, UserCircle } from "@phosphor-icons/react"
import { sileo } from "sileo"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import type { WalletUser } from "@/domain/wallet/wallet"
import { useAuthStore } from "@/infrastructure/auth/auth-store"
import { LanguageSwitcher } from "@/shared/ui/language-switcher"

interface AppAccountMenuProps {
  readonly user?: WalletUser
  readonly includeLanguage?: boolean
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function AppAccountMenu({
  user,
  includeLanguage = false,
}: AppAccountMenuProps) {
  const { t } = useTranslation("common")
  const logout = useAuthStore((state) => state.logout)
  const displayName = user?.name ?? t("account.defaultName")

  const handleLogout = () => {
    logout()
    sileo.info({
      title: t("notifications.loggedOut.title"),
      description: t("notifications.loggedOut.description"),
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={t("accessibility.accountMenu")}
            className="gap-2 ps-1.5 pe-2.5 text-foreground"
            size="sm"
            variant="ghost"
          />
        }
      >
        <span className="grid size-7 place-items-center rounded-lg bg-brand-petrol text-[0.68rem] font-semibold tracking-wide text-brand-petrol-foreground">
          {getInitials(displayName)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium xl:inline">
          {displayName.split(" ")[0]}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="gap-2 p-3" sideOffset={8}>
        <PopoverHeader className="px-1 py-1">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <UserCircle aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <PopoverTitle className="truncate">{displayName}</PopoverTitle>
              {user ? (
                <PopoverDescription>
                  <bdi className="financial-value" dir="ltr">
                    {user.phone}
                  </bdi>
                </PopoverDescription>
              ) : null}
            </div>
          </div>
        </PopoverHeader>
        {includeLanguage ? (
          <>
            <Separator />
            <LanguageSwitcher className="w-full justify-start" />
          </>
        ) : null}
        <Separator />
        <Button
          className="w-full justify-start"
          variant="destructive"
          onClick={handleLogout}
        >
          <SignOut aria-hidden="true" data-icon="inline-start" />
          {t("actions.logout")}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
