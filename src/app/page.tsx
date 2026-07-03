'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/store/chatStore'
import { useAuthStore } from '@/store/authStore'
import ChatContainer from '@/components/chat/ChatContainer'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'

export default function HomePage() {
  const newChat = useChatStore(s => s.newChat)
  const token = useAuthStore(s => s.token)
  const router = useRouter()

  useEffect(() => {
    if (!token) router.replace('/auth/login')
  }, [token, router])

  if (!token) return null

  return (
    <div className="app-shell">
      <Sidebar onNewChat={newChat} />
      <ChatContainer />
      <RightPanel />
    </div>
  )
}
