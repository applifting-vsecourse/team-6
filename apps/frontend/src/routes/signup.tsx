import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"
import { getErrorMessage } from "@/lib/errorMessage"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { AppHeader } from "@/features/auth/components/AppHeader"
import { SignUpForm } from "@/features/auth/components/SignUpForm"
import { SignUpPreview } from "@/features/auth/components/SignUpPreview"
import { useSignUp } from "@/features/auth/hooks/useSignUp"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: ROUTES.overview })
  },
})

const EMAIL_TAKEN_CODES = ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"]

function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [username, setUsername] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleSubmit = async (values: {
    email: string
    name: string
    username: string
    password: string
    acceptCodeOfConduct: boolean
  }) => {
    setErrorMessage(null)
    setEmailError(null)
    try {
      await signUp.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username,
        acceptCodeOfConduct: values.acceptCodeOfConduct,
      })
      await navigate({ to: ROUTES.onboarding })
    } catch (error) {
      const message = getErrorMessage(error, "errors.signUpFailed")
      const code = (error as { code?: string }).code
      // A taken e-mail belongs under the e-mail field (Figma A2b), anything else in the alert.
      if (code && EMAIL_TAKEN_CODES.includes(code)) setEmailError(message)
      else setErrorMessage(message)
    }
  }

  return (
    <>
      <Seo title={t("auth.signUp")} />
      <AuthLayout
        header={<AppHeader />}
        title={t("auth.signUpTitle")}
        description={t("auth.signUpDescription")}
        titleAccessory={
          <SignUpPreview
            username={username}
            variant="inline"
          />
        }
        aside={
          <SignUpPreview
            username={username}
            variant="panel"
          />
        }
        footer={
          <>
            {t("auth.haveAccount")}{" "}
            <Link
              to={ROUTES.login}
              className="text-foreground underline underline-offset-4"
            >
              {t("auth.signIn")}
            </Link>
          </>
        }
      >
        <SignUpForm
          isLoading={signUp.isPending}
          errorMessage={errorMessage}
          emailError={emailError}
          onUsernameChange={setUsername}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
