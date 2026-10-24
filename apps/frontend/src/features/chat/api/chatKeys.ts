export const chatKeys = {
  all: ["chat"] as const,
  // Scoped to the kvintet: the poll appends to whatever is cached, so a cache from a previous
  // kvintet (left and rejoined within the cache time) must never be picked up.
  messages: (kvintetId: string) => [...chatKeys.all, "messages", kvintetId] as const,
}
