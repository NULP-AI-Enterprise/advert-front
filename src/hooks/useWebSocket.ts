'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useChatStore, MarketingPlan } from '@/store/chatStore'
import { DeviceContext, WebSocketMessage } from '@/types/chat'
import { RecommendationResponse } from '@/types/recommendation'

function getWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080/api/ws/chat'
  const { protocol, hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080/api/ws/chat'
  }
  return `${protocol}//${hostname}/api/ws/chat`
}

export function useWebSocket() {
  const socketRef    = useRef<any>(null)
  const retryRef     = useRef<ReturnType<typeof setTimeout>>()
  const mountedRef   = useRef(true)

  const {
    sessionId, setConnected, setTyping,
    addMessage, appendStreamChunk, finalizeStream,
    setRecommendations, setMarketingPlan,
  } = useChatStore()

  const handleMessage = useCallback((raw: string) => {
    let msg: WebSocketMessage
    try { msg = JSON.parse(raw) } catch { return }

    switch (msg.type) {
      case 'CLARIFICATION_QUESTION':
      case 'ASSISTANT_MESSAGE':
        setTyping(false)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: msg.content ?? '',
          createdAt: new Date(),
        })
        break

      case 'ASSISTANT_STREAM_CHUNK':
        setTyping(true)
        appendStreamChunk(msg.content ?? '')
        break

      case 'ASSISTANT_STREAM_END':
        finalizeStream()
        break

      case 'RECOMMENDATIONS_READY': {
        setTyping(false)
        const recs = msg.payload as RecommendationResponse & {
          ctaMessage?: string
          suggestions?: string[]
        }
        setRecommendations(recs)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: recs.ctaMessage ?? msg.content ?? 'Placements ready — see the panel on the right',
          type: 'recommendations',
          payload: recs,
          suggestions: recs.suggestions ?? [],
          createdAt: new Date(),
        })
        break
      }

      case 'MARKETING_PLAN_READY':
        setTyping(false)
        setMarketingPlan(msg.payload as MarketingPlan)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Marketing plan ready — see the panel on the right.',
          type: 'plan',
          createdAt: new Date(),
        })
        break

      case 'ERROR':
        setTyping(false)
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${msg.error}`,
          type: 'error',
          createdAt: new Date(),
        })
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (socketRef.current?.readyState === 1) return
    if (typeof window === 'undefined') return

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SockJS = require('sockjs-client')
    const sock = new SockJS(getWsUrl())
    socketRef.current = sock

    sock.onopen = () => {
      if (!mountedRef.current) { sock.close(); return }
      setConnected(true)
    }
    sock.onmessage = (e: MessageEvent) => handleMessage(e.data)
    sock.onclose = () => {
      if (!mountedRef.current) return
      setConnected(false)
      retryRef.current = setTimeout(connect, 3000)
    }
    sock.onerror = () => sock.close()
  }, [handleMessage, setConnected])

  const send = useCallback((msg: WebSocketMessage) => {
    if (socketRef.current?.readyState === 1) {
      socketRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const sendChatMessage = useCallback((content: string, deviceContext?: DeviceContext | null) => {
    if (sessionId) {
      send({
        type: 'CHAT_MESSAGE',
        sessionId,
        content,
        payload: deviceContext ? { deviceContext } : undefined,
      })
    }
  }, [send, sessionId])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(retryRef.current)
      socketRef.current?.close()
      socketRef.current = null
    }
  // run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { sendChatMessage }
}
