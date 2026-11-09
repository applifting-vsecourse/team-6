import { describe, expect, it } from "vitest"

import i18n from "@/i18n"

import { formatSharedPreferences } from "@/features/kvintet/lib/formatPreferences"

const none = {
  weekdays: false,
  weekends: false,
  mornings: false,
  afternoons: false,
  evenings: false,
}

describe("formatSharedPreferences", () => {
  const t = i18n.t.bind(i18n)

  it("lists the parts of the day, then the days, then the frequency", () => {
    expect(
      formatSharedPreferences(
        {
          commonAvailability: { ...none, weekdays: true, evenings: true },
          meetingFrequency: "BIWEEKLY",
        },
        t,
      ),
    ).toBe("evenings · weekdays · every two weeks")
  })

  it("is empty when members share nothing", () => {
    expect(formatSharedPreferences({ commonAvailability: none, meetingFrequency: null }, t)).toBe(
      "",
    )
  })
})
