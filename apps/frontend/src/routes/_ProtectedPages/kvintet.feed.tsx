import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { KvintetFeedPage } from "@/features/kvintet/components/KvintetFeedPage"
import { FREQUENCIES } from "@/features/kvintet/lib/frequencies"

// The filters live in the URL so a filtered feed can be shared and survives a reload. A single
// value (an old `?category=slug` link) counts as a list of one.
const listOrOne = <T extends z.ZodType>(item: T) =>
  z
    .union([item, z.array(item)])
    .optional()
    .catch(undefined)

const feedSearchParamsSchema = z.object({
  category: listOrOne(z.string()),
  frequency: listOrOne(z.enum(FREQUENCIES)),
})

const toList = <T,>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

// An empty filter leaves the URL clean.
const orUndefined = <T,>(list: T[]) => (list.length ? list : undefined)

export const Route = createFileRoute("/_ProtectedPages/kvintet/feed")({
  component: KvintetFeedRoute,
  validateSearch: feedSearchParamsSchema,
})

function KvintetFeedRoute() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user } = useSession()

  return (
    <>
      <Seo title={t("kvintet.title")} />
      <KvintetFeedPage
        category={toList(search.category)}
        frequency={toList(search.frequency)}
        avatarSeed={user ? (user.username ?? user.id) : undefined}
        onCategoryChange={(next) =>
          void navigate({ search: (prev) => ({ ...prev, category: orUndefined(next) }) })
        }
        onFrequencyChange={(next) =>
          void navigate({ search: (prev) => ({ ...prev, frequency: orUndefined(next) }) })
        }
      />
    </>
  )
}
