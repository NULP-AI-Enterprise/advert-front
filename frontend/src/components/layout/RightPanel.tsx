'use client'

import { useChatStore } from '@/store/chatStore'
import RecommendationCard from '../recommendation/RecommendationCard'

export default function RightPanel() {
  const recs = useChatStore(s => s.recommendations)

  if (!recs) return null

  return (
    <aside className="right-panel anim-in">
      <div className="right-panel-header">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2 2.5h4v4H2v-4zM9 2.5h4v4H9v-4zM2 9.5h4v3H2v-3zM9 9.5h4v3H9v-3z"
                stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        <h3>Media Placements</h3>
        <span className="badge">{recs.recommendations.length}</span>
      </div>

      <div className="right-panel-body">
        <RecommendationCard data={recs} />
      </div>
    </aside>
  )
}
