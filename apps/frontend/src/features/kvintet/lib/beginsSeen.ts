// The "Kvintet begins" page is shown once per kvintet. The backend does not know who has seen
// it, so the mark lives in this browser. shortcut: a second device or cleared storage shows the
// page again, which is harmless; move the mark to the membership if that ever matters.
const key = (kvintetId: string) => `kvintet-begins-seen:${kvintetId}`

export function hasSeenBegins(kvintetId: string): boolean {
  try {
    return localStorage.getItem(key(kvintetId)) !== null
  } catch {
    // Storage blocked: treat as seen, so the user is never sent to the page again and again.
    return true
  }
}

export function markBeginsSeen(kvintetId: string): void {
  try {
    localStorage.setItem(key(kvintetId), "1")
  } catch {
    // Nothing to do; see hasSeenBegins.
  }
}
