'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_auth');
      if (auth === 'true') {
        router.replace('/admin/dashboard');
        return;
      }
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin@12345') {
      sessionStorage.setItem('admin_auth', 'true');
      router.replace('/admin/dashboard');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (loading) return null;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>
          Admin Panel
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--t3)', marginBottom: '24px' }}>
          Enter your password to continue
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            autoFocus
          />
          {error && (
            <p style={{ fontSize: '12px', color: 'var(--red)', margin: 0 }}>{error}</p>
          )}
          <button className="auth-btn" type="submit">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
