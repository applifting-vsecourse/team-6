import type { ReactNode } from "react"
import { Link, Navigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
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
        to={ROUTES.myKvintet}
        replace
      />
    )
  }

  return (
    <>
      <Seo title={t("chat.pageTitle")} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:py-12">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24 rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </div>
        ) : isError || !kvintet ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
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
            <header className="flex flex-col gap-2">
              <Link
                to={ROUTES.myKvintet}
                className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                <ArrowLeft
                  className="size-4"
                  aria-hidden="true"
                />
                {t("nav.myKvintet")}
              </Link>
              <h1 className="text-title">{kvintet.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t("chat.subtitle", {
                  names: kvintet.members.flatMap((member) => member.name ?? []).join(", "),
                })}
              </p>
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
