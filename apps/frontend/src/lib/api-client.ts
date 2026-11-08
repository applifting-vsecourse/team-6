import ky, { HTTPError } from "ky"

import { env } from "@/config/env"
import { queryClient } from "@/config/react-query"
import { authKeys } from "@/lib/auth-keys"

// Single shared HTTP client. Per the Applifting frontend playbook:
// - send credentials so better-auth's session cookie travels with every request
// - on 401 invalidate the auth session query so route loaders re-resolve auth
//   and redirect through the login flow
// - API errors keep the parsed body on `error.data` ({ code, errors[] } from the
//   backend's exception filter); `getErrorMessage` turns it into translated text
//
// Paths are joined onto `prefix`, and a leading slash is normalised away, so
// both `api.get("welcome")` and `api.get("/welcome")` hit the same endpoint.
export const api = ky.create({
  prefix: env.VITE_API_URL,
  credentials: "include",
  retry: { limit: 0 },
  hooks: {
    afterResponse: [
      ({ response }) => {
        if (response.status === 401) {
          queryClient.clear()
          void queryClient.invalidateQueries({ queryKey: authKeys.session() })
        }
      },
    ],
  },
})

export { HTTPError }
