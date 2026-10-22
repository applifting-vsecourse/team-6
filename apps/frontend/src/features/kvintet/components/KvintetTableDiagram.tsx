import { Trans, useTranslation } from "react-i18next"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import type { KvintetMember } from "@/features/kvintet/api/kvintetApi"

type KvintetTableDiagramProps = {
  members: KvintetMember[]
}

// Five seats on a circle in a 300x300 space, starting at the top and going clockwise.
// As in the Figma flower, the seat radius equals the petal radius: every petal's edge
// passes through the centre point.
const PETAL_RADIUS = 70
const SEAT_RADIUS = PETAL_RADIUS
const SEAT_POSITIONS = Array.from({ length: 5 }, (_, i) => {
  const angle = ((-90 + i * 72) * Math.PI) / 180
  return { cx: 150 + SEAT_RADIUS * Math.cos(angle), cy: 150 + SEAT_RADIUS * Math.sin(angle) }
})

const AVATAR_SIZE = 56

export function KvintetTableDiagram({ members }: KvintetTableDiagramProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-8 rounded-lg border border-border bg-card p-6 md:flex-row md:gap-12 md:p-8">
      {/* Visual circular table diagram */}
      <TooltipProvider>
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 300 300"
            className="size-60 md:size-72"
            role="img"
            aria-label={t("kvintet.table.title")}
          >
            {/* 5 translucent seat circles, so the overlaps read as a flower */}
            {SEAT_POSITIONS.map((pos, idx) => {
              const member = members[idx]
              const isCurrentUser = member?.isCurrentUser

              return (
                <circle
                  key={idx}
                  cx={pos.cx}
                  cy={pos.cy}
                  r={PETAL_RADIUS}
                  className={`stroke-1 ${
                    isCurrentUser
                      ? "fill-primary/30 stroke-primary/60"
                      : "fill-primary/15 stroke-primary/40"
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

            {/* Member blobatars on their seats; hovering shows the name */}
            {SEAT_POSITIONS.map((pos, idx) => {
              const member = members[idx]
              if (!member) return null

              const displayName =
                member.name ??
                member.role ??
                String(t("kvintet.diagram.memberNumber", { number: idx + 1 }))
              const label = member.isCurrentUser
                ? `${displayName} ${String(t("kvintet.members.you"))}`
                : displayName

              return (
                <foreignObject
                  key={idx}
                  x={pos.cx - AVATAR_SIZE / 2}
                  y={pos.cy - AVATAR_SIZE / 2}
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block size-14 rounded-full">
                        <GazeBlobatar
                          name={member.username ?? member.userId}
                          title={label}
                          className="size-14"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                </foreignObject>
              )
            })}
          </svg>
        </div>
      </TooltipProvider>

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
