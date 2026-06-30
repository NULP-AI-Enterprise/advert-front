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
      setError('Не вдалося надіслати лист. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="sidebar-logo" style={{ marginBottom: 24, justifyContent: 'center' }}>
          <div className="sidebar-logo-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L12.5 4.5V9.5L7 12.5L1.5 9.5V4.5L7 1.5Z"
                    stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
              <circle cx="7" cy="7" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">MediaAI</span>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: 'var(--t1)', marginBottom: 8 }}>Перевірте пошту</p>
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>
              Ми надіслали magic link на <strong>{email}</strong>.
              Посилання діє 15 хвилин.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 15, color: 'var(--t1)', marginBottom: 4 }}>Увійти</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 20 }}>
              Введіть email — надішлемо magic link
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--t1)', fontSize: 13,
                outline: 'none', boxSizing: 'border-box', marginBottom: 12,
              }}
            />

            {error && (
              <p style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn"
              style={{
                width: '100%', padding: '10px', justifyContent: 'center',
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Надсилаємо…' : 'Надіслати magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
