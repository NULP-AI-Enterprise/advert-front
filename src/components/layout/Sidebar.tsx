'use client'

import { useState, useCallback } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useSessions, SessionSummary } from '@/hooks/useSessions'

export default function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const isConnected = useChatStore(s => s.isConnected)
  const sessionId   = useChatStore(s => s.sessionId)
  const setSessionId = useChatStore(s => s.setSessionId)
  const loadMessages = useChatStore(s => s.loadMessages)

  const token  = useAuthStore(s => s.token)
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const { sessions, deleteSession } = useSessions()

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
                  stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
            <circle cx="7" cy="7" r="1.5" fill="white"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">MediaAI</span>
      </div>

      {/* Body */}
      <div className="sidebar-body">
        <button className="btn btn-w" onClick={onNewChat}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          New chat
        </button>

        <div className="divider" style={{ marginTop: 12 }}/>
        <p className="section-label">CHATS</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sessions.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--t3)', padding: '0 8px' }}>No chats yet</p>
          )}
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
      </div>

      {/* Footer — auth */}
      <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
          <span className={`status-dot ${isConnected ? 'online' : ''}`}/>
          <span className="status-text">{isConnected ? 'Connected' : 'Connecting…'}</span>
        </div>

        {token && user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: 11, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {user.email}
            </span>
            <button
              onClick={logout}
              style={{ fontSize: 10, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
            >
              вийти
            </button>
          </div>
        ) : (
          <a href="/auth/login" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
            Увійти →
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
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'var(--bg-2)' : hovered ? 'var(--bg-2)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <span style={{
        fontSize: 12, color: active ? 'var(--t1)' : 'var(--t2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
      }}>
        {session.title || 'New Chat'}
      </span>
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 2px', color: 'var(--t3)', fontSize: 14, flexShrink: 0,
          }}
          title="Delete"
        >
          ×
        </button>
      )}
    </div>
  )
}
