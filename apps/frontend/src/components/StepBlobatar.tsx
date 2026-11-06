import { happy } from "blobatar/expression"

import { Blobatar } from "@/components/ui/blobatar"

type StepBlobatarProps = {
  /** A first name from the Figma frames; these are illustrations, not real people. */
  seed: string
  className?: string
}

/** The smiling blobatar that marks a step of "How it works". Static and decorative. */
export function StepBlobatar({ seed, className }: StepBlobatarProps) {
  return (
    <Blobatar
      name={seed}
      className={className}
      blobatar={{ expression: happy }}
    />
  )
}
