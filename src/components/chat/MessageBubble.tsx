'use client'

import ReactMarkdown from 'react-markdown'
import { ChatMessage } from '@/types/chat'
import { useChat } from '@/hooks/useChat'

// Inline markdown renderer — renders **bold**, *italic*, `code` without block-level wrappers.
// Used inside bubble spans so we don't break flex/inline layout with stray <p> tags.
function InlineMd({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        // Suppress wrapping <p> — keeps content inline inside a span/div
        p: ({ children }) => <>{children}</>,
        // Bold
        strong: ({ children }) => (
          <strong style={{ fontWeight: 700, color: 'var(--t1)' }}>{children}</strong>
        ),
        // Italic
        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
        // Inline code
        code: ({ children }) => (
          <code style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.9em',
            background: 'var(--bg-3)', padding: '1px 4px', borderRadius: 3,
          }}>{children}</code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

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
              <div>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13 }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <path d="M2 2.5h3.5v3.5H2V2.5zM7.5 2.5H11v3.5H7.5V2.5zM2 8H5.5v3H2V8zM7.5 8H11v3H7.5V8z"
                          stroke="var(--accent)" strokeWidth="1.1" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ lineHeight: 1.6 }}>
                    <InlineMd>{message.content}</InlineMd>
                  </span>
                </span>
                {/* Strategy reasoning shown inline in chat so user doesn't miss it */}
                {message.reasoning && (
                  <div style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid var(--bd)',
                    fontSize: 12,
                    color: 'var(--t2)',
                    lineHeight: 1.65,
                  }}>
                    <span style={{
                      display: 'block',
                      fontSize: 9, fontWeight: 700, color: 'var(--accent)',
                      textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
                    }}>
                      Strategy
                    </span>
                    {message.reasoning}
                  </div>
                )}
              </div>
            )
            : <InlineMd>{message.content ?? ''}</InlineMd>
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
                  border: '1px solid var(--bd)',
                  background: 'var(--bg-2)',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-2)')}
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
