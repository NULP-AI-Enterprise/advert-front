'use client'

export default function TypingIndicator() {
  return (
    <div className="msg-row anim-in">
      <div className="msg-avatar ai">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L11 3.5V8.5L6 11L1 8.5V3.5L6 1Z"
                stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="msg-bubble" style={{ padding: '12px 16px' }}>
        <div className="typing-dots">
          <span className="dot"/>
          <span className="dot"/>
          <span className="dot"/>
        </div>
      </div>
    </div>
  )
}
