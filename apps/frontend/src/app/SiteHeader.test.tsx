import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SiteHeader } from "@/app/SiteHeader"

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isMember: false,
  isChatActive: false,
  unreadCount: 0,
  membershipEnabled: undefined as boolean | undefined,
  appHeaderProps: undefined as Record<string, unknown> | undefined,
}))

vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => ({ user: state.user }) }))
vi.mock("@/features/kvintet/hooks/useKvintetMembership", () => ({
  useKvintetMembership: (isEnabled: boolean) => {
    state.membershipEnabled = isEnabled
    return { isMember: state.isMember }
  },
}))
vi.mock("@/features/chat/hooks/useUnread", () => ({
  useUnreadMessages: () => ({ isChatActive: state.isChatActive, unreadCount: state.unreadCount }),
}))
vi.mock("@/features/auth/components/AppHeader", () => ({
  AppHeader: (props: Record<string, unknown>) => {
    state.appHeaderProps = props
    return null
  },
}))

describe("SiteHeader", () => {
  beforeEach(() => {
    Object.assign(state, {
      user: null,
      isMember: false,
      isChatActive: false,
      unreadCount: 0,
      membershipEnabled: undefined,
      appHeaderProps: undefined,
    })
  })

  it("does not ask a signed-out visitor whether they are in a kvintet", () => {
    render(<SiteHeader />)

    expect(state.membershipEnabled).toBe(false)
    expect(state.appHeaderProps?.navDisabled).toBeUndefined()
  })

  it("keeps 'Kvintets' available for someone who is in no kvintet", () => {
    state.user = { id: "u1" }

    render(<SiteHeader />)

    expect(state.membershipEnabled).toBe(true)
    expect(state.appHeaderProps?.navDisabled).toBeUndefined()
  })

  it("marks 'Kvintets' unavailable and passes the unread count for a member", () => {
    state.user = { id: "u1" }
    state.isMember = true
    state.isChatActive = true
    state.unreadCount = 2

    render(<SiteHeader />)

    expect(state.appHeaderProps?.navDisabled).toEqual({
      "/kvintet/feed": "You're already in a kvintet, so you can't browse others.",
    })
    expect(state.appHeaderProps?.chat).toEqual({ unreadCount: 2 })
  })
})
