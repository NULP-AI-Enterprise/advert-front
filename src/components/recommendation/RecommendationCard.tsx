'use client'

import { RecommendationResponse, MediaItemDTO } from '@/types/recommendation'

export default function RecommendationCard({ data }: { data: RecommendationResponse }) {
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'var(--t3)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        {data.recommendations.length} placement{data.recommendations.length !== 1 ? 's' : ''} found
      </p>

      {/* Strategy reasoning block */}
      {data.reasoning && (
        <div style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: 'var(--bg-1)',
          border: '1px solid var(--bd)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: 8,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
          }}>
            Strategy
          </p>
          <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
            {data.reasoning}
          </p>
        </div>
      )}

      {data.recommendations.map((item, i) => (
        <MediaRow key={item.id} item={item} index={i} />
      ))}
    </div>
  )
}

function formatVisits(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${Math.round(v / 1_000)}K`
  return String(v)
}

function formatCost(v: number): string {
  return `$${v % 1 === 0 ? v : v.toFixed(2)}`
}

function MediaRow({ item, index }: { item: MediaItemDTO; index: number }) {
  const pct        = item.matchScore ?? 0
  const delay      = `${index * 0.06}s`
  const scoreColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--t3)'

  const hasMetrics = item.costUsd != null || item.similarwebVisits != null || item.ahrefsDr != null

  return (
    <div className="card anim-in" style={{ animationDelay: delay }}>

      {/* Header: title + score badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {item.url
                ? <a href={`https://${item.url}`} target="_blank" rel="noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}>
                    {item.title}
                  </a>
                : item.title}
            </p>
          </div>
          <p style={{
            fontSize: 12, color: 'var(--t2)', lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.matchReason ?? item.description}
          </p>
        </div>

        {/* Score badge */}
        <div style={{
          textAlign: 'center', flexShrink: 0,
          background: 'var(--bg-1)', borderRadius: 8,
          padding: '4px 8px', border: '1px solid var(--bd)',
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreColor, lineHeight: 1 }}>
            {pct}%
          </p>
          <p style={{ fontSize: 9, color: 'var(--t3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            match
          </p>
        </div>
      </div>

      {/* Score bar */}
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, var(--green), #34d399)'
              : 'linear-gradient(90deg, var(--accent), var(--accent-light))',
          }}
        />
      </div>

      {/* Key metrics: cost · traffic · DR */}
      {hasMetrics && (
        <div style={{
          display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap',
        }}>
          {item.costUsd != null && (
            <MetricChip label="Cost" value={formatCost(item.costUsd)} color="var(--green)" />
          )}
          {item.similarwebVisits != null && (
            <MetricChip label="Visits/mo" value={formatVisits(item.similarwebVisits)} color="var(--t2)" />
          )}
          {item.ahrefsDr != null && (
            <MetricChip label="DR" value={String(item.ahrefsDr)} color="var(--t2)" />
          )}
          {item.language && (
            <MetricChip label="Lang" value={item.language.split(',')[0].trim()} color="var(--t3)" />
          )}
        </div>
      )}

      {/* Tags */}
      {(item.category || (item.tags && item.tags.length > 0)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {item.category && <span className="tag accent-tag">{item.category}</span>}
          {item.tags?.slice(0, 3).map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      {/* Format / reach / budgetFit */}
      {(item.suggestedFormat || item.estimatedReach || item.budgetFit) && (
        <div style={{
          marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--bd)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            {item.suggestedFormat && (
              <span style={{
                fontSize: 11, color: 'var(--accent)', fontWeight: 500,
                background: 'var(--accent-bg)', padding: '2px 8px',
                borderRadius: 99, border: '1px solid var(--accent-bd)',
              }}>
                {item.suggestedFormat}
              </span>
            )}
            {item.estimatedReach && (
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 3, verticalAlign: 'middle' }}>
                  <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M2.5 5a2.5 2.5 0 015 0" stroke="currentColor" strokeWidth="1.1"/>
                </svg>
                {item.estimatedReach}
              </span>
            )}
          </div>
          {item.budgetFit && (
            <p style={{ fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>
              {item.budgetFit}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-1)', border: '1px solid var(--bd)',
      borderRadius: 6, padding: '3px 8px', minWidth: 44,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
        {value}
      </span>
      <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>
        {label}
      </span>
    </div>
  )
}
