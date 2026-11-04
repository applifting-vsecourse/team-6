import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Seo } from "@/components/Seo"
import { Blobatar } from "@/components/ui/blobatar"
import { api } from "@/lib/api-client"
import { formatDate } from "@/lib/date"
import { getErrorMessage } from "@/lib/errorMessage"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { messagesQueryOptions } from "@/features/chat/api/chatApi"
import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"
import {
  kvintetFeedQueryOptions,
  type FeedKvintet,
} from "@/features/kvintet/api/kvintetFeedQueryOptions"
import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"
import { LeaveKvintetDialog } from "@/features/kvintet/components/LeaveKvintetDialog"
import { StartKvintetDialog } from "@/features/kvintet/components/StartKvintetDialog"
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
  const { t, i18n } = useTranslation()
  const { user } = useSession()
  const queryClient = useQueryClient()
  const label = useSlugLabel()

  const profileQuery = useQuery(profileQueryOptions(user?.id))
  const profile = profileQuery.data
  const isOnboarded = Boolean(profile?.onboardingCompletedAt)

  const myKvintet = useMyKvintet()
  const kvintet = myKvintet.data

  const feedQuery = useQuery({
    ...kvintetFeedQueryOptions(),
    enabled: isOnboarded && !kvintet,
    refetchInterval: 10000,
  })

  const messagesQuery = useQuery({
    ...messagesQueryOptions(kvintet?.id ?? ""),
    enabled: Boolean(isOnboarded && kvintet?.status === "ACTIVE" && kvintet?.id),
    refetchInterval: 5000,
  })

  const [leftKvintetTitle, setLeftKvintetTitle] = useState<string | null>(null)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [icebreakerIndex, setIcebreakerIndex] = useState(0)
  const icebreakerKey =
    ICEBREAKER_KEYS[icebreakerIndex % ICEBREAKER_KEYS.length] ?? ICEBREAKER_KEYS[0]

  const handleJoin = async (id: string) => {
    setJoiningId(id)
    try {
      await api.post(`kvintets/${id}/members`)
      toast.success(t("kvintet.joined"))
      queryClient.setQueryData(kvintetKeys.membership(), { isMember: true })
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.mine() })
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.feed() })
    } catch (error) {
      toast.error(getErrorMessage(error))
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.feed() })
    } finally {
      setJoiningId(null)
    }
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

  const firstName = user?.name.split(" ")[0]
  const headerDate = formatHeaderDate(i18n.language)

  // Loading state
  const isInitialLoading = profileQuery.isLoading || (isOnboarded && myKvintet.isLoading)
  if (isInitialLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full bg-[#F5F6FA] text-[#10172A] dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-12 pb-[88px] md:px-16 lg:px-[120px]">
          <OverviewSkeleton />
        </div>
      </div>
    )
  }

  // Error state with retry
  if (profileQuery.isError) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full bg-[#F5F6FA] text-[#10172A] dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-12 pb-[88px] md:px-16 lg:px-[120px]">
          <OverviewError
            error={profileQuery.error}
            onRetry={() => profileQuery.refetch()}
          />
        </div>
      </div>
    )
  }

  if (myKvintet.isError) {
    return (
      <div className="min-h-[calc(100vh-64px)] w-full bg-[#F5F6FA] text-[#10172A] dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-12 pb-[88px] md:px-16 lg:px-[120px]">
          <OverviewError
            error={myKvintet.error}
            onRetry={() => myKvintet.refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="min-h-[calc(100vh-64px)] w-full bg-[#F5F6FA] text-[#10172A] dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-6 py-12 pb-[88px] md:px-16 lg:px-[120px]">
          {/* State 1: Profile not finished */}
          {!isOnboarded && (
            <>
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#5B6582] uppercase dark:text-slate-400">
                  {headerDate}
                </p>
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.01em] text-[#10172A] dark:text-white">
                  {firstName
                    ? t("overview.greeting", { name: firstName })
                    : t("overview.greetingAnonymous")}
                </h1>
                <p className="text-[17px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                  {t("overview.profileNotFinished.lead")}
                </p>
              </div>

              <div className="flex flex-col items-center gap-7 rounded-[12px] border border-[#DDE2EC] bg-white p-8 sm:flex-row dark:border-slate-800 dark:bg-slate-900">
                <div className="size-28 shrink-0 overflow-hidden rounded-full">
                  <GazeBlobatar
                    name={user?.username ?? user?.id ?? "preview"}
                    animate="always"
                    travel={7}
                    className="size-28"
                  />
                </div>
                <div className="flex flex-1 flex-col items-start gap-2.5">
                  <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#2F5BD3] uppercase dark:text-blue-400">
                    {t("overview.profileNotFinished.stepBadge")}
                  </span>
                  <h2 className="text-[22px] leading-[1.3] font-semibold tracking-[-0.005em] text-[#10172A] dark:text-white">
                    {t("overview.profileNotFinished.title")}
                  </h2>
                  <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                    {t("overview.profileNotFinished.description")}
                  </p>
                  <Link
                    to={ROUTES.onboarding}
                    className="inline-flex items-center justify-center rounded-[8px] bg-[#10172A] px-[18px] py-[11px] text-[14px] font-medium text-white transition-colors hover:bg-[#1E293B] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {t("overview.profileNotFinished.button")}
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* State 2: No Kvintet */}
          {isOnboarded && !kvintet && (
            <>
              <div className="flex flex-col gap-1.5">
                <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#5B6582] uppercase dark:text-slate-400">
                  {headerDate}
                </p>
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.01em] text-[#10172A] dark:text-white">
                  {firstName
                    ? t("overview.greeting", { name: firstName })
                    : t("overview.greetingAnonymous")}
                </h1>
                <p className="text-[17px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                  {leftKvintetTitle
                    ? t("overview.noKvintet.leadAfterLeave")
                    : t("overview.noKvintet.lead")}
                </p>
              </div>

              {leftKvintetTitle && (
                <div className="flex items-center gap-3.5 rounded-[12px] border border-[#2F5BD3] bg-[#E3EBFF] p-[18px] dark:border-blue-600 dark:bg-blue-950/40">
                  <div className="size-11 shrink-0 overflow-hidden rounded-full">
                    <Blobatar
                      name="left-notice-seat"
                      className="size-11"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[15px] leading-[1.5] font-medium text-[#10172A] dark:text-white">
                      {t("overview.noKvintet.leftNotice", { title: leftKvintetTitle })}
                    </p>
                    <p className="text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
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
                      className="h-44 animate-pulse rounded-[12px] border border-[#DDE2EC] bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
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

              {feedQuery.isSuccess && feedQuery.data.length === 0 && (
                <div className="rounded-[12px] border border-[#DDE2EC] bg-white p-8 text-center text-[#5B6582] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <p className="text-[15px]">{t("overview.noKvintet.empty")}</p>
                </div>
              )}

              {feedQuery.isSuccess && feedQuery.data.length > 0 && (
                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {feedQuery.data.slice(0, 3).map((proposal) => (
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

              <div className="flex flex-col items-start justify-between gap-4 border-t border-[#DDE2EC] pt-5 sm:flex-row sm:items-center dark:border-slate-800">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] leading-[1.5] font-medium text-[#10172A] dark:text-white">
                    {t("overview.noKvintet.nothingFits")}
                  </p>
                  <p className="text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
                    {t("overview.noKvintet.startYourOwnHint")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    to={ROUTES.kvintetFeed}
                    className="rounded-[8px] px-[18px] py-[11px] text-[14px] font-medium text-[#10172A] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                  >
                    {t("overview.noKvintet.seeAll")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsStartDialogOpen(true)}
                    className="cursor-pointer rounded-[8px] border border-[#B8C0D3] bg-white px-[18px] py-[11px] text-[14px] font-medium text-[#10172A] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/80"
                  >
                    {t("overview.noKvintet.startOwn")}
                  </button>
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
                <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#5B6582] uppercase dark:text-slate-400">
                  {headerDate}
                </p>
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.01em] text-[#10172A] dark:text-white">
                  {t("overview.forming.heading")}
                </h1>
                <p className="text-[17px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                  {kvintet.title}
                </p>
              </div>

              <div className="flex flex-col items-start gap-6 lg:flex-row">
                {/* Left Card: Vote & Table */}
                <div className="flex w-full flex-1 flex-col items-center gap-9 rounded-[12px] border border-[#DDE2EC] bg-white p-8 md:flex-row dark:border-slate-800 dark:bg-slate-900">
                  <HomeTableDiagram members={kvintet.members} />

                  <div className="flex w-full flex-1 flex-col items-start gap-3">
                    {kvintet.voteStatus.canVote ||
                    kvintet.voteStatus.userHasVoted ||
                    kvintet.members.length >= 3 ? (
                      <>
                        <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#2F5BD3] uppercase dark:text-blue-400">
                          {t("overview.forming.seatsStatus", {
                            seats: kvintet.members.length,
                            capacity: kvintet.capacity,
                            voted: kvintet.voteStatus.votedCount,
                            total: kvintet.voteStatus.totalCount,
                          })}
                        </span>
                        <h2 className="text-[22px] leading-[1.3] font-semibold tracking-[-0.005em] text-[#10172A] dark:text-white">
                          {t("overview.forming.canVoteTitle")}
                        </h2>
                        <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                          {t("overview.forming.canVoteDescription", {
                            count: kvintet.members.length,
                          })}
                        </p>
                        <div className="pt-1">
                          {!kvintet.voteStatus.userHasVoted ? (
                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                              <button
                                type="button"
                                onClick={() => myKvintet.vote()}
                                disabled={myKvintet.isVoting}
                                className="cursor-pointer rounded-[8px] bg-[#10172A] px-[18px] py-[11px] text-[14px] font-medium text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                              >
                                {myKvintet.isVoting
                                  ? t("kvintet.vote.voting")
                                  : t("overview.forming.voteButton")}
                              </button>
                              <span className="text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
                                {t("overview.forming.voteHint")}
                              </span>
                            </div>
                          ) : (
                            <p className="text-[14px] font-medium text-[#2F5BD3] dark:text-blue-400">
                              ✓ {t("kvintet.vote.voted")}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#2F5BD3] uppercase dark:text-blue-400">
                          {t("overview.forming.waitingSeatsStatus", {
                            seats: kvintet.members.length,
                            capacity: kvintet.capacity,
                          })}
                        </span>
                        <h2 className="text-[22px] leading-[1.3] font-semibold tracking-[-0.005em] text-[#10172A] dark:text-white">
                          {t("overview.forming.waitingTitle")}
                        </h2>
                        <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                          {t("overview.forming.waitingDescription")}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Card: Who's here */}
                <div className="flex w-full shrink-0 flex-col gap-3 rounded-[12px] border border-[#DDE2EC] bg-white p-5 lg:w-[340px] dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[17px] leading-[1.35] font-semibold text-[#10172A] dark:text-white">
                      {t("overview.forming.whoTitle")}
                    </h3>
                    <p className="text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
                      {t("overview.forming.whoSubtitle")}
                    </p>
                  </div>

                  <div className="flex flex-col divide-y divide-[#DDE2EC] dark:divide-slate-800">
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
                          <p className="truncate text-[14px] leading-[1.4] font-medium text-[#10172A] dark:text-white">
                            {(member.role ? roleLabel(member.role, label) : null) ??
                              member.name ??
                              t("kvintet.members.openSeat")}
                            {member.isCurrentUser ? ` (${t("kvintet.members.you")})` : ""}
                          </p>
                          <p className="truncate text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
                            {describeMemberSummary(member, t, label)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLeaveDialogOpen(true)}
                    className="mt-1 cursor-pointer self-start text-[14px] font-medium text-[#C93B3B] underline underline-offset-2 transition-opacity hover:opacity-80 dark:text-red-400"
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
                <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#5B6582] uppercase dark:text-slate-400">
                  {headerDate}
                </p>
                <h1 className="text-[32px] leading-[1.2] font-semibold tracking-[-0.01em] text-[#10172A] dark:text-white">
                  {t("overview.active.heading")}
                </h1>
                <p className="text-[17px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                  {t("overview.active.subtitle", {
                    title: kvintet.title,
                    count: kvintet.members.length,
                    date: formatStartDate(
                      new Date(kvintet.activatedAt ?? kvintet.createdAt),
                      i18n.language,
                    ),
                  })}
                </p>
              </div>

              <div className="flex flex-col items-start gap-6 lg:flex-row">
                {/* Left Card: Group */}
                <div className="flex w-full flex-1 flex-col gap-6 rounded-[12px] border border-[#DDE2EC] bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col items-center gap-8 md:flex-row">
                    <HomeTableDiagram members={kvintet.members} />

                    <div className="flex w-full flex-1 flex-col items-start gap-3.5">
                      <h3 className="text-[17px] leading-[1.35] font-semibold text-[#10172A] dark:text-white">
                        {t("overview.active.chatHeading")}
                      </h3>

                      {messagesQuery.data?.messages.length ? (
                        <div className="flex w-full flex-col gap-1 rounded-[8px] bg-[#F5F6FA] p-3 text-[13px] dark:bg-slate-800">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-medium text-[#10172A] dark:text-white">
                              {messagesQuery.data.messages.at(-1)?.authorName ??
                                t("chat.deletedMember")}
                            </span>
                            <span className="text-[11px] text-[#5B6582] dark:text-slate-400">
                              {formatDate(new Date(messagesQuery.data.messages.at(-1)!.createdAt))}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-[13px] text-[#5B6582] dark:text-slate-400">
                            {messagesQuery.data.messages.at(-1)?.body}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                          {t("overview.active.chatDescription")}
                        </p>
                      )}

                      <Link
                        to={ROUTES.kvintetMessages}
                        className="inline-flex items-center justify-center rounded-[8px] bg-[#10172A] px-[18px] py-[11px] text-[14px] font-medium text-white transition-colors hover:bg-[#1E293B] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      >
                        {t("overview.active.openChat")}
                      </Link>

                      <div className="flex w-full flex-col items-start gap-1 border-t border-[#DDE2EC] pt-3.5 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsLeaveDialogOpen(true)}
                          className="cursor-pointer text-[14px] font-medium text-[#C93B3B] underline underline-offset-2 transition-opacity hover:opacity-80 dark:text-red-400"
                        >
                          {t("overview.forming.leaveKvintet")}
                        </button>
                        <p className="text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
                          {t("overview.active.leaveHint")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Before next meeting */}
                <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[360px]">
                  <p className="font-mono text-[11px] font-medium tracking-[0.08em] text-[#5B6582] uppercase dark:text-slate-400">
                    {t("overview.active.beforeMeeting")}
                  </p>

                  {/* Card 1: Icebreaker */}
                  <div className="flex flex-col gap-2.5 rounded-[12px] border border-[#DDE2EC] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[14px] leading-[1.4] font-medium text-[#2F5BD3] dark:text-blue-400">
                      {t("overview.active.icebreaker.label")}
                    </span>
                    <h3 className="text-[17px] leading-[1.35] font-semibold text-[#10172A] dark:text-white">
                      {t(icebreakerKey)}
                    </h3>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={ROUTES.kvintetMessages}
                        className="inline-flex items-center justify-center rounded-[8px] border border-[#B8C0D3] bg-white px-[18px] py-[11px] text-[14px] font-medium text-[#10172A] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/80"
                      >
                        {t("overview.active.icebreaker.send")}
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setIcebreakerIndex((prev) => (prev + 1) % ICEBREAKER_KEYS.length)
                        }
                        className="cursor-pointer rounded-[8px] px-[18px] py-[11px] text-[14px] font-medium text-[#10172A] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                      >
                        {t("overview.active.icebreaker.another")}
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Tip */}
                  <div className="flex flex-col gap-2 rounded-[12px] border border-[#DDE2EC] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[14px] leading-[1.4] font-medium text-[#2F5BD3] dark:text-blue-400">
                      {t("overview.active.tip.label")}
                    </span>
                    <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
                      {t("overview.active.tip.body")}
                    </p>
                  </div>

                  {/* Card 3: Next meeting */}
                  <div className="flex flex-col gap-2 rounded-[12px] border border-[#DDE2EC] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-[14px] leading-[1.4] font-medium text-[#2F5BD3] dark:text-blue-400">
                      {t("overview.active.nextMeeting.label")}
                    </span>
                    <p className="text-[15px] leading-[1.5] text-[#5B6582] dark:text-slate-400">
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
          stroke="#DDE2EC"
          strokeWidth="1"
          strokeDasharray="3 5"
          className="dark:stroke-slate-800"
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
              <div className="size-[59.28px] rounded-full border-[1.5px] border-dashed border-[#B8C0D3] dark:border-slate-600" />
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
            className="absolute flex size-[76px] items-center justify-center rounded-full shadow-sm"
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
  if (proposal.category) {
    metaParts.push(label("categories", proposal.category))
  }
  if (proposal.meetingFrequency) {
    metaParts.push(t(`meetingFrequency.${proposal.meetingFrequency}`))
  }
  const metaText = metaParts.join(" · ")

  return (
    <div className="flex flex-col justify-between gap-3.5 rounded-[12px] border border-[#DDE2EC] bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 text-[17px] leading-[1.35] font-semibold text-[#10172A] dark:text-white">
            {proposal.title}
          </h3>
          <span className="shrink-0 font-mono text-[11px] font-medium text-[#5B6582] dark:text-slate-400">
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
              <div className="size-[28px] rounded-full border-[1.5px] border-dashed border-[#B8C0D3] dark:border-slate-600" />
            </div>
          ))}
        </div>

        <p className="line-clamp-1 text-[13px] leading-[1.45] text-[#5B6582] dark:text-slate-400">
          {metaText || "—"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onJoin(proposal.id)}
        disabled={isJoining || isDisabled}
        className="w-full cursor-pointer rounded-[8px] border border-[#B8C0D3] bg-white px-[18px] py-[11px] text-center text-[14px] font-medium text-[#10172A] transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/80"
      >
        {isJoining ? t("overview.noKvintet.joining") : t("overview.noKvintet.join")}
      </button>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-32 animate-pulse rounded bg-[#DDE2EC] dark:bg-slate-800" />
        <div className="h-9 w-64 animate-pulse rounded bg-[#DDE2EC] dark:bg-slate-800" />
        <div className="h-5 w-48 animate-pulse rounded bg-[#DDE2EC] dark:bg-slate-800" />
      </div>
      <div className="h-56 animate-pulse rounded-[12px] border border-[#DDE2EC] bg-white dark:border-slate-800 dark:bg-slate-900" />
    </div>
  )
}

function OverviewError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-4 rounded-[12px] border border-red-200 bg-red-50 p-8 text-center dark:border-red-950 dark:bg-red-950/20">
      <p className="text-[15px] text-red-600 dark:text-red-400">{getErrorMessage(error)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-[8px] border border-[#B8C0D3] bg-white px-[18px] py-[11px] text-[14px] font-medium text-[#10172A] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        {t("common.retry")}
      </button>
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

function formatHeaderDate(locale: string): string {
  const now = new Date()
  const isCzech = locale.startsWith("cs")
  const weekday = new Intl.DateTimeFormat(isCzech ? "cs-CZ" : "en-US", { weekday: "long" }).format(
    now,
  )
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)

  const day = now.getDate()
  if (isCzech) {
    const month = new Intl.DateTimeFormat("cs-CZ", { month: "long" }).format(now)
    return `${capitalizedWeekday}, ${day}. ${month}`
  }
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(now)
  return `${capitalizedWeekday}, ${day} ${month}`
}

function formatStartDate(date: Date, locale: string): string {
  const isCzech = locale.startsWith("cs")
  const day = date.getDate()
  if (isCzech) {
    const month = new Intl.DateTimeFormat("cs-CZ", { month: "long" }).format(date)
    return `${day}. ${month}`
  }
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date)
  return `${day} ${month}`
}
