import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import i18n from "@/i18n"

import { HowItWorksPage } from "./HowItWorksPage"

describe("HowItWorksPage", () => {
  it("renders heading and key principles", () => {
    render(<HowItWorksPage />)

    expect(screen.getByRole("heading", { name: i18n.t("howItWorks.title") })).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: i18n.t("howItWorks.principlesTitle") }),
    ).toBeInTheDocument()
    expect(screen.getByText(i18n.t("howItWorks.step1Title"))).toBeInTheDocument()
    expect(screen.getByText(i18n.t("howItWorks.step2Title"))).toBeInTheDocument()
    expect(screen.getByText(i18n.t("howItWorks.step3Title"))).toBeInTheDocument()
  })
})
