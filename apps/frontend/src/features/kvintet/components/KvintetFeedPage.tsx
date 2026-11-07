import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { LogoMark } from "@/components/LogoMark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/date"

import { kvintetFeedQueryOptions } from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { referenceQueryOptions } from "@/features/kvintet/api/referenceQueryOptions"
import { FeedFilters } from "@/features/kvintet/components/FeedFilters"
import { KvintetCard } from "@/features/kvintet/components/KvintetCard"
import { KvintetFeedSkeleton } from "@/features/kvintet/components/KvintetFeedSkeleton"
import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"
import { useJoinKvintet } from "@/features/kvintet/hooks/useJoinKvintet"
import { isApiError } from "@/features/kvintet/lib/apiError"
import type { Frequency } from "@/features/kvintet/lib/frequencies"

type KvintetFeedPageProps = {
  /** Category slugs from the URL; ones that are not known categories are ignored. */
  category: string[]
  frequency: Frequency[]
  onCategoryChange: (category: string[]) => void
  onFrequencyChange: (frequency: Frequency[]) => void
  /** Seed of the signed-in person's blobatar (username, else id), shown in the start dialog. */
  avatarSeed?: string
}

export function KvintetFeedPage({
  category,
  frequency,
  onCategoryChange,
  onFrequencyChange,
  avatarSeed,
}: KvintetFeedPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isStartOpen, setIsStartOpen] = useState(false)
  const reference = useQuery(referenceQueryOptions())
  const categories = reference.data?.categories
  const kvintets = useQuery(kvintetFeedQueryOptions())
  const items = kvintets.data?.items
  const join = useJoinKvintet()

  // The feed answers 409 to someone who is already in a kvintet.
  const isMember = isApiError(kvintets.error, "already_in_kvintet")
  useEffect(() => {
    if (!isMember) return
    toast.info(t("kvintet.alreadyMember"))
    void navigate({ to: ROUTES.overview, replace: true })
  }, [isMember, navigate, t])

  const activeCategories = categories
    ? category.filter((slug) => categories.some((item) => item.slug === slug))
    : category
  // Within a group any pick matches; a kvintet without a common frequency never matches a
  // frequency filter.
  const visible = items?.filter(
    (kvintet) =>
      (!activeCategories.length ||
        kvintet.categories.some((slug) => activeCategories.includes(slug))) &&
      (!frequency.length ||
        (kvintet.meetingFrequency !== null && frequency.includes(kvintet.meetingFrequency))),
  )
  const isFilteredEmpty = Boolean(items?.length) && visible?.length === 0

  const openStart = () => setIsStartOpen(true)
  const clearFilters = () => {
    onCategoryChange([])
    onFrequencyChange([])
  }

  return (
    // The padding sits outside the 1200px column, so the content lines up with the header's.
    <div className="px-4 pt-4 pb-22 md:pt-12">
      <div className="mx-auto flex w-full max-w-300 flex-col gap-5 md:gap-7">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1-mobile md:text-h1">{t("kvintet.title")}</h1>
            <p className="text-compact text-body md:text-lead">{t("kvintet.subtitle")}</p>
          </div>
          <Button
            className="max-sm:w-full"
            onClick={openStart}
          >
            {t("kvintet.startOwn.button")}
          </Button>
        </header>

        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
          {categories ? (
            <div className="md:w-57.5 md:shrink-0">
              <FeedFilters
                categories={categories}
                category={activeCategories}
                frequency={frequency}
                onCategoryChange={onCategoryChange}
                onFrequencyChange={onFrequencyChange}
              />
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            {kvintets.isPending ? <KvintetFeedSkeleton /> : null}

            {kvintets.isError && !isMember ? (
              <Alert
                variant="destructive"
                className="grid-cols-[0.5rem_1fr_auto]"
              >
                <AlertTitle className="col-start-2">{t("kvintet.error.title")}</AlertTitle>
                <AlertDescription className="col-start-2 row-start-2 text-sm">
                  {t("kvintet.error.text")}
                </AlertDescription>
                <Button
                  variant="outline"
                  className="col-start-3 row-span-2 row-start-1 text-foreground"
                  onClick={() => void kvintets.refetch()}
                >
                  {t("kvintet.error.retry")}
                </Button>
              </Alert>
            ) : null}

            {items?.length === 0 || isFilteredEmpty ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border px-6 py-12 text-center">
                <LogoMark className="size-12" />
                <h2 className="text-subheading font-semibold">
                  {isFilteredEmpty ? t("kvintet.emptyFiltered.title") : t("kvintet.empty.title")}
                </h2>
                <p className="text-sm text-body">
                  {isFilteredEmpty ? t("kvintet.emptyFiltered.text") : t("kvintet.empty.text")}
                </p>
                <Button
                  variant="outline"
                  onClick={openStart}
                >
                  {t("kvintet.startOwn.button")}
                </Button>
                {isFilteredEmpty ? (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    {t("kvintet.emptyFiltered.showAll")}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {visible?.length ? (
              <>
                {/* The design drops this line on a phone; screen readers keep it. */}
                <p className="font-mono text-meta tracking-meta text-muted-foreground uppercase max-md:sr-only">
                  {t("kvintet.count", {
                    count: visible.length,
                    formatted: formatNumber(visible.length),
                  })}
                </p>
                {kvintets.data?.fallback ? (
                  <p className="text-sm text-body">{t("kvintet.fallback")}</p>
                ) : null}
                <ul className="flex flex-col gap-5 sm:gap-3.5">
                  {visible.map((kvintet) => (
                    <li key={kvintet.id}>
                      <KvintetCard
                        kvintet={kvintet}
                        isJoining={join.isPending && join.variables === kvintet.id}
                        isDisabled={join.isPending}
                        onJoin={join.mutate}
                      />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <StartKvintetDialog
        isOpen={isStartOpen}
        avatarSeed={avatarSeed}
        onOpenChange={setIsStartOpen}
      />
    </div>
  )
}
