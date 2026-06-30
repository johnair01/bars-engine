# Plan: The Crossing — CYOA Experience + Steward Dashboard

Implements [`spec.md`](./spec.md). **API-first** (action signatures + data shape
before UI). **No Prisma migration** — contributions stay `CustomBar`s; new state
lives in `contextLines` JSON. Each phase ends with `npm run build` + `npm run
check` (fail-fix) and is independently shippable.

## Architecture at a glance

```
src/lib/the-crossing-support-moves.ts     ← extend: element, channel/labels, fund consts, car_expert rename
src/actions/the-crossing-support.ts        ← extend submit + add steward actions
src/app/campaign/the-crossing/             ← NEW dedicated route tree (literal segment beats [ref])
  page.tsx                                  (00–01 landing: hero, How To Play, gates+accordion)
  TheCrossingLanding.tsx                    (client: accordion state)
  role/[roleId]/page.tsx                    (02–05 role detail + deck cards)
  move/[roleId]/page.tsx                    (06–07 capture)
  move/[roleId]/saved/page.tsx              (08 saved-as-BAR)
  steward/page.tsx                          (09 dashboard — auth-gated)
  steward/StewardDashboard.tsx              (client: filter chips)
  steward/contributor/[barId]/page.tsx      (10 follow-up)
  steward/thank-you/page.tsx                (12 broadcast)
  steward/thank-you/sent/page.tsx           (13 loop closed)
src/components/the-crossing/                ← NEW presentational components (RoleCard, DeckCardForRole, etc.)
src/app/campaign/[ref]/CampaignLanding.tsx  ← remove the inline TheCrossingSupportSection branch
scripts/seed-cyoa-cert-the-crossing.ts      ← verification quest seed
```

> **Routing note**: Next.js resolves the literal `the-crossing` segment before
> the `[ref]` dynamic segment, so the new tree transparently overrides the old
> `[ref]`-rendered support section. Keep the static-fallback behavior (renders
> even if no campaign record exists).

## Phase 0 — Role model & tokens *(foundational, build first)*

Extend `src/lib/the-crossing-support-moves.ts` (single source of truth):

1. **Rename** `car_person` → `car_expert` (id + label "Car Expert"). Add an
   alias map so `getTheCrossingSupportRole('car_person')` still resolves
   (historical BARs). Update `TheCrossingSupportRoleId` union.
2. **Add per-role fields** the UI/forms need:
   ```ts
   element: ElementKey            // earth | wood | metal | fire (from card-tokens)
   isDonor?: boolean              // donor → amount field + auto-accept
   capture: {                     // role-specific form copy (from prototype)
     contactPlaceholder: string   // e.g. "phone, @handle, or email"
     offerLabel: string           // e.g. "The lead" | "Your read" | "The introduction"
     offerPlaceholder: string     // e.g. "2019 Honda Civic, $6,200, clean title"
     detailPlaceholder: string    // e.g. "Paste the listing link and why it fits."
   }
   filterKey: string              // dashboard chip grouping (= role.id)
   exploreVerb: 'Explore' | 'Give'
   ```
   Domain→element: Gather=earth, Organizing=wood, Awareness=metal, Direct=fire.
3. **Centralize constants**:
   ```ts
   export const THE_CROSSING_FUND = { goal: 4800, base: 3225 } as const
   export const THE_CROSSING_VENMO_HANDLE = 'wendell-britt' // PLACEHOLDER — confirm
   export const THE_CROSSING_CHANNELS = ['text','email','instagram','signal','venmo'] as const
   export const THE_CROSSING_FILTERS = [
     { key:'all', label:'All' },
     { key:'new', label:'Needs follow-up' },        // status==='new'
     { key:'car_scout', label:'Leads' },
     { key:'connector', label:'Intros' },
     { key:'signal_booster', label:'Awareness' },
     { key:'encourager', label:'Care' },
     { key:'donor', label:'Donations' },
   ] as const
   ```
4. **Contribution helpers** (pure, unit-testable): `parseContribution(bar)` →
   typed `{ id, role, name, contact, channel, summary, detail, status, amount,
   notified, createdAt, notes[] }` from `contextLines`; `computeFund(contribs)`
   → `{ raised, pct, leads }`; `computeStewardStats(contribs)` → `{ total,
   pending, people }`; `recipientsOf(contribs)` (unique-by-name, non-declined).

   *Status colors* (for tokens, not element palette): new `#d4a017` · contacted
   `#3a93c8` · accepted `#2ecc71` · declined `#8e7d76` · thanked `#a855f7`.

**Verify**: add `src/lib/__tests__/the-crossing-support-moves.test.ts` covering
the alias, `computeFund` (base+amounts, cap 100%), and `parseContribution`
defaults for legacy BARs.

## Phase 1 — API: capture + steward actions *(API before UI)*

In `src/actions/the-crossing-support.ts`:

1. **Extend** `submitTheCrossingSupport` → keep the name for back-compat, add a
   `submitTheCrossingMove` that reads `channel`, `amount`, sets initial `status`
   (`donor → accepted`, else `new`), `notes:[]`, `notified:false`, and writes
   them into `contextLines` (see spec § Data Contract). Redirect →
   `…/move/<role>/saved?bar=<id>`.
2. **`stewardTransitionContribution({ barId, action, message? })`** — load BAR,
   `assertSteward()`, parse `contextLines`, apply transition (see status table),
   for `log_message` append `You: "<message>"` to `notes` + advance
   `new→contacted`, write back, `revalidatePath`. Returns `{ success, error? }`.
3. **`stewardMarkCarPurchased({ campaignRef })`** + **`stewardBroadcastThankYou
   ({ campaignRef, message })`** — campaign-level state. **Decision**: store on a
   single steward-owned **state `CustomBar`** with deterministic id
   `the-crossing-campaign-state` (`evidenceKind:'campaign_state'`,
   `contextLines:{ carPurchased, thanked }`) — avoids a migration and a column on
   `Instance`. Broadcast iterates contributions: non-`declined` →
   `status:'thanked'`, `notified:true`; returns recipient count.
4. **`assertSteward(playerId, campaignRef)`** helper — reuse the existing
   steward-resolution chain + `assertCanEditInstanceDonation`; reject otherwise.

**Status transition table** (server-enforced):

| action | from | to |
|---|---|---|
| `log_message` | new | contacted (and append note) |
| `log_message` | any other | unchanged (append note) |
| `mark_contacted` | new | contacted |
| `accept` | new｜contacted | accepted |
| `decline` | new｜contacted｜accepted | declined |
| broadcast | any except declined | thanked + notified |
| submit (donor) | — | accepted |
| submit (other) | — | new |

## Phase 2 — Supporter landing (00–01)

- `page.tsx` (server) resolves roles + renders `TheCrossingLanding.tsx`
  (client, owns accordion `openRoleId`).
- **Hero** (copy verbatim from prototype): eyebrow "◇ Part of the Allyship
  Launch · Barn Raising"; H1 "The Crossing"; subhead "Wendell needs a reliable
  car to keep showing up."; body "Every kind of help moves this forward. Choose
  the path that fits what you can actually offer."; CTAs "Choose Your Move →"
  (→ `#paths`) + "Read the full story"; top-right "Book-launch weekend →" →
  `/awaken`.
- **How To Play** strip: three numbered steps (verbatim copy in spec/extraction).
- **Choose a path** (`#paths`): four domain gates (sigil + tinted label + blurb)
  → role cards beneath. `RoleCard` = element `frame` border, glyph tile,
  name + tiny-move, EXPLORE/GIVE. Accordion: one open at a time; panel mounts
  (not opacity-0); `prefers-reduced-motion`. Panel: description, Tiny
  move/Creates/Why grid, deck-move chips, one starter `DeckCardForRole`, two
  CTAs (primary → `…/move/<id>`; secondary "Save this as a BAR →" → same;
  Donor primary = Venmo deep link).
- **Fallbacks**: "Not sure this is your role? Take the Superpower Quiz →" →
  `/superpower`; water-tinted `/awaken` cross-link; fine-print line.
- All color via `card-tokens` (`ELEMENT_TOKENS[role.element]`); layout via
  Tailwind; aesthetic via `cultivation-cards.css`. Per `UI_COVENANT.md`.

## Phase 3 — Role detail + deck cards (02–05)

- `role/[roleId]/page.tsx`: one prop-driven component, all six roles; 404 on
  unknown id. Sections: breadcrumb → element-tinted header card (faded sigil) →
  "Do this now" (tiny-move + primary CTA + "Save this as a BAR") → "Why it
  matters" (impact + boundary on left rule) → "Moves you can make" (examples) →
  two deck cards → purple "Save this contribution" account card → `/superpower`.
- **`DeckCardForRole`**: map `role.starterCardIds[i]` → real deck-move data and
  render with **`CultivationCard`** (do not port `AllyshipCard.dc.html`). Parse
  the move code `WAKE-GR-DIPLOMAT` → `{ move: WAKE, domain: GR, face: DIPLOMAT }`
  for glyphs; element from role. Signed-out action bar ("Sign in to claim").
  *If a deck-move registry exists, look it up; else derive label/question from
  the code + role copy.* (Confirm registry in build — see Open Questions.)

## Phase 4 — Capture + saved (06–08)

- `move/[roleId]/page.tsx` (client form, server action): 560px column. Back
  link → role. Element glyph + "MAKE YOUR MOVE" + role H1 + helper line. Fields:
  Name + "Reach you on" (channel select) in 2-col; "Where to reach you"
  (contact); **donor-only** Amount; role `offerLabel` field; "Link or context"
  textarea (optional). Sticky submit: element gradient when valid, disabled
  until `name && contact && offer` (trimmed). Hint flips: disabled "Add your
  name, contact, and what you're offering." / valid "Goes straight to Wendell's
  board." Keep honeypot `url`.
- Submits `submitTheCrossingMove` (Phase 1).
- `move/[roleId]/saved/page.tsx`: load BAR by `?bar=`; green check; H1 "Your
  move is saved as a BAR."; mini BAR card (deck code, NEW BAR amber pill, offer
  summary, role·domain); three CTAs — "Create your BARS Engine account to track
  this →" (purple, → login/signup), "See where it lands · Steward view →" (→
  steward), "← Back to The Crossing · pick another path" (→ `…/the-crossing#paths`).

## Phase 5 — Steward dashboard + contributor (09–10)

- `steward/page.tsx` (server, **auth-gated** via `getCurrentPlayer` +
  `assertSteward`; redirect to `/login?returnTo=…` if signed out, 403 view if
  not steward). Query: `db.customBar.findMany({ where: { campaignRef:
  'the-crossing', evidenceKind: 'support_intake' } })` → `parseContribution`.
  Load campaign-state BAR for `carPurchased`/`thanked`.
- Renders `StewardDashboard.tsx` (client, owns `filter`): header "Wendell's
  board"; stat row (Contributions/Needs follow-up/People in the field); amber
  car-fund card (`$raised of $4,800`, `NN% · N leads in`, progress bar,
  "Mark the car as purchased →"); filter chips with counts (mapping in Phase 0);
  contribution list (element accent rule, glyph, name+role pill+New pill,
  truncated summary, status label + relative time; `new` sorts first). Click →
  contributor.
- `steward/contributor/[barId]/page.tsx`: header card (name, role·domain, status
  pill), Offering, Reach via (contact·channel), Amount (donor), Activity log
  (notes), Follow-up panel (reply textarea + conditional actions wired to
  `stewardTransitionContribution`). Toast on transition.

## Phase 6 — Close the loop (11–13)

- Car-fund card purchased state (green "CAR SECURED", car glyph, "2019 Honda
  Civic — on the road", "Thank your contributors →"); driven by
  `stewardMarkCarPurchased`.
- `steward/thank-you/page.tsx`: "To · N people" recipient chips (name+channel),
  prefilled editable textarea (default broadcast copy from prototype), "Send
  thank-you to N contributors →" → `stewardBroadcastThankYou`.
- `steward/thank-you/sent/page.tsx`: paved-brick animation
  (reduced-motion-safe), "A yellow brick is paved.", "You let N contributors
  know…", "Back to the board".

## Phase 7 — Verification quest

- `scripts/seed-cyoa-cert-the-crossing.ts` (idempotent): `TwineStory` (6
  passages per spec § Verification Quest) + `CustomBar` `{ id:
  'cert-the-crossing-experience-v1', isSystem: true, visibility: 'public' }`.
- `package.json`: `"seed:cert:the-crossing": "tsx scripts/seed-cyoa-cert-the-crossing.ts"`.
- Pattern: copy `scripts/seed-cyoa-certification-quests.ts`.

## Deck move code parsing (reference)

`MOVE-DOMAIN-FACE`: MOVE ∈ {WAKE,OPEN,CLEAN,GROW,SHOW}; DOMAIN ∈
{GR=Gather,SO=Skillful Organizing,RA=Raise Awareness,DA=Direct Action};
FACE ∈ {ARCHITECT,DIPLOMAT,REGENT,CHALLENGER,SAGE,SHAMAN}. Used by
`DeckCardForRole` for glyphs/labels.

## AllyshipCard → CultivationCard mapping

| Prototype `AllyshipCard` prop | Real source |
|---|---|
| `card.move/face/el/domain` | parsed from `starterCardIds[i]` + `role.element` |
| `card.q` (question) | deck-move registry if present, else role-derived copy |
| `mod.contribution/artifact` | `role.tinyMove` / `role.artifact` |
| `status` | `'signedout'` on public pages |
| glyphs | `move-icons.ts` + `ELEMENT_TOKENS[].sigil` |

## File impacts

- **Edit**: `the-crossing-support-moves.ts`, `the-crossing-support.ts`,
  `campaign/[ref]/CampaignLanding.tsx` (remove inline branch), `package.json`.
- **New**: the `campaign/the-crossing/**` tree, `components/the-crossing/**`,
  seed script, lib test.
- **Delete/retire**: `campaign/[ref]/TheCrossingSupportSection.tsx` (after the
  dedicated landing supersedes it).

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Steward auth on a public-ish campaign | Server-side `assertSteward` on every steward action + page; never trust client. |
| Legacy `car_person` BARs | Alias map + `parseContribution` defaults. |
| Deck-move registry may not exist | `DeckCardForRole` degrades to code-derived label/question; confirm in build. |
| Campaign-state without migration | Singleton state `CustomBar` (`evidenceKind:'campaign_state'`). |
| Double surface during rollout | Remove `[ref]` inline branch in the same PR that lands the dedicated landing. |
| Reduced motion | Gate all animations behind `prefers-reduced-motion`. |

## Open questions (carry to build, none block planning)

1. Real Venmo handle (placeholder `wendell-britt`).
2. Does a deck-move registry exist to source card `question`/`title`, or derive
   from the code? (affects `DeckCardForRole` fidelity only.)
3. Confirm the steward player resolves in the target DB (env override exists).

## Verification (every phase)

`npm run build` + `npm run check` (lint + type). `npm run check` also confirms
**no `prisma/schema.prisma` diff** (no migration). Manual: walk the loop per the
verification quest.
</content>
