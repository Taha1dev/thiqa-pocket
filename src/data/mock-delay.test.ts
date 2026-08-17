import { afterEach, describe, expect, it, vi } from "vitest"

import { createMoney } from "@/domain/money"
import {
  authenticateMockCredentials,
  demoCredentials,
  mockSessionToken,
} from "@/features/auth/mock-auth"
import {
  MOCK_REQUEST_DELAYS,
  waitForMockRequest,
  type MockRequestDelay,
} from "@/data/mock-delay"
import { MockMoneyMovementRepository } from "@/data/money-movement-repository"

describe("mock request delay", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("injects the configured auth delay without making the test wait", async () => {
    const requestDelay = vi.fn<MockRequestDelay>().mockResolvedValue(undefined)

    const token = await authenticateMockCredentials(demoCredentials, {
      requestDelay,
    })

    expect(token).toBe(mockSessionToken)
    expect(requestDelay).toHaveBeenCalledWith(MOCK_REQUEST_DELAYS.auth)
  })

  it("injects the configured financial mutation delay", async () => {
    const requestDelay = vi.fn<MockRequestDelay>().mockResolvedValue(undefined)
    const repository = new MockMoneyMovementRepository({
      createId: () => "txn_injected_delay",
      requestDelay,
    })

    await repository.topUp({
      amount: createMoney(100, "SAR"),
      currentBalance: createMoney(4_285.5, "SAR"),
      source: "bank_transfer",
    })

    expect(requestDelay).toHaveBeenCalledWith(
      MOCK_REQUEST_DELAYS.financialMutation,
      undefined
    )
  })

  it("cancels an in-flight delay through its AbortSignal", async () => {
    vi.useFakeTimers()
    const abortController = new AbortController()
    const pendingDelay = waitForMockRequest(1_200, abortController.signal)

    abortController.abort()

    await expect(pendingDelay).rejects.toMatchObject({ name: "AbortError" })
  })
})
