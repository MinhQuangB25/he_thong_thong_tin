import { createContext, useContext, useState, type ReactNode } from 'react'
import type { AssistantConversationTurn, AssistantResult } from '../api/types'

type Conversation = {
  history: AssistantConversationTurn[]
  append: (question: string, result: AssistantResult) => void
  finishProposal: (message: string) => void
  clear: () => void
}
const ConversationContext = createContext<Conversation | undefined>(undefined)

export function AssistantConversationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<AssistantConversationTurn[]>([])
  function append(question: string, result: AssistantResult) {
    const answer = result.kind === 'ANSWER'
      ? [result.answer, ...result.facts.map(fact => `${fact.label}: ${fact.value}`)].join('\n')
      : `Bản nháp chưa lưu, cần xác nhận: ${result.proposal.summary}`
    setHistory(previous => [...previous, { question, answer: answer.slice(0, 600) }].slice(-4))
  }
  function finishProposal(message: string) {
    setHistory(previous => previous.map((turn, index) => index === previous.length - 1
      ? { ...turn, answer: message.slice(0, 600) } : turn))
  }
  return <ConversationContext.Provider value={{ history, append, finishProposal, clear: () => setHistory([]) }}>
    {children}
  </ConversationContext.Provider>
}

export function useAssistantConversation() {
  const conversation = useContext(ConversationContext)
  if (!conversation) throw new Error('AssistantConversationProvider is missing')
  return conversation
}
