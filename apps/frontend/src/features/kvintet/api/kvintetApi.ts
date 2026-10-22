import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api, HTTPError } from "@/lib/api-client"

import { kvintetKeys } from "./kvintetKeys"

export const kvintetMemberSchema = z.object({
  userId: z.string(),
  name: z.string().nullable(),
  role: z.string().nullable(),
  teachTags: z.array(z.string()),
  learnTags: z.array(z.string()),
  interestTags: z.array(z.string()),
  hasVoted: z.boolean(),
  isCurrentUser: z.boolean(),
})

export type KvintetMember = z.infer<typeof kvintetMemberSchema>

export const kvintetVoteStatusSchema = z.object({
  canVote: z.boolean(),
  userHasVoted: z.boolean(),
  votedCount: z.number(),
  totalCount: z.number(),
})

export type KvintetVoteStatus = z.infer<typeof kvintetVoteStatusSchema>

export const kvintetDetailsSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["FORMING", "ACTIVE"]),
  createdAt: z.string(),
  activatedAt: z.string().nullable(),
  commonPreferences: z.string().nullable(),
  capacity: z.number(),
  openSeatsCount: z.number(),
  members: z.array(kvintetMemberSchema),
  voteStatus: kvintetVoteStatusSchema,
})

export type KvintetDetails = z.infer<typeof kvintetDetailsSchema>

export const myKvintetQueryOptions = () =>
  queryOptions({
    queryKey: kvintetKeys.mine(),
    queryFn: async (): Promise<KvintetDetails | null> => {
      try {
        const json = await api.get("kvintets/mine").json<unknown>()
        return kvintetDetailsSchema.parse(json)
      } catch (error) {
        if (
          error instanceof HTTPError &&
          (error.response.status === 403 || error.response.status === 404)
        ) {
          // User is authenticated but is not a member of any kvintet (empty state)
          return null
        }
        throw error
      }
    },
    // Architecture principle: Polling vote status every 10s without background refetching
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  })

export async function voteToStartKvintet(): Promise<KvintetDetails> {
  const json = await api.post("kvintets/mine/vote").json<unknown>()
  return kvintetDetailsSchema.parse(json)
}

export async function leaveKvintet(): Promise<{ success: boolean }> {
  return api.delete("kvintets/mine/membership").json<{ success: boolean }>()
}
