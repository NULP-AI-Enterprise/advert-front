'use client'

import { useChatStore } from '@/store/chatStore'
import RecommendationCard from '../recommendation/RecommendationCard'

export default function RightPanel() {
  const recs = useChatStore(s => s.recommendations)

  if (!recs) return null

  return (
    <aside className="right-panel anim-in">
      <div className="right-panel-tabs">
        <button className="btn btn-tab active">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="0.5" y="0.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="6.5" y="0.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="0.5" y="6.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/>
            <rect x="6.5" y="6.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
          Media
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontSize: 9, fontFamily: 'var(--font-mono)'
          }}>
            {recs.recommendations.length}
          </span>
        </button>
      </div>

      <div className="right-panel-body">
        <RecommendationCard data={recs} />
      </div>
    </aside>
  )
}
