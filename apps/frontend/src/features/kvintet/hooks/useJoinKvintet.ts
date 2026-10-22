import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { api } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/errorMessage"

import { kvintetKeys } from "@/features/kvintet/api/kvintetKeys"
import { useEnteredKvintet } from "@/features/kvintet/hooks/useEnteredKvintet"

export function useJoinKvintet() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const entered = useEnteredKvintet()

  return useMutation({
    mutationFn: async (kvintetId: string) => {
      await api.post(`kvintets/${kvintetId}/members`)
    },
    onSuccess: () => entered(t("kvintet.joined")),
    onError: (error) => {
      toast.error(getErrorMessage(error))
      // The kvintet may have filled up meanwhile; show the list as it is now.
      void queryClient.invalidateQueries({ queryKey: kvintetKeys.feed() })
    },
  })
}
