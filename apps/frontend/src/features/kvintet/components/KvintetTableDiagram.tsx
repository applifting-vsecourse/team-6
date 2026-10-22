import { Trans, useTranslation } from "react-i18next"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"

type KvintetTableDiagramProps = {
  members: KvintetMember[]
}

// Seat positions around a 300x300 coordinate space
// 5 seats placed at angles: -90° (top), -18° (top-right), 54° (bottom-right), 126° (bottom-left), 198° (top-left)
const SEAT_POSITIONS = [
  { cx: 150, cy: 75, textX: 150, textY: 50 }, // Top
  { cx: 221, cy: 127, textX: 236, textY: 120 }, // Top-right
  { cx: 194, cy: 211, textX: 205, textY: 228 }, // Bottom-right
  { cx: 106, cy: 211, textX: 95, textY: 228 }, // Bottom-left
  { cx: 79, cy: 127, textX: 64, textY: 120 }, // Top-left
]

export function KvintetTableDiagram({ members }: KvintetTableDiagramProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-card p-6 md:flex-row md:gap-12 md:p-8">
      {/* Visual circular table diagram */}
      <div className="relative shrink-0">
        <svg
          viewBox="0 0 300 300"
          className="size-60 md:size-72"
          role="img"
          aria-label={t("kvintet.table.title")}
        >
          {/* 5 overlapping circular seat circles */}
          {SEAT_POSITIONS.map((pos, idx) => {
            const member = members[idx]
            const isCurrentUser = member?.isCurrentUser

            return (
              <circle
                key={idx}
                cx={pos.cx}
                cy={pos.cy}
                r="70"
                className={`stroke-1 ${
                  isCurrentUser
                    ? "fill-primary/20 stroke-primary/40"
                    : "fill-secondary stroke-border"
                }`}
              />
            )
          })}

          {/* Center table dot */}
          <circle
            cx="150"
            cy="150"
            r="3.5"
            className="fill-foreground"
          />

          {/* Member labels positioned on their seats */}
          {SEAT_POSITIONS.map((pos, idx) => {
            const member = members[idx]
            if (!member) return null

            // Format first name or you
            const firstName = member.name
              ? member.name.split(" ")[0]
              : (member.role ?? `Člen ${idx + 1}`)
            const label = member.isCurrentUser
              ? `${firstName} ${String(t("kvintet.members.you"))}`
              : firstName

            return (
              <text
                key={idx}
                x={pos.textX}
                y={pos.textY}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-foreground font-sans text-xs font-semibold"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Description text */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-heading">
          <Trans
            i18nKey="kvintet.table.title"
            components={{ em: <em className="italic" /> }}
          />
        </h2>
        <p className="text-body text-muted-foreground">{t("kvintet.table.description")}</p>
      </div>
    </div>
  )
}
