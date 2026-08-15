export const routePaths = {
  root: "/",
  login: "/login",
  dashboard: "/dashboard",
  transaction: "/transactions/:transactionId",
  transfer: "/transfer",
  topUp: "/top-up",
  assistant: "/assistant",
  notFound: "*",
} as const

export function getTransactionPath(transactionId: string): string {
  return `/transactions/${encodeURIComponent(transactionId)}`
}
