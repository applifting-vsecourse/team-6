import { createContext } from "react"

// The seed of the signed-in person's own blobatar. It comes from the route because the profile
// feature does not import the auth feature.
export const AvatarSeedContext = createContext<string | undefined>(undefined)
