import { Trans, useTranslation } from "react-i18next"

import { SUPPORT_EMAIL } from "@/config/support"

/**
 * How to get a copy of one's stored data (GDPR Art. 15 and 20). There is no download in the app:
 * requests are answered by hand, as described in docs/ARCHITECTURE.md.
 */
export function DataRequestSection() {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col gap-2.5 border-t border-border pt-5 md:pt-6">
      <h2 className="text-h3 font-semibold text-foreground">{t("profile.yourData.title")}</h2>
      <p className="text-small text-muted-foreground md:text-compact">
        <Trans
          i18nKey="profile.yourData.request"
          values={{ email: SUPPORT_EMAIL }}
          components={{
            email: (
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-foreground underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
            ),
          }}
        />
      </p>
      <p className="text-small text-muted-foreground md:text-compact">
        {t("profile.yourData.terms")}
      </p>
    </section>
  )
}
