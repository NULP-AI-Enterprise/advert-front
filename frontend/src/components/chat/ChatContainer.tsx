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
        <h2>Chat</h2>
        <p>{messages.length === 0 ? 'Start by describing your campaign' : `${messages.length} messages`}</p>
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
    'FMCG brand, Gen Z, social media',
    'B2B SaaS awareness campaign',
    'Fashion retail, Instagram + TikTok',
    'Local business, seasonal promo',
  ]
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z"
                stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="10" cy="10" r="2.5" fill="var(--accent)"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>
          Media Intelligence
        </p>
        <p style={{ fontSize: 13, color: 'var(--t2)', maxWidth: 300 }}>
          Describe your campaign and I'll find the best media placements and build a content strategy.
        </p>
      </div>
      <div className="empty-prompts">
        {prompts.map(p => <div key={p} className="prompt-chip">{p}</div>)}
      </div>
    </div>
  )
}
