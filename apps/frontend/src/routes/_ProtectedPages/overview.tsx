import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Seo } from "@/components/Seo"
import { Blobatar } from "@/components/ui/blobatar"
import { Button } from "@/components/ui/button"
import { formatDate, formatDayAndMonth, formatHeaderDate } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { messagesQueryOptions } from "@/features/chat/api/chatApi"
import { useSendMessage } from "@/features/chat/hooks/useMessages"
import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"
import {
  kvintetFeedQueryOptions,
  type FeedKvintet,
} from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { LeaveKvintetDialog } from "@/features/kvintet/components/LeaveKvintetDialog"
import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"
import { useJoinKvintet } from "@/features/kvintet/hooks/useJoinKvintet"
import { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"
import { profileQueryOptions } from "@/features/profile/api/profileApi"

type SlugLabel = ReturnType<typeof useSlugLabel>

const ICEBREAKER_KEYS = [
  "overview.active.icebreaker.q1",
  "overview.active.icebreaker.q2",
  "overview.active.icebreaker.q3",
  "overview.active.icebreaker.q4",
] as const

const HOME_SEAT_POSITIONS = [
  { left: 112, top: 10 },
  { left: 209, top: 80.5 },
  { left: 172, top: 194.5 },
  { left: 52, top: 194.5 },
  { left: 15, top: 80.5 },
]

export const Route = createFileRoute("/_ProtectedPages/overview")({
  loader: async ({ context }) => {
    // Overview is open to any signed-in user without forced redirect to onboarding.
    await context.queryClient.ensureQueryData(authSessionQueryOptions())
  },
  component: OverviewPage,
})

function OverviewPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const label = useSlugLabel()

  const profileQuery = useQuery(profileQueryOptions(user?.id))
  const profile = profileQuery.data
  const isOnboarded = Boolean(profile?.onboardingCompletedAt)

  const myKvintet = useMyKvintet()
  const kvintet = myKvintet.data

  const feedQuery = useQuery({
    ...kvintetFeedQueryOptions(),
    enabled: isOnboarded && !kvintet,
  })

  const messagesQuery = useQuery({
    ...messagesQueryOptions(kvintet?.id ?? ""),
    enabled: Boolean(isOnboarded && kvintet?.status === "ACTIVE" && kvintet?.id),
    refetchInterval: false,
  })

  const joinKvintet = useJoinKvintet()
  const sendMessageMutation = useSendMessage(kvintet?.id ?? "")

  const [leftKvintetTitle, setLeftKvintetTitle] = useState<string | null>(null)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [icebreakerIndex, setIcebreakerIndex] = useState(0)
  const icebreakerKey =
    ICEBREAKER_KEYS[icebreakerIndex % ICEBREAKER_KEYS.length] ?? ICEBREAKER_KEYS[0]

  const handleJoin = (id: string) => {
    setJoiningId(id)
    joinKvintet.mutate(id, {
      onSettled: () => setJoiningId(null),
    })
  }

  const handleLeave = () => {
    const title = kvintet?.title ?? null
    myKvintet.leave(undefined, {
      onSuccess: () => {
        setLeftKvintetTitle(title)
        setIsLeaveDialogOpen(false)
      },
    })
  }

  const handleSendIcebreaker = () => {
    const question = t(icebreakerKey)
    sendMessageMutation.mutate(question, {
      onSuccess: () => {
        toast.success(t("overview.active.icebreaker.sentToast"))
      },
      onError: (error) => {
        toast.error(getErrorMessage(error))
      },
    })
  }

  const firstName = user?.name.split(" ")[0]
  const headerDate = formatHeaderDate()

  const isInitialLoading = profileQuery.isLoading || (isOnboarded && myKvintet.isLoading)

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="w-full bg-background text-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-12 pb-22 md:px-16 lg:px-28">
          {/* Loading state */}
          {isInitialLoading && <OverviewSkeleton />}

          {/* Profile Error state */}
          {!isInitialLoading && profileQuery.isError && (
            <OverviewError
              error={profileQuery.error}
              onRetry={() => profileQuery.refetch()}
            />
          )}

          {/* My Kvintet Error state */}
          {!isInitialLoading && !profileQuery.isError && myKvintet.isError && (
            <OverviewError
              error={myKvintet.error}
              onRetry={() => myKvintet.refetch()}
            />
          )}

          {/* Content */}
          {!isInitialLoading && !profileQuery.isError && !myKvintet.isError && (
            <>
              {/* State 1: Profile not finished */}
              {!isOnboarded && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
                      {headerDate}
                    </p>
                    <h1 className="text-h1-mobile font-semibold text-foreground md:text-h1">
                      {firstName
                        ? t("overview.greeting", { name: firstName })
                        : t("overview.greetingAnonymous")}
                    </h1>
                    <p className="text-compact text-muted-foreground md:text-lead">
                      {t("overview.profileNotFinished.lead")}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-7 rounded-lg border border-border bg-card p-8 sm:flex-row">
                    <div className="size-28 shrink-0 overflow-hidden rounded-full">
                      <GazeBlobatar
                        name={user?.username ?? user?.id ?? "preview"}
                        animate="always"
                        travel={7}
                        className="size-28"
                      />
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-2.5">
                      <span className="font-mono text-meta font-medium tracking-meta text-highlight uppercase">
                        {t("overview.profileNotFinished.stepBadge")}
                      </span>
                      <h2 className="text-subheading font-semibold text-foreground">
                        {t("overview.profileNotFinished.title")}
                      </h2>
                      <p className="text-compact text-muted-foreground">
                        {t("overview.profileNotFinished.description")}
                      </p>
                      <Button asChild>
                        <Link to={ROUTES.onboarding}>
                          {t("overview.profileNotFinished.button")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* State 2: No Kvintet */}
              {isOnboarded && !kvintet && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
                      {headerDate}
                    </p>
                    <h1 className="text-h1-mobile font-semibold text-foreground md:text-h1">
                      {firstName
                        ? t("overview.greeting", { name: firstName })
                        : t("overview.greetingAnonymous")}
                    </h1>
                    <p className="text-compact text-muted-foreground md:text-lead">
                      {leftKvintetTitle
                        ? t("overview.noKvintet.leadAfterLeave")
                        : t("overview.noKvintet.lead")}
                    </p>
                  </div>

                  {leftKvintetTitle && (
                    <div className="flex items-center gap-3.5 rounded-lg border border-highlight bg-highlight/10 p-4.5">
                      <div className="size-11 shrink-0 overflow-hidden rounded-full">
                        <Blobatar
                          name="left-notice-seat"
                          className="size-11"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-compact font-medium text-foreground">
                          {t("overview.noKvintet.leftNotice", { title: leftKvintetTitle })}
                        </p>
                        <p className="text-small text-muted-foreground">
                          {t("overview.noKvintet.leftNoticeHint")}
                        </p>
                      </div>
                    </div>
                  )}

                  {feedQuery.isLoading && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-44 animate-pulse rounded-lg border border-border bg-card p-5"
                        />
                      ))}
                    </div>
                  )}

                  {feedQuery.isError && (
                    <OverviewError
                      error={feedQuery.error}
                      onRetry={() => feedQuery.refetch()}
                    />
                  )}

                  {feedQuery.isSuccess && feedQuery.data.items.length === 0 && (
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                      <p className="text-compact">{t("overview.noKvintet.empty")}</p>
                    </div>
                  )}

                  {feedQuery.isSuccess && feedQuery.data.items.length > 0 && (
                    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {feedQuery.data.items.slice(0, 3).map((proposal) => (
                        <ProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          isJoining={joiningId === proposal.id}
                          isDisabled={Boolean(joiningId)}
                          onJoin={handleJoin}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-compact font-medium text-foreground">
                        {t("overview.noKvintet.nothingFits")}
                      </p>
                      <p className="text-small text-muted-foreground">
                        {t("overview.noKvintet.startYourOwnHint")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        asChild
                      >
                        <Link to={ROUTES.kvintetFeed}>{t("overview.noKvintet.seeAll")}</Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsStartDialogOpen(true)}
                      >
                        {t("overview.noKvintet.startOwn")}
                      </Button>
                    </div>
                  </div>

                  <StartKvintetDialog
                    isOpen={isStartDialogOpen}
                    onOpenChange={setIsStartDialogOpen}
                  />
                </>
              )}

              {/* State 3: Forming Kvintet */}
              {isOnboarded && kvintet && kvintet.status === "FORMING" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
                      {headerDate}
                    </p>
                    <h1 className="text-h1-mobile font-semibold text-foreground md:text-h1">
                      {t("overview.forming.heading")}
                    </h1>
                    <p className="text-compact text-muted-foreground md:text-lead">
                      {kvintet.title}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-6 lg:flex-row">
                    {/* Left Card: Vote & Table */}
                    <div className="flex w-full flex-1 flex-col items-center gap-9 rounded-lg border border-border bg-card p-8 md:flex-row">
                      <HomeTableDiagram members={kvintet.members} />

                      <div className="flex w-full flex-1 flex-col items-start gap-3">
                        {kvintet.voteStatus.canVote ||
                        kvintet.voteStatus.userHasVoted ||
                        kvintet.members.length >= 3 ? (
                          <>
                            <span className="font-mono text-meta font-medium tracking-meta text-highlight uppercase">
                              {t("overview.forming.seatsStatus", {
                                seats: kvintet.members.length,
                                capacity: kvintet.capacity,
                                voted: kvintet.voteStatus.votedCount,
                                total: kvintet.voteStatus.totalCount,
                              })}
                            </span>
                            <h2 className="text-subheading font-semibold text-foreground">
                              {t("overview.forming.canVoteTitle")}
                            </h2>
                            <p className="text-compact text-muted-foreground">
                              {t("overview.forming.canVoteDescription", {
                                count: kvintet.members.length,
                              })}
                            </p>
                            <div className="pt-1">
                              {!kvintet.voteStatus.userHasVoted ? (
                                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                  <Button
                                    onClick={() => myKvintet.vote()}
                                    disabled={myKvintet.isVoting}
                                  >
                                    {myKvintet.isVoting
                                      ? t("kvintet.vote.voting")
                                      : t("overview.forming.voteButton")}
                                  </Button>
                                  <span className="text-small text-muted-foreground">
                                    {t("overview.forming.voteHint")}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-label font-medium text-highlight">
                                  ✓ {t("kvintet.vote.voted")}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="font-mono text-meta font-medium tracking-meta text-highlight uppercase">
                              {t("overview.forming.waitingSeatsStatus", {
                                seats: kvintet.members.length,
                                capacity: kvintet.capacity,
                              })}
                            </span>
                            <h2 className="text-subheading font-semibold text-foreground">
                              {t("overview.forming.waitingTitle")}
                            </h2>
                            <p className="text-compact text-muted-foreground">
                              {t("overview.forming.waitingDescription")}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Card: Who's here */}
                    <div className="flex w-full shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 lg:w-85">
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-h3 font-semibold text-foreground">
                          {t("overview.forming.whoTitle")}
                        </h3>
                        <p className="text-small text-muted-foreground">
                          {t("overview.forming.whoSubtitle")}
                        </p>
                      </div>

                      <div className="flex flex-col divide-y divide-border">
                        {kvintet.members.map((member, idx) => (
                          <div
                            key={member.userId}
                            className="flex items-center gap-3 py-2 first:pt-2"
                          >
                            <div className="size-8 shrink-0 overflow-hidden rounded-full">
                              <Blobatar
                                name={
                                  member.isCurrentUser
                                    ? (user?.username ?? user?.id ?? member.userId)
                                    : `${kvintet.id}-seat-${idx}`
                                }
                                className="size-8"
                              />
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <p className="truncate text-compact font-medium text-foreground">
                                {(member.role ? roleLabel(member.role, label) : null) ??
                                  member.name ??
                                  t("kvintet.members.openSeat")}
                                {member.isCurrentUser ? ` (${t("kvintet.members.you")})` : ""}
                              </p>
                              <p className="truncate text-small text-muted-foreground">
                                {describeMemberSummary(member, t, label)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLeaveDialogOpen(true)}
                        className="mt-1 cursor-pointer self-start text-label font-medium text-destructive underline underline-offset-2 transition-opacity hover:opacity-80"
                      >
                        {t("overview.forming.leaveKvintet")}
                      </button>
                    </div>
                  </div>

                  <LeaveKvintetDialog
                    isOpen={isLeaveDialogOpen}
                    onOpenChange={setIsLeaveDialogOpen}
                    onConfirm={handleLeave}
                    isLeaving={myKvintet.isLeaving}
                    isActiveKvintet={false}
                  />
                </>
              )}

              {/* State 4: Active Kvintet */}
              {isOnboarded && kvintet && kvintet.status === "ACTIVE" && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
                      {headerDate}
                    </p>
                    <h1 className="text-h1-mobile font-semibold text-foreground md:text-h1">
                      {t("overview.active.heading")}
                    </h1>
                    <p className="text-compact text-muted-foreground md:text-lead">
                      {t("overview.active.subtitle", {
                        title: kvintet.title,
                        count: kvintet.members.length,
                        date: formatDayAndMonth(new Date(kvintet.activatedAt ?? kvintet.createdAt)),
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-6 lg:flex-row">
                    {/* Left Card: Group */}
                    <div className="flex w-full flex-1 flex-col gap-6 rounded-lg border border-border bg-card p-8">
                      <div className="flex flex-col items-center gap-8 md:flex-row">
                        <HomeTableDiagram members={kvintet.members} />

                        <div className="flex w-full flex-1 flex-col items-start gap-3.5">
                          <h3 className="text-h3 font-semibold text-foreground">
                            {t("overview.active.chatHeading")}
                          </h3>

                          {messagesQuery.data?.messages.length ? (
                            <div className="flex w-full flex-col gap-1 rounded-md bg-secondary p-3 text-small">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium text-foreground">
                                  {messagesQuery.data.messages.at(-1)?.authorName ??
                                    t("chat.deletedMember")}
                                </span>
                                <span className="text-meta text-muted-foreground">
                                  {formatDate(
                                    new Date(messagesQuery.data.messages.at(-1)!.createdAt),
                                  )}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-small text-muted-foreground">
                                {messagesQuery.data.messages.at(-1)?.body}
                              </p>
                            </div>
                          ) : (
                            <p className="text-compact text-muted-foreground">
                              {t("overview.active.chatDescription")}
                            </p>
                          )}

                          <Button asChild>
                            <Link to={ROUTES.kvintetMessages}>{t("overview.active.openChat")}</Link>
                          </Button>

                          <div className="flex w-full flex-col items-start gap-1 border-t border-border pt-3.5">
                            <button
                              type="button"
                              onClick={() => setIsLeaveDialogOpen(true)}
                              className="cursor-pointer text-label font-medium text-destructive underline underline-offset-2 transition-opacity hover:opacity-80"
                            >
                              {t("overview.forming.leaveKvintet")}
                            </button>
                            <p className="text-small text-muted-foreground">
                              {t("overview.active.leaveHint")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Before next meeting */}
                    <div className="flex w-full shrink-0 flex-col gap-3 lg:w-90">
                      <p className="font-mono text-meta font-medium tracking-meta text-muted-foreground uppercase">
                        {t("overview.active.beforeMeeting")}
                      </p>

                      {/* Card 1: Icebreaker */}
                      <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-5">
                        <span className="text-label font-medium text-highlight">
                          {t("overview.active.icebreaker.label")}
                        </span>
                        <h3 className="text-h3 font-semibold text-foreground">
                          {t(icebreakerKey)}
                        </h3>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            disabled={sendMessageMutation.isPending}
                            onClick={handleSendIcebreaker}
                          >
                            {t("overview.active.icebreaker.send")}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setIcebreakerIndex((prev) => (prev + 1) % ICEBREAKER_KEYS.length)
                            }
                          >
                            {t("overview.active.icebreaker.another")}
                          </Button>
                        </div>
                      </div>

                      {/* Card 2: Tip */}
                      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
                        <span className="text-label font-medium text-highlight">
                          {t("overview.active.tip.label")}
                        </span>
                        <p className="text-compact text-muted-foreground">
                          {t("overview.active.tip.body")}
                        </p>
                      </div>

                      {/* Card 3: Next meeting */}
                      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
                        <span className="text-label font-medium text-highlight">
                          {t("overview.active.nextMeeting.label")}
                        </span>
                        <p className="text-compact text-muted-foreground">
                          {t("overview.active.nextMeeting.body")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <LeaveKvintetDialog
                    isOpen={isLeaveDialogOpen}
                    onOpenChange={setIsLeaveDialogOpen}
                    onConfirm={handleLeave}
                    isLeaving={myKvintet.isLeaving}
                    isActiveKvintet={true}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

function HomeTableDiagram({ members }: { members: KvintetMember[] }) {
  const { t } = useTranslation()

  return (
    <div
      className="relative size-[300px] shrink-0"
      role="img"
      aria-label={t("kvintet.table.title")}
    >
      <svg
        viewBox="0 0 300 300"
        className="pointer-events-none absolute inset-0 size-[300px]"
      >
        <circle
          cx="150"
          cy="150"
          r="102"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 5"
          className="text-border"
        />
      </svg>

      {HOME_SEAT_POSITIONS.map((pos, idx) => {
        const member = members[idx]
        if (!member) {
          return (
            <div
              key={`free-${idx}`}
              style={{ left: pos.left, top: pos.top }}
              className="absolute flex size-[76px] items-center justify-center"
            >
              <div className="size-[59.28px] rounded-full border-[1.5px] border-dashed border-input" />
            </div>
          )
        }

        const displayName =
          member.name ??
          member.role ??
          String(t("kvintet.diagram.memberNumber", { number: idx + 1 }))
        const label = member.isCurrentUser
          ? `${displayName} (${t("kvintet.members.you")})`
          : displayName

        return (
          <div
            key={member.userId || idx}
            style={{ left: pos.left, top: pos.top }}
            className="absolute flex size-[76px] items-center justify-center rounded-full"
          >
            <GazeBlobatar
              name={member.username ?? member.userId}
              title={label}
              className="size-[76px]"
            />
          </div>
        )
      })}
    </div>
  )
}

function ProposalCard({
  proposal,
  isJoining,
  isDisabled,
  onJoin,
}: {
  proposal: FeedKvintet
  isJoining: boolean
  isDisabled: boolean
  onJoin: (id: string) => void
}) {
  const { t } = useTranslation()
  const label = useSlugLabel()
  const freeSeats = Math.max(proposal.capacity - proposal.memberCount, 0)

  const metaParts: string[] = []
  if (proposal.categories.length > 0) {
    metaParts.push(proposal.categories.map((c) => label("categories", c)).join(", "))
  }
  if (proposal.meetingFrequency) {
    metaParts.push(t(`meetingFrequency.${proposal.meetingFrequency}`))
  }
  const metaText = metaParts.join(" · ")

  return (
    <div className="flex flex-col justify-between gap-3.5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-h3 font-semibold text-foreground">{proposal.title}</h3>
          <span className="shrink-0 font-mono text-meta font-medium text-muted-foreground">
            {proposal.memberCount} / {proposal.capacity}
          </span>
        </div>

        {/* Seats row */}
        <div className="flex items-center gap-1.5">
          {proposal.members.map((_, idx) => (
            <div
              key={idx}
              className="size-9 shrink-0 overflow-hidden rounded-full"
            >
              <Blobatar
                name={`${proposal.id}-seat-${idx}`}
                className="size-9"
              />
            </div>
          ))}
          {Array.from({ length: freeSeats }, (_, idx) => (
            <div
              key={`free-${idx}`}
              className="flex size-9 shrink-0 items-center justify-center"
            >
              <div className="size-7 rounded-full border-[1.5px] border-dashed border-input" />
            </div>
          ))}
        </div>

        <p className="line-clamp-1 text-small text-muted-foreground">{metaText || "—"}</p>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => onJoin(proposal.id)}
        disabled={isJoining || isDisabled}
      >
        {isJoining ? t("overview.noKvintet.joining") : t("overview.noKvintet.join")}
      </Button>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-lg border border-border bg-card" />
    </div>
  )
}

function OverviewError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/20 bg-destructive-soft p-8 text-center">
      <p className="text-compact text-destructive">{getErrorMessage(error)}</p>
      <Button
        variant="outline"
        onClick={onRetry}
      >
        {t("common.retry")}
      </Button>
    </div>
  )
}

function roleLabel(role: string, label: SlugLabel) {
  return role
    .split(", ")
    .map((slug) => label("roles", slug))
    .join(", ")
}

function describeMemberSummary(member: KvintetMember, t: TFunction, label: SlugLabel): string {
  const teaches = member.teachTags
    .map((s) => label("tags", s))
    .slice(0, 2)
    .join(", ")
  const wants = member.learnTags
    .map((s) => label("tags", s))
    .slice(0, 2)
    .join(", ")

  if (teaches && wants) {
    return t("overview.forming.teachesWants", { offers: teaches, seeks: wants })
  }
  if (teaches) {
    return t("overview.forming.teachesWantsFallback", { role: teaches })
  }
  if (member.role) {
    return label("roles", member.role)
  }
  return "—"
}
