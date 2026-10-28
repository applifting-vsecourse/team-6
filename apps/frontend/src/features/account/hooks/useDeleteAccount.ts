import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ROUTES } from "@/app/routes"
import { authKeys } from "@/lib/auth-keys"
import { getErrorMessage } from "@/lib/errorMessage"

import { deleteAccount } from "@/features/account/api/accountApi"

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: () => deleteAccount(),
    onSuccess: async () => {
      queryClient.clear()
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
      toast.success(t("account.deleteSuccess"))
      await navigate({ to: ROUTES.home })
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
