# Strand consult: Ally Campaign ← `feat/ally-campaign-jim` integration — Six Game Master faces

**Settled before the council sat (Wendell, 2026-08-18):** the digital book is
**$30, fixed**. `/launch` moves off PWYW/$15 and `digital-price-parity` fails the
build if the page and the plan ever drift again. Not reopened below.

**Questions on the table:**

1. **Shared narrative, two readers.** `jim` rewrites the workstream narratives in
   `workstreams.ts`, which **both** `/ally/mom` and `/ally/jim` render. Mom's
   print-run screen becomes *"a debt I owe in cardboard"*; her car repayment is
   recosted onto digital revenue. One set of narratives for every invite, or
   per-invite registers?
2. **Disclosing the 250.** 250 copies are sold, undelivered, and the money is
   spent. Does that reach a **family lender** in the same words it reaches a
   numbers-first investor?
3. **Attribution on live sales.** The Gumroad webhook gains ally referral credit
   into `RedemptionCode.metadata`. Ship it inside the 4,283-line integration, or
   on its own gate?

**Why it matters:** these decide whether the ally campaign stays *one honest
account rendered for different readers* or becomes *two pitches that can drift* —
and whether a payment webhook's blast radius is legible when it lands.

Faces deliver **observations / risks / recommendations**. **Sage** issues the
ruling + integration deltas. Registers are the canonical `FACE_HEALTHY_REGISTER`
from `src/lib/quest-grammar/move-aspect.ts`.

---

## 1. Shaman — *in ritual, holding the container* (charge / terrain)

- **Observation (Q1):** A letter to a mother and a plan for a numbers-first man
  are different **containers**. The same paragraph poured into both does not
  arrive the same way; Mom's screen is a *disclosure*, Jim's is a *proposal*.
- **Observation (Q2):** *"A debt I owe in cardboard"* is a charge-bearing
  sentence. It will land in her body before it lands in her arithmetic. That is
  not a reason to remove it — it is the reason it works.
- **Risk:** Charge with no discharge is just anxiety transferred. If the
  obligation renders on a screen without the recovery beside it, she carries the
  weight and gets no plan to set it down.
- **Risk (Q1):** The pitch register contaminating the warm register — Mom reading
  a sentence tuned to survive an investor's scrutiny and feeling *handled*.
- **Recommendation:** The **facts are shared; the register must not be**. And
  wherever an obligation appears, its discharge appears on the same screen.

## 2. Architect — *by strategy and design* (the machine)

- **Observation (Q1):** One content module serving N audiences is precisely what
  the override layer already does. `AllyContentOverrides.workstreams` is keyed by
  workstream; a register dimension is a small extension, not a new system.
- **Risk (Q1):** Forking the prose wholesale **duplicates the derived numbers**
  and lets them drift — the single failure `economics.ts` exists to prevent. Two
  hand-maintained accounts of the same print run is how a campaign ends up
  quoting two different break-evens.
- **Observation (Q2):** The 250 is a real liability that **changes the math** —
  500 printed, 250 sellable. Omitting it makes the repayment plan
  *unfalsifiable*, which is the one property the plan cannot afford.
- **Observation (Q3):** The webhook change is well-formed: additive JSON on an
  existing column, guarded by `!alreadyMinted`, and it only credits ids that
  resolve to a real `CampaignLead`. No migration.
- **Risk (Q3):** Correct code with a bad **blast radius**. Shipping it inside a
  24-file change means a webhook regression is indistinguishable from a funnel
  regression, and the failure mode is *a buyer without their book*.
- **Recommendation:** Numbers stay single-source and derived. Register varies only
  where it changes meaning. Payment plumbing merges on its own.

## 3. Challenger — *at the edge, naming the lever* (rupture)

- **Observation (Q1):** The lever nobody wants to name: **you cannot maintain two
  voices of the same fact by hand.** The moment Mom's print run and Jim's print
  run are separately authored, one of them becomes a lie by omission — and it will
  be the warm one, because that is the one nobody wants to update.
- **Risk:** Per-invite copy silently becoming **per-invite truth**.
- **Observation (Q2):** Not disclosing a known liability to someone you are asking
  for a loan **is** the failure mode. Not a risk of the plan — the plan's
  integrity is the ask. If she learns it later, every other number you showed her
  becomes retroactively suspect, including the honest ones.
- **Risk (Q2):** Softening it for her is not protection. It is the assumption that
  she cannot handle her son's real situation — and she will read that assumption
  in the softening.
- **Observation (Q3):** The comment says the attribution is best-effort and never
  fails a sale. **Checked, not trusted** — and it holds: both `await`s sit inside
  a `try` whose `catch` only warns, `attributedTo` initialises to `null`, nothing
  downstream reads it, and the block runs *after* the entitlement mint.
- **Risk (Q3) — the actual one, which throw-safety does not cover:** it adds **two
  sequential database round-trips** to a third-party webhook path that has a
  timeout. A `try/catch` catches a throw; it does not catch a slow query. Under a
  database stall the handler gets slower, Gumroad retries, and the failure
  presents as duplicate pings rather than as an attribution bug.
- **Recommendation:** Ship the harder version of the letter. For the webhook, test
  throw-safety **and** bound the attribution work — it must not extend the
  handler's critical path under a stalled database.

## 4. Regent — *through clear roles and order* (phasing / gates)

- **Observation (Q1):** This is a **sequencing** call, not an architecture one.
  jim's narratives are more accurate than what they replace. Ship them as the
  single set now; build a register system when a second reader actually complains,
  not for a hypothetical third.
- **Phase gate (Q1):** No per-invite workstream variants in this integration.
  Revisit only on real evidence that one register is failing a real reader.
- **Observation (Q2):** Disclosure has an **order**: the liability, then what it
  changes, then the plan that survives it. Never the liability alone on a screen,
  and never after the ask.
- **Phase gate (Q3):** Payment plumbing gets its own merge, its own deploy, and
  its own watch window — not because it is wrong, but because **you cannot tell
  what broke if it ships with everything else.**
- **Recommendation:** Three gates, in order: (a) funnel + content, (b) attribution
  webhook alone, (c) register variants only if evidenced.

## 5. Diplomat — *in relationship, weaving care* (culture / onboarding)

- **Observation (Q2):** She is family, not an investor — and family **discovers
  things**. The relational cost of her learning about the 250 from a spreadsheet
  in a year is far higher than the cost of her reading it tonight.
- **Observation:** The warm register's job is not to make the news softer. It is
  to make the news **survivable in the relationship** — which means the person
  delivering it stays present in the sentence rather than hiding behind a number.
- **Risk (Q1):** Two registers means two maintenance burdens, and the warm one
  will rot first, because the commercial one is the one under pressure.
- **Observation (Q3):** Attribution is how an ally **sees their act land**. The
  Book Brigade asks someone to text twenty people; without credit reaching the
  board, they are working blind and will stop. It is not optional — it is timed
  differently.
- **Recommendation (copy):** Wherever the 250 appears, it appears in the first
  person and adjacent to what is being done about it. No passive voice, no
  "unfortunately".

## 6. Sage — *in flow, holding the whole* (integration & RULING)

**Synthesis.** The faces converge on a shape the questions obscured. Q1 looked
like *"should Mom get a gentler version?"* and is actually *"can two accounts of
one fact be maintained?"* — Challenger and Architect both say no, from opposite
directions. Q2 looked like a kindness question and is a **credibility** question:
Diplomat and Challenger agree that softening reads as condescension and destroys
the very trust the ask depends on. Q3 was never about correctness — Architect
found the code sound — only about **legibility of failure**.

> **One account, single-sourced. Register varies, facts do not. Disclosure leads,
> and never appears without its discharge on the same screen. Payment plumbing
> gets its own gate.**

**Ruling:**

1. **Q1 — ~~ship jim's narratives as the single shared set. No per-invite
   workstream variants.~~** **AMENDED (Wendell, 2026-08-18)** — see
   *Amendment 1* below. The requirement is per-ally messaging over shared data;
   this ruling dropped half of it.
2. ~~**Register stays per-invite only where it already is** — the `opening` and
   `closing` letters.~~ **Superseded by Amendment 1.**
3. **Q2 — the 250 ships to Mom unsoftened**, in the first person, with a
   structural invariant: **an obligation never renders without its recovery on the
   same screen.** Liability → what it changes → the plan that survives it.
4. **Q3 — the Gumroad attribution splits into its own PR**, merged and deployed
   alone, after the funnel work. Throw-safety is already correct (verified by
   inspection); what must still be addressed is **latency on the critical path**,
   since the block adds two sequential queries to a webhook Gumroad will retry.
5. **The `embedded` / `suppressReveal` collision resolves as both.** They are
   orthogonal: `embedded` is behavioral (no mid-quiz write, no Crossing CTA),
   `suppressReveal` is presentational (host renders the result). jim's funnel sets
   both; the standalone `/superpower` page sets neither.

**Integration deltas:**

- **Δ I1** — Merge order: `#202` (test mode) → `#203` (funnel notes) → jim's
  funnel/content → attribution webhook alone.
- **Δ I2** — Resolve `AllyFunnel.tsx` (5 hunks) onto **jim's step machine as the
  superset**; re-apply back-navigation, myth skip, quiz framing and `testMode`
  onto his 14-step flow rather than the reverse.
- **Δ I3** — `SuperpowerQuiz` keeps **both** props (ruling 5). Its doc comment
  must say which is behavioral and which presentational, so the next host picks
  correctly.
- **Δ I4** — Strip the webhook + `referral.ts` + `useAllyReferral.ts` out of the
  integration branch into its own PR.
- **Δ I5** — New test: an attribution throw inside the Gumroad handler still
  returns 200 and still grants the buyer their entitlement.
- **Δ I6** — New invariant test: every surface rendering `obligationUnits` also
  renders the recovery figure. Fails the build otherwise (ruling 3).
- **Δ I7** — `digital-price-parity` retained as merged; the $30 decision is now
  load-bearing for every copy target in `victory-paths.ts`.

**Deferred (explicit):** ~~per-register workstream narratives (Regent's gate);
cross-invite content inheritance.~~ **Both un-deferred by Amendment 1.**

---

# Amendment 1 — per-ally messaging over shared data

**Correction (Wendell, 2026-08-18):** *"different allies can get different
messaging but relying on the same data."*

The original Q1 ruling was wrong. It let **Regent's phase gate override the
requirement** rather than schedule it, and resolved Architect-vs-Challenger by
dropping one side instead of fixing the mechanism that made them look opposed.

**Why the objection stops applying.** Challenger's argument — *you cannot maintain
two voices of the same fact by hand* — is sound only while each variant
**hand-authors the facts**. If every variant derives its numbers from
`economics.ts`, the variants are structurally incapable of drifting on facts.
They can differ only in register, which is the entire point. Challenger's risk
was never "two messages"; it was "two sources of truth."

## The blocker (found on inspection, not argued)

The two requirements are in **direct conflict in the code as it stands**:

| | today |
|---|---|
| authored narrative (`workstreams.ts`) | template literal — `${INPUTS.printRunUnits}`, `${usd(...)}` — always tracks `economics.ts` |
| overridden narrative (`content-overrides.ts`) | `o.narrative ?? w.narrative` — a **frozen string** |

So per-ally messaging requires overriding narratives, and overriding narratives
loses the shared data. Whichever you pick, you lose the other. **This is why the
first ruling reached for "don't do variants" — it was resolving an architectural
conflict by abandoning a requirement.**

## Ruling (amended)

> **Data is single-source and derived. Message is per-ally and authored. An
> override may never contain a number.**

1. **Three-layer cascade** for every content bucket — myths, understanding panels,
   workstream narratives, asks:
   `authored default (TS)` → `global override` → `per-invite override`.
   Most specific wins per *field*, not per object, so a per-ally narrative does
   not silently drop a globally-corrected ask.
2. **Overrides carry tokens, not numbers.** Override text uses `{{token}}`
   resolved at render against the same `economics.ts` values the authored
   template literals use. `{{carLoan}}`, `{{printLanded}}`, `{{breakEven}}`,
   `{{obligation}}`. One registry, both consumers.
3. **A literal currency figure in an override fails validation.** Not a warning in
   the editor — a rejection in `normalizeOverrides`, because the invariant is the
   whole amendment. An admin who types `$2,500` gets told to use `{{carLoan}}`.
4. **The editor offers the tokens** rather than expecting them to be memorised: an
   insert-token control listing what each resolves to right now.
5. **Per-ally content is scoped by invite slug**, so `/ally/mom` and `/ally/jim`
   may state the same print run in different registers — and both move when
   `INPUTS.printRunUnits` changes.

## Amended deltas

- **Δ A1** — `AllyContentOverrides` gains an `invites[slug].content` layer mirroring
  the global `myths` / `understanding` / `workstreams` shape. Resolution is
  field-level three-layer cascade.
- **Δ A2** — New `content-tokens.ts`: one registry mapping token → derived value,
  consumed by both the authored templates and the override renderer, so a token
  cannot exist in one and not the other.
- **Δ A3** — `normalizeOverrides` rejects override text containing a currency
  literal or a bare figure matching a known derived value. Test: storing
  `"$2,500"` in a narrative is refused; storing `"{{carLoan}}"` is accepted.
- **Δ A4** — Invariant test: for every workstream, rendering under a per-invite
  override with a changed `INPUTS.carLoanCents` produces the changed figure. This
  is the falsifiable form of "different messaging, same data".
- **Δ A5** — Editor gains a token palette per field, showing each token's current
  resolved value inline.

**What this does not change:** the disclosure ruling (3) and the payment gate (4)
stand. The 250 still ships unsoftened in Mom's register; the webhook still merges
alone.

**Consequence for the integration order:** Δ A1–A3 are prerequisites for *any*
per-ally divergence in jim's narratives. Until they land, jim's narratives ship as
the shared set — not as the ruling, but as the honest interim, and the interim
should be short.

**Open question raised by the council:** the car's `theAsk` is now costed on
**digital** book revenue rather than physical. Mom's loan repayment therefore
depends on the $30 digital price holding and on the attach-rate assumption in
`attachRateToBreakEven`. Is that dependency stated to her *in the letter*, or does
it sit only in the plan screen she may never open? → Sage leans **stated in the
letter**: a repayment schedule whose load-bearing assumption is invisible to the
lender is the same failure as the undisclosed 250.
