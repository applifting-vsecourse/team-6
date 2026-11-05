import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Our font sizes (`@theme` in global.css) are not Tailwind's own, so twMerge would read
// `text-small` as a colour and drop one of `text-small text-destructive`. Keep in sync with the
// `--text-*` tokens there.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "title",
            "heading",
            "subheading",
            "label",
            "small",
            "meta",
            "logo",
            "h1",
            "h1-mobile",
            "lead",
            "copy",
            "h3",
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
