import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Our font sizes (`@theme` in global.css) are custom names. Without this, tailwind-merge reads
// `text-label` as a colour and drops it (or a real colour) when both appear in one `cn()` call.
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
            "compact",
            "small",
            "meta",
            "logo",
            "h1",
            "h1-mobile",
            "lead",
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
