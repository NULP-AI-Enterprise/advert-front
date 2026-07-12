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

function EventRow({ evt, index }: { evt: DebugEvent; index: number }) {
  const [open, setOpen] = useState(false)
  const colors = STAGE_COLORS[evt.stage]
  const hasData = Object.keys(evt.data).length > 0

  return (
    <div style={{
      borderBottom: '1px solid var(--bd)',
      transition: 'background 0.1s',
    }}>
      <button
        onClick={() => hasData && setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '8px 16px', background: 'none', border: 'none', cursor: hasData ? 'pointer' : 'default',
          textAlign: 'left',
        }}
        onMouseEnter={e => hasData && (e.currentTarget.style.background = 'var(--bg-1)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {/* Timeline dot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.dot }} />
          {index < 999 && (
            <div style={{ width: 1, height: 16, background: 'var(--bd)', marginTop: 2 }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Stage badge + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: colors.badge, color: colors.text,
              borderRadius: 4, padding: '1px 5px',
            }}>
              {STAGE_LABELS[evt.stage]}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', flex: 1 }}>
              {evt.label}
            </span>
          </div>
          {/* Timestamp + event key */}
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
            fontSize: 10, color: 'var(--t3)', flexShrink: 0, marginTop: 2,
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s',
            display: 'inline-block',
          }}>
            ▶
          </span>
        )}
      </button>

      {open && hasData && (
        <div style={{
          padding: '0 16px 10px 34px',
          background: 'var(--bg-1)',
        }}>
          <DataTree data={evt.data} />
        </div>
      )}
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
