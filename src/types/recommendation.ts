export interface MediaItemDTO {
  id: string
  title: string
  url?: string
  description?: string
  category?: string
  tags?: string[]
  audience?: Record<string, unknown>
  metrics?: Record<string, unknown>
  restrictions?: Record<string, unknown>

  // Placement specs (from PRNEW CSV)
  costUsd?: number
  similarwebVisits?: number
  ahrefsDr?: number
  mozDa?: number
  formatType?: string
  language?: string
  leadTimeHours?: number
  hyperlinksType?: string

  // LLM reasoning fields
  matchScore?: number
  matchReason?: string
  suggestedFormat?: string
  estimatedReach?: string
  budgetFit?: string
}

export interface RecommendationResponse {
  sessionId?: string
  recommendations: MediaItemDTO[]
  reasoning?: string
  appliedFilters?: Record<string, unknown>
  ctaMessage?: string
  suggestions?: string[]
}
