# Emotional Alchemy — Hostile Review + Six Game Master Analysis

**Scope**: the whole system as built — registry (T01–T11), diagnostic (`vector.ts` + flow), composer (`recommendPractice`), practice card + deck draw, and the service design. Failure criterion: *it fails if it is beautiful but non-playable, unsafe, or amnesiac.*
**Verdict up front**: the **engine is over-built and the loop is unclosed**. The recommender is tested to 81 assertions and 16 fixtures; the thing that would make it a *practice* rather than a one-off — logging, memory, cross-session noticing — is entirely unbuilt. A player can get one good rep and the system forgets them instantly. Two safety gaps are load-bearing (one now fixed).

---

## 0. Crisis threshold → 9–10 (APPLIED this pass)

Per direction: the scale is 0–10 and **9–10 now surfaces "seek outside help,"** not just 10.
- `isCrisisIntensity(i) = i >= 9` (`vector.ts`, tested).
- Diagnostic intensity step: readout turns amber + the nudge fires at 9–10 (was `=== 10`).
- **New**: the post-practice **re-rate** escalates — a rep that leaves the charge at 9–10 shows the 988 line, not "try a different tool." (A practice that didn't help a person still at a 9 must not just recommend more practice.)

Remaining crisis gaps (below): S2 (numb players evade the net), S3 (US-only resources), S4 (no repeated-distress noticing).

---

## 1. Hostile review

Severity: **B** blocker (unsafe or non-playable) · **M** major · **m** minor.

### Safety
- **S1 · Numb/dissociated players evade the crisis net entirely.** `B` — **RESOLVED.** The intensity crisis check keys on a *number*, but the most at-risk players often can't rate — they tap "flat / numb" or "I can't tell," so `intensity` is `undefined` and no crisis logic ran. Fixed: the flat-fork `walled_off` branch and the `can't-tell` step now render an active `GentleHelp` outside-help offer, independent of any numeric rating.
- **S2 · Crisis resources are US-only, hardcoded.** `M` — **RESOLVED.** `988` was baked into the crisis card and the re-rate. Fixed: one `crisisResources()` seam (`crisis-resources.ts`) returns the US line **and** an always-valid international fallback ("your local emergency number", directory pointer); the crisis card and the re-rate both render it. Region-aware selection stays a later step (G10) but no one is stranded now.
- **S3 · No repeated-distress noticing.** `M` — OPEN. The internal-only ratchet (§9.3) and thread demotion are *designed* but unbuilt, and there's no session log, so the system cannot notice a player who runs the diagnostic at 8+ every day. The one signal that most warrants "maybe more than a practice" — a *pattern* — is invisible. Ties to S-log being unbuilt (§Architect, §Sage).
- **S4 · Capture caps intensity at 5, below the crisis range.** `B` (latent) — **RESOLVED.** `/capture` collects `intensity: 1|2|3|4|5`; a captured charge could never seed a 9–10. Fixed: `normalizeCaptureIntensity(1–5) → 0–10` (5→10, tested); the service spec now mandates every capture-sourced seed pass through it, so a max captured charge reaches the crisis range.

### Weak mechanics
- **W1 · The composer's decisive input is silent and fragile.** `M` — After the deck alignment, routing `shape` (`BlockerShape`) is **classified silently** from text (gap G12) and drives the `+3 shapeBonus` — the tiebreak that makes S1/S3/S6 pick the *right* tool. So the single most outcome-determining value is (a) invisible to the player, (b) a conservative keyword regex, (c) unconfirmed. A classifier miss silently swaps the recommended tool. The player-facing "shape" (felt-texture) is a *different* thing and doesn't route. **This is the composer's softest spot.**
- **W2 · The tuning loop is circular.** `M` — The scoring weights (`channelFit×2 + submoveFit + shapeBonus 3`) are declared "seeds to tune from session logs." There are no session logs. The data source that would justify the weights is unbuilt, so the weights are permanent guesses wearing a "v3 seed" label.
- **W3 · A random draw can hand a griever an "act now" card.** `M` — Theme-by-move means the drawn card's **move is random relative to the charge**. Draw *Show Up × …* for a fresh-sadness charge → the composer will pick a show_up tool for grief (the hot-charge bridge only fires at ≥7). Redraw exists but there's **no guidance** ("this card may not fit your charge"). The resonance check (§1.3 step 2b) is designed, not built.
- **W4 · The "practice" has no memory, so it isn't a practice.** `B` — Every session is amnesiac (no log). A practice is *repeated, remembered, developmental*. Right now the system does Wake/Open/Clean/Show with **no Grow** — the exact system-level echo of gap G1 (Grow Up is toolless). See §Sage.

### Dangerous inferences
- **D1 · The harm fork misses grief and joy.** `M` — It fires for anger/fear (or identity-harm keywords). A person grieving a racist incident who taps **"sad"** and doesn't hit a trigger word never sees the harm branch → can be offered an external move *toward the harmer*. **Fix**: fire the harm fork whenever identity-harm is plausible on *any* channel, or ask it once for every charge that names another person.
- **D2 · The progress metaphor died in the deck alignment.** `m` — "Altitude is the honest progress meter; the re-rate lifts it toward satisfied" was the CultivationCard contract. The deck card doesn't render altitude, so the re-rate is now text-only. Not wrong, but a designed feedback loop quietly vanished.

### Playability
- **P1 · The golden path to one move is ~15 screens.** `B` — blocker → thread → channel → (fork) → intensity → time → temporal → fuel → story → (layer) → (harm) → (safety) → defaults → read → draw → (redraw) → practice → show-up → re-rate. For a person at an 8, that is a marathon before a single action. The Atlas warned this (§9.4); it is now real. **Fix**: a fast path — high intensity should be able to *short-circuit* to grounding + one move, deferring the taxonomy.
- **P2 · "Now I draw a card?"** `M` — After naming a raw feeling, "Form the practice → draw an Allyship card" can read as a non-sequitur. The doctrine (the deck fixes the move) is sound but **unexplained** at the moment it happens.
- **P3 · Three abstract taxonomies at peak impatience.** `M` — The defaults screen asks target (5 spirits) + altitude (Raw/Forming/Formed) + felt-shape (Knot/Weight/Fog/…) right before the payoff. That's a vocabulary quiz between a hurting person and their move.

### Coherence
- **C1 · Two card systems in the same app.** `M` — Practice card = deck gold; the rest = CultivationCard. Until R1–R4 (convergence) land, the practice card looks like a different product than the daemon/nation cards. Filed, not built.
- **C2 · Two different things named "shape."** `M` — The player picks a felt-shape ("Knot"); the composer routed on a `BlockerShape` ("interpersonal_live"). "Why this tool?" will show a shape word the player never chose. Rename one.
- **C3 · Vocabulary sprawl, no EA glossary.** `M` — channel, intensity, altitude, target/spirit, felt-shape, routing-shape, thread, move, tool, rolePath, submove, operation/face, domain, guard, prepend, bridge. The deck-literacy spec exists *because* of vocab debt; EA added a dozen terms with no glossary + deep-links.

---

## 2. Six Game Master analysis

Each face of the GM (the six operations) asks its question of the system.

### 🜍 Shaman — *Notice: "What is here?"*
The diagnostic **is** the Shaman move, and the ask-don't-infer discipline is its strength — it refuses to guess the channel, the numbness, the safety context. But the Shaman notices only *this charge, this moment*. It does **not notice the person over time** (no cross-session memory) and it **cannot notice its most frozen visitors** (S1 — the unratable evade every check). Verdict: *sharp at noticing a single charge; blind to the pattern and to the numb.*

### 🜂 Challenger — *Challenge: "What resists being real?"*
The Challenger attacks the happy path. What resists? The **random draw** resists the charge. The **15-screen flow** resists a hurting player's need. The **silent routing-shape** resists inspection. The sharpest hit: *the system asks fifteen questions before it does one thing* — thoroughness that protects the system's correctness at the player's expense. And until this pass, 9–10 **flinched** — the design was most cautious exactly where the stakes were highest. Verdict: *the system is bravest in the registry and most timid at the bedside.*

### 🜛 Regent — *Steward: "Who is responsible?"*
The Regent asks who is accountable for the player's safety and continuity. Findings: nobody stewarded the 9–10 (fixed now); **nobody stewards the repeated-distress player** (S3); **nobody stewards the data** — weights can't be tuned because logs don't exist (W2). The Regent's ruling is blunt: *the crisis path (S1–S4) and the session log are the two things that MUST ship before real people are put in front of this. Everything else is optional; those are not.*

### 🜃 Architect — *Amplify: "What value wants to be increased?"*
The engine is **over-built relative to the loop**. 16 fixtures, 7 guards, 81 tests — beautiful — feeding an output that is **not logged, not scheduled, not remembered**. The value is trapped: a superb recommender with amnesia. The highest-value moment — Show Up, where charge becomes action — is exactly where the value leaks (un-loggable, un-committable). Amplify = **build P0/P1 of the service** (seed + `AlchemySession` logging) so reps *compound*. The registry does not need more polish; the loop needs a memory.

### 🜄 Diplomat — *Care: "What relationships and power matter?"*
The Diplomat honors what's strong: the safety fork, the received-harm branch (no move *toward* the harmer), the non-clinical boundary, the deterministic-first stance (respecting the Portland AI-allergy). But care has holes: the **harm fork excludes grievers and joy** (D1); **crisis resources exclude everyone outside the US** (S2) — a care-and-equity failure on the most sensitive surface; and the coming "AI tailoring" must stay strictly opt-in or it breaches the community's trust. Verdict: *tender where it looks, blind where it doesn't — widen the harm fork and internationalize the lifeline.*

### 🜁 Sage — *Integrate: "What larger truth is emerging?"*
The Sage integrates the whole: **this is a charge-metabolizer that confuses a rep with a practice.** A practice is repeated, remembered, and developmental — it *grows someone up*. Every session here is amnesiac, so the system runs Wake → Open → Clean → Show and **never Grows** — the system-scale form of gap G1. The missing integration is not cosmetic: the **BAR-logging extension (service P1) is what turns reps into a practice.** Until charges accumulate into a visible, developmental arc ("here is how you've been metabolizing anger this month"), the game has a heart and no memory. Verdict: *build the memory, or it will always be a very good first date that forgets you by morning.*

---

## 3. Priority (what the six faces agree on)

1. **Safety completeness** (Regent + Diplomat, `B`): outside-help path for the *unratable* (S1); international crisis resources (S2); don't let capture's 1–5 swallow a crisis (S4). *Do before any real-player exposure.*
2. **Close the loop — service P0/P1** (Architect + Sage, `B`): the seed contract + `AlchemySession` logging. This unblocks weight-tuning (W2), repeated-distress noticing (S3), and turns reps into a practice (W4).
3. **A fast path for high distress** (Challenger, `M`): let ≥7 short-circuit to grounding + one move; defer the taxonomy (P1/P3).
4. **Make the decisive input honest** (Challenger, `M`): surface/confirm the routing shape, or fold it into the felt-shape the player already picks (W1 + C2).
5. **Widen the harm fork + resonance guidance** (Diplomat, `M`): D1 + W3.

*This review is a process artifact — the game reviewing the game. Update it from session logs once they exist; right now it is reviewing a system that cannot yet review itself.*
