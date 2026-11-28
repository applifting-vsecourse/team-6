import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { SUPPORT_EMAIL } from "@/config/support"
import i18n from "@/i18n"

import { PrivacyPage } from "@/features/legal/components/PrivacyPage"

const headings = (level: number) =>
  screen.getAllByRole("heading", { level }).map((heading) => heading.textContent)

describe("PrivacyPage", () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage("en"))
  })

  it("covers every topic of the notice under one title", () => {
    render(<PrivacyPage />)

    expect(headings(1)).toEqual(["Privacy notice"])
    expect(headings(2)).toEqual([
      "Who is responsible",
      "What we keep, why and on what legal basis",
      "What not to write",
      "Who can see your data",
      "Where your data goes",
      "Cookies and browser storage",
      "How kvintets are suggested",
      "How long we keep it",
      "Your rights",
      "Complaints",
    ])
    expect(headings(3)).toEqual([
      "Account",
      "Profile",
      "Kvintets and chat",
      "Matching records",
      "Sign-in and security",
      "When you write to us",
    ])
    expect(screen.getByText("Last updated November 28, 2026")).toBeInTheDocument()
  })

  it("shows that the controller is still to be named, with a way to get in touch", () => {
    render(<PrivacyPage />)

    const placeholder = screen.getByRole("note")
    expect(placeholder).toHaveTextContent("Controller not decided yet")
    expect(placeholder).toHaveTextContent("[To be completed before launch:")
    const contacts = screen.getAllByRole("link", { name: SUPPORT_EMAIL })
    // The contact, access to one's data, and the other rights written in the same list.
    expect(contacts.length).toBeGreaterThanOrEqual(2)
    for (const link of contacts) expect(link).toHaveAttribute("href", `mailto:${SUPPORT_EMAIL}`)
  })

  it("answers requests by e-mail and offers no download", () => {
    const { container } = render(<PrivacyPage />)

    expect(screen.getByText(/Get a copy of your data/)).toHaveTextContent(
      `write to ${SUPPORT_EMAIL} from your account's e-mail address`,
    )
    expect(screen.getByText(/the administrator answers each request by hand/)).toHaveTextContent(
      "within one month",
    )
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/download (my|your) data/i)
  })

  it("names the supervisory authority and the map provider", () => {
    render(<PrivacyPage />)

    expect(screen.getByText(/Office for Personal Data Protection/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "uoou.gov.cz" })).toHaveAttribute(
      "href",
      "https://uoou.gov.cz",
    )
    expect(screen.getByRole("link", { name: "privacy policy" })).toHaveAttribute(
      "href",
      "https://osmfoundation.org/wiki/Privacy_Policy",
    )
  })

  it.each([
    ["en", "Privacy notice"],
    ["cs", "Ochrana soukromí"],
  ])("is fully translated into %s", async (language, title) => {
    await act(() => i18n.changeLanguage(language))
    const { container } = render(<PrivacyPage />)

    expect(headings(1)).toEqual([title])
    // No missing key, unfilled placeholder or unrendered link tag.
    expect(container).not.toHaveTextContent(/privacy\.|\{\{|<\/?(email|osm|uoou)>/)
    expect(screen.getByRole("link", { name: "uoou.gov.cz" })).toBeInTheDocument()
  })
})
