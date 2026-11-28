import type { ReactNode } from "react"
import { Trans, useTranslation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SUPPORT_EMAIL } from "@/config/support"
import { formatCalendarDate } from "@/lib/date"

// Move this forward whenever the text of the notice changes.
const LAST_UPDATED = new Date(2026, 10, 28)

const DATA_KINDS = ["account", "profile", "kvintet", "matching", "security", "support"] as const
const VISIBILITY = ["feed", "forming", "started", "hidden", "admin", "operators"] as const
const SERVICES = ["hosting", "logs", "map", "email", "tracking"] as const
const RETENTION = ["account", "kvintet", "sessions", "matching", "deletion", "other"] as const
const RIGHTS = ["access", "correct", "erase", "object"] as const

const LINK_CLASS = "text-foreground underline underline-offset-4"

const externalLink = (href: string) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={LINK_CLASS}
  >
    {href}
  </a>
)

// The tags a translated sentence may use; the text of the link comes from the translation.
const LINKS = {
  email: (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className={LINK_CLASS}
    >
      {SUPPORT_EMAIL}
    </a>
  ),
  osm: externalLink("https://osmfoundation.org/wiki/Privacy_Policy"),
  uoou: externalLink("https://uoou.gov.cz"),
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5 md:pt-6">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  )
}

/**
 * The privacy notice (GDPR Art. 13). Every sentence describes what the code does today: a change
 * to what is stored, who sees it, how long it stays or which outside service is called updates the
 * `privacy.*` texts of every locale file in the same PR (see docs/ARCHITECTURE.md).
 */
export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
      <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 text-compact text-muted-foreground md:gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-h1-mobile text-foreground md:text-h1">{t("privacy.title")}</h1>
          <p className="md:text-lead">{t("privacy.subtitle")}</p>
          <p className="text-small">
            {t("privacy.updated", { date: formatCalendarDate(LAST_UPDATED) })}
          </p>
        </header>

        <Section title={t("privacy.controller.title")}>
          {/* TODO(controller): not decided yet. Replace the placeholder with the controller's name,
              address and contact (every locale file) before the pilot launches. */}
          <Alert
            role="note"
            className="border-highlight bg-highlight-soft"
          >
            <AlertTitle className="line-clamp-none text-foreground">
              {t("privacy.controller.placeholderTitle")}
            </AlertTitle>
            <AlertDescription className="text-compact text-foreground">
              {t("privacy.controller.placeholder")}
            </AlertDescription>
          </Alert>
          <p>
            <Trans
              i18nKey="privacy.controller.contact"
              values={{ email: SUPPORT_EMAIL }}
              components={LINKS}
            />
          </p>
        </Section>

        <Section title={t("privacy.data.title")}>
          <p>{t("privacy.data.required")}</p>
          <div className="flex flex-col divide-y divide-border">
            {DATA_KINDS.map((kind) => (
              <div
                key={kind}
                className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0"
              >
                <h3 className="text-compact font-semibold text-foreground">
                  {t(`privacy.data.${kind}.title`)}
                </h3>
                <p>{t(`privacy.data.${kind}.what`)}</p>
                <p>{t(`privacy.data.${kind}.why`)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t("privacy.sensitive.title")}>
          <p>{t("privacy.sensitive.text")}</p>
        </Section>

        <Section title={t("privacy.visibility.title")}>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {VISIBILITY.map((item) => (
              <li key={item}>{t(`privacy.visibility.${item}`)}</li>
            ))}
          </ul>
        </Section>

        <Section title={t("privacy.services.title")}>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {SERVICES.map((item) => (
              <li key={item}>
                <Trans
                  i18nKey={`privacy.services.${item}`}
                  components={LINKS}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("privacy.browser.title")}>
          <p>{t("privacy.browser.text")}</p>
        </Section>

        <Section title={t("privacy.ranking.title")}>
          <p>{t("privacy.ranking.how")}</p>
          <p>{t("privacy.ranking.effect")}</p>
        </Section>

        <Section title={t("privacy.retention.title")}>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {RETENTION.map((item) => (
              <li key={item}>{t(`privacy.retention.${item}`)}</li>
            ))}
          </ul>
        </Section>

        <Section title={t("privacy.rights.title")}>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            {RIGHTS.map((item) => (
              <li key={item}>
                <Trans
                  i18nKey={`privacy.rights.${item}`}
                  values={{ email: SUPPORT_EMAIL }}
                  components={LINKS}
                />
              </li>
            ))}
          </ul>
          <p>{t("privacy.rights.answer")}</p>
        </Section>

        <Section title={t("privacy.complaint.title")}>
          <p>
            <Trans
              i18nKey="privacy.complaint.text"
              components={LINKS}
            />
          </p>
        </Section>
      </article>
    </div>
  )
}
