import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { happy, unsure } from "blobatar/expression"
import { MapPin, Mic, Phone, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { AnonymousBlobatar, Face } from "@/components/AnonymousBlobatar"
import { Blobatar } from "@/components/ui/blobatar"
import type en from "@/i18n/locales/en.json"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { cn } from "@/lib/utils"

import { useCoreIdeaTimeline } from "./useCoreIdeaTimeline"

import "./core-idea.css"

// The faces of the Figma frames, in seat order (top, then clockwise). Seat 0 is you.
const SEATS = [
  { seed: "jana", role: "roleYou" },
  { seed: "petr", role: "roleAnalyst", name: "namePetr" },
  { seed: "eva", role: "roleMarketer", name: "nameEva" },
  { seed: "ondrej", role: "roleDesigner", name: "nameOndrej" },
  { seed: "lucie", role: "roleDeveloper", name: "nameLucie" },
] as const

const STEPS = [0, 1, 2, 3, 4, 5] as const
// The stages are drawn at a fixed size and zoomed down to whatever room the page has. The desktop
// stage is 1120 wide but its steps and card only span 1008 of it; the 56 px margins are cropped.
const STAGE_WIDTH = { desktop: 1008, phone: 360 }

/** A blobatar stacked in a seat; CSS fades between the layers (grey, colour, happy). */
function Layer({ kind, children }: { kind: "g" | "c" | "h" | "u"; children: ReactNode }) {
  return <span className={`ci-${kind}`}>{children}</span>
}

const FACE = "size-full overflow-visible"

type Text = keyof typeof en.landing.animation

function Seat({
  seat,
  index,
  isOn,
}: {
  seat: (typeof SEATS)[number]
  index: number
  isOn: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={cn(`ci-seat ci-s${index}`, isOn && "ci-on")}>
      <span className="ci-free" />
      <i className="ci-melt" />
      <div className="ci-faces">
        {index > 0 ? (
          <Layer kind="g">
            <AnonymousBlobatar
              seed={seat.seed}
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
          <Blobatar
            name={seat.seed}
            className={FACE}
            blobatar={{ expression: happy }}
          />
        </Layer>
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
 * The core idea of Kvintet in six scenes: you hit a problem, tell us about you, pick a kvintet,
 * it starts, you arrange a meeting and meet. A phone stage and a desktop stage (a list of the
 * steps beside the same card, with a pointer instead of a tap), each drawn at a fixed size and
 * zoomed to fit its parent, so the parent sets how big it is. Only the one that matches the window
 * runs. Purely decorative.
 */
export function CoreIdeaAnimation({ className }: { className?: string }) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  const { flags, count } = useCoreIdeaTimeline(isDesktop, isReducedMotion)

  const frameRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  // Layout effect: measured before the first paint, so the stage never flashes at full size.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    // The desktop stage fills its parent, larger than drawn if need be, so its margins match the
    // page's; the phone stage only shrinks.
    const measure = () => {
      const ratio = frame.clientWidth / STAGE_WIDTH[isDesktop ? "desktop" : "phone"]
      setFit(isDesktop ? ratio : Math.min(1, ratio))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [isDesktop])

  const text = (key: Text) => t(`landing.animation.${key}`)
  const has = (flag: string) => flags.has(flag)
  const stateClasses = [...flags].map((flag) => `ci-${flag}`)

  const ringItems = (
    <>
      {SEATS.map((_, i) => (
        <span
          key={`tile${i}`}
          className={`ci-tile ci-tl${i}`}
        />
      ))}
      {SEATS.map((seat, i) => (
        <Seat
          key={i}
          seat={seat}
          index={i}
          isOn={has(`on${i}`)}
        />
      ))}
      {SEATS.map((_, i) => (
        <span
          key={`cup${i}`}
          className={`ci-cup ci-cp${i}`}
        />
      ))}
      <div className="ci-callbar">
        <span className="ci-cb">
          <Mic aria-hidden="true" />
        </span>
        <span className="ci-cb">
          <Video aria-hidden="true" />
        </span>
        <span className="ci-cb ci-end">
          <Phone aria-hidden="true" />
        </span>
      </div>
      <div className="ci-wordmark">Kvintet</div>
      <div className="ci-solo">
        <span className="ci-u">
          <Blobatar
            name="jana"
            className={FACE}
            blobatar={{ expression: unsure }}
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
        <p className="ci-title">
          <span>{text("titleFive")}</span>
          <span>{text("titleOne")}</span>
        </p>
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
      <div className="ci-where">
        <span className="ci-wchip ci-wcafe">{text("whereCafe")}</span>
        <span className="ci-wchip ci-wcall">{text("whereCall")}</span>
        <span className="ci-wchip">{text("whereWalk")}</span>
        <span className="ci-wchip">{text("whereAnywhere")}</span>
      </div>
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
      <div className="ci-t-call">
        <p className="ci-feed-meta">{text("callMeta")}</p>
        <p className="ci-feed-title">
          <Video
            className="ci-pin"
            aria-hidden="true"
          />
          {text("callTitle")}
        </p>
      </div>
      <div className="ci-t-meet">
        <p className="ci-feed-meta">{text("cafeMeta")}</p>
        <p className="ci-feed-title">
          <MapPin
            className="ci-pin"
            aria-hidden="true"
          />
          {text("cafeTitle")}
        </p>
      </div>
      <div className="ci-t-chat">
        <p className="ci-sys">{text("chatSys")}</p>
        <div className="ci-msg ci-msg1">
          <span className="ci-face">
            <Face
              seed="eva"
              className={FACE}
            />
          </span>
          <span className="ci-bubble">{text("chatMsg1")}</span>
        </div>
        <div className="ci-msg ci-msg2">
          <span className="ci-face">
            <Face
              seed="jana"
              className={FACE}
            />
          </span>
          <span className="ci-bubble">{text("chatMsg2")}</span>
        </div>
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
            <div className="ci-steps">
              <p className="ci-eyebrow">{t("landing.howItWorks")}</p>
              {STEPS.map((n) => (
                <div
                  key={n}
                  className={`ci-step ci-step${n}`}
                >
                  <span className="ci-dot">{n + 1}</span>
                  <div>
                    <h3>{text(`step${n}Title`)}</h3>
                    <p>{text(`step${n}Text`)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="ci-card">
              <div className="ci-guide" />
              <div className="ci-awning" />
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
            <div className="ci-caps">
              {STEPS.map((n) => (
                <div
                  key={n}
                  className={`ci-cap ci-cap${n}`}
                >
                  <p className="ci-num">{`0${n + 1}`}</p>
                  <h3>{text(`step${n}Title`)}</h3>
                  <p>{text(n === 2 ? "step2TextShort" : `step${n}Text`)}</p>
                </div>
              ))}
            </div>
            <div className="ci-dots">
              {STEPS.map((n) => (
                <i
                  key={n}
                  className={`ci-d${n}`}
                />
              ))}
            </div>
            <div className="ci-ring">
              <div className="ci-awning" />
              <div className="ci-guide" />
              {ringItems}
            </div>
            {form}
            {tray}
          </>
        )}
      </div>
    </div>
  )
}
