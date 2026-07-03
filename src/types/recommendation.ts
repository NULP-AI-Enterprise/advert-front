export interface MediaItemDTO {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  audience: Record<string, unknown>
  metrics: Record<string, unknown>
  // V1 enrichment fields
  matchScore?: number
  matchReason?: string
  suggestedFormat?: string
  estimatedReach?: string
}

export interface RecommendationResponse {
  sessionId: string
  recommendations: MediaItemDTO[]
  explanation?: string
  appliedFilters?: Record<string, unknown>
}
