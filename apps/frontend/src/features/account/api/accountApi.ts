import { api } from "@/lib/api-client"

export async function deleteAccount(): Promise<{ success: boolean }> {
  return api.delete("me").json<{ success: boolean }>()
}
