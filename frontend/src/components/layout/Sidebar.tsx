'use client'

import { useChatStore } from '@/store/chatStore'

export default function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const isConnected = useChatStore(s => s.isConnected)
  const messages    = useChatStore(s => s.messages)
  const preview     = messages.find(m => m.role === 'user')?.content?.slice(0, 38)

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
        <p className="section-label">RECENT</p>

        {preview
          ? <div className="card" style={{ cursor: 'pointer', padding: '10px 12px' }}>
              <p style={{ fontSize: 12, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview}…
              </p>
            </div>
          : <p style={{ fontSize: 12, color: 'var(--t3)', padding: '0 8px' }}>No chats yet</p>
        }
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <span className={`status-dot ${isConnected ? 'online' : ''}`}/>
        <span className="status-text">{isConnected ? 'Connected' : 'Connecting…'}</span>
      </div>
    </aside>
  )
}
