export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageType =
  | 'CHAT_MESSAGE'
  | 'REQUEST_RECOMMENDATIONS'
  | 'ASSISTANT_MESSAGE'
  | 'ASSISTANT_STREAM_CHUNK'
  | 'ASSISTANT_STREAM_END'
  | 'RECOMMENDATIONS_READY'
  | 'CLARIFICATION_QUESTION'
  | 'MARKETING_PLAN_READY'
  | 'ERROR'
  | 'PING'
  | 'PONG'

export interface DeviceContext {
  lat?: number
  lon?: number
  language?: string
}

export interface WebSocketMessage {
  type: MessageType
  sessionId?: string
  content?: string
  payload?: unknown
  error?: string
  timestamp?: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  type?: 'text' | 'recommendations' | 'error' | 'plan'
  payload?: unknown
  suggestions?: string[]
  createdAt: Date
}

export interface ChatSession {
  id: string
  userId: string
  messages: ChatMessage[]
}
