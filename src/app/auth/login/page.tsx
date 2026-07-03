'use client'

import { useState, FormEvent } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSent(true)
    } catch {
      setError('Could not send the link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card anim-in">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div className="sidebar-logo-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L12.5 4.5V9.5L7 12.5L1.5 9.5V4.5L7 1.5Z"
                    stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="1.5" fill="white"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            MediaAI
          </span>
        </div>

        {sent ? (
          <div className="anim-in">
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--green-bg)', border: '1.5px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
              Check your inbox
            </p>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
              We sent a sign-in link to{' '}
              <strong style={{ color: 'var(--t1)' }}>{email}</strong>.
              {' '}The link expires in 15 minutes.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              style={{
                marginTop: 20, background: 'none', border: 'none',
                color: 'var(--accent)', fontSize: 13, cursor: 'pointer', padding: 0,
              }}
            >
              ← Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Sign in to MediaAI
            </p>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 24, lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send a magic link — no password needed.
            </p>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="auth-input"
              style={{ marginBottom: 12 }}
            />

            {error && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6 3.5v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="auth-btn"
              style={{ marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}/>
                  Sending…
                </span>
              ) : (
                'Send magic link'
              )}
            </button>

            <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginTop: 16 }}>
              By signing in you agree to our Terms of Service.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
