'use client'

import { RecommendationResponse, MediaItemDTO } from '@/types/recommendation'

export default function RecommendationCard({ data }: { data: RecommendationResponse }) {
  return (
    <div>
      <p className="section-label">{data.recommendations.length} PLACEMENTS FOUND</p>
      {data.recommendations.map((item, i) => (
        <MediaRow key={item.id} item={item} index={i} />
      ))}
    </div>
  )
}

function MediaRow({ item, index }: { item: MediaItemDTO; index: number }) {
  const pct = item.matchScore ?? 0
  const delay = `${index * 0.05}s`

  return (
    <div className="card anim-in" style={{ animationDelay: delay }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', marginBottom: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--t2)', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.matchReason ?? item.description}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
            {pct}%
          </p>
          <p style={{ fontSize: 9, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>match</p>
        </div>
      </div>

      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%` }}/>
      </div>

      {(item.category || item.tags?.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {item.category && <span className="tag accent-tag">{item.category}</span>}
          {item.tags?.slice(0, 2).map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      {(item.suggestedFormat || item.estimatedReach) && (
        <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {item.suggestedFormat && (
            <span className="tag" style={{ color: 'var(--accent)' }}>
              {item.suggestedFormat}
            </span>
          )}
          {item.estimatedReach && (
            <span style={{ fontSize: 10, color: 'var(--t3)' }}>{item.estimatedReach}</span>
          )}
        </div>
      )}
    </div>
  )
}
