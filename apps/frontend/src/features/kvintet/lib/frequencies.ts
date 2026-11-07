export const FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const

export type Frequency = (typeof FREQUENCIES)[number]
