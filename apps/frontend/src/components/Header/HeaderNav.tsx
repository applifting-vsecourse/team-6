// The logo already links home, so "Home" would be a duplicate. Renders nothing
// until protected pages exist: wrap <HeaderNavLink> entries in a <nav> then,
// an empty landmark is noise for screen readers.
export function HeaderNav() {
  return null
}
