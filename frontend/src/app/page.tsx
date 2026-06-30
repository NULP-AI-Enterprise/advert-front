'use client'

import { useChatStore } from '@/store/chatStore'
import ChatContainer from '@/components/chat/ChatContainer'
import Sidebar from '@/components/layout/Sidebar'
import RightPanel from '@/components/layout/RightPanel'

export default function HomePage() {
  const newChat = useChatStore(s => s.newChat)
  return (
    <div className="app-shell">
      <Sidebar onNewChat={newChat} />
      <ChatContainer />
      <RightPanel />
    </div>
  )
}
