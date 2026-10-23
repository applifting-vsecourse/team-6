import { HTTPError } from "ky"

/** True when the API answered with this stable error code (e.g. "already_in_kvintet"). */
export const isApiError = (error: unknown, code: string) =>
  error instanceof HTTPError && (error.data as { code?: string } | undefined)?.code === code
