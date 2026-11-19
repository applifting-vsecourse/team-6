import { blobatar } from "blobatar"

/**
 * The avatar as a favicon. The viewBox is cropped tight so the blob fills the 16 px square without
 * clipping any shape (the widest decorations, droplet tip and cloud petals, stay inside it).
 */
export function faviconSvg(seed: string) {
  return blobatar(seed).replace('viewBox="0 0 100 100"', 'viewBox="6 6 88 88"')
}

export const faviconHref = (seed: string) =>
  `data:image/svg+xml,${encodeURIComponent(faviconSvg(seed))}`
