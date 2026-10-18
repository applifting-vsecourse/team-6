import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authKeys } from "@/lib/auth-keys"
import { toAuthError } from "@/lib/errorMessage"

import { authClient } from "@/features/auth/lib/auth-client"

export type SignUpInput = {
  name: string
  username: string
  email: string
  password: string
  acceptCodeOfConduct: boolean
}

export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      // BetterAuth handles the whole flow (and signs the user in by default)
      // The server stamps the consent time and version; we only send the flag.
      // It is not part of the client's typed body, hence the variable.
      const body = {
        name: input.name,
        username: input.username,
        email: input.email,
        password: input.password,
        acceptCodeOfConduct: input.acceptCodeOfConduct,
      }
      const { error } = await authClient.signUp.email(body)
      if (error) throw toAuthError(error)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}
