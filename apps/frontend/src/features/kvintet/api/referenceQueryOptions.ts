import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

import { api } from "@/lib/api-client"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"

const referenceSchema = z.object({
  categories: z.array(z.object({ slug: z.string() })),
})

export const referenceQueryOptions = () =>
  queryOptions({
    queryKey: kvintetKeys.reference(),
    queryFn: async () => referenceSchema.parse(await api.get("reference").json()),
    // Reference data changes with a deploy, not while someone is on the page.
    staleTime: 5 * 60_000,
  })
