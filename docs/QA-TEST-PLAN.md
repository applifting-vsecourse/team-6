# QA test plan – P0 stories

Manual test cases for the `important: 0` stories in the backlog. Each case maps to the story's acceptance criteria (AC).
Tick a case when it passes. If it fails, open a `bug` issue and link it next to the case. ⏸ = not testable yet (feature not on `develop`).

- **Where to test:** live app https://team-6.vsepractical.applifting.dev, or locally with `pnpm dev` (frontend http://localhost:3050). Seeded demo users are listed in the [README](../README.md#seeded-users) (local only – production has no seed).
- **Devices:** desktop (primary) + phone width 375 px (browser dev tools → device toolbar).
- **Themes:** light and dark (switcher in the header).

Owner: Valeriia (QA).

---

## 0. Cross-cutting checks (run on every screen)

- [ ] **X-1** Open the screen at 375 px width → Nothing overflows horizontally, all buttons reachable, text readable
- [ ] **X-2** Look for hardcoded / English text in the Czech UI → All texts are Czech and come from translation keys (no raw keys like `auth.signIn.title` visible)
- [ ] **X-3** Look for photos, avatars, faces → None anywhere (#3)
- [ ] **X-4** Look for stars, scores, public statistics about people → None (#7, #13, #16)
- [ ] **X-5** Dusty-rose accent → At most one accent element per screen (#3)
- [ ] **X-6** Loading / empty / error states → Every list has all three (throttle network in dev tools to see loading; stop the backend to see the error)
- [ ] **X-7** Compare with Figma → Layout and texts match the wireframe/design linked in the issue
- [ ] **X-8** Switch to dark theme and back → Every text and control stays readable; the choice survives a reload

---

## 1. Registration with code of conduct consent (#5)

- [ ] **REG-1** Open registration, fill a valid e-mail + password, tick consent, submit → Account is created, user continues to onboarding
- [ ] **REG-2** Fill everything but do **not** tick consent, submit → Form cannot be submitted, clear error next to the checkbox
- [ ] **REG-3** Click the code of conduct link in the consent label → Code of conduct page opens (ideally a new tab, form data not lost)
- [ ] **REG-4** Sign out, open `/code-of-conduct` directly by URL → Page is reachable without sign-in; contains the rules + what happens after a report (support e-mail)
- [ ] **REG-5** Check header/footer on several pages → Code of conduct link is present
- [ ] **REG-6** Register with an e-mail that already exists → Understandable error, no crash
- [ ] **REG-7** Invalid e-mail format (`abc`, `abc@`) → Validation error, not submitted
- [ ] **REG-8** Empty / very short password → Validation error with the rule explained
- [ ] **REG-9** After registration, check the DB (Prisma Studio) → Consent timestamp and code of conduct version stored with the user

## 2. Sign in and sign out (#6)

- [ ] **AUTH-1** Sign in as a user who has **not** finished onboarding → Lands on onboarding
- [ ] **AUTH-2** Sign in as a user who **has** finished onboarding → Lands on the Overview page (`/overview`)
- [ ] **AUTH-3** Wrong password for an existing e-mail → Generic error ("wrong e-mail or password")
- [ ] **AUTH-4** Non-existent e-mail → **Same** generic error as AUTH-3 (doesn't reveal whether the e-mail exists)
- [ ] **AUTH-5** Sign out from the header → User is signed out, lands on a public page; Back button doesn't show protected content
- [ ] **AUTH-6** Signed out, open a protected URL directly (e.g. `/kvintet`) → Redirect to sign-in; after sign-in returns to that page (or Overview)
- [ ] **AUTH-7** Signed in, refresh the page / close and reopen the browser → Still signed in
- [ ] **AUTH-8** Signed in, open `/login` → Redirect away from login (no double sign-in)

## 3. Onboarding: profile and questionnaire (#7)

- [ ] **ONB-1** Fill role, teach / learn / interests (from tags), questionnaire; submit → Saved; lands on Overview
- [ ] **ONB-2** Try to type a custom tag → Only predefined tags can be chosen
- [ ] **ONB-3** Leave a required field empty, submit → Validation error, not saved
- [ ] **ONB-4** Before finishing onboarding, open `/kvintet/feed` directly → Access denied / redirect to onboarding
- [ ] **ONB-5** Look for a photo upload → No photo/avatar upload anywhere
- [ ] **ONB-6** Leave onboarding halfway, sign out, sign in again → Lands on onboarding again (AUTH-1)

## 4. Post an offer on the board (#10)

Not on `develop` yet – mark ⏸ until the board is merged.

- [ ] **OFF-1** ⏸ Fill what, when, where, spots, category; submit → Offer appears on the board
- [ ] **OFF-2** ⏸ Date in the past → Validation error
- [ ] **OFF-3** ⏸ Spots = 0, negative, text → Validation error
- [ ] **OFF-4** ⏸ Post 3 offers with different dates → Board ordered by date (soonest first)
- [ ] **OFF-5** ⏸ Empty board (fresh DB) → Empty state with a call to action
- [ ] **OFF-6** ⏸ Very long title / description → Doesn't break the layout (desktop + 375 px)
- [ ] **OFF-7** ⏸ Signed-out user opens the board → Redirect to sign-in

## 5. Board categories and filter (#11)

Not on `develop` yet (branch `feat/11-board-categories-filter`).

- [ ] **CAT-1** ⏸ Create an offer without a category → Not possible – category is required
- [ ] **CAT-2** ⏸ Select a category in the filter → Only offers of that category shown; URL changes (e.g. `?category=sport`)
- [ ] **CAT-3** ⏸ Copy the filtered URL into a new tab → Same filter applied
- [ ] **CAT-4** ⏸ Filter a category with no offers → Empty state "no offers in this category"
- [ ] **CAT-5** ⏸ Clear the filter → All offers back
- [ ] **CAT-6** ⏸ Put nonsense in the URL (`?category=xxx`) → No crash; empty state or filter reset

## 6. Kvintet proposal feed (#13) – `/kvintet/feed`

Needs several users (local seed).

- [ ] **PRO-1** Open the feed as an onboarded user → All open proposals listed with members' roles + interests, **no names/photos**
- [ ] **PRO-2** Join a proposal → User becomes a member; proposal shows +1 member
- [ ] **PRO-3** Already a member, try to join another proposal → Not possible, clear message
- [ ] **PRO-4** Proposal with 5 members → Cannot be joined (button disabled / hidden)
- [ ] **PRO-5** Two users join the 5th spot at the same time (two browsers) → Only one succeeds; the other sees an error, never 6 members
- [ ] **PRO-6** Start a new proposal → Created with me as the first member; visible in another user's feed
- [ ] **PRO-7** Empty feed → Empty state with "start a proposal"

## 7. My kvintet page (#16) – `/kvintet`

- [ ] **KVI-1** A member opens My kvintet → Sees the other members' name, role, interests
- [ ] **KVI-2** The group is still a proposal → Page says it's a proposal (+ vote status)
- [ ] **KVI-3** A non-member opens another kvintet's URL / API endpoint → Access denied (check the API call in dev tools too, not just the UI)
- [ ] **KVI-4** A user without a kvintet opens the page → Empty state with a link to the feed

## 8. Kvintet group messages (#17) – `/kvintet/messages`

- [ ] **MSG-1** A member sends a message → Appears in the chat with author name + time
- [ ] **MSG-2** A second member has the chat open in another browser → New message appears within a few seconds without a reload
- [ ] **MSG-3** Order of messages → Oldest → newest
- [ ] **MSG-4** A non-member / admin calls the messages URL or API → Access denied
- [ ] **MSG-5** Empty message / only spaces → Not sent
- [ ] **MSG-6** Very long message, emoji, `<script>alert(1)</script>` → Displayed as text, no layout break, no script runs
- [ ] **MSG-7** Check the backend logs while sending → Message content is not logged

## 9. Localization-ready app (#4) and design system (#3)

- [ ] **LOC-1** Search the frontend code for hardcoded strings in JSX → None in feature code
- [ ] **LOC-2** Trigger a backend validation error → Frontend shows translated Czech text, not a raw code / English message
- [ ] **LOC-3** Dates in the chat (and later on the board) → Czech format (e.g. 19. 10. 2026)
- [ ] **DS-1** Check the header → Five-circle logo shown
- [ ] **DS-2** Dev tools → Network → Fonts loaded from our domain, no Google Fonts CDN

---

## 10. End-to-end happy path (demo script)

Run this before every demo, ideally on the live app:

1. Register a new user with consent → onboarding
2. Fill in profile + questionnaire → Overview
3. _(when the board is merged)_ Post an offer on the board → it appears; filter by its category
4. Open the proposal feed → start a new proposal
5. Sign in as other users and join the proposal → either 5/5 (forms automatically) or 3–4 members who all vote "start now" (#15)
6. My kvintet page shows all members with names
7. Send a message in the group chat → another member sees it within seconds
8. Sign out

---

## 11. Gaps and questions found while writing the tests (to clarify with PO / team)

1. **Overview page:** `/overview` now exists on `develop`, but is there a story with AC for it (#21 is the admin overview, a different page)? Without AC, AUTH-2 / ONB-1 can only check that the page opens.
2. **Voting (#15):** voting to start with 3–4 members is already on `develop` (seed has a user who voted). Its AC should be added to this plan as its own section.
3. **Leaving a proposal is P2 (#18).** A user who joins the wrong proposal in the MVP is stuck. Should "leave proposal" move to P0/P1?
4. **When are names revealed?** #13 hides names in proposals, #16 shows names on the kvintet page, which can also be a proposal (KVI-2). Does a proposal member see names or not?
5. **Password rules** (min. length etc.) aren't in #5 – needed for REG-8.
6. **Duplicate e-mail behaviour** isn't in #5 – needed for REG-6.
7. **Open content questions** block some tests: predefined tags list (#7), questionnaire questions (#7), board categories (#11), code of conduct text (#5), max. offer capacity (#10).

---

## Bug report template (new issue, label `bug`)

```
**Story:** #<number>   **Test case:** <ID>
**Environment:** live / local, desktop / 375 px, light / dark, browser
**Steps to reproduce:**
1.
2.
**Expected:**
**Actual:**
**Screenshot / video:**
```
