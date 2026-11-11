type Placed = { id: string; top: number; bottom: number }

/**
 * Which card the person is looking at: the one the middle of the window falls on, or, when it falls
 * in a gap between cards, the nearest. `undefined` when there is none to choose from.
 */
export function cardInView(cards: Placed[], viewportHeight: number): string | undefined {
  const line = viewportHeight / 2
  let nearest: string | undefined
  let distance = Infinity

  for (const card of cards) {
    const away = line < card.top ? card.top - line : line > card.bottom ? line - card.bottom : 0
    if (away < distance) {
      nearest = card.id
      distance = away
    }
  }
  return nearest
}
