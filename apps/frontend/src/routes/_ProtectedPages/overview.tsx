import { createFileRoute } from "@tanstack/react-router"
import { Trans, useTranslation } from "react-i18next"

import watermark from "@/assets/logo-watermark.svg"
import { Seo } from "@/components/Seo"
import { formatLongDate } from "@/lib/date"

import { useSession } from "@/features/auth/hooks/useSession"

export const Route = createFileRoute("/_ProtectedPages/overview")({
  component: OverviewPage,
})

// Stub: greeting only. The design's next-step and profile blocks need data from later stories.
function OverviewPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  // shortcut: nominative first name, the design uses the Czech vocative ("Jano"); needs a name-inflection rule.
  const firstName = user?.name.split(" ")[0]

  return (
    <>
      <Seo title={t("overview.title")} />
      <div className="relative mx-auto w-full max-w-4xl px-4 pt-16 pb-24">
        <img
          src={watermark}
          alt=""
          width={182}
          height={182}
          className="pointer-events-none absolute top-2 right-4 hidden size-45.5 md:block"
        />
        <p className="font-mono text-xs tracking-meta text-muted-foreground uppercase">
          {formatLongDate(new Date())}
        </p>
        <h1 className="mt-2 text-title">
          {firstName ? (
            <Trans
              i18nKey="overview.greeting"
              values={{ name: firstName }}
              components={{ em: <em /> }}
            />
          ) : (
            t("overview.greetingAnonymous")
          )}
        </h1>
      </div>
    </>
  )
}
