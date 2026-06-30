'use client'

import { useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from './useWebSocket'
import { ChatMessage } from '@/types/chat'

export function useChat() {
  const store = useChatStore()
  const token = useAuthStore(s => s.token)
  const { sendChatMessage } = useWebSocket()

  // Create session on mount and after newChat()
  useEffect(() => {
    if (store.sessionId) return

    const userId = `user_${crypto.randomUUID().slice(0, 8)}`
    let cancelled = false

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    fetch(`/api/chat/sessions?userId=${userId}`, { method: 'POST', headers })
      .then((r) => r.json())
      .then(({ sessionId }) => { if (!cancelled) store.setSessionId(sessionId) })
      .catch(console.error)

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.sessionId])

  const sendMessage = useCallback((content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    }
    store.addMessage(userMsg)
    store.setTyping(true)
    sendChatMessage(content)
  }, [store, sendChatMessage])

  return {
    messages: store.messages,
    isConnected: store.isConnected,
    isTyping: store.isTyping,
    sessionId: store.sessionId,
    recommendations: store.recommendations,
    sendMessage,
  }
}
