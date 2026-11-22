import { api } from "@/lib/api-client"

export async function deleteAccount(): Promise<{ success: boolean }> {
  return api.delete("me").json<{ success: boolean }>()
}

/** The caller's own data as a JSON file (GDPR Art. 15 and 20). */
export async function downloadMyData(): Promise<void> {
  const blob = await api.get("me/export").blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "kvintet-my-data.json"
  link.click()
  URL.revokeObjectURL(url)
}
