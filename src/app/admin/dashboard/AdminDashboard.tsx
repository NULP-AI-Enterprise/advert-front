'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface MediaItem {
  id: string;
  title: string;
  url: string | null;
  marketplaceUrl: string | null;
  country: string | null;
  // Placement specs (PRNEW CSV)
  costUsd: number | null;
  formatType: string | null;
  language: string | null;
  leadTimeHours: number | null;
  hyperlinksType: string | null;
  // Traffic & SEO (PRNEW CSV)
  similarwebVisits: number | null;
  ahrefsDr: number | null;
  mozDa: number | null;
  semrushScore: number | null;
  organicTrafficAhrefs: number | null;
  organicTrafficSemrush: number | null;
  // Content restrictions
  restrictions: Record<string, boolean> | null;
  // LLM-enriched
  description: string | null;
  category: string | null;
  tags: string[] | null;
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

const CATEGORIES = [
  'News', 'Business', 'Technology', 'Sports', 'Fashion',
  'Agriculture', 'Video', 'Entertainment', 'Science', 'Politics',
];

const PAGE_SIZE = 20;

function fmt(n: number | null | undefined, unit?: string): string {
  if (n == null) return '—';
  if (unit === '$') return `$${n % 1 === 0 ? n : n.toFixed(0)}`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-1)', border: '1px solid var(--bd)',
      borderRadius: 6, padding: '2px 7px', minWidth: 36,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'var(--t1)', fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>
        {value}
      </span>
      <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}

function EmbedBadge({ has }: { has: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
      background: has ? '#d1fae5' : 'var(--bg-1)',
      color: has ? '#065f46' : 'var(--t4)',
      border: `1px solid ${has ? '#6ee7b7' : 'var(--bd)'}`,
      whiteSpace: 'nowrap',
    }}>
      {has ? '✓ embedded' : '— pending'}
    </span>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: 'var(--t3)', minWidth: 140, flexShrink: 0, textTransform: 'capitalize' }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--t1)', fontFamily: mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function truncate(s: string | null, n: number) {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function RestrictionsChips({ r }: { r: Record<string, boolean> }) {
  const entries = Object.entries(r);
  if (!entries.length) return <span style={{ fontSize: 12, color: 'var(--t3)' }}>No restrictions</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {entries.map(([k, v]) => (
        <span key={k} style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 99,
          background: v ? '#d1fae5' : '#fee2e2',
          color: v ? '#065f46' : '#991b1b',
          border: `1px solid ${v ? '#6ee7b7' : '#fca5a5'}`,
        }}>
          {v ? '✓' : '✗'} {k}
        </span>
      ))}
    </div>
  );
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

  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formAudience, setFormAudience] = useState('');
  const [formMetrics, setFormMetrics] = useState('');

  const [toast, setToast] = useState<Toast | null>(null);
  const [enrichLimit, setEnrichLimit] = useState<string>('100');
  const [enrichPopoverOpen, setEnrichPopoverOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('admin_auth');
      if (auth !== 'true') { router.replace('/admin'); return; }
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
      const res = await fetch(`/api/admin/media-items?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, showToast]);

  useEffect(() => { if (authed) fetchItems(); }, [authed, fetchItems]);

  const openEdit = (item: MediaItem) => {
    setEditItem(item);
    setFormTitle(item.title);
    setFormDesc(item.description ?? '');
    setFormCategory(item.category ?? '');
    setFormTags(item.tags?.join(', ') ?? '');
    setFormAudience(item.audience ? JSON.stringify(item.audience, null, 2) : '');
    setFormMetrics(item.metrics ? JSON.stringify(item.metrics, null, 2) : '');
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    let parsedAudience = null;
    let parsedMetrics = null;
    try { if (formAudience.trim()) parsedAudience = JSON.parse(formAudience); }
    catch { showToast('Invalid JSON in Audience', 'error'); return; }
    try { if (formMetrics.trim()) parsedMetrics = JSON.parse(formMetrics); }
    catch { showToast('Invalid JSON in Metrics', 'error'); return; }
    const body = {
      title: formTitle,
      description: formDesc || null,
      category: formCategory || null,
      tags: formTags ? formTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      audience: parsedAudience,
      metrics: parsedMetrics,
    };
    try {
      const url = editItem?.id ? `/api/admin/media-items/${editItem.id}` : '/api/admin/media-items';
      const res = await fetch(url, { method: editItem?.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setEditModalOpen(false);
      fetchItems();
      showToast(editItem?.id ? 'Saved' : 'Created', 'success');
    } catch { showToast('Save failed', 'error'); }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/media-items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchItems();
      showToast('Deleted', 'success');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleReenrich = async (item: MediaItem) => {
    try {
      const res = await fetch('/api/admin/reenrich', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, title: item.title }),
      });
      if (!res.ok) throw new Error();
      showToast('Queued for re-enrichment', 'success');
    } catch { showToast('Re-enrich failed', 'error'); }
  };

  const handleEnrichAll = async (limit?: number) => {
    try {
      const url = limit ? `/api/admin/enrich-all?limit=${limit}` : '/api/admin/enrich-all';
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error();
      showToast(`Enrichment queued for ${limit ?? 'all'} items`, 'success');
      setEnrichPopoverOpen(false);
    } catch { showToast('Enrich failed', 'error'); }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!authed) return null;

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-1)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, background: '#fff',
        borderBottom: '1px solid var(--bd)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>Media Items</span>
          <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99 }}>
            {total}
          </span>
        </div>
        <input
          type="search" placeholder="Search titles…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: '7px 11px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', width: 200 }}
        />
        <select
          value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ padding: '7px 11px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', background: '#fff', color: 'var(--t1)' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, position: 'relative' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEnrichPopoverOpen(p => !p)}>
            Run Enrichment ▾
          </button>
          {enrichPopoverOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', border: '1px solid var(--bd)', borderRadius: 'var(--r-lg)',
              padding: '14px 16px', boxShadow: 'var(--shadow-md)', zIndex: 200, minWidth: 220,
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Items to enrich
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[10, 100, 500, 1000].map(n => (
                  <button key={n}
                    className={`btn btn-sm ${enrichLimit === String(n) ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ minWidth: 44 }}
                    onClick={() => setEnrichLimit(String(n))}
                  >{n}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
                <input
                  type="number" min={1} placeholder="Custom…" value={enrichLimit}
                  onChange={e => setEnrichLimit(e.target.value)}
                  style={{ flex: 1, padding: '6px 8px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none' }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => setEnrichLimit('')}>All</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setEnrichPopoverOpen(false)}>Cancel</button>
                <button
                  className="btn btn-primary btn-sm" style={{ flex: 1 }}
                  onClick={() => handleEnrichAll(enrichLimit ? Number(enrichLimit) : undefined)}
                  disabled={enrichLimit !== '' && (isNaN(Number(enrichLimit)) || Number(enrichLimit) < 1)}
                >Start</button>
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => {
            setEditItem(null); setFormTitle(''); setFormDesc(''); setFormCategory('');
            setFormTags(''); setFormAudience(''); setFormMetrics('');
            setEditModalOpen(true);
          }}>+ Add New</button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div style={{ margin: '20px 24px', background: '#fff', border: '1px solid var(--bd)', borderRadius: 'var(--r-lg)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span className="spinner" />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Outlet', 'Category', 'Cost', 'Traffic', 'SEO', 'Format', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '9px 12px', fontSize: 11,
                    fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', borderBottom: '1px solid var(--bd)',
                    background: 'var(--bg-1)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>No items found</td></tr>
              ) : items.map(item => (
                <tr key={item.id}
                  style={{ borderBottom: '1px solid var(--bd)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => setDetailItem(item)}
                >
                  {/* Outlet: title + url */}
                  <td style={{ padding: '9px 12px', maxWidth: 220, verticalAlign: 'middle' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {item.title}
                    </p>
                    {item.url && (
                      <p style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.url}
                      </p>
                    )}
                  </td>

                  {/* Category + tags */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {item.category
                      ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)' }}>{item.category}</span>
                      : <span style={{ fontSize: 11, color: 'var(--t4)', fontStyle: 'italic' }}>pending</span>
                    }
                  </td>

                  {/* Cost */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {item.costUsd != null
                      ? <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>${Math.round(item.costUsd)}</span>
                      : <span style={{ color: 'var(--t4)' }}>—</span>
                    }
                  </td>

                  {/* Traffic */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    {item.similarwebVisits != null
                      ? <span style={{ fontSize: 12, color: 'var(--t2)', fontFamily: 'var(--font-mono)' }}>{fmt(item.similarwebVisits)}/mo</span>
                      : <span style={{ color: 'var(--t4)' }}>—</span>
                    }
                  </td>

                  {/* SEO: DR + DA */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {item.ahrefsDr != null && <Chip label="DR" value={String(item.ahrefsDr)} color="var(--accent)" />}
                      {item.mozDa != null && <Chip label="DA" value={String(item.mozDa)} color="var(--t2)" />}
                      {item.ahrefsDr == null && item.mozDa == null && <span style={{ color: 'var(--t4)' }}>—</span>}
                    </div>
                  </td>

                  {/* Format */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                    {item.formatType
                      ? <span className="tag" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{item.formatType}</span>
                      : <span style={{ color: 'var(--t4)' }}>—</span>
                    }
                  </td>

                  {/* Enrichment status */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle' }}>
                    <EmbedBadge has={item.has_embedding} />
                    {!item.description && (
                      <p style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2 }}>no desc</p>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '9px 12px', verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => openEdit(item)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleReenrich(item)} title="Re-enrich">↻</button>
                      <button className="btn btn-sm" style={{ fontSize: 11, padding: '3px 8px', background: 'none', border: '1.5px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--r)', cursor: 'pointer' }}
                        onClick={() => handleDelete(item)}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 32 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
        <span style={{ fontSize: 13, color: 'var(--t2)' }}>Page {page} of {totalPages}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</button>
      </div>

      {/* ── Detail drawer ────────────────────────────────────────────── */}
      {detailItem && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setDetailItem(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', width: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
            {/* Header */}
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--bd)', position: 'sticky', top: 0, background: '#fff', zIndex: 1, display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Media Outlet</p>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: 0, lineHeight: 1.3 }}>{detailItem.title}</h2>
                {detailItem.url && (
                  <a href={`https://${detailItem.url}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                    {detailItem.url}
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setDetailItem(null); openEdit(detailItem); }}>Edit</button>
                <button onClick={() => setDetailItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}>×</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* Status chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {detailItem.category && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-bd)' }}>
                    {detailItem.category}
                  </span>
                )}
                {detailItem.country && (
                  <span className="tag" style={{ fontSize: 12 }}>{detailItem.country}</span>
                )}
                <EmbedBadge has={detailItem.has_embedding} />
              </div>

              {/* Placement specs */}
              <Section label="Placement">
                {detailItem.costUsd != null && <DetailRow label="Cost" value={<span style={{ color: 'var(--green)', fontWeight: 700 }}>${detailItem.costUsd}</span>} />}
                {detailItem.formatType && <DetailRow label="Format" value={detailItem.formatType} />}
                {detailItem.language && <DetailRow label="Language" value={detailItem.language} />}
                {detailItem.leadTimeHours != null && <DetailRow label="Lead time" value={`${detailItem.leadTimeHours}h`} />}
                {detailItem.hyperlinksType && <DetailRow label="Links type" value={detailItem.hyperlinksType} />}
                {detailItem.marketplaceUrl && (
                  <DetailRow label="Marketplace" value={
                    <a href={detailItem.marketplaceUrl} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {detailItem.marketplaceUrl}
                    </a>
                  } />
                )}
              </Section>

              {/* Traffic & SEO */}
              <Section label="Traffic & SEO">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {detailItem.similarwebVisits != null && <Chip label="Visits/mo" value={fmt(detailItem.similarwebVisits)} color="var(--t1)" />}
                  {detailItem.ahrefsDr != null && <Chip label="Ahrefs DR" value={String(detailItem.ahrefsDr)} color="var(--accent)" />}
                  {detailItem.mozDa != null && <Chip label="Moz DA" value={String(detailItem.mozDa)} color="var(--t2)" />}
                  {detailItem.semrushScore != null && <Chip label="Semrush" value={String(detailItem.semrushScore)} color="var(--t2)" />}
                  {detailItem.organicTrafficAhrefs != null && <Chip label="Org. Ahrefs" value={fmt(detailItem.organicTrafficAhrefs)} color="var(--t3)" />}
                  {detailItem.organicTrafficSemrush != null && <Chip label="Org. Semrush" value={fmt(detailItem.organicTrafficSemrush)} color="var(--t3)" />}
                </div>
              </Section>

              {/* Restrictions */}
              {detailItem.restrictions && Object.keys(detailItem.restrictions).length > 0 && (
                <Section label="Content Restrictions">
                  <RestrictionsChips r={detailItem.restrictions} />
                </Section>
              )}

              {/* Description */}
              <Section label="Description (enriched)">
                {detailItem.description
                  ? <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.7, margin: 0 }}>{detailItem.description}</p>
                  : <p style={{ fontSize: 13, color: 'var(--t3)', fontStyle: 'italic', margin: 0 }}>Not yet enriched — run enricher to generate</p>
                }
              </Section>

              {/* Tags */}
              {(detailItem.tags?.length ?? 0) > 0 && (
                <Section label="Tags">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {detailItem.tags!.map(t => (
                      <span key={t} className="tag" style={{ fontSize: 12, padding: '3px 9px' }}>#{t}</span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Audience (from enricher) */}
              {detailItem.audience && (
                <Section label="Audience (enriched)">
                  {detailItem.audience.age_range && <DetailRow label="Age range" value={detailItem.audience.age_range} />}
                  {detailItem.audience.interests?.length > 0 && <DetailRow label="Interests" value={detailItem.audience.interests.join(', ')} />}
                  {detailItem.audience.demographics && Object.entries(detailItem.audience.demographics).map(([k, v]) => (
                    <DetailRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                  ))}
                </Section>
              )}

              {/* Metrics (from enricher) */}
              {detailItem.metrics && Object.keys(detailItem.metrics).length > 0 && (
                <Section label="Editorial Metrics (enriched)">
                  {Object.entries(detailItem.metrics).map(([k, v]) => (
                    <DetailRow key={k} label={k.replace(/_/g, ' ')} value={Array.isArray(v) ? (v as string[]).join(', ') : String(v)} />
                  ))}
                </Section>
              )}

              {/* Record meta */}
              <Section label="Record">
                <DetailRow label="ID" value={detailItem.id} mono />
                <DetailRow label="Created" value={fmtDate(detailItem.created_at)} />
                <DetailRow label="Updated" value={fmtDate(detailItem.updated_at)} />
              </Section>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {editModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setEditModalOpen(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', padding: 28, width: 540, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 20 }}>
              {editItem ? `Edit — ${editItem.title}` : 'New Item'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16, lineHeight: 1.5 }}>
              Only LLM-generated fields are editable here. Structured CSV data (cost, traffic, DR) is managed via the enricher.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Title *', val: formTitle, set: setFormTitle, type: 'text' as const },
              ].map(({ label, val, set, type }) => (
                <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>{label}</span>
                  <input type={type} value={val} onChange={e => set(e.target.value)}
                    style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', boxSizing: 'border-box', width: '100%' }}
                  />
                </label>
              ))}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>Description</span>
                <textarea rows={4} value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>Category</span>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                  style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', background: '#fff', color: 'var(--t1)', width: '100%' }}>
                  <option value="">— select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>Tags (comma-separated)</span>
                <input type="text" value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="tag1, tag2"
                  style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 13, outline: 'none', boxSizing: 'border-box', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>Audience (JSON)</span>
                <textarea rows={3} value={formAudience} onChange={e => setFormAudience(e.target.value)} placeholder='{"age_range": "18-34"}'
                  style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>Editorial Metrics (JSON)</span>
                <textarea rows={3} value={formMetrics} onChange={e => setFormMetrics(e.target.value)} placeholder='{"publishing_frequency": "daily"}'
                  style={{ padding: '8px 10px', border: '1.5px solid var(--bd)', borderRadius: 'var(--r)', fontSize: 12, fontFamily: 'var(--font-mono)', outline: 'none', resize: 'vertical', width: '100%' }} />
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!formTitle.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, padding: '10px 16px',
          borderRadius: 'var(--r)', fontSize: 13, color: '#fff', zIndex: 2000,
          boxShadow: 'var(--shadow-md)',
          background: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
