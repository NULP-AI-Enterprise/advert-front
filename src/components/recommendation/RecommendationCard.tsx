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
      {data.recommendations.map((item, i) => (
        <MediaRow key={item.id} item={item} index={i} />
      ))}
    </div>
  )
}

function MediaRow({ item, index }: { item: MediaItemDTO; index: number }) {
  const pct = item.matchScore ?? 0
  const delay = `${index * 0.06}s`
  const scoreColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--t3)'

  return (
    <div className="card anim-in" style={{ animationDelay: delay }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: 'var(--t1)',
            marginBottom: 4, lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.title}
          </p>
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

      {/* Tags */}
      {(item.category || (item.tags?.length > 0)) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
          {item.category && <span className="tag accent-tag">{item.category}</span>}
          {item.tags?.slice(0, 3).map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      {/* Format / reach */}
      {(item.suggestedFormat || item.estimatedReach) && (
        <div style={{
          marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--bd)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 6,
        }}>
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
      )}
    </div>
  )
}
