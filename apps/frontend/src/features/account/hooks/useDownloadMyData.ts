import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/errorMessage"

import { downloadMyData } from "@/features/account/api/accountApi"

export function useDownloadMyData() {
  return useMutation({
    mutationFn: downloadMyData,
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
