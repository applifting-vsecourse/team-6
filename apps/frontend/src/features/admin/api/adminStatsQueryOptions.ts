import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

const adminStatsSchema = z.object({
  users: z.object({
    registered: z.number(),
    onboarded: z.number(),
    activeToday: z.number(),
  }),
  kvintets: z.object({
    total: z.number(),
    active: z.number(),
    formingSmall: z.number(),
    formingReady: z.number(),
  }),
})

export type AdminStats = z.infer<typeof adminStatsSchema>

export const adminStatsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "stats"] as const,
    queryFn: async () => adminStatsSchema.parse(await api.get("admin/stats").json()),
  })
