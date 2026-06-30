# Strand consult: Superpower System Reconciliation — open items, Six Game Master faces

**Question on the table:** With the cross-branch merge landed (single `Superpower`
source, M1 quiz→loadout mapping, loadout persistence on intake — commit `36d09b2`),
**where do we go next on the items still open from `reconciliation.md`?**

Open items inherited from the doc:
- **OQ4 — `translate.ts`:** retire fully / adapter-wrap / keep as a distinct
  reveal-time lens, in favor of the technique-library resolver.
- **Slice 3 — offers:** superpower pack SKUs + `loadout-bundle` land in `offers.ts`
  (go-deeper upsell currently dead-links to `/launch`).
- **Boundary vocab:** Branch B adopts shared aspect/subject (`campaign → other`).
- **OQ2 / OQ3 — Coach:** confirm channel/domain; does Coach get a 7th pack or stay
  bundled/role-specific?

**Grounding facts (verified in code, not the doc):**
- `translateCardForSuperpower` is **live**, not dead: imported by
  `components/handbook/HandbookReader.tsx`, `components/onboarding/OnboardingRecommendation.tsx`,
  and `lib/superpowers/card-view.ts`. The doc's default ("retire") is **already
  falsified** — retiring it breaks the handbook + onboarding reveal.
- `offers.ts` `OfferKey` has **no** `superpower-*-pack` or `loadout-bundle`. The
  go-deeper `upsellSku` resolves but the UI links to `/launch` as a placeholder —
  the funnel has a **floor with no checkout**.
- `SUPERPOWER_DEFS.coach` already exists (channel `fire`, domain `GATHERING_RESOURCES`)
  — OQ2 is effectively answered in `types.ts`; the live question is OQ3 (pack-or-not).

Faces deliver **observations / risks / recommendations**. **Sage** issues the ruling
+ next-step deltas. Registers are the canonical `FACE_HEALTHY_REGISTER` from
`src/lib/quest-grammar/move-aspect.ts`.

---

## 1. Shaman — *in ritual, holding the container* (charge / terrain)

- **Observation:** The funnel's charge lives in **one moment**: a player clicks Go
  Deeper on a self-card and the move *pays off*. Right now that moment ends at a
  dead `/launch` link. The container is built but the ritual has no exit.
- **Observation:** Two translation engines (resolver + `translate.ts`) is **two
  voices speaking the same card** — players will feel the seam if the handbook lens
  and the Go Deeper move disagree about what a superpower "says."
- **Risk:** Chasing Coach's 7th pack or vocab purity now is **necromancy on a
  not-yet-living funnel** — polishing organs before the body breathes.
- **Recommendation:** Restore the ritual first. **Slice 3 (offers) is the charged
  work**; everything else is terrain-grooming that can wait until a player can
  actually complete the loop.

## 2. Architect — *by strategy and design* (the machine)

- **Observation:** The two engines have **distinct jobs**, not redundant ones.
  `translate.ts` is a *cheap, always-available reveal lens* (card + matrix cell,
  no quality gate, no entitlement); the resolver is the *gated, authored,
  publishable move*. "Retire" was the wrong frame — they're **different layers**.
- **Observation:** Slice 3 is **purely additive** to `offers.ts`: 6 (or 7) `OfferKey`
  pack entries + one `loadout-bundle`, all `group:'bundle'`/`'digital'`. The
  deferred-grant plumbing already exists in `saveSuperpowerLoadout`; only the SKU
  catalog + Gumroad links are missing.
- **Risk:** Collapsing both engines into the resolver forces the handbook/onboarding
  to pay the resolver's auth+DB+quality cost for what is a **static lens line** —
  an over-engineered downgrade.
- **Recommendation:** **Keep `translate.ts` as the reveal-lens layer; the resolver
  owns gated content.** Draw the seam explicitly in a one-paragraph header on each.
  Land Slice 3 as additive `OfferKey`s. Defer vocab + Coach-pack as schema-shape
  decisions, not blockers.

## 3. Challenger — *at the edge, naming the lever* (rupture)

- **Observation:** The real lever isn't "which engine" — it's **"can a stranger pay
  us?"** Until offers ship, the entire superpower system is a demo. That's the only
  edge that matters.
- **Risk:** `loadout-bundle` quietly **re-prices the inner pack to zero** (the
  deferred grant gifts the inner pack to deck owners). If the bundle and the
  per-pack SKUs aren't reconciled, we either **double-charge** for the inner pack or
  **cannibalize** pack sales. Name it now or eat a refund queue later.
- **Risk:** OQ3 hides a polarity trap: if Coach is the **only** superpower without a
  pack, "Coach" becomes a second-class loadout slot — the integrator superpower
  can't be the one you can't buy depth for.
- **Recommendation:** Falsify "retire translate." Falsify "ship packs without bundle
  math." The safe lever: **ship all 7 packs symmetric + one bundle, with an explicit
  rule that the deferred inner-pack grant is *credited against* the bundle**, never
  stacked.

## 4. Regent — *through clear roles and order* (phasing / gates)

- **Observation:** These four items are **not peers** — they sort cleanly by
  "does a player feel it":
  1. **Slice 3 offers** — player-facing, blocks revenue → **now.**
  2. **translate.ts seam** — author-facing clarity, one doc paragraph + headers → **now, cheap.**
  3. **Coach pack (OQ3)** — catalog symmetry, rides along with Slice 3 → **decide now, with Slice 3.**
  4. **Boundary vocab (`campaign → other`)** — internal hygiene, zero player impact → **defer to a cleanup pass.**
- **Risk:** Doing the vocab rename mid-funnel touches the quiz boundary and risks
  regressing the just-merged intake path for **no player-visible gain**.
- **Phase gate:** Ship-the-funnel slice = `offers.ts` has 7 packs + bundle, Go Deeper
  upsell links to the **real** pack SKU, `loadout-bundle` grant math is single-charge.
  Vocab + translate-retirement are explicitly **out** of this slice.
- **Recommendation:** One slice: **offers + Coach pack + translate seam-doc.** Vocab
  is a follow-up chore, not part of "make the funnel real."

## 5. Diplomat — *in relationship, weaving care* (culture / onboarding)

- **Observation:** Portland's allergy to extractive gamification means the **bundle
  framing is a care decision**: "your loadout, together" reads as a gift; "buy 2
  packs" reads as a shakedown. The `loadout-bundle` should be the *kind* default.
- **Observation:** Coach is the **integrator/onboarder** superpower (the one that
  "calls up" others). Denying it a pack sends the worst possible cultural signal —
  the welcoming face is the paywalled-thinnest.
- **Risk:** If the handbook lens (`translate.ts`) and the paid Go Deeper move use
  **different vocabulary** for the same card, the player feels upsold-into-a-different-
  product. The seam-doc isn't just dev hygiene — it protects trust.
- **Recommendation:** Ship Coach's pack for **parity of dignity**, price the bundle as
  the generous default, and make the handbook lens and Go Deeper move share voice so
  the paid tier feels like *more of the same care*, not a bait-and-switch.

## 6. Sage — *in flow, holding the whole* (integration & RULING)

**Synthesis.** The faces converge hard. Shaman/Challenger say the **only charged,
revenue-bearing work is the offers slice** — the funnel is a demo until a stranger
can pay. Architect/Diplomat dissolve the "retire translate.ts" framing: it's a
**live reveal-lens layer**, distinct from the gated resolver — keep it, draw the
seam. Regent sorts the four open items by player-impact and quarantines the vocab
rename as a no-player-gain chore. Challenger + Diplomat converge on Coach: a 7th
pack is **mandatory for polarity and dignity**, and the bundle must credit (not
stack) the deferred inner-pack grant.

> **Make the funnel real before making it tidy. Ship offers (7 symmetric packs +
> one crediting bundle) and wire the real upsell SKU. Keep `translate.ts` as the
> reveal-lens layer and document the seam. Defer the boundary-vocab rename.**

**Ruling (resolves the open reconciliation items):**

1. **OQ4 — `translate.ts` stays.** It is the *reveal-lens layer* (cheap, ungated,
   always-available); the technique-library resolver is the *gated content layer*.
   Not redundant. Action = a one-paragraph header on each declaring the seam; **no
   retirement, no adapter-wrap.** (Revisit only if a third consumer blurs the line.)
2. **Slice 3 is the next build.** Add `superpower-<sp>-pack` `OfferKey`s + a
   `loadout-bundle` to `offers.ts`; point the Go Deeper `upsellSku` at the real pack
   SKU (kill the `/launch` placeholder).
3. **OQ3 — Coach gets a pack. 7 packs, symmetric.** No second-class loadout slot;
   the integrator face is not the unpurchasable one.
4. **Bundle math is single-charge** (Challenger): the deferred inner-pack grant on
   `saveSuperpowerLoadout` is **credited against** `loadout-bundle`, never stacked —
   a deck owner who buys the bundle is not charged twice for their inner pack.
5. **Boundary vocab (`campaign → other`) is deferred** to a dedicated cleanup pass —
   zero player impact, and touching the quiz boundary now risks the freshly-merged
   intake path. Not part of the funnel slice.
6. **OQ2 is closed:** `SUPERPOWER_DEFS.coach` (channel `fire`, domain
   `GATHERING_RESOURCES`) is the confirmed profile; no further action.

**Next-step deltas (go-deeper `tasks.md` + reconciliation `action items`):**
- **Δ Slice 3 / T11** — `offers.ts`: add `superpower-<sp>-pack` ×**7** + `loadout-bundle`
  `OfferKey`s (Gumroad links TBD); `group` `digital`/`bundle`.
- **Δ Slice 3 / T12** — SKU→capability + `capability → Superpower` map consumed by
  `getOwnedSuperpowers`; document the **single-charge** bundle-credit invariant.
- **Δ Slice 4 / T14** — `getCardGoDeeper` `upsellSku` resolves to the real pack
  `OfferKey`; `GoDeeper.tsx` locked-state link targets it (not `/launch`).
- **Δ reconciliation §Action items** — mark OQ4 resolved (keep + seam-doc); mark OQ2
  closed; record OQ3 = 7 packs.
- **New invariant (Challenger/Diplomat)** — "Every superpower (incl. Coach) has a
  purchasable pack; the `loadout-bundle` credits the deferred inner-pack grant and
  never double-charges."

**Deferred (explicit):** boundary-vocab rename (`campaign → other`); any merge of the
two translation engines. Both are tidy-not-charged work — revisit after the funnel
takes a real payment.
