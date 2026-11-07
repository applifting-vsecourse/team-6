import { describe, expect, it } from "vitest"

import { PREDEFINED_ROLES } from "@/features/profile/components/RoleSelector"

import { fieldOfRole, ROLE_FIELDS } from "./roleFields"

describe("ROLE_FIELDS", () => {
  it("puts every predefined role into exactly one field", () => {
    const grouped = ROLE_FIELDS.flatMap((field) => [...field.roles]).sort()

    expect(grouped).toEqual(PREDEFINED_ROLES.map((role) => role.slug).sort())
  })

  it("finds the field of a role", () => {
    expect(fieldOfRole("copywriter")).toBe("marketing")
    expect(fieldOfRole("not-a-role")).toBeUndefined()
  })
})
