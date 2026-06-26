# Tasks: The Crossing — CYOA Experience + Steward Dashboard

Implements [`spec.md`](./spec.md) per [`plan.md`](./plan.md). **API-first
order.** **No Prisma migration** (reuse `CustomBar`; state in `contextLines`).
Check off as completed; run `npm run build` + `npm run check` at each phase
boundary (fail-fix). `npm run check` must also show **no `schema.prisma` diff**.

## Phase 0 — Role model & tokens *(foundational)* — ✅ DONE

- [x] **T0.1** Rename `car_person` → `car_expert` in
  `src/lib/the-crossing-support-moves.ts` (id, label "Car Expert", union type);
  alias map so `getTheCrossingSupportRole('car_person')` still resolves.
- [x] **T0.2** Per-role fields: `element: ElementKey`, `isDonor`,
  `exploreVerb`, `filterKey`, and `capture` copy (`contactPlaceholder`,
  `offerLabel`, `offerPlaceholder`, `detailPlaceholder`). Domain→element via
  `DOMAIN_ELEMENT` (gather=earth, organize=wood, aware=metal, direct=fire).
- [x] **T0.3** Constants: `THE_CROSSING_FUND {goal:4800,base:3225}`,
  `THE_CROSSING_VENMO_HANDLE` (confirmed `wendell-britt`) + `theCrossingVenmoUrl`,
  `THE_CROSSING_CHANNELS` + `channelLabel`, `THE_CROSSING_FILTERS`,
  `THE_CROSSING_STATUSES` + `STATUS_META` (status colors).
- [x] **T0.4** Pure helpers: `parseContribution(bar)`, `computeFund`,
  `computeStewardStats`, `recipientsOf`, `filterCounts`. Legacy BARs default
  (`status='new'`, `channel='text'`, `amount=null`, `notes=[]`, `notified=false`).
- [x] **T0.5** Unit tests `src/lib/__tests__/the-crossing-support-moves.test.ts`:
  alias resolution, `computeFund` (base+amounts, cap 100%),
  `parseContribution` legacy + full defaults, recipients/filter counts. **Pass.**
- [x] **CHECK 0** `tsc --noEmit` (0 errors), `eslint` clean, unit test passes.
  *(Full `npm run check`'s `next build` not run here — heavy/needs DB; the
  type+lint+test gates are green.)*

## Phase 1 — API (actions before UI) — ✅ DONE

- [x] **T1.1** `submitTheCrossingMove(formData)` in
  `src/actions/the-crossing-support.ts` (legacy `submitTheCrossingSupport`
  retained, both via shared `createContributionBar`). Reads `channel`, donor
  `amount`; sets initial `status` (donor→accepted, else new), `notes:[]`,
  `notified:false`; redirects → `…/move/<role>/saved?bar=<id>`.
- [x] **T1.2** `assertSteward(playerId, campaignRef)` (reuses `findStewardPlayerId`
  + `assertCanEditInstanceDonation`); `findStewardPlayerId` exported. **Steward
  actions read the player from the session cookie — never a client arg.**
- [x] **T1.3** `stewardTransitionContribution({barId,action,message?})` — status
  table per plan; `log_message` appends `You: "…"` + advances new→contacted;
  `revalidatePath`.
- [x] **T1.4** Campaign-state singleton `CustomBar`
  (`id:'the-crossing-campaign-state'`, `evidenceKind:'campaign_state'`):
  `getCampaignState()`, `writeCampaignState`, `stewardMarkCarPurchased`,
  `stewardBroadcastThankYou` (non-declined → thanked+notified; returns count).
- [x] **CHECK 1** `tsc --noEmit` 0 errors; `eslint` clean.

## Phase 2 — Supporter landing (00–01) — ✅ DONE

- [x] **T2.1** `src/app/campaign/the-crossing/page.tsx` (server + metadata;
  no DB dependency → renders as a static experience) → `TheCrossingLanding.tsx`
  (client, owns accordion `openRoleId`). Literal segment overrides `[ref]`.
- [x] **T2.2** Hero (eyebrow, H1, subhead, body, two CTAs) + How-To-Play strip
  + `/awaken` top-right chrome link + fine print (copy verbatim).
- [x] **T2.3** Domain gates + role cards rendered inline in the landing
  (`RoleAccordion`) to keep accordion state cohesive — element-tinted glyph
  tile, EXPLORE/GIVE, color via `ELEMENT_TOKENS`. *(Deviation from separate
  DomainGate/RoleCard files — noted; the markup is the same.)*
- [x] **T2.4** Accordion (one open at a time; panel mounted; CSS `grid-rows`
  height animation with `motion-reduce:transition-none`): description, Tiny
  move/Creates/Why grid, deck-move chips, one `DeckCardForRole`, two CTAs
  (Donor primary = Venmo deep link; non-donor primary = capture, secondary =
  read-the-role; "Save this as a BAR →").
- [x] **T2.5** `/superpower` fallback card + water-tinted `/awaken` cross-link.
- [x] **CHECK 2** `tsc --noEmit` 0 errors; `eslint` clean. *(Live `next build`
  not run — heavy/needs env; landing is dependency-free static UI.)*

> Note: `DeckCardForRole` (`src/components/the-crossing/DeckCardForRole.tsx`)
> built here on the real `CultivationCard` primitive + `parseDeckCode`; reused
> by Phase 3 (satisfies most of T3.2).

## Phase 3 — Role detail + deck cards (02–05) — ✅ DONE

- [x] **T3.1** `role/[roleId]/page.tsx` (server, prop-driven for all six;
  `notFound()` on unknown; `generateStaticParams` + `generateMetadata`).
  Sections: breadcrumb, element-tinted header card (faded sigil), Do-this-now
  (Venmo for donor), Why-it-matters (impact + boundary on a left rule),
  Moves-you-can-make (new `role.examples`), two deck cards, purple account
  upsell, Superpower fallback, back link.
- [x] **T3.2** `components/the-crossing/DeckCardForRole.tsx` (built in Phase 2):
  `parseDeckCode` (`MOVE-DOMAIN-FACE`) + role element → `CultivationCard` with
  signed-out claim bar. Degrades without a deck-move registry (labels +
  question derive from the code).
- [x] **CHECK 3** `tsc --noEmit` 0 errors; `eslint` clean; unit test passes.
  Added `examples: string[]` to the role model (all six) for "Moves you can
  make".

## Phase 4 — Capture + saved (06–08)

- [ ] **T4.1** `move/[roleId]/page.tsx` capture form (560px): fields per plan,
  donor-only Amount, channel select, honeypot `url`. Sticky submit disabled
  until `name && contact && offer`; hint line flips. Wire `submitTheCrossingMove`.
- [ ] **T4.2** `move/[roleId]/saved/page.tsx`: load BAR by `?bar=`; green check;
  mini BAR card (deck code, NEW BAR pill, summary, role·domain); three CTAs.
- [ ] **CHECK 4** `npm run build` + `npm run check`. Submit a test move; confirm
  the BAR persists with new `contextLines` fields.

## Phase 5 — Steward dashboard + contributor (09–10)

- [ ] **T5.1** `steward/page.tsx` (auth-gated: `getCurrentPlayer` +
  `assertSteward`; signed-out → `/login?returnTo`; non-steward → 403 view).
  Query contributions + campaign state.
- [ ] **T5.2** `steward/StewardDashboard.tsx` (client `filter`): header, stat
  row, amber car-fund card, filter chips with counts, contribution list (`new`
  first, relative time). Click → contributor.
- [ ] **T5.3** `steward/contributor/[barId]/page.tsx`: header card, Offering,
  Reach via, Amount, Activity log, Follow-up panel with conditional actions →
  `stewardTransitionContribution`. Toast on change.
- [ ] **CHECK 5** `npm run build` + `npm run check`. Log a message → status
  advances to `contacted`.

## Phase 6 — Close the loop (11–13)

- [ ] **T6.1** Car-fund purchased state (green "CAR SECURED") + wire
  `stewardMarkCarPurchased`.
- [ ] **T6.2** `steward/thank-you/page.tsx`: recipient chips + prefilled
  editable message + `stewardBroadcastThankYou`.
- [ ] **T6.3** `steward/thank-you/sent/page.tsx`: paved-brick animation
  (reduced-motion-safe) + completion copy + "Back to the board".
- [ ] **CHECK 6** `npm run build` + `npm run check`.

## Phase 7 — Cleanup + verification quest

- [ ] **T7.1** Remove the `TheCrossingSupportSection` branch from
  `campaign/[ref]/CampaignLanding.tsx`; retire the component file. Confirm
  `/campaign/the-crossing` resolves to the new tree.
- [ ] **T7.2** `scripts/seed-cyoa-cert-the-crossing.ts` (idempotent): TwineStory
  (6 passages, spec § Verification Quest) + `CustomBar`
  `id:'cert-the-crossing-experience-v1'` (`isSystem`, `visibility:'public'`),
  barn-raising framing. Pattern: `scripts/seed-cyoa-certification-quests.ts`.
- [ ] **T7.3** `package.json`: `"seed:cert:the-crossing"`; run it once.
- [ ] **CHECK 7** `npm run build` + `npm run check`. Walk the full loop
  (landing → role → capture → saved → dashboard → log → mark purchased →
  broadcast → loop closed).

## Backlog / tracking

- [ ] **T8.1** Add a BACKLOG.md entry (next id) linking this spec; prompt file
  `.specify/backlog/prompts/the-crossing-experience.md`; `npm run backlog:seed`.
- [ ] **T8.2** Mark
  [`the-crossing-campaign-landing-page`](../the-crossing-campaign-landing-page/spec.md)
  as superseded-by this spec (experiential layer).

## Guardrails (every phase)

- No `prisma/schema.prisma` edits. `npm run check` must show no schema diff.
- All element color from `card-tokens`; purple = action/account/close-the-loop
  only. Status colors per spec.
- Steward authorization re-checked server-side on every steward action/page.
- `prefers-reduced-motion` honored for all motion.
- Keep the unauthenticated honeypot + `clean()` trimming on capture.
</content>
