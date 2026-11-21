import { createFileRoute, notFound } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Seo } from "@/components/Seo"

import { AdminStatsPage } from "@/features/admin/components/AdminStatsPage"
import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"

export const Route = createFileRoute("/_ProtectedPages/admin")({
  // Non-admins get the 404 page: the admin section does not exist for them.
  loader: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session?.user.role !== "admin") throw notFound()
  },
  component: AdminRoute,
})

function AdminRoute() {
  const { t } = useTranslation()

  return (
    <>
      <Seo title={t("admin.title")} />
      <AdminStatsPage />
    </>
  )
}
