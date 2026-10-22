import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

const membershipSchema = z.object({ isMember: z.boolean() })

export const membershipQueryOptions = () =>
  queryOptions({
    queryKey: kvintetKeys.membership(),
    queryFn: async () => membershipSchema.parse(await api.get("kvintets/membership").json()),
  })
