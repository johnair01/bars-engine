# Inner Garden — Reconciliation: our ontology ⇄ Claude Design's playable layer

> Two efforts ran in parallel: **our ontology track** (this repo's `src/lib/inner-garden/*`
> + the handoff docs) and **Claude Design's playable layer** (the `design_handoff_inner_garden`
> bundle: Play the Card, Inner Garden Deck, Cultivation, Rollup, the Coherence Map, etc.).
> This doc records where they converged, where they drifted, and the practitioner-author's
> ruling on each conflict (2026-07-12). It is the merge base for both sides going forward.

## Converged foundation (not in dispute)

Claude Design (CD) built directly on our world-representation + synthesis docs. Shared,
often verbatim:
- **Register over an OS that already exists; OS owns truth; a pure projection derives the
  farm; the renderer holds no truth.**
- The **No Man's Sky rule** `renderedFarm = applyOverlay(overlay, projectFarm(seed, osState))`
  and the M0 verification set (determinism / semantic-safety / 1000-farm / overlay round-trip).
- The **vocabulary contract** (charge=`CustomBar`, element=`EmotionChannel`, altitude=
  `AlchemyAltitude`, bed=`Lens`, campaign/commons=`Campaign`/`SpokeMoveBed`, recommender=
  `charge-metabolism`).
- **Three-channel encoding** — with a CD improvement we adopt: **stage → silhouette** (shape),
  not density, because luminance belongs to altitude's glow and the two would collide. Update
  `world/visuals.ts` accordingly (stage drives shape/frame, never brightness).

## Reconciliation ledger

| # | Tension | **Ruling** | Consequence |
|---|---------|-----------|-------------|
| **C1** | Faces = altitude (ours/original) vs **scope** (CD) | **Faces ARE the altitude / developmental level** (base→summit, prerequisite ladder; "the School is the mountain"). CD's scope reinterpretation is not what a face is. | **But scope is still a real, useful mechanic** — see §"The scope axis" below. It must be **re-homed as a separate axis**, decoupled from faces. |
| **C2** | Blocker: our multi-channel gate-confrontation vs CD's myth-shadow-cards + Clean-Up exercise | **Integrate — do not pick.** This is a genuine design tension and **warrants its own design handoff** dedicated to the integration. | Neither our capacity economy nor CD's myth-cards is deleted; they compose (direction sketched below). This is the largest open work item. |
| **C3** | Completion: our demonstration teeth vs CD's "mirror, never a grade" | **Integrate through the Calm ↔ Progress polarity.** CD didn't have that context. | Meeting a charge = **mirror** (Calm/recovery register). Earning a capacity = **teeth** (Progress register / School). Feed CD the polarity map. |
| **C4** | Card economy: permanent-owned + daily-limit (ours) vs Dominion draw (CD) | **We were partly off.** Capacities remain **permanently owned**, AND CD's draw layer surfaces a **meta-skill we'd missed: reliably pulling the card you want** (deck curation). Keep exploring. | Own-everything (economy C) holds; a **draw/reliability layer** sits on top. Needs a short design pass on *how* draw-reliability works when you own the whole deck. |
| **C5** | Fruit taxonomy: our OutputBar-conflation vs CD's split | **Adopt CD's.** **Fruit type = `allyshipDomain`** (4 fruits = 4 domains, WHERE); **`OutputBar` = the durable artifact** banked to the Vault (with provenance). | Correct our docs/code that said "fruit = OutputBar × altitude." Our `MOVE_FRUIT` (move→OutputBar) is really *move → artifact-type* — relabel, don't delete. |
| **C6** | Campaign progression: our Kotter + six-face-watering birth vs CD's pour-meter + bounded/recurring goals | **Needs integration** *(your note was cut off — confirm the direction below).* | Likely compose: six-face watering = **birth**; Kotter = the **inner arc**; CD's pour-meter = the **visible rollup**; bounded vs recurring = **goal-type, polarity-governed**. |

## The scope axis (the consequence of C1)

Ruling C1 says faces = altitude, so CD's `SCOPES = ['yourself','the moment','a relationship',
'a group','a system','whole campaign']` **cannot be "what a face is."** But scope is doing
real work in CD's loop: a charge carries a scope; a move has a scope; **meeting at-or-above
the charge's scope fruits it, below-scope grows a slice.** That mechanic is worth keeping.

So we now have (at least) four axes, and scope needs a home distinct from faces:

| Axis | Question | Values |
|---|---|---|
| Move (WAVE) | HOW | Wake · Open · Clean · Grow · Show |
| **Face** | **WHAT LEVEL (altitude)** | Shaman → Sage (developmental ladder) |
| Domain | WHERE (arena) | Gather · Awareness · Action · Organizing |
| **Scope** *(new, from CD)* | **HOW WIDE** | yourself → the moment → relationship → group → system → whole campaign |

**Open for C2's handoff:** is scope a genuine fourth axis, or does it fold into domain / a
"subject" field (`self·other·group·system·campaign` already exists as `Subject` in
`allyship-deck`)? Note the near-match to the existing `Subject` enum — scope may already have
a canonical home. Resolve this when integrating the blocker/deck model.

## Direction sketches (for the dedicated handoffs — not decisions yet)

**C2 — blocker integration (its own handoff).** A plausible two-tier unification, consistent
with what we already built ("blockers are optional; self-reported or inferred"):
- **Everyday friction = CD's myth shadow-cards** — the 10 Myths ride in the deck, clog the
  hand, and are cleared by playing **Clean Up** (a drawn move + exercise). Light, deck-native.
- **Deep inner work = our multi-channel gate-confrontation** — when a *self-reported* or
  *inferred* blocker exceeds a single Clean Up (multi-channel, needs a capacity you lack), it
  becomes a route-hand quest (School/craft). The elaborate machinery engages only at this
  tier, which is exactly the "deep end" framing — and answers the overbuild critique by
  scoping our capacity economy to where it earns its weight.

**C3 — polarity-governed completion.** Meeting a charge is a mirror (no grade). Earning a
capacity at the School has teeth (demonstration). Register (charge vs task) + `alignmentType`
(progress/maintenance/recovery) pick which, per `docs/VALUES_AND_POLARITIES.md`.

**C4 — draw-reliability meta-skill.** You own every capacity permanently; the skill is
curating a deck that reliably *draws* the one you need (deck-thinning / favored-draw / a
School upgrade to raise draw-reliability). Design pass needed.

**C6 — campaign progression compose.** Confirm: keep our six-face watering as *birth* and
Kotter as the *inner arc*, and adopt CD's *pour-up meter* (bounded, %-to-done) and
*perennial/Epic* (recurring, yield-per-season, never "done") as the *visible rollup* —
with the %-meter shown only on the progress register (polarity).

## The meta-signal (worth stating plainly)

CD, building toward a **real playable surface for a real user**, arrived at a **simpler**
model and **did not reach for our capacity economy** (gate-confrontation / demonstration /
crafting / multi-channel blocker / fertility). The convergence is on the foundation *we*
authored; the divergence is that our deepest recent work went past what the playable layer
needed. This confirms the hostile review's overbuild warning. The C2 ruling — **integrate,
scoped to the deep tier** — is how that work earns its place rather than being deleted.

## Action items

**Docs/code to update now (small, non-blocking):**
- [ ] `world/visuals.ts` + master doc: stage → **silhouette/shape**, never brightness (C1-encoding).
- [ ] Docs that say "fruit = OutputBar × altitude" → **fruit type = `allyshipDomain`; `OutputBar` = banked artifact** (C5). Relabel `MOVE_FRUIT` as move→artifact-type.
- [ ] Master doc §3: keep **Face = altitude**; add the **Scope** axis (C1) with the `Subject`-enum note.

**Needs a dedicated handoff / design pass (the real work):**
- [ ] **C2 — Blocker & deck integration handoff** (two-tier: myth shadow-cards ⊕ multi-channel gate-confrontation; also resolves where Scope lives). *Largest item.*
- [ ] **C3 — Send CD the Calm↔Progress polarity** context; scope mirror-vs-teeth by register.
- [ ] **C4 — Draw-reliability meta-skill** design pass (draw curation atop permanent ownership).
- [ ] **C6 — Confirm the campaign-progression compose** (six-face birth + Kotter arc + CD pour-meter + bounded/recurring).

## Related
- Our side: `src/lib/inner-garden/*`, `docs/handoffs/2026-07-12-inner-garden-ontology-master.md`,
  `docs/VALUES_AND_POLARITIES.md`, the two implemented specs.
- CD side: `design_handoff_inner_garden/` (README + prototypes; Garden Coherence Map is their spine).
</content>
