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
import { useSignUp } from "@/features/auth/hooks/useSignUp"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: ROUTES.overview })
  },
})

function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: {
    email: string
    name: string
    username: string
    password: string
    acceptCodeOfConduct: boolean
  }) => {
    setErrorMessage(null)
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
      setErrorMessage(getErrorMessage(error, "errors.signUpFailed"))
    }
  }

  return (
    <>
      <Seo title={t("auth.signUp")} />
      <AuthLayout
        header={<AppHeader />}
        title={t("auth.signUp")}
        description={t("auth.signUpDescription")}
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
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
