'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

export interface SessionSummary {
  id: string
  title: string
  userId: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export function useSessions() {
  const token = useAuthStore(s => s.token)
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/chat/sessions', { headers })
      if (res.ok) {
        const all: SessionSummary[] = await res.json()
        setSessions(all.filter(s => s.messageCount > 0))
      }
    } catch {
      // silent — session list is non-critical
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.id !== id))
  }, [])

  const renameSession = useCallback(async (id: string, title: string) => {
    await fetch(`/api/chat/sessions/${id}/title`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }, [])

  // Local-only update — no network call, used when title arrives via WebSocket
  const patchTitle = useCallback((id: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }, [])

  return { sessions, loading, reload: load, deleteSession, renameSession, patchTitle }
}
