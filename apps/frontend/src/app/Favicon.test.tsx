import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Favicon } from "@/app/Favicon"
import { authKeys } from "@/lib/auth-keys"
import { faviconHref } from "@/lib/favicon"

// The query itself is not under test (it would call the network); the cache is.
vi.mock("@/features/auth/hooks/useSession", () => ({ useSession: () => ({ user: null }) }))

const svgLinks = () => document.querySelectorAll('link[rel="icon"][type="image/svg+xml"]')
const iconHref = () => svgLinks()[0]?.getAttribute("href")

const signedIn = (username: string) => ({
  user: { id: "u1", email: "a@b.cz", name: "A", username },
})

describe("Favicon", () => {
  let queryClient: QueryClient
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const signIn = (username: string) => {
    act(() => {
      queryClient.setQueryData(authKeys.session(), signedIn(username))
    })
  }

  beforeEach(() => {
    queryClient = new QueryClient()
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
  })
  afterEach(() => {
    document.head.innerHTML = ""
  })

  it("is the yellow mascot while nobody is signed in or has a username", () => {
    render(<Favicon />, { wrapper })
    expect(iconHref()).toBe(faviconHref("jana"))

    signIn("")
    expect(iconHref()).toBe(faviconHref("jana"))
  })

  it("swaps in a new link element, because Chrome ignores an edited href", () => {
    render(<Favicon />, { wrapper })
    const before = svgLinks()[0]

    signIn("petr")

    expect(svgLinks()).toHaveLength(1)
    expect(svgLinks()[0]).not.toBe(before)
  })

  it("follows the person live, with no re-render and no reload", () => {
    render(<Favicon />, { wrapper })

    signIn("petr")
    expect(iconHref()).toBe(faviconHref("petr"))

    // What sign-out (and sign-in, and sign-up) does to the cache.
    act(() => {
      queryClient.clear()
    })
    expect(iconHref()).toBe(faviconHref("jana"))

    signIn("eva")
    expect(iconHref()).toBe(faviconHref("eva"))
  })
})
