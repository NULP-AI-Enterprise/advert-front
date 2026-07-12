'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useSessions, SessionSummary } from '@/hooks/useSessions'

export default function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const isConnected  = useChatStore(s => s.isConnected)
  const sessionId    = useChatStore(s => s.sessionId)
  const isTyping     = useChatStore(s => s.isTyping)
  const setSessionId = useChatStore(s => s.setSessionId)
  const loadMessages = useChatStore(s => s.loadMessages)

  const token  = useAuthStore(s => s.token)
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const { sessions, reload, deleteSession } = useSessions()

  // Reload session list once after the first response arrives for a new session
  const pendingReloadRef = useRef(false)
  useEffect(() => {
    if (sessionId && !sessions.some(s => s.id === sessionId)) {
      pendingReloadRef.current = true
    }
  }, [sessionId, sessions])

  useEffect(() => {
    if (pendingReloadRef.current && !isTyping) {
      pendingReloadRef.current = false
      reload()
    }
  }, [isTyping, reload])

  const openSession = useCallback(async (s: SessionSummary) => {
    setSessionId(s.id)
    try {
      const res = await fetch(`/api/chat/sessions/${s.id}/messages`)
      if (!res.ok) return
      const raw = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msgs = raw.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.createdAt),
      }))
      loadMessages(msgs)
    } catch { /* silent */ }
  }, [setSessionId, loadMessages])

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5L12.5 4.5V9.5L7 12.5L1.5 9.5V4.5L7 1.5Z"
                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="7" cy="7" r="1.5" fill="white"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">MediaAI</span>
      </div>

      {/* Body */}
      <div className="sidebar-body">
        <button className="btn-new-chat" onClick={onNewChat}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          New chat
        </button>

        {sessions.length > 0 && (
          <>
            <p className="section-label" style={{ marginTop: 16 }}>Recent</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sessions.map(s => (
                <SessionRow
                  key={s.id}
                  session={s}
                  active={s.id === sessionId}
                  onOpen={() => openSession(s)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className={`status-dot ${isConnected ? 'online' : ''}`}/>
          <span className="status-text">{isConnected ? 'Connected' : 'Connecting…'}</span>
        </div>

        {token && user ? (
          <div className="user-chip" style={{ padding: '4px 6px' }}>
            <div className="user-avatar">
              {user.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="user-email">{user.email}</span>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', color: 'var(--t3)', fontSize: 11,
                borderRadius: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M8.5 4.5L11 7m0 0l-2.5 2.5M11 7H5M5 2H3.5A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5"
                      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <a href="/auth/login" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in →
          </a>
        )}
      </div>
    </aside>
  )
}

function SessionRow({
  session, active, onOpen, onDelete,
}: {
  session: SessionSummary
  active: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`session-row ${active ? 'active' : ''}`}
      onClick={onOpen}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: active ? 'var(--accent)' : 'var(--t4)' }}>
        <path d="M2 2h8a1 1 0 011 1v5a1 1 0 01-1 1H7L5 11V9H2a1 1 0 01-1-1V3a1 1 0 011-1z"
              stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      </svg>
      <span className="session-row-title">
        {session.title || 'New conversation'}
      </span>
      <button
        className="session-delete"
        onClick={e => { e.stopPropagation(); onDelete() }}
        title="Delete"
      >
        ×
      </button>
    </div>
  )
}
