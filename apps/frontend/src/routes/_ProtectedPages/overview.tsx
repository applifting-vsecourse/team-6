import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { AnonymousBlobatar, Face } from "@/components/AnonymousBlobatar"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { KvintetSeats, SeatTooltip, type SeatMember } from "@/components/KvintetSeats"
import { Seo } from "@/components/Seo"
import { StateAlert } from "@/components/StateAlert"
import { Blobatar } from "@/components/ui/blobatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import { formatDate, formatDayAndMonth, formatHeaderDate, formatList } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"
import { cn } from "@/lib/utils"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { messagesQueryOptions } from "@/features/chat/api/chatApi"
import { useSendMessage } from "@/features/chat/hooks/useMessages"
import { useUnreadMessages } from "@/features/chat/hooks/useUnread"
import type { KvintetDetails, KvintetMember } from "@/features/kvintet/api/kvintetApi"
import {
  kvintetFeedQueryOptions,
  type FeedKvintet,
} from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { LeaveKvintetDialog } from "@/features/kvintet/components/LeaveKvintetDialog"
import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"
import { useJoinKvintet } from "@/features/kvintet/hooks/useJoinKvintet"
import { useMyKvintet } from "@/features/kvintet/hooks/useMyKvintet"
import { formatSharedPreferences } from "@/features/kvintet/lib/formatPreferences"
import { useSlugLabel } from "@/features/kvintet/lib/useSlugLabel"
import { profileQueryOptions } from "@/features/profile/api/profileApi"

type SlugLabel = ReturnType<typeof useSlugLabel>

const ICEBREAKER_KEYS = [
  "overview.active.icebreaker.q1",
  "overview.active.icebreaker.q2",
  "overview.active.icebreaker.q3",
  "overview.active.icebreaker.q4",
] as const

// Seat and ring sizes read off Figma H3/H4 (desktop) and M5 (phone).
const RING_CLASS =
  "w-48 shrink-0 [--seat-radius:42%] [--seat:22%] md:w-72 md:[--seat-radius:35.4%] md:[--seat:20.1%]"

const LEAVE_BUTTON_CLASS =
  "cursor-pointer self-start text-label font-medium text-destructive underline underline-offset-2 transition-opacity hover:opacity-80"

/** You first, so the seat at the top of the ring and the first row of the list are yours. */
function youFirst(members: KvintetMember[]): KvintetMember[] {
  return [...members].sort((a, b) => Number(b.isCurrentUser) - Number(a.isCurrentUser))
}

/**
 * The same seed everywhere for the same person. You are seeded by your session, because the
 * kvintet carries no username for anyone while it forms; people you have not met get a seat seed,
 * grey.
 */
function seatSeed(
  kvintet: KvintetDetails,
  member: KvintetMember,
  index: number,
  ownSeed: string,
): SeatMember {
  // The server sends a name only for you, or for everyone once the kvintet is active.
  const tooltip = member.name?.trim() ? member.name : undefined
  if (member.isCurrentUser) return { seed: ownSeed, tooltip }
  return kvintet.status === "ACTIVE"
    ? { seed: member.username ?? member.userId, tooltip }
    : { seed: `${kvintet.id}-seat-${index}`, anonymous: true, tooltip }
}

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

  const profileQuery = useQuery(profileQueryOptions(user?.id))
  const profile = profileQuery.data
  const isOnboarded = Boolean(profile?.onboardingCompletedAt)

  const myKvintet = useMyKvintet(isOnboarded)
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

  // The same query as the header's badge, so asking again costs nothing.
  const { unreadCount } = useUnreadMessages(Boolean(isOnboarded && kvintet?.status === "ACTIVE"))

  // System lines ("kvintet_started", "Eva left") belong in the chat, not in this preview.
  const lastMessage = messagesQuery.data?.messages.findLast((m) => m.kind === "USER")

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

  const ownSeed = user?.username ?? user?.id ?? ""
  const firstName = user?.name.split(" ")[0]
  const headerDate = formatHeaderDate()

  const isInitialLoading = profileQuery.isLoading || (isOnboarded && myKvintet.isLoading)
  const hasLoadError = profileQuery.isError || myKvintet.isError

  // First time in this active kvintet: the "Kvintet begins" page, once.
  if (isOnboarded && kvintet?.status === "ACTIVE" && !kvintet.beginsSeen) {
    return (
      <Navigate
        to={ROUTES.kvintetBegins}
        replace
      />
    )
  }

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="w-full bg-background text-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-12 pb-22 md:px-16 lg:px-28">
          {/* Loading and error states keep the greeting, so the page does not jump when it loads. */}
          {(isInitialLoading || hasLoadError) && (
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
              </div>
              {isInitialLoading ? (
                <OverviewSkeleton />
              ) : (
                <OverviewError
                  title={t("overview.error.title")}
                  text={t("overview.error.text")}
                  onRetry={() => {
                    // Both can fail; refetch each one that did, so one retry clears them all.
                    if (profileQuery.isError) void profileQuery.refetch()
                    if (myKvintet.isError) void myKvintet.refetch()
                  }}
                />
              )}
            </>
          )}

          {/* Content */}
          {!isInitialLoading && !hasLoadError && (
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
                      title={t("kvintet.error.title")}
                      text={t("kvintet.error.text")}
                      onRetry={() => void feedQuery.refetch()}
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

                  <CommonTime kvintet={kvintet} />

                  <div className="flex flex-col items-start gap-6 lg:flex-row">
                    {/* Left Card: Vote & Table */}
                    <div className="flex w-full flex-1 flex-col items-center gap-9 rounded-lg border border-border bg-card p-8 md:flex-row">
                      <KvintetSeats
                        members={youFirst(kvintet.members).map((m, i) =>
                          seatSeed(kvintet, m, i, ownSeed),
                        )}
                        className={RING_CLASS}
                      />

                      <div className="flex w-full flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
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
                                <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
                                  <Button
                                    className="max-md:w-full"
                                    onClick={() => myKvintet.vote()}
                                    disabled={myKvintet.isVoting}
                                  >
                                    {myKvintet.isVoting
                                      ? t("kvintet.vote.voting")
                                      : t("overview.forming.voteButton")}
                                  </Button>
                                  <span className="text-small text-muted-foreground max-md:hidden">
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
                    <div className="hidden w-full shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 md:flex lg:w-85">
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-h3 font-semibold text-foreground">
                          {t("overview.forming.whoTitle")}
                        </h3>
                        <p className="text-small text-muted-foreground">
                          {t("overview.forming.whoSubtitle")}
                        </p>
                      </div>

                      <div className="flex flex-col divide-y divide-border">
                        <MemberRows
                          kvintet={kvintet}
                          ownSeed={ownSeed}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLeaveDialogOpen(true)}
                        className={`mt-1 ${LEAVE_BUTTON_CLASS}`}
                      >
                        {t("overview.forming.leaveKvintet")}
                      </button>
                    </div>
                  </div>

                  {/* M5: no "Who's here" list on a phone, so Leave sits under the card. */}
                  <button
                    type="button"
                    onClick={() => setIsLeaveDialogOpen(true)}
                    className={`md:hidden ${LEAVE_BUTTON_CLASS}`}
                  >
                    {t("overview.forming.leaveKvintet")}
                  </button>

                  <LeaveKvintetDialog
                    isOpen={isLeaveDialogOpen}
                    onOpenChange={setIsLeaveDialogOpen}
                    onConfirm={handleLeave}
                    isLeaving={myKvintet.isLeaving}
                    isActiveKvintet={false}
                    avatarSeed={user ? user.username || user.id : undefined}
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

                  <CommonTime kvintet={kvintet} />

                  <div className="flex flex-col items-start gap-6 lg:flex-row">
                    {/* Left Card: Group */}
                    <div className="flex w-full flex-1 flex-col gap-6 rounded-lg border border-border bg-card p-8">
                      <div className="flex flex-col items-center gap-8 md:flex-row">
                        <KvintetSeats
                          members={youFirst(kvintet.members).map((m, i) =>
                            seatSeed(kvintet, m, i, ownSeed),
                          )}
                          className={RING_CLASS}
                        />

                        <div className="flex w-full flex-1 flex-col items-start gap-3.5">
                          <h3 className="text-h3 font-semibold text-foreground">
                            {t("overview.active.chatHeading")}
                          </h3>

                          {lastMessage ? (
                            <div className="flex w-full flex-col gap-1 rounded-md bg-secondary p-3 text-small">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-medium text-foreground">
                                  {lastMessage.authorName ?? t("chat.deletedMember")}
                                </span>
                                <span className="text-meta text-muted-foreground">
                                  {formatDate(new Date(lastMessage.createdAt))}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-small text-muted-foreground">
                                {lastMessage.body}
                              </p>
                            </div>
                          ) : (
                            <p className="text-compact text-muted-foreground">
                              {t("overview.active.chatDescription")}
                            </p>
                          )}

                          <Button asChild>
                            <Link to={ROUTES.kvintetMessages}>
                              {unreadCount > 0
                                ? t("overview.active.openChatUnread", { count: unreadCount })
                                : t("overview.active.openChat")}
                            </Link>
                          </Button>

                          <div className="flex w-full flex-col items-start gap-1 border-t border-border pt-3.5">
                            <button
                              type="button"
                              onClick={() => setIsLeaveDialogOpen(true)}
                              className={LEAVE_BUTTON_CLASS}
                            >
                              {t("overview.forming.leaveKvintet")}
                            </button>
                            <p className="text-small text-muted-foreground">
                              {t("overview.active.leaveHint")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border pt-6">
                        <h3 className="text-h3 font-semibold text-foreground">
                          {t("overview.active.membersHeading")}
                        </h3>
                        <MemberRows
                          kvintet={kvintet}
                          ownSeed={ownSeed}
                        />
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
                    avatarSeed={user ? user.username || user.id : undefined}
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

  return (
    <div className="flex flex-col justify-between gap-3.5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-1.5">
          {proposal.categories.map((slug) => (
            <span
              key={slug}
              className="rounded-full border border-input px-2.5 py-0.75 text-small text-foreground"
            >
              {label("categories", slug)}
            </span>
          ))}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-h3 font-semibold text-foreground">{proposal.title}</h3>
          <span className="shrink-0 font-mono text-meta font-medium text-muted-foreground">
            {proposal.memberCount} / {proposal.capacity}
          </span>
        </div>

        {/* The feed never carries a name, so the faces are grey and seeded by the seat. */}
        <KvintetSeats
          layout="row"
          freeLabel={t("kvintet.vacancy")}
          members={proposal.members.map((member, idx) => ({
            seed: `${proposal.id}-seat-${idx}`,
            anonymous: true,
            label: member.position ? roleLabel(member.position, label) : t("kvintet.member"),
          }))}
        />

        <p className="text-small text-muted-foreground">
          {formatSharedPreferences(proposal, t) || "—"}
        </p>
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
  const { t } = useTranslation()
  return (
    <div
      role="status"
      className="flex flex-col gap-7"
    >
      <div
        aria-hidden="true"
        className="grid gap-4 md:grid-cols-3"
      >
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className={cn(
              "flex flex-col gap-3.5 rounded-lg border border-border bg-card p-5",
              card === 2 && "max-md:hidden",
            )}
          >
            <Skeleton className="h-4 w-45 max-w-full" />
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((seat) => (
                <Skeleton
                  key={seat}
                  className="size-10 rounded-full"
                />
              ))}
            </div>
            <Skeleton className="h-3 w-35 max-w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <p className="text-small text-muted-foreground">{t("overview.loading")}</p>
    </div>
  )
}

function OverviewError({
  title,
  text,
  onRetry,
}: {
  title: string
  text: string
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <StateAlert
      title={title}
      text={text}
    >
      <Button
        variant="outline"
        className="bg-card text-foreground"
        onClick={onRetry}
      >
        {t("common.retry")}
      </Button>
    </StateAlert>
  )
}

function roleLabel(role: string, label: SlugLabel) {
  return role
    .split(", ")
    .map((slug) => label("roles", slug))
    .join(", ")
}

/** The days and parts of the day that suit every member, never a place. */
function CommonTime({ kvintet }: { kvintet: KvintetDetails }) {
  const { t } = useTranslation()
  const prefs = kvintet.commonPreferences
  const when = prefs
    ? formatSharedPreferences(
        { commonAvailability: prefs, meetingFrequency: prefs.meetingFrequency },
        t,
      )
    : ""
  if (!when) return null
  return (
    <p className="rounded-lg border border-border bg-card px-5 py-3.5 text-compact text-muted-foreground">
      {t("overview.commonTime")} <span className="font-medium text-foreground">{when}</span>
    </p>
  )
}

/** Who is in the kvintet, with what each person teaches, wants to learn and is interested in. */
function MemberRows({ kvintet, ownSeed }: { kvintet: KvintetDetails; ownSeed: string }) {
  const { t } = useTranslation()
  const label = useSlugLabel()

  return (
    <TooltipProvider>
      <div className="flex flex-col divide-y divide-border">
        {youFirst(kvintet.members).map((member, idx) => {
          const { seed, anonymous: isAnonymous, tooltip } = seatSeed(kvintet, member, idx, ownSeed)
          const role = member.role ? roleLabel(member.role, label) : null
          const name = member.name?.trim() ? member.name : null
          // Names are hidden while the kvintet forms, so the role leads; once it is active the name does.
          const title =
            (kvintet.status === "ACTIVE" ? (name ?? role) : (role ?? name)) ??
            t("kvintet.members.openSeat")
          const lines = [
            { heading: t("kvintet.members.teaches"), slugs: member.teachTags },
            { heading: t("kvintet.members.wantsToLearn"), slugs: member.learnTags },
            { heading: t("kvintet.members.interests"), slugs: member.interestTags },
          ].filter((line) => line.slugs.length > 0)

          return (
            <div
              key={member.userId}
              className="flex items-start gap-3 py-2 first:pt-2"
            >
              <span className="size-8 shrink-0">
                <SeatTooltip text={tooltip}>
                  {isAnonymous ? (
                    <AnonymousBlobatar
                      seed={seed}
                      motion="hover"
                      className="size-full"
                    />
                  ) : (
                    <Face
                      seed={seed}
                      motion="hover"
                      className="size-full"
                    />
                  )}
                </SeatTooltip>
              </span>
              <div className="flex min-w-0 flex-col">
                <p className="text-compact font-medium text-foreground">
                  {title}
                  {member.isCurrentUser ? ` ${t("kvintet.members.you")}` : ""}
                  {name && role && kvintet.status === "ACTIVE" ? (
                    <span className="font-normal text-muted-foreground"> · {role}</span>
                  ) : null}
                </p>
                {lines.map(({ heading, slugs }) => (
                  <p
                    key={heading}
                    className="text-small text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{heading} </span>
                    {formatList(slugs.map((slug) => label("tags", slug)))}
                  </p>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
