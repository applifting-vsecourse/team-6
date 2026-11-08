import { useTranslation } from "react-i18next"

import { GazeBlobatar } from "@/components/GazeBlobatar"
import { Blobatar } from "@/components/ui/blobatar"

// `palette` takes hex, not CSS variables. This is the grey head of Figma `blob/anon`.
const PLACEHOLDER_PALETTE = { head: "#CED4DE" }
const PLACEHOLDER_SEED = "placeholder"

type SignUpPreviewProps = {
  username: string
  /** `panel`: large and animated beside the form; `inline`: small and static, for phones. */
  variant: "panel" | "inline"
}

/** The face others will see, drawn from the username as it is being typed. */
export function SignUpPreview({ username, variant }: SignUpPreviewProps) {
  const { t } = useTranslation()
  // BetterAuth stores usernames lowercase and the rest of the app seeds from the stored value.
  const seed = username.trim().toLowerCase()
  const palette = seed ? undefined : PLACEHOLDER_PALETTE
  const name = seed || PLACEHOLDER_SEED

  if (variant === "inline") {
    return (
      <Blobatar
        name={name}
        className="size-16"
        blobatar={palette ? { palette } : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg bg-card p-8 text-center">
      <GazeBlobatar
        name={name}
        palette={palette}
        animate="always"
        className="size-40"
      />
      <h2 className="text-subheading">{t("auth.preview.title")}</h2>
    </div>
  )
}
