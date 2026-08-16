/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react"

interface TransactionPresentation {
  readonly transactionId: string
  readonly focusTargetId: string
}

interface TransactionPresentationContextValue {
  readonly presentation: TransactionPresentation | null
  readonly beginContextualPresentation: (
    transactionId: string,
    focusTargetId: string
  ) => void
}

const defaultContextValue: TransactionPresentationContextValue = {
  presentation: null,
  beginContextualPresentation: () => undefined,
}

const TransactionPresentationContext =
  createContext<TransactionPresentationContextValue>(defaultContextValue)

export function TransactionPresentationProvider({
  children,
}: {
  readonly children: ReactNode
}) {
  const [presentation, setPresentation] =
    useState<TransactionPresentation | null>(null)
  const value = useMemo<TransactionPresentationContextValue>(
    () => ({
      presentation,
      beginContextualPresentation: (transactionId, focusTargetId) => {
        setPresentation({ transactionId, focusTargetId })
      },
    }),
    [presentation]
  )

  return (
    <TransactionPresentationContext.Provider value={value}>
      {children}
    </TransactionPresentationContext.Provider>
  )
}

export function useTransactionPresentation(): TransactionPresentationContextValue {
  return useContext(TransactionPresentationContext)
}

export function isPlainPrimaryNavigation(
  event: MouseEvent<HTMLAnchorElement>
): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  )
}
