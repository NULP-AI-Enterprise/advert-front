'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  audience: Record<string, any> | null;
  metrics: Record<string, any> | null;
  has_embedding: boolean;
  created_at: string;
  updated_at: string;
}

interface Toast {
  msg: string;
  type: 'success' | 'error';
}

const TIER_COLORS: Record<string, string> = {
  national: '#6366f1',
  regional: '#0ea5e9',
  local: '#10b981',
  niche: '#f59e0b',
};

const CATEGORIES = [
  'News', 'Business', 'Technology', 'Sports', 'Fashion',
  'Agriculture', 'Video', 'Entertainment', 'Science', 'Politics',
];

const PAGE_SIZE = 20;

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</p>
      {children}
    </div>
  );
}

function DetailRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '12px', color: 'var(--t3)', minWidth: '120px', flexShrink: 0, textTransform: 'capitalize' }}>{k}</span>
      <span style={{ fontSize: '12px', color: 'var(--t1)', fontFamily: mono ? 'var(--font-mono, monospace)' : undefined, wordBreak: 'break-all' }}>{v}</span>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function truncate(str: string | null, len: number) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formAudience, setFormAudience] = useState('');
  const [formMetrics, setFormMetrics] = useState('');

  const [toast, setToast] = useState<Toast | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [enrichLimit, setEnrichLimit] = useState<string>('100');
  const [enrichPopoverOpen, setEnrichPopoverOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_auth');
      if (auth !== 'true') {
        router.replace('/admin');
        return;
      }
      setAuthed(true);
    }
  }, [router]);

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/admin/media-items?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, showToast]);

  useEffect(() => {
    if (authed) fetchItems();
  }, [authed, fetchItems]);

  const openNew = () => {
    setEditItem(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('');
    setFormTags('');
    setFormAudience('');
    setFormMetrics('');
    setModalOpen(true);
  };

  const openEdit = (item: MediaItem) => {
    setEditItem(item);
    setFormTitle(item.title);
    setFormDesc(item.description ?? '');
    setFormCategory(item.category ?? '');
    setFormTags(item.tags?.join(', ') ?? '');
    setFormAudience(item.audience ? JSON.stringify(item.audience, null, 2) : '');
    setFormMetrics(item.metrics ? JSON.stringify(item.metrics, null, 2) : '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    let parsedAudience = null;
    let parsedMetrics = null;
    try {
      if (formAudience.trim()) parsedAudience = JSON.parse(formAudience);
    } catch {
      showToast('Invalid JSON in Audience field', 'error');
      return;
    }
    try {
      if (formMetrics.trim()) parsedMetrics = JSON.parse(formMetrics);
    } catch {
      showToast('Invalid JSON in Metrics field', 'error');
      return;
    }
    const body = {
      title: formTitle,
      description: formDesc || null,
      category: formCategory || null,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      audience: parsedAudience,
      metrics: parsedMetrics,
    };
    try {
      if (editItem?.id) {
        const res = await fetch(`/api/admin/media-items/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch('/api/admin/media-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
      }
      setModalOpen(false);
      fetchItems();
      showToast(editItem?.id ? 'Item updated' : 'Item created', 'success');
    } catch {
      showToast('Save failed', 'error');
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/media-items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchItems();
      showToast('Item deleted', 'success');
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const handleReenrich = async (item: MediaItem) => {
    try {
      const res = await fetch('/api/admin/reenrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, title: item.title }),
      });
      if (!res.ok) throw new Error();
      showToast('Queued for re-enrichment', 'success');
    } catch {
      showToast('Re-enrich failed', 'error');
    }
  };

  const handleEnrichAll = async (limit?: number) => {
    try {
      const url = limit ? `/api/admin/enrich-all?limit=${limit}` : '/api/admin/enrich-all';
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error();
      const label = limit ? `${limit} items` : 'all items';
      showToast(`Enrichment queued for ${label}`, 'success');
      setEnrichPopoverOpen(false);
    } catch {
      showToast('Enrich failed', 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!authed) return null;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg-1)' }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, background: '#fff',
        borderBottom: '1px solid var(--bd)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--t1)' }}>Media Items</span>
          <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '99px' }}>
            {total}
          </span>
        </div>
        <input
          type="search"
          placeholder="Search titles…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: '7px 11px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)',
            fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', width: '220px',
          }}
        />
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{
            padding: '7px 11px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)',
            fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', background: '#fff',
            color: 'var(--t1)',
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setEnrichPopoverOpen(p => !p)}
          >
            Run Enrichment ▾
          </button>
          {enrichPopoverOpen && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1px solid var(--bd)', borderRadius: 'var(--r-lg)',
                padding: '14px 16px', boxShadow: 'var(--shadow-md)',
                zIndex: 200, minWidth: '220px',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Items to enrich
              </p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {[10, 100, 500, 1000].map(n => (
                  <button
                    key={n}
                    className={`btn btn-sm ${enrichLimit === String(n) ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ minWidth: '44px' }}
                    onClick={() => setEnrichLimit(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  placeholder="Custom…"
                  value={enrichLimit}
                  onChange={e => setEnrichLimit(e.target.value)}
                  style={{
                    flex: 1, padding: '6px 8px',
                    border: '1.5px solid var(--bd)', borderRadius: 'var(--r)',
                    fontSize: '13px', fontFamily: 'var(--font)', outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEnrichLimit(''); }}
                  title="All items"
                >
                  All
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEnrichPopoverOpen(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleEnrichAll(enrichLimit ? Number(enrichLimit) : undefined)}
                  disabled={enrichLimit !== '' && (isNaN(Number(enrichLimit)) || Number(enrichLimit) < 1)}
                >
                  Start
                </button>
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={openNew}>
            + Add New
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ margin: '24px', background: '#fff', border: '1px solid var(--bd)', borderRadius: 'var(--r-lg)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
            <span className="spinner" />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Category', 'Reach Tier', 'Description', 'Tags', 'Embedding', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 14px', fontSize: '11px',
                    fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '1px solid var(--bd)',
                    background: 'var(--bg-1)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--t3)', fontSize: '13px' }}>
                    No items found
                  </td>
                </tr>
              ) : items.map(item => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid var(--bd)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--t1)', verticalAlign: 'middle', maxWidth: '200px' }}>
                    <button
                      onClick={() => openEdit(item)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent)', fontWeight: 500, fontSize: '13px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px', display: 'block' }}
                    >
                      {item.title}
                    </button>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--t1)', verticalAlign: 'middle' }}>
                    {item.category ? (
                      <span className="tag" style={{ fontSize: '11px', padding: '2px 8px' }}>{item.category}</span>
                    ) : <span style={{ color: 'var(--t4)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--t1)', verticalAlign: 'middle' }}>
                    {item.metrics?.reach_tier ? (
                      <span className="badge" style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--accent-bg)', color: 'var(--accent)' }}>{item.metrics.reach_tier}</span>
                    ) : <span style={{ color: 'var(--t4)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--t2)', verticalAlign: 'middle', maxWidth: '220px' }}>
                    {truncate(item.description, 60)}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', verticalAlign: 'middle', maxWidth: '180px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {item.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="tag" style={{ fontSize: '11px', padding: '1px 6px' }}>{tag}</span>
                      ))}
                      {(item.tags?.length ?? 0) > 3 && (
                        <span style={{ fontSize: '11px', color: 'var(--t3)' }}>+{item.tags.length - 3} more</span>
                      )}
                      {(!item.tags || item.tags.length === 0) && <span style={{ color: 'var(--t4)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '13px', verticalAlign: 'middle', textAlign: 'center' }}>
                    {item.has_embedding
                      ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓</span>
                      : <span style={{ color: 'var(--t3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--t3)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {formatDate(item.created_at)}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setDetailItem(item)}
                        title="View details"
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => handleReenrich(item)}
                        title="Re-enrich"
                      >
                        ↻
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px', background: 'none', border: '1.5px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--r)', cursor: 'pointer' }}
                        onClick={() => handleDelete(item)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingBottom: '32px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <span style={{ fontSize: '13px', color: 'var(--t2)' }}>
          Page {page} of {totalPages}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', padding: '28px', width: '540px', maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--t1)', marginBottom: '20px' }}>
              {editItem ? 'Edit Item' : 'New Item'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Title *</span>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Description</span>
                <textarea
                  rows={4}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Category</span>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', background: '#fff', color: 'var(--t1)', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                >
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Tags (comma-separated)</span>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Audience (JSON)</span>
                <textarea
                  rows={3}
                  value={formAudience}
                  onChange={e => setFormAudience(e.target.value)}
                  placeholder='{"age_range": "18-34"}'
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font-mono, monospace)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--t2)' }}>Metrics (JSON)</span>
                <textarea
                  rows={3}
                  value={formMetrics}
                  onChange={e => setFormMetrics(e.target.value)}
                  placeholder='{"reach_tier": "high"}'
                  style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: '13px', fontFamily: 'var(--font-mono, monospace)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--accent-bd)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--bd)')}
                />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!formTitle.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailItem && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setDetailItem(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', width: '600px', maxHeight: '88vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Media Outlet</p>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3, margin: 0 }}>{detailItem.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }} onClick={() => { setDetailItem(null); openEdit(detailItem); }}>Edit</button>
                <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: '18px', lineHeight: 1, padding: '2px 4px' }}>×</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Badges row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {detailItem.category && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)' }}>
                    {detailItem.category}
                  </span>
                )}
                {detailItem.metrics?.reach_tier && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '99px', background: TIER_COLORS[detailItem.metrics.reach_tier] + '18', color: TIER_COLORS[detailItem.metrics.reach_tier] ?? 'var(--t2)', border: `1px solid ${TIER_COLORS[detailItem.metrics.reach_tier] ?? 'var(--bd)'}40` }}>
                    {detailItem.metrics.reach_tier}
                  </span>
                )}
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '99px', background: detailItem.has_embedding ? '#d1fae5' : 'var(--bg-1)', color: detailItem.has_embedding ? '#065f46' : 'var(--t3)', border: `1px solid ${detailItem.has_embedding ? '#6ee7b7' : 'var(--bd)'}` }}>
                  {detailItem.has_embedding ? '✓ Embedding' : 'No embedding'}
                </span>
              </div>

              {/* Description */}
              <DetailSection label="Description">
                {detailItem.description
                  ? <p style={{ fontSize: '13px', color: 'var(--t1)', lineHeight: 1.7, margin: 0 }}>{detailItem.description}</p>
                  : <p style={{ fontSize: '13px', color: 'var(--t3)', fontStyle: 'italic', margin: 0 }}>No description — run enrichment to generate</p>
                }
              </DetailSection>

              {/* Tags */}
              {detailItem.tags?.length > 0 && (
                <DetailSection label="Tags">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {detailItem.tags.map(t => (
                      <span key={t} className="tag" style={{ fontSize: '12px', padding: '3px 9px' }}>#{t}</span>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Audience */}
              {detailItem.audience && (
                <DetailSection label="Audience">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detailItem.audience.age_range && (
                      <DetailRow k="Age range" v={detailItem.audience.age_range} />
                    )}
                    {detailItem.audience.interests?.length > 0 && (
                      <DetailRow k="Interests" v={detailItem.audience.interests.join(', ')} />
                    )}
                    {detailItem.audience.demographics && Object.entries(detailItem.audience.demographics).map(([k, v]) => (
                      <DetailRow key={k} k={k.replace(/_/g, ' ')} v={String(v)} />
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Metrics */}
              {detailItem.metrics && (
                <DetailSection label="Metrics">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(detailItem.metrics).map(([k, v]) => (
                      <DetailRow key={k} k={k.replace(/_/g, ' ')} v={String(v)} />
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Meta */}
              <DetailSection label="Record">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <DetailRow k="ID" v={detailItem.id} mono />
                  <DetailRow k="Created" v={formatDate(detailItem.created_at)} />
                  <DetailRow k="Updated" v={formatDate(detailItem.updated_at)} />
                </div>
              </DetailSection>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          padding: '10px 16px', borderRadius: 'var(--r)',
          fontSize: '13px', color: '#fff', zIndex: 2000,
          boxShadow: 'var(--shadow-md)',
          background: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          animation: 'fadeSlideUp 0.2s',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
