import { z } from "zod"

export const kvintetTabSchema = z.enum(["overview", "messages"])

export type KvintetTab = z.infer<typeof kvintetTabSchema>
