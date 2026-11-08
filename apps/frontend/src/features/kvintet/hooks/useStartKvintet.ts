import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { api } from "@/lib/api-client"

import { useEnteredKvintet } from "@/features/kvintet/hooks/useEnteredKvintet"

export type StartKvintetInput = {
  title: string
  categorySlugs: string[]
  description?: string
}

export function useStartKvintet() {
  const { t } = useTranslation()
  const entered = useEnteredKvintet()

  return useMutation({
    mutationFn: async (input: StartKvintetInput) => {
      await api.post("kvintets", { json: input })
    },
    onSuccess: () => entered(t("kvintet.started")),
  })
}
