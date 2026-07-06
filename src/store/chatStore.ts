import { create } from 'zustand'
import { ChatMessage, DeviceContext } from '@/types/chat'
import { RecommendationResponse } from '@/types/recommendation'

export interface MarketingPlan {
  objective: string
  placements: Array<{ media_title: string; suggested_format: string; budget_share_pct: number }>
  total_budget_note: string
  notes: string
}

interface ChatStore {
  sessionId: string | null
  messages: ChatMessage[]
  isConnected: boolean
  isTyping: boolean
  recommendations: RecommendationResponse | null
  marketingPlan: MarketingPlan | null
  deviceContext: DeviceContext | null

  setSessionId: (id: string) => void
  setConnected: (v: boolean) => void
  setTyping: (v: boolean) => void
  addMessage: (msg: ChatMessage) => void
  appendStreamChunk: (chunk: string) => void
  finalizeStream: () => void
  setRecommendations: (r: RecommendationResponse) => void
  setMarketingPlan: (plan: MarketingPlan) => void
  setDeviceContext: (ctx: DeviceContext) => void
  loadMessages: (msgs: ChatMessage[]) => void
  reset: () => void
  newChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  recommendations: null,
  marketingPlan: null,
  deviceContext: null,

  setSessionId: (id) => set({ sessionId: id }),
  setConnected: (v) => set({ isConnected: v }),
  setTyping: (v) => set({ isTyping: v }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  appendStreamChunk: (chunk) =>
    set((s) => {
      const messages = [...s.messages]
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + chunk }
      } else {
        messages.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: chunk,
          createdAt: new Date(),
        })
      }
      return { messages }
    }),

  finalizeStream: () => set({ isTyping: false }),
  setRecommendations: (r) => set({ recommendations: r }),
  setMarketingPlan: (plan) => set({ marketingPlan: plan }),
  setDeviceContext: (ctx) => set({ deviceContext: ctx }),

  loadMessages: (msgs) => set({ messages: msgs, recommendations: null, marketingPlan: null, isTyping: false }),

  reset: () => set({
    sessionId: null,
    messages: [],
    isConnected: false,
    isTyping: false,
    recommendations: null,
    marketingPlan: null,
  }),

  newChat: () => set((s) => ({
    sessionId: null,
    messages: [],
    isTyping: false,
    recommendations: null,
    marketingPlan: null,
    isConnected: s.isConnected,
  })),
}))
