import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ROUTES } from "@/app/routes"
import { AuthLayout } from "@/components/AuthLayout"
import { MascotBubbleSlot } from "@/components/Mascot/MascotBubbleSlot"
import { useMascotStage } from "@/components/Mascot/MascotContext"
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

// The mascot swaps faces as the username settles, not on every key press.
const AVATAR_DEBOUNCE_MS = 250

const EMAIL_TAKEN_CODES = ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"]

function SignUpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signUp = useSignUp()
  const [username, setUsername] = useState("")
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  // BetterAuth stores usernames lowercase, and the avatar is seeded from the stored value.
  const [seed, setSeed] = useState<string | undefined>(undefined)

  useEffect(() => {
    const timer = setTimeout(
      () => setSeed(username.trim().toLowerCase() || undefined),
      AVATAR_DEBOUNCE_MS,
    )
    return () => clearTimeout(timer)
  }, [username])

  const stage = useMemo(
    () => ({
      anchorId: "signup-avatar",
      seed,
      // Nobody should see a password, not even the avatar.
      isEyesClosed: isPasswordFocused,
      bubble: { text: t("auth.mascot.avatar"), slotId: "signup-bubble" },
    }),
    [seed, isPasswordFocused, t],
  )
  useMascotStage(stage)

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
      // Same read as getErrorMessage: a thrown null or primitive has no code.
      const code = (error as { code?: unknown } | null)?.code
      // A taken e-mail belongs under the e-mail field (Figma A2b), anything else in the alert.
      if (typeof code === "string" && EMAIL_TAKEN_CODES.includes(code)) setEmailError(message)
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
        belowTitle={
          <MascotBubbleSlot
            id="signup-bubble"
            className="min-h-20 w-full"
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
          onPasswordFocusChange={setIsPasswordFocused}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </>
  )
}
