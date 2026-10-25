import type { ImgHTMLAttributes } from "react"

import { useTheme } from "@/lib/theme"

type ThemedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  light: string
  dark: string
}

// SVG assets have their colours baked in, so each theme gets its own file.
export function ThemedImage({ light, dark, ...props }: ThemedImageProps) {
  const { theme } = useTheme()

  return (
    <img
      src={theme === "dark" ? dark : light}
      alt=""
      {...props}
    />
  )
}
