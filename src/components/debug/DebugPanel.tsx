'use client'

import { useState } from 'react'
import { useChatStore } from '@/store/chatStore'
import { DebugEvent, DebugStage } from '@/types/chat'

const STAGE_COLORS: Record<DebugStage, { dot: string; badge: string; text: string }> = {
  router:     { dot: '#6366f1', badge: 'rgba(99,102,241,0.12)',  text: '#6366f1' },
  search:     { dot: '#10b981', badge: 'rgba(16,185,129,0.12)',  text: '#059669' },
  enrichment: { dot: '#f59e0b', badge: 'rgba(245,158,11,0.12)', text: '#d97706' },
  system:     { dot: '#9ca3af', badge: 'rgba(156,163,175,0.12)', text: '#6b7280' },
}

const STAGE_LABELS: Record<DebugStage, string> = {
  router:     'Router',
  search:     'Search',
  enrichment: 'Enrichment',
  system:     'System',
}

export default function DebugPanel() {
  const debugOpen    = useChatStore(s => s.debugOpen)
  const setDebugOpen = useChatStore(s => s.setDebugOpen)
  const events       = useChatStore(s => s.debugEvents)
  const clearEvents  = useChatStore(s => s.clearDebugEvents)

  if (!debugOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 480, height: '75vh',
        background: 'var(--bg)',
        border: '1px solid var(--bd)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        pointerEvents: 'all',
        margin: '0 16px',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--bd)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.3"/>
              <path d="M7 4v3.5L9.5 9" stroke="var(--accent)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', letterSpacing: '0.03em' }}>
              Pipeline Trace
            </span>
            {events.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                borderRadius: 99, padding: '1px 7px',
              }}>
                {events.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {events.length > 0 && (
              <button onClick={clearEvents} style={{
                fontSize: 11, color: 'var(--t3)', background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 8px', borderRadius: 4,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
              >
                Clear
              </button>
            )}
            <button onClick={() => setDebugOpen(false)} style={{
              fontSize: 15, color: 'var(--t3)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '0 6px', borderRadius: 4, lineHeight: 1,
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--t1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}
            >
              ×
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 12, padding: '8px 16px',
          borderBottom: '1px solid var(--bd)', flexShrink: 0,
        }}>
          {(Object.keys(STAGE_COLORS) as DebugStage[]).map(stage => (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: STAGE_COLORS[stage].dot,
              }} />
              <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          ))}
        </div>

        {/* Event list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {events.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 8,
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" opacity={0.3}>
                <circle cx="14" cy="14" r="12" stroke="var(--t3)" strokeWidth="1.5"/>
                <path d="M14 8v6.5L17.5 17" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                Waiting for a message…
              </span>
            </div>
          ) : (
            events.map((evt, i) => <EventRow key={i} evt={evt} index={i} />)
          )}
        </div>
      </div>
    </div>
  )
}

/** Extract a compact one-line summary from event data so key numbers are visible without expanding. */
function getSummary(event: string, data: Record<string, unknown>): string | null {
  const d = data as Record<string, number | string | unknown[]>
  switch (event) {
    case 'embed_query':
      return typeof d.query_text === 'string'
        ? `"${d.query_text.slice(0, 60)}${d.query_text.length > 60 ? '…' : ''}"`
        : null
    case 'keywords_built': {
      const list = Array.isArray(d.final_keyword_list) ? d.final_keyword_list as string[] : []
      return list.length ? list.slice(0, 6).join(' · ') + (list.length > 6 ? ` +${list.length - 6}` : '') : null
    }
    case 'vector_search':
    case 'vector_retry':
      return `sql=${d.sql_returned ?? '?'}  new=${d.new_in_pool ?? '?'}  pool=${d.pool_size ?? '?'}`
    case 'llm_input':
      return `history=${d.history_msgs ?? '?'} msgs  clarify_count=${d.clarify_count ?? '?'}`
    case 'llm_output':
      return typeof d.action === 'string' ? `action=${d.action}` : null
    case 'enrichment_llm_input':
    case 'input':
      return typeof d.candidate_count === 'number' ? `${d.candidate_count} candidates` : null
    case 'llm_error':
    case 'embed_error':
      return typeof d.error === 'string' ? d.error.slice(0, 80) : null
    case 'final_pool':
      return `pool=${d.total_candidates ?? '?'}  enriched=${d.enriched_count ?? '?'}  target=${d.target_results ?? '?'}`
    case 'pre_rank':
      return `analyzed=${d.pool_in ?? '?'}  kept=${d.batch_out ?? '?'}  dropped=${d.dropped ?? '?'}  score_cut=${d.score_cut ?? '?'}`
    case 'category_pad':
      return `new=${d.new_in_pool ?? '?'}  pool=${d.pool_size ?? '?'}`
    case 'top_traffic':
      return `new=${d.new_in_pool ?? '?'}  pool=${d.pool_size ?? '?'}`
    default:
      if (typeof d.pool_size === 'number') {
        return `new=${d.new_in_pool ?? '?'}  pool=${d.pool_size}`
      }
      if (typeof d.keywords_tried === 'number') {
        return `${d.keywords_tried} keywords  new=${d.new_in_pool ?? '?'}  pool=${d.pool_size ?? '?'}`
      }
      return null
  }
}

function EventRow({ evt, index }: { evt: DebugEvent; index: number }) {
  const [open, setOpen] = useState(false)
  const colors = STAGE_COLORS[evt.stage]
  const hasData = Object.keys(evt.data).length > 0
  const summary = getSummary(evt.event, evt.data)
  const isError = evt.event.includes('error')

  return (
    <div style={{ borderBottom: '1px solid var(--bd)' }}>
      <button
        onClick={() => hasData && setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '8px 16px', background: 'none', border: 'none',
          cursor: hasData ? 'pointer' : 'default', textAlign: 'left',
        }}
        onMouseEnter={e => hasData && (e.currentTarget.style.background = 'var(--bg-1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isError ? 'var(--red)' : colors.dot,
          }} />
          <div style={{ width: 1, flex: 1, minHeight: 12, background: 'var(--bd)', marginTop: 2 }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: isError ? 'rgba(239,68,68,0.1)' : colors.badge,
              color: isError ? 'var(--red)' : colors.text,
              borderRadius: 4, padding: '1px 5px', flexShrink: 0,
            }}>
              {STAGE_LABELS[evt.stage]}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)' }}>
              {evt.label}
            </span>
          </div>

          {/* Summary line — key metrics without expanding */}
          {summary && (
            <div style={{
              fontSize: 10, color: 'var(--t2)', fontFamily: 'var(--font-mono)',
              marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {summary}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--t4)', fontFamily: 'var(--font-mono)' }}>
              {evt.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
              {evt.event}
            </span>
          </div>
        </div>

        {hasData && (
          <span style={{
            fontSize: 10, color: 'var(--t3)', flexShrink: 0, marginTop: 4,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s', display: 'inline-block',
          }}>▶</span>
        )}
      </button>

      {open && hasData && (
        <div style={{ padding: '0 16px 10px 34px', background: 'var(--bg-1)' }}>
          {evt.event === 'pre_rank'
            ? <PreRankTable data={evt.data} />
            : <DataTree data={evt.data} />
          }
        </div>
      )}
    </div>
  )
}

// ── Pre-rank dedicated renderer ──────────────────────────────────────────────

interface ScoredItem {
  rank: number
  kept: boolean
  score: number
  signals: string[]
  title: string
  category?: string
  format?: string
  traffic?: string
  cost_usd?: number
  dr?: number
  enriched: boolean
}

function signalColor(sig: string): string {
  if (sig.startsWith('+')) return '#10b981'
  if (sig.startsWith('-')) return '#ef4444'
  return '#6b7280'
}

function signalLabel(sig: string): string {
  // "+30_category" → "cat+30", "+20_traffic>1M" → "1M+20", "0_unenriched" → "no desc"
  const noPrefix = sig.replace(/^[+-]?\d+_/, '')
  const num = sig.match(/^([+-]?\d+)_/)?.[1] ?? ''
  const key = noPrefix.replace(/_/g, ' ')
  return num ? `${key} ${num}` : key
}

function PreRankTable({ data }: { data: Record<string, unknown> }) {
  const [filter, setFilter] = useState<'all' | 'kept' | 'dropped'>('all')
  const [showSignals, setShowSignals] = useState(false)

  const allScored = (data.all_scored as ScoredItem[] | undefined) ?? []
  const poolIn    = (data.pool_in    as number) ?? 0
  const batchOut  = (data.batch_out  as number) ?? 0
  const dropped   = (data.dropped    as number) ?? 0
  const scoreMax  = data.score_max  as number | undefined
  const scoreCut  = data.score_cut  as number | undefined
  const scoreMin  = data.score_min  as number | undefined
  const keptCat   = data.kept_by_category    as Record<string, number> | undefined
  const droppedCat = data.dropped_by_category as Record<string, number> | undefined

  const visible = filter === 'all'     ? allScored
                : filter === 'kept'    ? allScored.filter(i => i.kept)
                :                        allScored.filter(i => !i.kept)

  return (
    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--t3)' }}>analyzed <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{poolIn}</span></span>
        <span style={{ color: '#10b981' }}>kept <span style={{ fontWeight: 600 }}>{batchOut}</span></span>
        <span style={{ color: '#ef4444' }}>dropped <span style={{ fontWeight: 600 }}>{dropped}</span></span>
        {scoreMax !== undefined && (
          <span style={{ color: 'var(--t3)' }}>
            scores <span style={{ color: 'var(--t2)' }}>{scoreMax}</span>
            <span style={{ color: 'var(--t4)' }}> → cut </span>
            <span style={{ color: 'var(--t2)' }}>{scoreCut}</span>
            <span style={{ color: 'var(--t4)' }}> → </span>
            <span style={{ color: 'var(--t2)' }}>{scoreMin}</span>
          </span>
        )}
      </div>

      {/* Category distribution */}
      {keptCat && Object.keys(keptCat).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: 'var(--t4)', fontSize: 10 }}>kept by category: </span>
          {Object.entries(keptCat).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
            <span key={cat} style={{
              display: 'inline-block', marginRight: 6,
              fontSize: 10, color: '#10b981',
            }}>{cat} ({n})</span>
          ))}
        </div>
      )}
      {droppedCat && Object.keys(droppedCat).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: 'var(--t4)', fontSize: 10 }}>dropped by category: </span>
          {Object.entries(droppedCat).sort((a, b) => b[1] - a[1]).map(([cat, n]) => (
            <span key={cat} style={{
              display: 'inline-block', marginRight: 6,
              fontSize: 10, color: '#ef4444',
            }}>{cat} ({n})</span>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['all', 'kept', 'dropped'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none',
            cursor: 'pointer',
            background: filter === f ? 'var(--accent)' : 'var(--bg-2)',
            color:      filter === f ? 'white' : 'var(--t3)',
            fontFamily: 'var(--font-mono)',
          }}>
            {f === 'all' ? `all (${poolIn})` : f === 'kept' ? `kept (${batchOut})` : `dropped (${dropped})`}
          </button>
        ))}
        <button onClick={() => setShowSignals(v => !v)} style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--bd)',
          cursor: 'pointer', background: 'none',
          color: showSignals ? 'var(--accent)' : 'var(--t3)',
          marginLeft: 'auto',
        }}>
          {showSignals ? 'hide signals' : 'show signals'}
        </button>
      </div>

      {/* Ranked list */}
      <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--bd)', borderRadius: 4 }}>
        {visible.map((item) => (
          <div key={item.rank} style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            padding: '5px 8px',
            borderBottom: '1px solid var(--bd)',
            background: item.kept ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {/* Rank + score badge */}
              <span style={{ color: 'var(--t4)', width: 24, flexShrink: 0, textAlign: 'right' }}>
                #{item.rank}
              </span>
              <span style={{
                fontWeight: 700, fontSize: 11, width: 28, textAlign: 'center',
                color: item.kept ? '#10b981' : '#ef4444', flexShrink: 0,
              }}>
                {item.score}
              </span>
              {/* Kept / dropped indicator */}
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                color: item.kept ? '#10b981' : '#ef4444', flexShrink: 0, width: 48,
              }}>
                {item.kept ? '✓ KEPT' : '✗ DROP'}
              </span>
              {/* Title */}
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: 'var(--t1)',
              }}>
                {item.title}
              </span>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 8, paddingLeft: 58, flexWrap: 'wrap' }}>
              {item.category && (
                <span style={{ fontSize: 9, color: '#6366f1', background: 'rgba(99,102,241,0.1)', borderRadius: 3, padding: '0 4px' }}>
                  {item.category}
                </span>
              )}
              {item.format && (
                <span style={{ fontSize: 9, color: 'var(--t3)' }}>{item.format}</span>
              )}
              {item.traffic && (
                <span style={{ fontSize: 9, color: 'var(--t2)' }}>↑{item.traffic}</span>
              )}
              {item.dr !== undefined && (
                <span style={{ fontSize: 9, color: 'var(--t3)' }}>DR={item.dr}</span>
              )}
              {item.cost_usd !== undefined && (
                <span style={{ fontSize: 9, color: 'var(--t3)' }}>${item.cost_usd}</span>
              )}
              {item.enriched
                ? <span style={{ fontSize: 9, color: '#10b981' }}>enriched</span>
                : <span style={{ fontSize: 9, color: 'var(--t4)' }}>unenriched</span>
              }
            </div>

            {/* Signals */}
            {showSignals && item.signals.length > 0 && (
              <div style={{ display: 'flex', gap: 4, paddingLeft: 58, flexWrap: 'wrap' }}>
                {item.signals.map((sig, i) => (
                  <span key={i} style={{
                    fontSize: 9, color: signalColor(sig),
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {signalLabel(sig)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--t4)', textAlign: 'center' }}>
            no items
          </div>
        )}
      </div>
    </div>
  )
}

function DataTree({ data }: { data: Record<string, unknown> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Object.entries(data).map(([key, val]) => (
        <DataRow key={key} name={key} value={val} />
      ))}
    </div>
  )
}

function DataRow({ name, value }: { name: string; value: unknown }) {
  const [open, setOpen] = useState(false)
  const isComplex = Array.isArray(value) || (value !== null && typeof value === 'object')
  const isLongString = typeof value === 'string' && value.length > 120

  return (
    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <div
        style={{
          display: 'flex', gap: 6, cursor: (isComplex || isLongString) ? 'pointer' : 'default',
          alignItems: 'flex-start',
        }}
        onClick={() => (isComplex || isLongString) && setOpen(v => !v)}
      >
        <span style={{ color: 'var(--t3)', flexShrink: 0 }}>{name}:</span>
        {isComplex ? (
          <span style={{ color: 'var(--accent)' }}>
            {open ? '▼' : '▶'} {Array.isArray(value)
              ? `[${(value as unknown[]).length} items]`
              : `{${Object.keys(value as object).length} keys}`}
          </span>
        ) : isLongString ? (
          <span style={{ color: 'var(--t2)' }}>
            {open ? (value as string) : `${(value as string).substring(0, 100)}… ▶`}
          </span>
        ) : (
          <span style={{ color: typeof value === 'number' ? '#f59e0b' : 'var(--t1)' }}>
            {String(value)}
          </span>
        )}
      </div>

      {open && isComplex && (
        <div style={{ marginLeft: 12, borderLeft: '1px solid var(--bd)', paddingLeft: 8, marginTop: 2 }}>
          {Array.isArray(value)
            ? (value as unknown[]).map((item, i) => (
                <DataRow key={i} name={String(i)} value={item} />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <DataRow key={k} name={k} value={v} />
              ))
          }
        </div>
      )}
    </div>
  )
}

export function DebugToggleButton() {
  const debugOpen    = useChatStore(s => s.debugOpen)
  const setDebugOpen = useChatStore(s => s.setDebugOpen)
  const eventCount   = useChatStore(s => s.debugEvents.length)

  return (
    <button
      onClick={() => setDebugOpen(!debugOpen)}
      title="Toggle pipeline trace"
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 100,
        width: 40, height: 40, borderRadius: '50%',
        background: debugOpen ? 'var(--accent)' : 'var(--bg)',
        border: '1px solid var(--bd)',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: debugOpen ? 'white' : 'var(--t2)',
        transition: 'background 0.2s, color 0.2s',
      }}
      onMouseEnter={e => {
        if (!debugOpen) {
          e.currentTarget.style.background = 'var(--bg-2)'
          e.currentTarget.style.color = 'var(--t1)'
        }
      }}
      onMouseLeave={e => {
        if (!debugOpen) {
          e.currentTarget.style.background = 'var(--bg)'
          e.currentTarget.style.color = 'var(--t2)'
        }
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 5h10M3 8h10M3 11h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      {eventCount > 0 && !debugOpen && (
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--accent)', color: 'white',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--bg)',
        }}>
          {eventCount > 9 ? '9+' : eventCount}
        </span>
      )}
    </button>
  )
}
