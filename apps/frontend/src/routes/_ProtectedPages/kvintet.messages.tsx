import { createFileRoute } from "@tanstack/react-router"

import { ChatPanel } from "@/features/chat/components/ChatPanel"
import { KvintetMessagesPage } from "@/features/kvintet/components/KvintetMessagesPage"

export const Route = createFileRoute("/_ProtectedPages/kvintet/messages")({
  component: KvintetMessagesRoute,
})

function KvintetMessagesRoute() {
  return (
    <KvintetMessagesPage
      renderChat={({ kvintetId, currentUserId }) => (
        <ChatPanel
          key={kvintetId}
          kvintetId={kvintetId}
          currentUserId={currentUserId}
        />
      )}
    />
  )
}
