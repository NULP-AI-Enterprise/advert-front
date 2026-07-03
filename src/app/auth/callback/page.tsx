'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setToken, setUser } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const hash = window.location.hash
    const token = new URLSearchParams(hash.slice(1)).get('token')

    if (!token) {
      setStatus('error')
      return
    }

    setToken(token)

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => {
        setUser(user)
        router.replace('/')
      })
      .catch(() => setStatus('error'))
  }, [router, setToken, setUser])

  if (status === 'error') {
    return (
      <div className="auth-shell">
        <div className="auth-card anim-in" style={{ textAlign: 'center' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="var(--red)" strokeWidth="1.5"/>
              <path d="M7 7l6 6M13 7l-6 6" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
            Link expired or invalid
          </p>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, lineHeight: 1.6 }}>
            This sign-in link has expired or has already been used.
            Please request a new one.
          </p>
          <a
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '9px 20px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--r)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-card anim-in" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <span className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}/>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)', marginBottom: 4 }}>
          Signing you in…
        </p>
        <p style={{ fontSize: 12, color: 'var(--t3)' }}>
          Please wait a moment.
        </p>
      </div>
    </div>
  )
}
