import { happy } from "blobatar/expression"

import { HoverGazeBlobatar } from "@/components/HoverGazeBlobatar"

type StepBlobatarProps = {
  /** A first name from the Figma frames; these are illustrations, not real people. */
  seed: string
  className?: string
}

/**
 * The smiling blobatar that marks a step of "How it works". A short list, so it is `hover`: static
 * until the mouse is over it, then it follows the pointer (DESIGN.md, "People are blobatars").
 */
export function StepBlobatar({ seed, className }: StepBlobatarProps) {
  return (
    <HoverGazeBlobatar
      name={seed}
      className={className}
      expression={happy}
    />
  )
}
