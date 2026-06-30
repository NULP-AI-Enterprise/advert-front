'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setToken, setUser } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')

  useEffect(() => {
    const hash = window.location.hash // #token=JWT...
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
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171', marginBottom: 12 }}>Посилання недійсне або протерміноване.</p>
          <a href="/auth/login" style={{ color: 'var(--accent)', fontSize: 13 }}>
            Запросити новий link →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--t2)', fontSize: 13 }}>Авторизація…</p>
      </div>
    </div>
  )
}
