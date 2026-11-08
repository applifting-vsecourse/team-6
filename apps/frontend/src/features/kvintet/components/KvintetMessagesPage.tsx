import type { ReactNode } from "react"
import { Link, Navigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Seo } from "@/components/Seo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"

type KvintetMessagesPageProps = {
  /** The chat belongs to another feature, and features may not import each other: the route supplies it. */
  renderChat: (chat: { kvintetId: string; currentUserId: string | undefined }) => ReactNode
}

export function KvintetMessagesPage({ renderChat }: KvintetMessagesPageProps) {
  const { t } = useTranslation()
  const { data: kvintet, isLoading, isError, refetch } = useMyKvintet()

  // The chat exists only for an active kvintet; everyone else (or someone who just left) goes back.
  if (!isLoading && !isError && kvintet?.status !== "ACTIVE") {
    return (
      <Navigate
        to={ROUTES.overview}
        replace
      />
    )
  }

  // On a phone the chat is full-bleed (no page padding, no card); from `md` it is a card on the page.
  return (
    <>
      <Seo title={t("chat.pageTitle")} />
      <div className="mx-auto flex w-full max-w-300 flex-col md:gap-5 md:px-4 md:py-12">
        {isLoading ? (
          <div className="flex flex-col gap-3 px-4 py-8 md:px-0 md:py-0">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ) : isError || !kvintet ? (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
            <h2 className="text-subheading text-destructive">{t("errors.somethingWentWrong")}</h2>
            <p className="text-body text-muted-foreground">{t("errors.internal_error")}</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
            >
              {t("common.reload")}
            </Button>
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-1.5 border-b border-border px-4 py-3 md:flex-row md:items-center md:gap-4 md:border-b-0 md:p-0">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  to={ROUTES.overview}
                  className="inline-flex w-fit items-center gap-1 text-label font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                  {t("nav.overview")}
                </Link>
                <h1 className="text-h3 md:text-h1">{kvintet.title}</h1>
                <p className="hidden text-lead text-muted-foreground md:block">
                  {t("chat.subtitle")}
                </p>
              </div>
              {/* One group of five, so the eyes can follow the cursor all the time (the list below is hover-only). */}
              <ul
                aria-label={t("chat.members")}
                className="flex space-x-1 md:shrink-0 md:-space-x-2"
              >
                {kvintet.members.map((member) => (
                  <li
                    key={member.userId}
                    title={member.name ?? undefined}
                  >
                    <GazeBlobatar
                      name={member.username ?? member.userId}
                      travel={6}
                      className="size-6.5 md:size-9"
                    />
                    {/* No name is written beside the face, so screen readers get it here. */}
                    {member.name && <span className="sr-only">{member.name}</span>}
                  </li>
                ))}
              </ul>
            </header>
            {renderChat({
              kvintetId: kvintet.id,
              currentUserId: kvintet.members.find((member) => member.isCurrentUser)?.userId,
            })}
          </>
        )}
      </div>
    </>
  )
}
