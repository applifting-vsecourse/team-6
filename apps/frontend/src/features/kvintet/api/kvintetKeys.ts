export const kvintetKeys = {
  all: ["kvintet"] as const,
  // Without a category this is the prefix of every feed key, so it clears or refreshes them all.
  feed: (category?: string) =>
    category
      ? ([...kvintetKeys.all, "feed", category] as const)
      : ([...kvintetKeys.all, "feed"] as const),
  membership: () => [...kvintetKeys.all, "membership"] as const,
  reference: () => [...kvintetKeys.all, "reference"] as const,
}
