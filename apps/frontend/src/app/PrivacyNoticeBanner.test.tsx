import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PrivacyNoticeBanner } from "@/app/PrivacyNoticeBanner"

import { profileKeys } from "@/features/profile/api/profileApi"

const dismiss = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({ user: { id: "u1" } }),
}))
vi.mock("@/features/profile/hooks/useMarkPrivacyNoticeSeen", () => ({
  useMarkPrivacyNoticeSeen: () => ({ mutate: dismiss, isPending: false }),
}))

function renderBanner(profile: { privacyNoticeSeenAt: string | null } | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(profileKeys.me("u1"), profile)
  return render(
    <QueryClientProvider client={queryClient}>
      <PrivacyNoticeBanner />
    </QueryClientProvider>,
  )
}

describe("PrivacyNoticeBanner", () => {
  beforeEach(() => dismiss.mockClear())

  it("links to the privacy notice and can be dismissed once", async () => {
    renderBanner({ privacyNoticeSeenAt: null })

    expect(screen.getByRole("link", { name: "Read the privacy notice" })).toHaveAttribute(
      "href",
      "/privacy",
    )
    await userEvent.click(screen.getByRole("button", { name: "Got it" }))
    expect(dismiss).toHaveBeenCalledOnce()
  })

  it("is not shown once it was dismissed", () => {
    renderBanner({ privacyNoticeSeenAt: "2026-11-22T12:00:00.000Z" })

    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument()
  })

  it("is not shown to someone without a profile", () => {
    renderBanner(null)

    expect(screen.queryByRole("button", { name: "Got it" })).not.toBeInTheDocument()
  })
})
