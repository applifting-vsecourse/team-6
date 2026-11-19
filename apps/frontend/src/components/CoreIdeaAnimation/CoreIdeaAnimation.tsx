import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { happy, unsure } from "blobatar/expression"
import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AnonymousBlobatar, Face } from "@/components/AnonymousBlobatar"
import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type en from "@/i18n/locales/en.json"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { cn } from "@/lib/utils"

import { stepMs, stepStart, useCoreIdeaTimeline } from "./useCoreIdeaTimeline"

import "./core-idea.css"

// The faces of the Figma frames, in seat order (top, then clockwise). Seat 0 is you. `teach` is
// what the person can advise on; what they want to learn is what the next seat teaches, so the
// five problems solve each other in a circle.
const SEATS = [
  { seed: "jana", role: "roleYou", teach: "excel" },
  { seed: "petr", role: "roleAnalyst", name: "namePetr", teach: "python" },
  { seed: "eva", role: "roleMarketer", name: "nameEva", teach: "copywriting" },
  { seed: "ondrej", role: "roleDesigner", name: "nameOndrej", teach: "figma" },
  { seed: "lucie", role: "roleDeveloper", name: "nameLucie", teach: "sql" },
] as const

const STEPS = [0, 1, 2, 3] as const
// The stages are drawn at a fixed size and zoomed to whatever room the page has: the phone one
// only down, the desktop card up to a point. The step tabs under the stage take the rest.
const STAGE = { desktop: { width: 404, height: 508 }, phone: { width: 360, height: 470 } }
const MAX_DESKTOP_FIT = 1.1
// The tabs under the stage: the bar and the title of the step, plus a little air.
const MAX_PHONE_FIT = 300 / 360
const TABS_HEIGHT = 90

/** A blobatar stacked in a seat; CSS fades between the layers (grey, colour, happy). */
function Layer({ kind, children }: { kind: "g" | "c" | "h" | "u"; children: ReactNode }) {
  return <span className={`ci-${kind}`}>{children}</span>
}

const FACE = "size-full overflow-visible"

type Text = keyof typeof en.landing.animation

function Seat({
  seat,
  learn,
  index,
  isOn,
}: {
  seat: (typeof SEATS)[number]
  learn: (typeof SEATS)[number]["teach"]
  index: number
  isOn: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={cn(`ci-seat ci-s${index}`, isOn && "ci-on")}>
      <span className="ci-free" />
      <div className="ci-faces">
        {index > 0 ? (
          <Layer kind="g">
            <AnonymousBlobatar
              seed={seat.seed}
              motion="always"
              className={FACE}
            />
          </Layer>
        ) : null}
        <Layer kind="c">
          <Face
            seed={seat.seed}
            motion="always"
            className={FACE}
          />
        </Layer>
        <Layer kind="h">
          <GazeBlobatar
            name={seat.seed}
            className={FACE}
            expression={happy}
          />
        </Layer>
      </div>
      <div className="ci-tags">
        <span className="ci-tag ci-teach">{t(`tags.${seat.teach}`)}</span>
        <span className="ci-tag ci-learn">
          <span>{t(`tags.${learn}`)}</span>
          {/* A copy of the neighbour's tag that flies in; theirs stays where it is. */}
          <span
            aria-hidden="true"
            className="ci-fly"
          >
            {t(`tags.${learn}`)}
          </span>
          <span className="ci-ok">
            <Check aria-hidden="true" />
          </span>
        </span>
      </div>
      <div className="ci-lab">
        <span className="ci-role">{t(`landing.animation.${seat.role}`)}</span>
        {"name" in seat ? (
          <span className="ci-name">{t(`landing.animation.${seat.name}`)}</span>
        ) : null}
      </div>
    </div>
  )
}

function FormCard({
  n,
  title,
  picked,
  suggestions,
}: {
  n: 1 | 2 | 3
  title: string
  picked: string
  suggestions: string[]
}) {
  return (
    <section className={`ci-fcard ci-fc${n}`}>
      <h4>{title}</h4>
      <div className="ci-frow">
        <span className={`ci-fchip ci-on ci-p${n}`}>{picked}</span>
      </div>
      <div className="ci-frow">
        {suggestions.map((label, i) => (
          <span
            key={label}
            className={cn("ci-fchip ci-s", i === 0 && `ci-p${n}s`)}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}

/**
 * The core idea of Kvintet in four scenes: you hit a problem, tell us about you, pick a kvintet,
 * it starts and everyone solves someone else's problem. A phone stage and a desktop stage (a list of the
 * steps beside the same card, with a pointer instead of a tap), each drawn at a fixed size and
 * zoomed to fit its parent, so the parent sets how big it is. Only the one that matches the window
 * runs. Purely decorative.
 */
export function CoreIdeaAnimation({ className }: { className?: string }) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  // Where the story starts: the beginning, or the step the visitor picked.
  const [from, setFrom] = useState<{ at: number } | undefined>(undefined)
  const { flags, count } = useCoreIdeaTimeline(isDesktop, isReducedMotion, from)

  const frameRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  // Layout effect: measured before the first paint, so the stage never flashes at full size.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    // Zoom to the width of the parent and to the height of the screen, so the whole scene and its
    // tabs fit in one view. clientHeight is the viewport with the browser bars showing, so it does
    // not jump as they hide on scroll.
    const measure = () => {
      const { width, height } = STAGE[isDesktop ? "desktop" : "phone"]
      const byWidth = frame.clientWidth / width
      const byHeight = (document.documentElement.clientHeight - TABS_HEIGHT) / height
      setFit(Math.min(byWidth, byHeight, isDesktop ? MAX_DESKTOP_FIT : MAX_PHONE_FIT))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [isDesktop])

  const text = (key: Text) => t(`landing.animation.${key}`)
  const has = (flag: string) => flags.has(flag)
  const stateClasses = [...flags].map((flag) => `ci-${flag}`)
  const step = STEPS.find((n) => has(`n${n}`)) ?? 0

  const ringItems = (
    <>
      {SEATS.map((seat, i) => (
        <Seat
          key={i}
          seat={seat}
          learn={SEATS[(i + 1) % SEATS.length]!.teach}
          index={i}
          isOn={has(`on${i}`)}
        />
      ))}
      <div className="ci-solo">
        <span className="ci-u">
          <GazeBlobatar
            name="jana"
            className={FACE}
            expression={unsure}
          />
        </span>
        <span className="ci-c">
          <Face
            seed="jana"
            motion="always"
            className={FACE}
          />
        </span>
      </div>
      <div className="ci-thought">{text("thought")}</div>
      <div className="ci-center">
        <span className="ci-count">{t("landing.animation.count", { n: count })}</span>
      </div>
    </>
  )

  const form = (
    <div className="ci-form">
      <FormCard
        n={1}
        title={t("onboarding.step1.role")}
        picked={t("roles.accountant")}
        suggestions={[t("roles.accountant"), t("roles.tech-recruiter")]}
      />
      <FormCard
        n={2}
        title={t("onboarding.step1.teachTitle")}
        picked={t("tags.excel")}
        suggestions={[t("tags.excel"), t("tags.copywriting"), t("tags.sql")]}
      />
      <FormCard
        n={3}
        title={t("onboarding.step1.learnTitle")}
        picked={t("tags.python")}
        suggestions={[t("tags.python"), t("tags.statistics"), t("tags.docker")]}
      />
    </div>
  )

  const tray = (
    <div className="ci-tray">
      <div className="ci-t-feed">
        <div>
          <p className="ci-feed-title">{text("feedTitle")}</p>
          <p className="ci-feed-meta">{text("feedMeta")}</p>
        </div>
        <span className="ci-join">
          {text("join")}
          <i className="ci-tap" />
        </span>
      </div>
      <div className="ci-t-alone">
        <p className="ci-feed-meta">{text("aloneMeta")}</p>
        <p className="ci-feed-title">{text("aloneTitle")}</p>
      </div>
      <div className="ci-t-slogan">
        <p className="ci-feed-title">{text("sloganLead")}</p>
        <p className="ci-feed-title ci-accent">{text("sloganAsk")}</p>
      </div>
    </div>
  )

  return (
    <div
      ref={frameRef}
      className={cn("ci", isDesktop ? "ci-d" : "ci-m", className)}
      style={{ "--fit": fit } as CSSProperties}
    >
      <div
        role="img"
        aria-label={text("ariaLabel")}
        className={cn("ci-stage", stateClasses)}
      >
        {isDesktop ? (
          <>
            <div className="ci-card">
              <div className="ci-guide" />
              {ringItems}
              {form}
              {tray}
            </div>
            <svg
              aria-hidden="true"
              className="ci-cursor"
              viewBox="0 0 22 22"
            >
              <path
                d="M2 1.5L2 17L6.2 13.2L9 19.5L11.6 18.3L8.8 12.2L14.5 12L2 1.5Z"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : (
          <>
            <div className="ci-ring">
              <div className="ci-guide" />
              {ringItems}
            </div>
            {form}
            {tray}
          </>
        )}
      </div>
      <div className="mx-auto mt-4 w-full md:mt-6">
        <Tabs
          value={String(step)}
          onValueChange={(value) =>
            setFrom({ at: stepStart(Number(value), isDesktop, isReducedMotion) })
          }
        >
          <TabsList
            variant="line"
            aria-label={t("landing.howItWorks")}
            className="h-auto w-full items-start gap-2 p-0 group-data-[orientation=horizontal]/tabs:h-auto md:gap-4"
          >
            {STEPS.map((n) => (
              <TabsTrigger
                key={n}
                value={String(n)}
                className="h-auto cursor-pointer flex-col items-start justify-start gap-1.5 rounded-t-[2px] rounded-b-none border-0 border-t-[3px] border-border px-0 pt-2 pb-0 text-left whitespace-normal text-muted-foreground after:hidden not-data-[state=active]:hover:border-muted-foreground data-[state=active]:text-foreground md:gap-2"
              >
                {n === step ? (
                  <span
                    aria-hidden="true"
                    className="ci-progress absolute inset-x-0 -top-[3px] h-[3px] rounded-[2px] bg-highlight"
                    style={{ animationDuration: `${stepMs(n, isDesktop)}ms` }}
                  />
                ) : null}
                <span className="font-mono text-meta tracking-[0.08em] text-muted-foreground uppercase group-data-[state=active]/tabs-list:text-highlight max-md:hidden">
                  {`0${n + 1}`}
                </span>
                <span className="text-small font-normal md:text-compact md:font-medium">
                  {text(`step${n}Title`)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
