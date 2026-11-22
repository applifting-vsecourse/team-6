import { Trans, useTranslation } from "react-i18next"

import { SUPPORT_EMAIL } from "@/config/support"

const SECTIONS = ["controller", "data", "recipients", "retention", "rights", "sensitive"] as const

// TODO(controller): the controller of the personal data is not decided yet. Name it in
// `privacy.controller.text` (en and cs) before the pilot launches.
export function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="px-4 pt-7 pb-10 md:pt-14 md:pb-22">
      <article className="mx-auto flex w-full max-w-180 flex-col gap-5 md:gap-6">
        <header className="flex flex-col gap-5 md:gap-2">
          <h1 className="text-h1-mobile md:text-h1">{t("privacy.title")}</h1>
          <p className="text-compact text-muted-foreground md:text-lead">{t("privacy.subtitle")}</p>
        </header>

        {SECTIONS.map((section) => (
          <section
            key={section}
            className="flex flex-col gap-5 md:gap-2"
          >
            <h2 className="text-h3">{t(`privacy.${section}.title`)}</h2>
            <p className="text-compact text-muted-foreground">
              <Trans
                i18nKey={`privacy.${section}.text`}
                values={{ email: SUPPORT_EMAIL }}
                components={{
                  email: (
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  ),
                }}
              />
            </p>
          </section>
        ))}
      </article>
    </div>
  )
}
