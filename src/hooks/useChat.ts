'use client'

import { useCallback, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useWebSocket } from './useWebSocket'
import { ChatMessage } from '@/types/chat'

export function useChat() {
  const store = useChatStore()
  const token = useAuthStore(s => s.token)
  const { sendChatMessage, send } = useWebSocket()

  // Capture device context on mount (no session created yet)
  useEffect(() => {
    const language = navigator.language || navigator.languages?.[0] || 'en'
    store.setDeviceContext({ language })

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      let cancelled = false
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
        () => { /* permission denied — ignore */ },
        { timeout: 5000, maximumAge: 600000 },
      )
      return () => { cancelled = true }
    }
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    }
    store.addMessage(userMsg)
    store.setTyping(true)

    // Lazily create session on first message
    let sid = store.sessionId
    if (!sid) {
      try {
        const userId = `user_${crypto.randomUUID().slice(0, 8)}`
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const r = await fetch(`/api/chat/sessions?userId=${userId}`, { method: 'POST', headers })
        const data = await r.json()
        sid = data.sessionId as string
        store.setSessionId(sid)
      } catch (err) {
        console.error('Failed to create session', err)
        store.setTyping(false)
        return
      }
    }

    // Send directly so we use the concrete sessionId (not the store closure)
    send({
      type: 'CHAT_MESSAGE',
      sessionId: sid,
      content,
      payload: store.deviceContext ? { deviceContext: store.deviceContext } : undefined,
    })
  }, [store, token, send])

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
