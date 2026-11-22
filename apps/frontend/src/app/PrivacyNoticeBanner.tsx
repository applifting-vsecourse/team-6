import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { useMarkPrivacyNoticeSeen } from "@/features/profile/hooks/useMarkPrivacyNoticeSeen"

/**
 * Tells people who signed up before the privacy notice existed that it is there. Shown once per
 * account: the dismissal is stored on the profile. Lives in `app/` because it ties auth and
 * profile together, which features may not do among themselves.
 */
export function PrivacyNoticeBanner() {
  const { t } = useTranslation()
  const { user } = useSession()
  const { data: profile } = useQuery({ ...profileQueryOptions(user?.id), enabled: Boolean(user) })
  const { mutate: dismiss, isPending } = useMarkPrivacyNoticeSeen(user?.id)

  if (!profile || profile.privacyNoticeSeenAt) return null

  return (
    <div className="mx-auto w-full max-w-300 px-4 pt-4">
      <Alert className="sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-4">
        <div className="flex flex-col gap-0.5">
          <AlertTitle className="col-start-1 line-clamp-none">
            {t("privacyBanner.title")}
          </AlertTitle>
          <AlertDescription className="col-start-1 text-small text-muted-foreground">
            {t("privacyBanner.text")}{" "}
            <Link
              to={ROUTES.privacy}
              className="text-foreground underline underline-offset-4"
            >
              {t("privacyBanner.link")}
            </Link>
          </AlertDescription>
        </div>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => dismiss()}
          className="mt-2 w-full sm:mt-0 sm:w-auto"
        >
          {t("privacyBanner.dismiss")}
        </Button>
      </Alert>
    </div>
  )
}
