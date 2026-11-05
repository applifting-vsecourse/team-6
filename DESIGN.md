# Design contract

Read this before writing or changing any UI — human or agent.

These are rules, not suggestions. When a rule and a "nicer looking" idea disagree, the rule wins. Consistency across every screen beats a clever one.

`src/components/ui/**` is vendored shadcn — treat it as a third-party kit and restyle via tokens rather than rewriting it.

**Tokens live in `apps/frontend/src/styles/global.css`.** That file is the only source of truth for colour, type, radius and shadows, and mirrors the Figma file's variables (`Design_MVP`). This file says how to _use_ them.

The app has **two themes: light and dark**, switched in the header (`ThemeSwitcher`, state in `lib/theme.ts`). Both are defined by the same token names: `:root` holds light, `.dark` holds dark, and the Figma `[Tmavý]` frames are the reference. **Never write `dark:` colour overrides in feature code**: a semantic class (`bg-card`, `text-muted-foreground`) already follows the theme. The only exception is assets with baked-in colours (SVGs), which use `ThemedImage` with a `-dark` file.

## Colour

- **Never hardcode a colour.** No `#hex`, no `bg-blue-500`, no `rgb()`. Use the semantic classes only: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-primary`, `bg-secondary`, `border-border`, `bg-destructive`.
- **`primary` is for actions, not decoration.** One primary button per view. Everything else is `outline`, `ghost` or a plain link.
- **`destructive` only for destructive actions and errors.** Never for emphasis.
- **`accent` is a hover/active surface, not a brand colour.** It tints menu items and ghost buttons on hover, so it must stay quiet. The brand colour is `primary`.
- Text has three levels: `text-foreground` (ink-900: headings, labels, input values), `text-body` (ink-700: running copy) and `text-muted-foreground` (ink-500: hints, captions, meta). There is no fourth level.
- `background` is the paper colour of every page; `secondary`/`muted` (paper-100) is the only other surface tone.

## Layout

- **Cards are for separable items in a list** — an offer, a search result, a product. They are not page sections and not layout tools.
- **Never nest a card inside a card.** If content needs grouping inside a card, use spacing and a hairline divider.
- **A page is not a card.** Page content sits on `background` in a centred column (`max-w-120` for forms, `max-w-2xl` for reading, `max-w-4xl` for wide layouts), not inside a floating panel.
- **Every page keeps the app chrome.** The header and footer (`PageLayout`) are present on every route, including login and sign-up. Pages never render as standalone islands.
- Forbidden by default: the centred-hero-plus-three-feature-cards layout, carousels, and any section whose only purpose is to look full.

## Spacing

Use the scale only: `1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 14, 16, 22, 24` (Tailwind units — 4px…96px; the half steps and 5, 10, 22 come from the Figma). No arbitrary values like `p-[13px]`. Related things get `gap-2`/`gap-3`; fields in a form get `gap-5`; separate blocks get `gap-6`/`gap-8`.

## Type

- One `h1` per page. Headings step down without skipping.
- Three families: **Newsreader** (`font-serif`, headings and the logo; `h1`–`h3` get it from the base layer), **Source Sans 3** (`font-sans`, everything else) and **IBM Plex Mono** (`font-mono`, meta labels only).
- Sizes come from the scale: `text-sm` hints, `text-label` (15px, semibold) buttons and form labels, `text-base` body, `text-lg` lead text, `text-subheading` (21px) item titles, `text-heading` (28px) section titles, `text-title` (40px) page titles, `text-display` (64px) the landing headline only. Letter-spacing is part of the size token; do not add `tracking-*` to headings.
- Sentence case everywhere. No ALL CAPS except the one meta label style: `font-mono text-xs uppercase tracking-meta text-muted-foreground`, used for dates, step numbers and the footer line.
- One italic accent word per hero or greeting at most (`<em>` inside an `h1`).

## Surfaces

- **Borders are hairlines**: `border border-border`. One border, not two adjacent ones.
- **Shadows are rare.** Only for things that genuinely float above the page — dropdowns, dialogs, toasts. Cards and inputs do not get shadows.
- Radius comes from the token: `rounded-md` (2px) for buttons, `rounded-lg` (4px) for inputs, alerts and cards, `rounded-full` for tags. Never mix radii in one component.

## Forms

- Every input has a visible `<label>`. Placeholders are examples, never labels.
- Validation runs client-side _and_ server-side. The client message appears under the field.
- The submit button shows a pending state and is disabled while submitting.
- Never disable a submit button just because the form is untouched — let the user try and show them what's wrong.

## People are blobatars

Kvintet shows no photos, so every person is represented by a generated avatar from [blobatar](https://blobatar.dev): the same string always renders the same creature, with nothing stored or uploaded. Use `Blobatar` from `@/components/ui/blobatar` wherever a person appears (chat messages, member lists, kvintet cards) — never initials, stock icons or a hand-rolled avatar.

- **Seed:** the user's `username`, falling back to `id` when there is none. Use the same seed everywhere, or one person turns into two faces. Never seed from the e-mail (it is private). The exception is a person who is not in your group yet: their face is seeded by an opaque seat or membership value, so it never reveals who they are.
- **Three states, one meaning each**:
  - **Grey** — not met yet. Anyone outside your group: feed, proposals, "who's here" before the kvintet starts.
  - **Colour** (`Blobatar`) — you, and your group once it has started.
  - **Dashed circle** — a seat nobody has taken. Never a "+" or an empty avatar.
- **A kvintet is a group of five seats, never a number.** One shared component draws it, as a compact row (cards) or as a ring (the table of the home page and "kvintet begins"; seats scale with the container). Members first, free seats after, always five in total.
- **Sizes** come from the Figma, so pick the one for the job rather than a new value:

  | Use                                               | Size   | Class     |
  | ------------------------------------------------- | ------ | --------- |
  | Inline, in a chip or tile                         | 24 px  | `size-6`  |
  | Compact list ("who's here"), last message on home | 32 px  | `size-8`  |
  | Chat message, seats in a proposal card on home    | 36 px  | `size-9`  |
  | Member row in the feed, nav bar, mobile menu      | 48 px  | `size-12` |
  | Page title accent (onboarding), empty-state group | 56 px  | `size-14` |
  | "Kvintet begins", profile header                  | 96 px  | `size-24` |
  | Home "finish your profile"                        | 112 px | `size-28` |
  | Sign-up preview                                   | 160 px | `size-40` |

  The ring on home is 76–80 px per seat; size it from the container, not per seat.

- **Animate wherever it is affordable, and follow the mouse.** A blobatar that looks back at you is the point of the app, so give every avatar the eyes-follow-the-cursor motion unless the cost below rules it out. A static blobatar is one `<img>`; an animated one is ~12 SVG nodes, and every animated avatar runs its own gaze driver (its own `pointermove`, `scroll` and `resize` listeners and a frame loop). That is cheap for a handful and wasteful for dozens, so there are two modes, plus one special case:
  - **`always`** (`GazeBlobatar`, `animate="always"`) for one large avatar or one group of five: sign-up preview, profile header, the ring on home and "kvintet begins". Keep it to about ten on screen at once.
  - **`hover`** for everything that comes in a list: chat messages, feed and "who's here" rows, proposal cards. It is a static `Blobatar` that becomes animated only while the mouse is over it, so a list of any length costs one driver at a time. Never `always` in a list.
  - **Nav bar:** the one avatar that is always on screen is a single `GazeBlobatar` with `animate="hover"` (it idles only while hovered) and a larger `travel`.
  - Both switch themselves off for `prefers-reduced-motion` and on touch. The ~10 and "a list" thresholds are judgement, not measurements: if a profile of a real screen shows jank, move that screen from `always` to `hover`, and write the screen here.
- **Decorative by default** (no alt text) because the name is written next to it. If an avatar stands alone, pass `blobatar={{ title: name }}`.
- **Tests:** jsdom lacks `matchMedia`/`ResizeObserver`, so a test that renders `GazeBlobatar` mocks `@blobatar/react/gaze` (see `SignUpForm.test.tsx`).

## Every list has three states

Loading, empty, and error — all three, always. An empty list renders an empty state with one sentence saying what would appear here, not a blank area. An error renders the message and a way to retry.

Data refreshes itself: refetch when the tab regains focus, and invalidate the query after a mutation. A manual "reload" button in normal UI means one of those is missing — retry belongs in the error state only.

## Accessibility (the floor, not the ceiling)

- Buttons are `<button>`, links are `<a>`/`<Link>`. Never a `div` with `onClick`.
- Every icon-only control has an `aria-label`.
- Focus rings are never removed. If you restyle focus, it must stay clearly visible.
- Text contrast at least 4.5:1 — the tokens are chosen to satisfy this; hardcoded colours are how you break it.

## When you are unsure

Prefer less: fewer borders, fewer boxes, fewer font sizes, more whitespace. If a screen feels plain, the fix is usually better spacing and clearer hierarchy, not another container.

## Extending this file

When a code review keeps repeating the same UI feedback, add it here as a rule. That is the point of the file: expectations live in the repo, not in someone's head.
