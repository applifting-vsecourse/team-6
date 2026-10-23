import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { ChatPanel } from "@/features/chat/components/ChatPanel"
import { MyKvintetPage } from "@/features/kvintet/components/MyKvintetPage"
import { kvintetTabSchema } from "@/features/kvintet/lib/kvintetTab"

// The tab lives in the URL so a reload or a shared link lands on the same tab.
const kvintetSearchParamsSchema = z.object({
  tab: kvintetTabSchema.optional().catch(undefined),
})

export const Route = createFileRoute("/_ProtectedPages/kvintet/")({
  component: KvintetRoute,
  validateSearch: kvintetSearchParamsSchema,
})

function KvintetRoute() {
  const { tab = "overview" } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <MyKvintetPage
      tab={tab}
      renderChat={(currentUserId) => <ChatPanel currentUserId={currentUserId} />}
      onTabChange={(next) => void navigate({ search: { tab: next }, replace: true })}
    />
  )
}
