'use client'

import { ChatMessage } from '@/types/chat'
import { useChat } from '@/hooks/useChat'

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const { sendMessage } = useChat()

  return (
    <div className={`msg-row ${isUser ? 'user' : ''} anim-in`}>
      <div className={`msg-avatar ${isUser ? 'user-av' : 'ai'}`}>
        {isUser
          ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1.5 10.5c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          : <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z"
                    stroke="white" strokeWidth="1.3" strokeLinejoin="round"/>
              <circle cx="6" cy="6" r="1.2" fill="white"/>
            </svg>
        }
      </div>

      <div className="msg-body">
        <div className={`msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'} ${message.type === 'error' ? 'error-bubble' : ''}`}>
          {message.type === 'recommendations' || message.type === 'plan'
            ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 2.5h3.5v3.5H2V2.5zM7.5 2.5H11v3.5H7.5V2.5zM2 8H5.5v3H2V8zM7.5 8H11v3H7.5V8z"
                        stroke="var(--accent)" strokeWidth="1.1" strokeLinejoin="round"/>
                </svg>
                {message.content}
              </span>
            )
            : message.content
          }
        </div>

        {/* Follow-up suggestion chips */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {message.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  background: 'var(--bg2)',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim, var(--bg3, #2a2a3a))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg2)')}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="msg-time">
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
