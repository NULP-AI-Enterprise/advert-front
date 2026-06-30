'use client'

import { useState, useRef, KeyboardEvent } from 'react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
  isConnected: boolean
}

export default function ChatInput({ onSend, disabled, isConnected }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim().length > 0 && !disabled && isConnected

  const send = () => {
    if (!canSend) return
    onSend(value.trim())
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const grow = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="input-wrap">
      <div className="input-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          onInput={grow}
          disabled={disabled || !isConnected}
          placeholder={isConnected ? 'Describe your product, audience, campaign goal…' : 'Connecting to server…'}
          className="input-textarea"
        />
        <button className={`send-btn ${canSend ? 'active' : ''}`} onClick={send} disabled={!canSend}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7h11M8 1.5L13.5 7 8 12.5"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <p className="input-hint">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}
