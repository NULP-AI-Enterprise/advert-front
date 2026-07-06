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

  // Create session on mount; also capture geolocation + language
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

    // Capture device language immediately
    const language = navigator.language || navigator.languages?.[0] || 'uk'
    store.setDeviceContext({ language })

    // Request geolocation (non-blocking)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            store.setDeviceContext({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              language,
            })
          }
        },
        () => { /* permission denied or unavailable — silently ignore */ },
        { timeout: 5000, maximumAge: 600000 }
      )
    }

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
    sendChatMessage(content, store.deviceContext)
  }, [store, sendChatMessage])

  return {
    messages: store.messages,
    isConnected: store.isConnected,
    isTyping: store.isTyping,
    sessionId: store.sessionId,
    recommendations: store.recommendations,
    marketingPlan: store.marketingPlan,
    sendMessage,
  }
}
