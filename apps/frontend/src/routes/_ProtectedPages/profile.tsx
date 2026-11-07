import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { DeleteAccountDialog } from "@/features/account/components/DeleteAccountDialog"
import { useDeleteAccount } from "@/features/account/hooks/useDeleteAccount"
import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileApi"
import { ProfilePage } from "@/features/profile/components/ProfilePage"

export const Route = createFileRoute("/_ProtectedPages/profile")({
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session?.user?.id) {
      await context.queryClient.ensureQueryData(profileQueryOptions(session.user.id))
    }
  },
  component: ProfileRoute,
})

function ProfileRoute() {
  const { t } = useTranslation()
  const { user } = useSession()
  const deleteAccount = useDeleteAccount()

  return (
    <>
      <Seo title={t("profile.title")} />
      <ProfilePage
        user={user}
        renderDeleteAccountDialog={({ isOpen, onOpenChange, avatarSeed }) => (
          <DeleteAccountDialog
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            onConfirm={() => deleteAccount.mutate()}
            isDeleting={deleteAccount.isPending}
            avatarSeed={avatarSeed}
          />
        )}
      />
    </>
  )
}
