'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import ChatInput from './ChatInput'

export default function ChatContainer() {
  const { messages, isConnected, isTyping, sendMessage } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <main className="chat-main">
      <div className="chat-header">
        <h2>Campaign Assistant</h2>
        <p>
          {messages.length === 0
            ? 'Describe your campaign to get started'
            : `${messages.length} message${messages.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="chat-messages">
        {messages.length === 0
          ? <EmptyState />
          : messages.map(m => <MessageBubble key={m.id} message={m} />)
        }
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-wrap">
        <ChatInput onSend={sendMessage} isConnected={isConnected} disabled={isTyping} />
      </div>
    </main>
  )
}

function EmptyState() {
  const prompts = [
    'FMCG brand targeting Gen Z on social',
    'B2B SaaS awareness — LinkedIn focus',
    'Fashion retail: Instagram + TikTok',
    'Local business seasonal promotion',
  ]

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2L20 6.5V15.5L11 20L2 15.5V6.5L11 2Z"
                stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="11" cy="11" r="3" fill="var(--accent)" opacity="0.8"/>
        </svg>
      </div>

      <div>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Media Intelligence
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', maxWidth: 300, lineHeight: 1.65 }}>
          Describe your campaign — target audience, goals, budget — and I'll surface
          the best media placements for you.
        </p>
      </div>

      <div>
        <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Try an example
        </p>
        <div className="empty-prompts">
          {prompts.map(p => (
            <div key={p} className="prompt-chip">{p}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
