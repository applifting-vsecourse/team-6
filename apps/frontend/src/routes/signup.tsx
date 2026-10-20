import { useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { AppHeader } from "@/features/auth/components/AppHeader"
import { SignUpForm } from "@/features/auth/components/SignUpForm"
import { useSignUp } from "@/features/auth/hooks/useSignUp"
import { signUpErrorMessage } from "@/features/auth/lib/sign-up-error"

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (!session) return
    throw redirect({ to: ROUTES.overview })
  },
})

function SignUpPage() {
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: {
    email: string
    name: string
    username: string
    password: string
  }) => {
    setErrorMessage(null)
    try {
      await signUp.mutateAsync({
        email: values.email,
        password: values.password,
        name: values.name,
        username: values.username,
      })
      await navigate({ to: ROUTES.overview })
    } catch (error) {
      setErrorMessage(signUpErrorMessage(error))
    }
  }

  return (
    <>
      <Seo title="Registrovat se" />
      <AuthLayout
        header={<AppHeader />}
        title="Registrovat se"
        description="Vytvořte si účet v Kvintetu."
        footer={
          <>
            Už máte účet?{" "}
            <Link
              to={ROUTES.login}
              className="text-foreground underline underline-offset-4"
            >
              Přihlásit se
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
