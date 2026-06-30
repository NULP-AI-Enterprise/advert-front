'use client'

import { ChatMessage } from '@/types/chat'

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`msg-row ${isUser ? 'user' : ''} anim-in`}>
      <div className={`msg-avatar ${isUser ? 'user-av' : 'ai'}`}>
        {isUser
          ? 'U'
          : <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z"
                    stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
        }
      </div>

      <div className="msg-body">
        <div className={`msg-bubble ${isUser ? 'user-bubble' : ''} ${message.type === 'error' ? 'error-bubble' : ''}`}>
          {message.type === 'recommendations'
            ? <span style={{ color: 'var(--accent)', fontSize: 12 }}>Результати в правій панелі →</span>
            : message.content}
        </div>
        <div className="msg-time">
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
