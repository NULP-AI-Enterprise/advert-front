import { create } from 'zustand'
import { ChatMessage } from '@/types/chat'
import { RecommendationResponse } from '@/types/recommendation'

interface ChatStore {
  sessionId: string | null
  messages: ChatMessage[]
  isConnected: boolean
  isTyping: boolean
  recommendations: RecommendationResponse | null

  setSessionId: (id: string) => void
  setConnected: (v: boolean) => void
  setTyping: (v: boolean) => void
  addMessage: (msg: ChatMessage) => void
  appendStreamChunk: (chunk: string) => void
  finalizeStream: () => void
  setRecommendations: (r: RecommendationResponse) => void
  reset: () => void
  newChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  recommendations: null,

  setSessionId: (id) => set({ sessionId: id }),
  setConnected: (v) => set({ isConnected: v }),
  setTyping: (v) => set({ isTyping: v }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  // Streams into the last assistant message
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

  reset: () => set({
    sessionId: null,
    messages: [],
    isConnected: false,
    isTyping: false,
    recommendations: null,
  }),

  newChat: () => set((s) => ({
    sessionId: null,
    messages: [],
    isTyping: false,
    recommendations: null,
    // isConnected залишається — сокет фізично відкритий
    isConnected: s.isConnected,
  })),
}))
