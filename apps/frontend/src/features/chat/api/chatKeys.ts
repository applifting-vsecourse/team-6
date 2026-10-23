export const chatKeys = {
  all: ["chat"] as const,
  messages: () => [...chatKeys.all, "messages"] as const,
}
