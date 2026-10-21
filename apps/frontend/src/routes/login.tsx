import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"
import { getErrorMessage } from "@/lib/errorMessage"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { AppHeader } from "@/features/auth/components/AppHeader"
import { SignInForm } from "@/features/auth/components/SignInForm"
import { useSignIn } from "@/features/auth/hooks/useSignIn"
import { postSignInPath } from "@/features/auth/lib/redirect"

const loginSearchParamsSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: loginSearchParamsSchema,
  loaderDeps: ({ search }) => ({ from: search.from }),
  loader: async ({ context, deps }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: postSignInPath(deps.from) })
  },
})

function LoginPage() {
  const { t } = useTranslation()
  const { from } = Route.useSearch()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: { email: string; password: string }) => {
    setErrorMessage(null)
    try {
      await signIn.mutateAsync(values)
      await navigate({ to: postSignInPath(from) })
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "errors.signInFailed"))
    }
  }

  return (
    <>
      <Seo title={t("auth.signIn")} />
      <AuthLayout
        header={<AppHeader hasAccount={false} />}
        title={t("auth.signIn")}
        description={t("auth.signInDescription")}
        footer={
          <>
            {t("auth.noAccount")}{" "}
            <Link
              to={ROUTES.signup}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("auth.signUp")}
            </Link>
          </>
        }
      >
        <SignInForm
          isLoading={signIn.isPending}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
