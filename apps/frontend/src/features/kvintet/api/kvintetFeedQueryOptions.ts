import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

const feedKvintetSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  capacity: z.number(),
  memberCount: z.number(),
  // Set only when every member picked the same value.
  meetingFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).nullable(),
  // Role and interests only: the feed never carries a name.
  members: z.array(
    z.object({
      position: z.string().nullable(),
      teach: z.array(z.string()),
      learn: z.array(z.string()),
      interests: z.array(z.string()),
    }),
  ),
})

export type FeedKvintet = z.infer<typeof feedKvintetSchema>

export const kvintetFeedQueryOptions = (category?: string) =>
  queryOptions({
    queryKey: kvintetKeys.feed(category),
    queryFn: async () =>
      z
        .array(feedKvintetSchema)
        .parse(
          await api
            .get("kvintets/feed", { searchParams: category ? { category } : undefined })
            .json(),
        ),
  })
