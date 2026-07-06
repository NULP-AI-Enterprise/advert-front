'use client'

import { useChatStore } from '@/store/chatStore'
import { useChat } from '@/hooks/useChat'
import RecommendationCard from '../recommendation/RecommendationCard'

export default function RightPanel() {
  const recs = useChatStore(s => s.recommendations)
  const plan = useChatStore(s => s.marketingPlan)
  const { sendMessage } = useChat()

  if (!recs && !plan) return null

  return (
    <aside className="right-panel anim-in">
      <div className="right-panel-header">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2 2.5h4v4H2v-4zM9 2.5h4v4H9v-4zM2 9.5h4v3H2v-3zM9 9.5h4v3H9v-3z"
                stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"/>
        </svg>
        <h3>Media Placements</h3>
        {recs && <span className="badge">{recs.recommendations.length}</span>}
      </div>

      <div className="right-panel-body">
        {recs && <RecommendationCard data={recs} />}

        {recs && !plan && (
          <button
            onClick={() => sendMessage('create marketing plan')}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '10px 0',
              borderRadius: 8,
              border: '1px dashed var(--border)',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            ✦ Generate Marketing Plan
          </button>
        )}

        {plan && <MarketingPlanCard plan={plan} />}
      </div>
    </aside>
  )
}

function MarketingPlanCard({ plan }: { plan: NonNullable<ReturnType<typeof useChatStore>['marketingPlan']> }) {
  const totalPct = plan.placements.reduce((s, p) => s + (p.budget_share_pct ?? 0), 0)

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: 'var(--accent)', marginBottom: 10 }}>
        Marketing Plan
      </p>

      <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12, lineHeight: 1.5 }}>
        {plan.objective}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {plan.placements.map((p, i) => (
          <div key={i} style={{ fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ color: 'var(--t1)', fontWeight: 600, flex: 1, marginRight: 8 }}>{p.media_title}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>{p.budget_share_pct}%</span>
            </div>
            <div style={{ color: 'var(--t3)', fontSize: 11 }}>{p.suggested_format}</div>
            <div style={{
              height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'var(--accent)',
                width: `${totalPct > 0 ? (p.budget_share_pct / totalPct) * 100 : 0}%`,
                transition: 'width 0.4s',
              }} />
            </div>
          </div>
        ))}
      </div>

      {plan.total_budget_note && (
        <p style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>
          {plan.total_budget_note}
        </p>
      )}
      {plan.notes && (
        <p style={{ fontSize: 11, color: 'var(--t2)', fontStyle: 'italic', lineHeight: 1.5 }}>
          {plan.notes}
        </p>
      )}
    </div>
  )
}
