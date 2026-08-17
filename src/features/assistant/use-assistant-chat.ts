import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"

import type { AssistantProvider } from "@/data/assistant-client"
import type { Transaction } from "@/domain/transaction"
import type { WalletUser } from "@/domain/wallet"

export interface AssistantMessage {
  readonly id: string
  readonly role: "user" | "assistant"
  readonly content: string
}

interface UseAssistantChatOptions {
  readonly provider: AssistantProvider
  readonly locale: string
  readonly wallet: WalletUser
  readonly transactions: readonly Transaction[]
}

interface AssistantMutationVariables {
  readonly question: string
  readonly requestId: number
  readonly controller: AbortController
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

function shouldReduceMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

export function useAssistantChat({
  provider,
  locale,
  wallet,
  transactions,
}: UseAssistantChatOptions) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<readonly AssistantMessage[]>([])
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null)
  const messageIdRef = useRef(0)
  const requestIdRef = useRef(0)
  const activeRequestIdRef = useRef<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const bottomAnchorRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: async ({
      question,
      requestId,
      controller,
    }: AssistantMutationVariables) => {
      const response = await provider.ask(
        { question, locale, wallet, transactions },
        controller.signal
      )

      return { response, requestId }
    },
    onSuccess: ({ response, requestId }) => {
      if (activeRequestIdRef.current !== requestId) {
        return
      }

      messageIdRef.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `assistant-message-${messageIdRef.current}`,
          role: "assistant",
          content: response.answer,
        },
      ])
    },
    onError: (error, variables) => {
      if (
        activeRequestIdRef.current === variables.requestId &&
        !isAbortError(error)
      ) {
        setFailedQuestion(variables.question)
      }
    },
    onSettled: (_data, _error, variables) => {
      if (activeRequestIdRef.current === variables.requestId) {
        activeRequestIdRef.current = null
        controllerRef.current = null
      }
    },
  })

  useEffect(() => {
    return () => {
      activeRequestIdRef.current = null
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      messages.length === 0 &&
      !mutation.isPending &&
      failedQuestion === null
    ) {
      return
    }

    bottomAnchorRef.current?.scrollIntoView({
      behavior: shouldReduceMotion() ? "auto" : "smooth",
      block: "nearest",
    })
  }, [failedQuestion, messages.length, mutation.isPending])

  const runRequest = (question: string) => {
    if (activeRequestIdRef.current !== null) {
      return
    }

    requestIdRef.current += 1
    const requestId = requestIdRef.current
    const controller = new AbortController()
    activeRequestIdRef.current = requestId
    controllerRef.current = controller
    setFailedQuestion(null)
    mutation.mutate({ question, requestId, controller })
  }

  const submitQuestion = (rawQuestion: string) => {
    const question = rawQuestion.trim()

    if (!question || activeRequestIdRef.current !== null) {
      return
    }

    messageIdRef.current += 1
    setMessages((current) => [
      ...current,
      {
        id: `user-message-${messageIdRef.current}`,
        role: "user",
        content: question,
      },
    ])
    setInput("")
    runRequest(question)
  }

  return {
    bottomAnchorRef,
    failedQuestion,
    input,
    isPending: mutation.isPending,
    messages,
    retryQuestion: runRequest,
    setInput,
    submitQuestion,
  }
}
