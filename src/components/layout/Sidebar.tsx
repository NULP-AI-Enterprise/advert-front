'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import { useSessions, SessionSummary } from '@/hooks/useSessions'

// ── Date grouping ────────────────────────────────────────────────────────────

function groupSessions(sessions: SessionSummary[]) {
  const now = new Date()
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(todayStart.getDate() - 1)
  const weekStart      = new Date(todayStart); weekStart.setDate(todayStart.getDate() - 7)
  const monthStart     = new Date(todayStart); monthStart.setDate(todayStart.getDate() - 30)

  const groups: { label: string; items: SessionSummary[] }[] = []

  const bucket = (label: string, items: SessionSummary[]) => {
    if (items.length) groups.push({ label, items })
  }

  bucket('Today',             sessions.filter(s => new Date(s.updatedAt) >= todayStart))
  bucket('Yesterday',         sessions.filter(s => { const d = new Date(s.updatedAt); return d >= yesterdayStart && d < todayStart }))
  bucket('Previous 7 days',   sessions.filter(s => { const d = new Date(s.updatedAt); return d >= weekStart && d < yesterdayStart }))
  bucket('Previous 30 days',  sessions.filter(s => { const d = new Date(s.updatedAt); return d >= monthStart && d < weekStart }))
  bucket('Older',             sessions.filter(s => new Date(s.updatedAt) < monthStart))

  return groups
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const isConnected  = useChatStore(s => s.isConnected)
  const sessionId    = useChatStore(s => s.sessionId)
  const isTyping     = useChatStore(s => s.isTyping)
  const titleUpdate  = useChatStore(s => s.titleUpdate)
  const clearTitleUpdate = useChatStore(s => s.clearTitleUpdate)
  const setSessionId = useChatStore(s => s.setSessionId)
  const loadMessages = useChatStore(s => s.loadMessages)

  const token  = useAuthStore(s => s.token)
  const user   = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)

  const { sessions, reload, deleteSession, renameSession, patchTitle } = useSessions()

  // Apply WebSocket title update to local session list
  useEffect(() => {
    if (titleUpdate) {
      patchTitle(titleUpdate.id, titleUpdate.title)
      clearTitleUpdate()
    }
  }, [titleUpdate, patchTitle, clearTitleUpdate])

  // Reload list once after the first response arrives for a new session
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

  const groups = groupSessions(sessions)

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

        {groups.map(group => (
          <div key={group.label}>
            <p className="section-label" style={{ marginTop: 16 }}>{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(s => (
                <SessionRow
                  key={s.id}
                  session={s}
                  active={s.id === sessionId}
                  onOpen={() => openSession(s)}
                  onDelete={() => deleteSession(s.id)}
                  onRename={(title) => renameSession(s.id, title)}
                />
              ))}
            </div>
          </div>
        ))}
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

// ── SessionRow with inline rename ────────────────────────────────────────────

function SessionRow({
  session, active, onOpen, onDelete, onRename,
}: {
  session: SessionSummary
  active: boolean
  onOpen: () => void
  onDelete: () => void
  onRename: (title: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(session.title || '')
  const inputRef              = useRef<HTMLInputElement>(null)

  // Sync draft when session title updates from outside (e.g. WebSocket auto-title)
  useEffect(() => {
    if (!editing) setDraft(session.title || '')
  }, [session.title, editing])

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft(session.title || '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== session.title) onRename(trimmed)
    else setDraft(session.title || '')
    setEditing(false)
  }

  if (editing) {
    return (
      <div className={`session-row ${active ? 'active' : ''}`} style={{ padding: '4px 6px' }}>
        <input
          ref={inputRef}
          className="session-rename-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
            if (e.key === 'Escape') { setDraft(session.title || ''); setEditing(false) }
          }}
          autoFocus
          maxLength={80}
        />
      </div>
    )
  }

  return (
    <div
      className={`session-row ${active ? 'active' : ''}`}
      onClick={onOpen}
      title={session.title || 'New conversation'}
    >
      <span className="session-row-title">
        {session.title || 'New conversation'}
      </span>
      <div className="session-row-actions">
        <button
          className="session-action-btn"
          onClick={startEdit}
          title="Rename"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6z" stroke="currentColor" strokeWidth="1.1"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          className="session-action-btn session-delete"
          onClick={e => { e.stopPropagation(); onDelete() }}
          title="Delete"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 2l7 7M9 2L2 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
