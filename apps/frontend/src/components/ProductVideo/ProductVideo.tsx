import { happy } from "blobatar/expression"
import { useTranslation } from "react-i18next"

import captionsEn from "@/assets/video/captions.en.vtt?url"
import videoEnDark from "@/assets/video/video.en.dark.mp4?url"
import videoEnLight from "@/assets/video/video.en.light.mp4?url"
import { HoverGazeBlobatar } from "@/components/HoverGazeBlobatar"
import { VideoPlayer, type VideoSources } from "@/components/VideoPlayer/VideoPlayer"
import { cn } from "@/lib/utils"

/**
 * One entry per language that has a film of its own; the rest see English. Adding Czech is the
 * three files plus a `cs` entry here (ARCHITECTURE.md, "Product video").
 */
export const PRODUCT_VIDEO_SOURCES: VideoSources = {
  en: { light: videoEnLight, dark: videoEnDark, captions: captionsEn },
}

// The poster of Figma A1: the five at the café table, as percentages of the 1200 x 675 frame.
const GUESTS = [
  { seed: "jana", left: 44.4, top: 14 },
  { seed: "petr", left: 60.3, top: 30 },
  { seed: "eva", left: 55.6, top: 66 },
  { seed: "ondrej", left: 33.1, top: 66 },
  { seed: "lucie", left: 28.5, top: 30 },
] as const

function CafeTable() {
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute rounded-full bg-card"
        style={{ left: "23.84%", top: "34.95%", width: "52.31%", height: "34.1%" }}
      />
      {GUESTS.map(({ seed, left, top }) => (
        <span
          key={seed}
          className="absolute w-[11.25%]"
          style={{ left: `${left}%`, top: `${top}%` }}
        >
          <HoverGazeBlobatar
            name={seed}
            expression={happy}
            className={cn("aspect-square size-full")}
          />
        </span>
      ))}
    </>
  )
}

/** The product film with its poster. Used by the landing page and "How it works". */
export function ProductVideo({ className }: { className?: string }) {
  const { t } = useTranslation()

  return (
    <VideoPlayer
      sources={PRODUCT_VIDEO_SOURCES}
      title={t("productVideo.posterTitle")}
      subtitle={t("productVideo.posterSubtitle")}
      artwork={<CafeTable />}
      className={className}
    />
  )
}
