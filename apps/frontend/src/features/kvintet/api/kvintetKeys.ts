export const kvintetKeys = {
  all: ["kvintet"] as const,
  feed: () => [...kvintetKeys.all, "feed"] as const,
  membership: () => [...kvintetKeys.all, "membership"] as const,
  reference: () => [...kvintetKeys.all, "reference"] as const,
}
