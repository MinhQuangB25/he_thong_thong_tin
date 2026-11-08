import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { AssistantConversationTurn, AssistantFact, AssistantResult } from '../api/types'

export type AssistantProposal = Extract<AssistantResult, { kind: 'PROPOSAL' }>['proposal']
export type ProposalStatus = 'pending' | 'confirmed' | 'dismissed'
export type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; kind: 'answer'; text: string; facts: AssistantFact[]; sources: string[] }
  | { id: number; role: 'assistant'; kind: 'proposal'; proposal: AssistantProposal; status: ProposalStatus }
  | { id: number; role: 'assistant'; kind: 'notice'; text: string }

type Conversation = {
  /** Bounded summary sent to the backend as context (max 4 turns, 600 chars each). */
  history: AssistantConversationTurn[]
  /** Full chat thread shown in the UI for this login session only. */
  messages: ChatMessage[]
  append: (question: string, result: AssistantResult) => void
  finishProposal: (message: string) => void
  record: (question: string, result: AssistantResult) => void
  resolveProposal: (id: number, status: Exclude<ProposalStatus, 'pending'>, historyNote: string, notice?: string) => void
  clear: () => void
}
const ConversationContext = createContext<Conversation | undefined>(undefined)
const MAX_MESSAGES = 60

export function AssistantConversationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<AssistantConversationTurn[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const nextId = useRef(1)

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
  function push(...added: ChatMessage[]) {
    setMessages(previous => [...previous, ...added].slice(-MAX_MESSAGES))
  }
  function record(question: string, result: AssistantResult) {
    append(question, result)
    const reply: ChatMessage = result.kind === 'ANSWER'
      ? { id: nextId.current + 1, role: 'assistant', kind: 'answer', text: result.answer, facts: result.facts, sources: result.sources }
      : { id: nextId.current + 1, role: 'assistant', kind: 'proposal', proposal: result.proposal, status: 'pending' }
    push({ id: nextId.current, role: 'user', text: question }, reply)
    nextId.current += 2
  }
  function resolveProposal(id: number, status: Exclude<ProposalStatus, 'pending'>, historyNote: string, notice?: string) {
    finishProposal(historyNote)
    setMessages(previous => previous.map(message => message.id === id && message.role === 'assistant' && message.kind === 'proposal'
      ? { ...message, status } : message))
    if (notice) { push({ id: nextId.current, role: 'assistant', kind: 'notice', text: notice }); nextId.current += 1 }
  }
  function clear() { setHistory([]); setMessages([]) }

  return <ConversationContext.Provider value={{ history, messages, append, finishProposal, record, resolveProposal, clear }}>
    {children}
  </ConversationContext.Provider>
}

export function useAssistantConversation() {
  const conversation = useContext(ConversationContext)
  if (!conversation) throw new Error('AssistantConversationProvider is missing')
  return conversation
}

/** For shell components that may render outside the provider (tests, login screen). */
export function useOptionalAssistantConversation() {
  return useContext(ConversationContext)
}
