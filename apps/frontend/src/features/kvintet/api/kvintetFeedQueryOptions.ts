import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

const feedKvintetSchema = z.object({
  id: z.string(),
  title: z.string(),
  categories: z.array(z.string()),
  capacity: z.number(),
  memberCount: z.number(),
  // Set only when every member picked the same value.
  meetingFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).nullable(),
  // Days and parts of the day that every member picked; never a place.
  commonAvailability: z.object({
    weekdays: z.boolean(),
    weekends: z.boolean(),
    mornings: z.boolean(),
    afternoons: z.boolean(),
    evenings: z.boolean(),
  }),
  // Role and interests only: the feed never carries a name.
  members: z.array(
    z.object({
      position: z.string().nullable(),
      teach: z.array(z.string()),
      learn: z.array(z.string()),
      interests: z.array(z.string()),
    }),
  ),
  // Why it suits the caller, strongest first. The server never sends a score.
  reasons: z.array(
    z.union([
      z.object({ code: z.enum(["learn", "teach", "interest"]), tag: z.string() }),
      z.object({ code: z.literal("topic"), category: z.string() }),
      z.object({ code: z.enum(["availability", "frequency", "roleMix"]) }),
    ]),
  ),
})

export type FeedKvintet = z.infer<typeof feedKvintetSchema>
export type FeedReason = FeedKvintet["reasons"][number]

const feedSchema = z.object({
  // Best match first.
  items: z.array(feedKvintetSchema),
  // Nothing reached the match threshold, so every open proposal is listed.
  fallback: z.boolean(),
})

// The whole feed is fetched once; the page filters it by category and frequency.
export const kvintetFeedQueryOptions = () =>
  queryOptions({
    queryKey: kvintetKeys.feed(),
    queryFn: async () => feedSchema.parse(await api.get("kvintets/feed").json()),
  })
