import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const genAiMocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
}))

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return {
      models: {
        generateContent: genAiMocks.generateContent,
      },
    }
  }),
  ThinkingLevel: {
    LOW: "LOW",
  },
}))

import assistantHandler from "./assistant"

const previousApiKey = process.env.GEMINI_API_KEY

const validPayload = {
  question: "How much did I spend on transfers this month?",
  locale: "en",
  wallet: {
    balanceMinor: 428550,
    currency: "SAR",
  },
  transactions: [
    {
      type: "debit",
      category: "transfer",
      amountMinor: 25000,
      currency: "SAR",
      status: "completed",
      timestamp: "2026-08-12T14:32:00+03:00",
      counterpartyName: "Ahmed Al-Harbi",
    },
  ],
}

function createRequest(body: unknown = validPayload, method = "POST"): Request {
  return new Request("http://localhost/api/assistant", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "server-only-test-key"
  genAiMocks.generateContent.mockReset()
  genAiMocks.generateContent.mockResolvedValue({
    text: "You spent SAR 250.00 on completed transfers this month.",
  })
})

afterAll(() => {
  if (previousApiKey === undefined) {
    delete process.env.GEMINI_API_KEY
  } else {
    process.env.GEMINI_API_KEY = previousApiKey
  }
})

describe("POST /api/assistant", () => {
  it("rejects unsupported methods and malformed payloads", async () => {
    const methodResponse = await assistantHandler.fetch(
      createRequest(undefined, "GET")
    )
    expect(methodResponse.status).toBe(405)
    expect(methodResponse.headers.get("Allow")).toBe("POST")

    const invalidResponse = await assistantHandler.fetch(
      createRequest({ ...validPayload, phone: "+966500000000" })
    )
    expect(invalidResponse.status).toBe(400)
  })

  it("uses the stable Flash model with strict financial semantics", async () => {
    const response = await assistantHandler.fetch(createRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      answer: "You spent SAR 250.00 on completed transfers this month.",
    })
    expect(genAiMocks.generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash",
        config: expect.objectContaining({
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: "LOW" },
          systemInstruction: expect.stringMatching(
            /Never count failed transactions/
          ),
        }),
      })
    )
    expect(
      genAiMocks.generateContent.mock.calls[0]?.[0].config.systemInstruction
    ).toMatch(/Never count pending transactions/)
  })

  it("does not expose configuration or raw provider errors", async () => {
    delete process.env.GEMINI_API_KEY
    const configurationResponse = await assistantHandler.fetch(createRequest())
    expect(configurationResponse.status).toBe(500)
    expect(await configurationResponse.text()).not.toContain(
      "server-only-test-key"
    )

    process.env.GEMINI_API_KEY = "server-only-test-key"
    genAiMocks.generateContent.mockRejectedValue(
      new Error("raw upstream provider details")
    )
    const providerResponse = await assistantHandler.fetch(createRequest())
    expect(providerResponse.status).toBe(502)
    expect(await providerResponse.text()).not.toContain(
      "raw upstream provider details"
    )
  })
})
