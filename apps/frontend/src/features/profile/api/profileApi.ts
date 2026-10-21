import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

export const tagSchema = z.object({
  id: z.string(),
  slug: z.string(),
})

export type Tag = z.infer<typeof tagSchema>

export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
})

export type City = z.infer<typeof citySchema>

export const referenceResponseSchema = z.object({
  cities: z.array(citySchema),
  tags: z.array(tagSchema),
})

export type ReferenceResponse = z.infer<typeof referenceResponseSchema>

export const meetingFrequencyEnum = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"])
export type MeetingFrequency = z.infer<typeof meetingFrequencyEnum>

export const profileResponseSchema = z
  .object({
    userId: z.string(),
    position: z.string().nullable().optional(),
    roles: z.array(z.string()).default([]),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    expectations: z.array(z.string()),
    meetingFrequency: meetingFrequencyEnum.nullable(),
    weekdays: z.boolean(),
    weekends: z.boolean(),
    mornings: z.boolean(),
    afternoons: z.boolean(),
    evenings: z.boolean(),
    cityId: z.string().nullable().optional(),
    cityName: z.string().nullable().optional(),
    radiusKm: z.number().nullable().optional(),
    note: z.string().nullable(),
    onboardingCompletedAt: z.string().nullable(),
    teaches: z.array(tagSchema),
    learns: z.array(tagSchema),
    interests: z.array(tagSchema),
  })
  .nullable()

export type ProfileResponse = z.infer<typeof profileResponseSchema>

export const saveProfileSchema = z.object({
  position: z.string().max(100).optional(),
  roles: z.array(z.string()).optional(),
  teachTagIds: z.array(z.string()),
  learnTagIds: z.array(z.string()),
  interestTagIds: z.array(z.string()),
  weekdays: z.boolean(),
  weekends: z.boolean(),
  mornings: z.boolean(),
  afternoons: z.boolean(),
  evenings: z.boolean(),
  cityId: z.string().nullable().optional(),
  radiusKm: z.number().min(1).max(500).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  expectations: z.array(z.string()).optional(),
  meetingFrequency: meetingFrequencyEnum.optional(),
  note: z.string().max(500).optional(),
  completeOnboarding: z.boolean().optional(),
})

export type SaveProfileInput = z.infer<typeof saveProfileSchema>

export const profileKeys = {
  all: ["profile"] as const,
  me: (userId?: string) =>
    userId ? ([...profileKeys.all, "me", userId] as const) : ([...profileKeys.all, "me"] as const),
  reference: () => ["reference"] as const,
}

export const referenceQueryOptions = () =>
  queryOptions({
    queryKey: profileKeys.reference(),
    queryFn: async (): Promise<ReferenceResponse> => {
      const res = await api.get("reference").json()
      return referenceResponseSchema.parse(res)
    },
    staleTime: 5 * 60 * 1000,
  })

export const profileQueryOptions = (userId?: string) =>
  queryOptions({
    queryKey: profileKeys.me(userId),
    queryFn: async (): Promise<ProfileResponse> => {
      const response = await api.get("me/profile")
      if (response.status === 204) return null
      const text = await response.text()
      if (!text || text.trim() === "") return null
      const json: unknown = JSON.parse(text)
      return profileResponseSchema.parse(json)
    },
    staleTime: 0,
  })

export const useSaveProfile = (userId?: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: SaveProfileInput) => {
      const res = await api.put("me/profile", { json: data }).json()
      return profileResponseSchema.parse(res)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me(userId), data)
    },
  })
}
