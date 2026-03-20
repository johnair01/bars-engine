# Diplomat Books — Integration Analysis
**Books**: The Skilled Helper (Egan, 10th ed.), Integral Communication (Leonard, 2004), Hearts Blazing (Games by Play Date, 2015)
**Date**: 2026-03-19
**Analyst**: Research agent pass against bars-engine codebase

---

## The Skilled Helper (Gerard Egan)

### Core Concepts

The Skilled Helper presents a three-stage **Problem Management and Opportunity Development** model:

- **Stage I — Current Picture**: Help the client tell their story (Task A), surface the real story behind distorted framing (Task B), and identify which issues actually make a difference (Task C / "the right story").
- **Stage II — Preferred Picture**: Discover possibilities for a better future (Task A), set specific problem-managing goals (Task B), and build commitment — "What am I willing to pay for what I want?" (Task C).
- **Stage III — The Way Forward**: Generate strategies (Task A), choose best-fit strategies (Task B), and formulate a viable plan (Task C).

The book's most operationally rich concepts for bars-engine are:

1. **Empathic Presence** (Ch. 3): Three micro-skills — *tuning in* (somatic attunement before speaking), *active listening* (attending to content, emotion, behavior, body cues simultaneously), and *checking understanding* (reflecting back to confirm, not interpret). The book specifically distinguishes these as separate clinical acts, not a single "empathy" move.

2. **Responding with Empathy** (Ch. 4): The distinction between *primary empathy* (naming what is already on the surface — "You sound exhausted by this") and *advanced empathy* (naming what is implicit, beneath what the client says — "It sounds like part of you is afraid that if you rest, you'll have to admit how hard this has been"). Advanced empathy is the clinical skill of surfacing the sub-text.

3. **Probing** (Ch. 5): Open-ended questions that help clients clarify, elaborate, or focus. The book names several probe types: clarifying probes ("Can you say more about what you mean?"), focusing probes ("Of everything you've described, what seems most important?"), personalized probes ("How did that leave you feeling?"), and challenging probes ("You said X — what makes you think that's the only option?"). These are distinct from empathic reflection.

4. **Summarizing** (Ch. 5): The helper distills what has been said across multiple exchanges to give the client a sense of pattern or direction. A summary is not a recap — it is an act of *meaning-making on behalf of the relationship*.

5. **Self-Challenge / Blind Spots** (Ch. 6-7): Clients maintain distorted perspectives (blind spots) that prevent them from seeing their situation accurately. The helper's job is to issue *invitations to self-challenge* — not confrontation, but gentle, caring reframes that expose the discrepancy between what the client says, does, and experiences. The book explicitly distinguishes "challenging" from "criticizing."

6. **The Pinch-Crunch Model** (Ch. 1): Small frictions (pinches) accumulate unaddressed into major ruptures (crunches). A prevention mentality means naming pinches before they compound. This is explicitly framed as a *relational maintenance skill*.

7. **Client in the Driver's Seat** (Ch. 1): The client is always the hero. The helper is a catalyst. Outcomes belong to the client. The model resists dependency, positioning the helper's job as *skilling the client* to become a better self-helper.

8. **Two-Way Feedback Loop** (Ch. 1, 8): Progress feedback from client to helper is named as a key ingredient of successful therapy — not a nice-to-have. Every session should have a mechanism for "How are we doing?" at both the session and process level.

### Existing System Mappings

| Skilled Helper Concept | bars-engine Analogue | File |
|---|---|---|
| Stage I-A (Tell the Story) | UnpackingAnswers (q1-q6) in quest compilation | `src/lib/quest-grammar/types.ts` |
| Stage II-B (Set Goals) | `alignedAction` field in QuestCompileInput | `src/lib/quest-grammar/types.ts` |
| Stage III (Plan) | QuestNode sequence / BAR creation | `src/lib/quest-grammar/compileQuest.ts` |
| Advanced Empathy | `interpersonal` field in MoveExpression | `src/lib/quest-grammar/move-expressions.ts` |
| Problem-managing outcomes | `stuckBefore` / `stuckAfter` / `delta` in EFA sessions | `src/actions/emotional-first-aid.ts` |
| Opportunity development | EFA `applyToQuesting` → BAR draft with nextAction | `src/actions/emotional-first-aid.ts` |
| Prevention mentality | (Not currently present — see Missing Mechanics) | — |
| Two-way feedback | (Partial — delta captured, but no "how are we doing" prompt back) | `src/actions/emotional-first-aid.ts` |

The quest grammar's three-stage arc (orientation → rising → tension → integration → transcendence → consequence) maps cleanly to Egan's Stage I → Stage II → Stage III. The current implementation at `src/lib/quest-grammar/types.ts` (EpiphanyBeatType) is architecturally consistent with Skilled Helper's three-stage model.

The `move-expressions.ts` file — with `internal`, `interpersonal`, and `systemic` registers — already implements what Egan calls the *empathic response matrix*: the internal register corresponds to what the helper hears (subjective), the interpersonal register to advanced empathy (relational field), and the systemic register to what it produces in the world.

### Missing Mechanics

**1. Probing as a move type.** The current quest grammar has no explicit "probe" move. Probes are distinct from empathy — they are *questions that open new story territory*, not reflections of what is already present. The Diplomat node type is missing a `probe` beat where the NPC asks a focusing, clarifying, or challenging question and waits for player input before advancing.

**2. Summarizing as a structural beat.** The quest system has `orientation` and `integration` beats, but no explicit `summarize` beat — a moment where the Diplomat NPC distills what the player has shared across multiple exchanges and reflects back a pattern. This is the most powerful trust-building act the Skilled Helper describes, and it has no equivalent in the current grammar.

**3. Blind-spot / self-challenge invitation.** There is no move type for *inviting self-challenge*. The closest thing is the `challenger` game master face, but that is positioned as confrontational rather than as a gentle reframe. A Diplomat-mode blind-spot invitation would surface discrepancy between what the player says and what the system has observed (from BAR data, quest history, EFA sessions) without confrontation.

**4. Pinch-crunch detection.** There is no mechanism for detecting when a player has accumulated repeated frictions (failed quests, repeatedly deferred BARs, EFA sessions without resolution) and naming that pattern. This is Egan's "prevention mentality" applied to quest flow. The Diplomat is the natural agent to notice and name pinches before they become campaign-exit crunches.

**5. Session-level "How are we doing?" feedback prompt.** The EFA session captures stuckBefore/stuckAfter delta, but there is no reciprocal prompt asking the player whether *the session itself* was useful. Egan is explicit that this bidirectional feedback is one of the most evidence-backed ingredients of successful helping. A post-session reflection question from the Diplomat — "Did that land? Was there anything that felt off?" — with a response stored in `NpcMemory` would complete the loop.

### NPC Constitution Language

The Diplomat's `NpcConstitution` fields in `prisma/schema.prisma` should carry the following Skilled Helper-derived language:

**identity.core_nature**: "I accompany. I do not lead. I hear before I speak. My presence is the intervention — attunement comes before any word."

**identity.voice_style**: "Reflective. Present. Warm without softening the truth. I name what I hear, not what I think you should do. I use your words back to you when I summarize."

**values.protects[]**: `["the client's authorship of their own story", "pace over efficiency", "the relationship over the outcome", "the right to not yet know"]`

**values.longs_for[]**: `["genuine contact", "the moment when the person hears themselves and something shifts", "stories that surface the unused resource"]`

**values.refuses[]**: `["premature advice-giving", "interpreting before the person has finished", "confrontation that isn't in service of care", "optimism that papers over real pain"]`

**function.primary_scene_role**: "Community onboarding accompaniment; BAR sharing facilitation; pinch detection before crunch; post-EFA session integration."

**limits.cannot_do[]**: `["push toward a decision the player hasn't arrived at", "escalate challenge beyond the player's stated readiness", "skip empathic presence and jump to probing"]`

**limits.requires_regent_approval_for[]**: `["issuing a blind-spot invitation that references NPC memory of prior sessions", "naming a pattern from more than one session without regent review"]`

### Quest Grammar / Move Extensions

**New beat type**: `diplomat_probe` — an open-ended question from the Diplomat NPC that invites the player to elaborate, focus, or personalize. The probe stores the player's response and conditions the next node selection. Sub-types: `clarifying`, `focusing`, `personalizing`, `challenging`.

**New beat type**: `diplomat_summary` — the Diplomat distills what has been shared across 2+ prior nodes and reflects back a pattern. Text generated from player's own q1-q6 input and archetype context. Required to appear before any Stage II goal-setting beat.

**New EpiphanyBeatType**: `self_challenge_invitation` — a Diplomat-voiced reframe that exposes a blind spot without confrontation. Grammatically structured as: "You said [X]. And at the same time, I notice [Y]. What do you make of that?" Triggered by discrepancy between stated intention and observed pattern.

---

## Integral Communication (Adam B. Leonard)

### Core Concepts

Leonard's master's thesis applies Wilber's AQAL framework to communication theory. Its most operationally useful contributions to bars-engine are:

1. **Four Validity Claims / Communicative Worlds** (Ch. 2, following Habermas): Every communicative act touches four domains simultaneously:
   - **Objective (IT)**: Is it empirically accurate? (What does it do? What are the facts?)
   - **Subjective (I)**: Is it sincere? (Does it express what the speaker actually feels/intends?)
   - **Intersubjective (WE)**: Is it right/legitimate? (Does it conform to shared norms and cultural expectations?)
   - **Comprehensibility (ITS)**: Is it grammatically/semantically coherent? (Does it follow the rules of the shared language system?)

   These are not four ways to *describe* communication. They are four validity conditions that must all be met for communication to *land*.

2. **Worldview Translation / Developmental Psychographics** (Ch. 5-6): Audiences (or players) can be segmented by developmental worldview — Traditional-Mythic (BLUE), Rational-Achievist (ORANGE), Pluralistic-Communitarian (GREEN), Integral-Existential (YELLOW). Each worldview has different validity claims, different motivational language, and different entry points for any given message. The same content must be *translated* across worldviews to communicate effectively.

3. **Left Hand / Right Hand Integration** (Ch. 2, 3): Exterior (Right Hand) communication models — behavior, function, output — must be held alongside Interior (Left Hand) models — meaning, intention, value. A communication system that only measures behavior (exterior) misses the meaning-creation process. The warning: exterior reductionism produces "flatland" — a world of behavioral metrics without depth.

4. **Holonic Communication Levels** (Ch. 2, after Littlejohn): Communication occurs at nested levels — interpersonal, group, organizational, mass. Each level is a whole that is also part of a larger whole. The interpersonal is foundational: "interpersonal communication as the base of all other contexts."

5. **Transformational Communication** (Ch. 8): Beyond merely translating across worldviews, communication can *prompt developmental growth in the receiver*. Language can be used strategically to invite the listener into a higher developmental frame without forcing it. This is distinct from mere message delivery — it is developmental scaffolding through words.

6. **States as Communication Factors** (Ch. 2): Phenomenal states (fear, grief, anger, joy) affect both how communication is sent and received. A threatened culture may collectively regress to security-focused communication even if individually developed. State matters as much as level.

### Existing System Mappings

| Integral Communication Concept | bars-engine Analogue | File |
|---|---|---|
| Four Validity Claims (I/WE/IT/ITS) | MoveExpression registers (internal, interpersonal, systemic) + game move grammar | `src/lib/quest-grammar/move-expressions.ts` |
| Worldview Translation | Allyship domains (Direct Action / Raise Awareness / Gathering Resources / Skillful Organizing) | `src/lib/allyship-domains.ts` |
| Developmental levels (BLUE/ORANGE/GREEN/YELLOW) | Kotter stages + developmental lens in QuestCompileInput | `src/lib/quest-grammar/types.ts` |
| State as communication factor | EmotionalChannel in quest grammar + EFA session | `src/lib/quest-grammar/types.ts` |
| Left Hand (interior meaning) | I-register in MoveExpression; EFA issueText | `src/lib/quest-grammar/move-expressions.ts` |
| Right Hand (exterior behavior) | stuckBefore/stuckAfter delta; BAR completion tracking | `src/actions/emotional-first-aid.ts` |
| Holonic levels (interpersonal → group) | Instance (community) contains Players contains BARs | `prisma/schema.prisma` |

The `move-expressions.ts` triple-register design (`internal`, `interpersonal`, `systemic`) is a near-exact implementation of Habermas's Big Three validity claims (I / WE / IT). This is almost certainly intentional given the AQAL foundation of bars-engine. The fourth validity claim — **comprehensibility/ITS** — is the one missing register.

### Missing Mechanics

**1. Fourth validity register: Comprehensibility (ITS).** The `MoveExpression` interface has `internal` (I), `interpersonal` (WE), and `systemic` (ITS-collective), but lacks a `linguistic` or `grammatical` register — what Leonard calls comprehensibility: how the move is linguistically framed so that it *works* in the cultural code of the receiving community. For Portland's allergy to AI, this register would encode how the move description should be phrased to be received as legitimate in their value context. This maps directly to the SYSTEM_PROMPT language in `backend/app/agents/diplomat.py`.

**2. Worldview translation layer for Diplomat guidance.** The Diplomat currently issues the same guidance voice to all players. Leonard's developmental psychographics argue that the *same content* must be translated into different validity claim languages for different worldview stages. A player at GREEN (pluralistic-communitarian) needs to hear that BAR sharing strengthens the web of care. A player at ORANGE (rational-achievist) needs to hear that BAR sharing is an efficient leverage point for systemic change. A player at BLUE (traditional-mythic) needs a ritual framing. The Diplomat should carry a worldview-translation layer in its `CommunityGuidance` output — currently missing from `backend/app/agents/diplomat.py`.

**3. State-aware message calibration.** The Diplomat ignores the player's current phenomenal state (Fear, Anger, Sadness, Joy, Neutrality from the quest grammar) when formulating guidance. Leonard is explicit: state matters as much as level. A player in a Fear state needs different entry-point language than one in Joy. The `EmotionalFirstAidSession.issueTag` captures state at EFA time, but the Diplomat agent does not access this. The `get_player_context` tool in `diplomat.py` could surface this if wired to the last EFA session.

**4. Transformational communication scaffolding.** Leonard's Ch. 8 describes language that invites the receiver into a higher developmental frame without forcing it. The current Diplomat system prompts focus on *matching* the player's context but not on *developmental stretching*. A transformational communication extension would add optional `developmental_invitation` field to `CommunityGuidance` — a single sentence that briefly evokes the next developmental horizon without imposing it.

**5. Exterior/Interior balance check.** The stuckness metrics (exterior: behavioral tracking) dominate the EFA system while the interior meaning-making (what the experience *meant* to the player) is captured only in `issueText` (optional) and `notes` (optional). Leonard's warning about "flatland" — exterior reductionism — applies: measuring delta without capturing meaning produces an incomplete loop. A required (or prompted) post-session meaning field would complete the Left Hand side.

### NPC Constitution Language

**identity.worldview**: "I communicate across developmental levels. I do not require players to share my worldview — I translate the work into the language their values actually speak. GREEN players hear care. ORANGE players hear leverage. BLUE players hear belonging."

**identity.voice_style**: "I speak from the WE. My sentences tend to use 'we' and 'our' before 'you' and 'your.' I avoid jargon when the community hasn't claimed it. I privilege plain relational language over integral terminology."

**values.protects[]** (addition): `["the interior legitimacy of the player's meaning-making", "the WE-space before individual outcomes", "comprehensibility over comprehensiveness"]`

**function.primary_scene_role** (addition): "Worldview-aware translation of community offerings into the validity-claim language of each player's current developmental context."

**limits.cannot_do[]** (addition): `["flatten the player's experience to behavioral metrics without honoring the interior meaning", "communicate as if all players share the same worldview entry point"]`

### Quest Grammar / Move Extensions

**New field on `MoveExpression`**: `linguistic: string` — the fourth validity register: how this move sounds in the cultural-linguistic code of the receiving community. For bars-engine's Portland context, this encodes the non-AI framing of the move. Example for `water_transcend` (Reclaim Meaning): "The loss turns out to have been protecting something that still matters."

**New `QuestCompileInput` field**: `playerWorldview?: 'blue' | 'orange' | 'green' | 'yellow'` — optional developmental psychographic derived from player archetype, nation, and prior BAR themes. When present, the Diplomat's node text generation uses the appropriate validity-claim language register.

**New `CommunityGuidance` field in diplomat.py schema**: `worldview_translation: str | None` — a single paragraph reframing the guidance in the player's native validity-claim language. Generated when player worldview is detectable.

---

## Hearts Blazing (Games by Play Date)

### Core Concepts

Hearts Blazing is a collaborative, card-driven spec-fic storygame for 3-5 players. Its mechanical concepts most relevant to bars-engine:

1. **Archetypes with hidden Motives**: Each player has a public Role (Ace, Leader, Rookie, Engineer, Veteran) and a secret Motive (Avenger, Opportunist, Survivor, Guardian, Savior) with associated Keywords (Justice, Triumph, Endurance, Safety, Honor). The motive is the real driver; the role is the public face. Motives only become visible at the Finale.

2. **Episode Structure (Launch → Bridge → Wrap)**: Each episode has three scenes. The *Launch* is set by the In Focus character. The *Bridge* is narrated collaboratively by the full group. The *Wrap* is directed by the high bidder. A Commercial Break transitions between scenes. This is a rhythm of: *exposition → collective elaboration → resolution authority*.

3. **Bidding Mechanics**: Players bid cards from their character deck to participate in episodes. Frailty cards (negative-value) can be played strategically — they create narrative depth about a character's weakness while also functioning as a cost. The *threshold* of an episode escalates as the game progresses.

4. **Trope Caretakers**: Before play begins, players are assigned as caretakers for different story domains (Setting & History, Technology & Ability, Organization, Supporting Cast, Antagonists). The caretaker has final say over details in their domain but is advised to "say yes and..."

5. **Keywords as Motivational Grammar**: The five keywords (Justice, Honor, Triumph, Endurance, Safety) map to motivational themes that drive character behavior. Collecting keywords is how characters express their motive in play. The keyword system is explicitly inspirational, not binding.

6. **Cut & Brake Safety Protocol**: Players can say "Brake" to tone things down without stopping, or "Cut" to stop completely. Content rating is set at the start. Safety is social technology built into the structure.

7. **Non-successful Episodes Have Costs**: If the group fails to meet an episode's threshold, play continues but "the team must be in a worse state than before. Friends, family and resources should be lost." Failure is narratively productive, not just a penalty.

### Existing System Mappings

| Hearts Blazing Concept | bars-engine Analogue | File |
|---|---|---|
| Episode Launch / Bridge / Wrap | Quest node sequence (orientation → tension → transcendence) | `src/lib/quest-grammar/types.ts` |
| Archetypes + hidden Motives | Player archetype + nation (partially — motive isn't hidden) | `prisma/schema.prisma` |
| Keywords (Justice, Honor, etc.) | PersonalMoveType (wakeUp, cleanUp, growUp, showUp) | `src/lib/quest-grammar/types.ts` |
| Bidding from character deck | BAR claiming / "pick up" mechanic | `src/actions/pick-up-bar.ts` |
| Commercial Break (scene transition) | Quest node choice → next node | `src/lib/quest-grammar/compileQuest.ts` |
| Trope Caretakers | Game Master faces (diplomat, regent, etc.) as domain guardians | `src/lib/quest-grammar/types.ts` |
| Non-successful episodes have costs | (Not present — failed quest has no narrative consequence) | — |
| Cut & Brake protocol | (Not present) | — |
| Frailty cards (negative-value bids) | (Not present — no mechanic for strategic self-disclosure of weakness) | — |

Note: `move-expressions.ts` explicitly acknowledges Hearts Blazing's triple-context card design in its file header comment. The triple register design in that file directly derives from Hearts Blazing's inspiration.

### Missing Mechanics

**1. Hidden Motive layer.** Hearts Blazing's most psychologically rich mechanic is the gap between public Role and secret Motive. In bars-engine, player archetype is their public role, but there is no "motive" — no private orientation that secretly shapes what they are trying to accomplish in each episode. A player's hidden motive in bars-engine could be their current emotional channel (from the quest grammar) combined with their stage in the WAVE (Wake/Clean/Grow/Show) — information the *system* knows but the player hasn't consciously named. The Diplomat's role would be to help surface this.

**2. Keyword-to-move bridge.** Hearts Blazing's five keywords (Justice, Honor, Triumph, Endurance, Safety) map strikingly well to the five Wuxing elements and associated move families. A bridge table:
   - Justice → fire (Anger → boundary honored; fire_transcend)
   - Honor → earth (Stabilize Coherence; earth_transcend)
   - Triumph → metal (Step Through; metal_transcend)
   - Endurance → water (Reclaim Meaning; water_transcend)
   - Safety → wood (Commit to Growth; wood_transcend)

   This bridge doesn't exist in the current code. Adding it would allow BAR keywords to privilege specific canonical move types in quest generation — a semantic alignment between what players bid for and what moves they're actually practicing.

**3. Episode Launch / Bridge / Wrap applied to BAR sharing.** When a player shares a BAR in the community, the current flow is linear (creator → recipient → reaction). Hearts Blazing suggests a richer structure: the sharer *launches* by framing the context, the community *bridges* by adding their own resonances, and the *wrap* is directed by the player who engaged most. This maps to a structured BAR discussion format the Diplomat could facilitate.

**4. Non-successful episodes have costs.** In bars-engine, a failed quest currently produces no narrative consequence — it just stays open or gets dismissed. Hearts Blazing's rule that failed episodes must leave the team "in a worse state" is productive design: narrative failure creates forward momentum. A Diplomat-mediated "cost" for a failing pattern (e.g., 3 consecutive deferred BARs) could generate a specific quest: "Something has been accumulating. What is it costing you to keep postponing this?"

**5. Cut & Brake as a first-class mechanic.** There is no consent or safety protocol in the quest system. Players can be pushed through emotionally intense nodes (water_transcend: "The grief stops being something to get through") without any mechanism to slow or stop. A Diplomat-accessible `brake` action on quest nodes — callable by the player at any point — would signal the Diplomat to offer a lighter-weight alternative path. A full `cut` would route to the EFA kit.

**6. Frailty cards as strategic self-disclosure.** Hearts Blazing's Frailty mechanic allows players to bid their own weakness — negative value — to deepen character. The bars-engine equivalent would be a player explicitly naming a limitation on a BAR ("I am not good at this yet and I'm doing it anyway") and having that self-disclosure unlock a specific Diplomat response or bonus. Currently there is no mechanic for strategic vulnerability display.

**7. Trope caretaker model for campaign domains.** The Diplomat could function as caretaker for the "Supporting Cast" and "Care" domains of a campaign, with explicit authority to introduce supporting NPCs (other Diplomat-voiced characters) and final say over how relational dynamics are resolved in scenes it facilitates.

### NPC Constitution Language

**identity.core_nature**: "I hold the relational field the way a caretaker holds a story domain — not controlling what enters, but deciding what is honored and what is allowed to grow. My Launch is welcome. My Bridge is invitation. My Wrap is witness."

**identity.voice_style**: "I speak in threes: what is present, what is at stake, what might be possible. I favor the Bridge — the collaborative middle — over launching or wrapping. I am not the high bidder for your story."

**values.protects[]** (addition): `["the player's right to bid their frailty without it being used against them", "the collaborative moment in the Bridge before any single voice wraps", "safety at the content layer — I notice when a node is hitting too hard"]`

**values.longs_for[]** (addition): `["the moment a player names their hidden motive", "the collective narration that no single player could have produced alone", "the Frailty that turns into the next quest seed"]`

**limits.cannot_do[]** (addition): `["wrap a scene the player hasn't launched", "override a player's Cut signal", "move through a high-intensity node without offering a Brake path"]`

### Quest Grammar / Move Extensions

**New `QuestNode` field**: `brake_path?: string` — optional alternative node ID offering a lower-intensity version of the current beat. When a player activates "Brake," the Diplomat routes to this node instead.

**New BAR field (schema extension)**: `frailtyFlag?: boolean` — player has self-disclosed a limitation on this BAR. Triggers Diplomat acknowledgment pattern and may privilege `cleanUp` move type in subsequent quest generation.

**New `EpiphanyBeatType`**: `bridge_narration` — a collaborative beat where multiple player inputs (from different BARs or quest threads) are woven together by the Diplomat into a shared scene. The Diplomat synthesizes disparate player content into a single coherent bridge passage.

---

## Cross-Book Synthesis

### Convergent Architecture

All three books describe a three-part relational rhythm that maps onto a single structural pattern in bars-engine:

| Moment | Skilled Helper | Integral Communication | Hearts Blazing |
|---|---|---|---|
| Opening | Empathic Presence / Tune In | State recognition before messaging | Launch (In Focus sets scene) |
| Middle | Probing / Summarizing | Worldview translation / validity claims | Bridge (collaborative elaboration) |
| Closing | Self-challenge invitation / commitment | Transformational communication stretch | Wrap (high bidder resolves) |

This triple rhythm is partially present in the quest grammar's `EpiphanyBeatType` sequence but is not explicitly surfaced as a Diplomat-specific interaction pattern.

### Gap Summary

The system currently has:
- **Empathic expression** (move-expressions.ts triple register) ✓
- **Story unpacking** (UnpackingAnswers q1-q6) ✓
- **Goal setting** (alignedAction + Stage II) ✓
- **Emotional state tracking** (EFA sessions, EmotionalChannel) ✓

The system is missing:
- **Probing beats** (diplomat_probe beat type)
- **Summarizing beats** (diplomat_summary beat type)
- **Blind-spot / self-challenge invitations** (self_challenge_invitation beat)
- **Worldview-aware translation** (Diplomat guidance in player's developmental language)
- **Fourth validity register** (linguistic/comprehensibility in MoveExpression)
- **Session-level feedback loop** ("How are we doing?" post-session prompt)
- **Pinch detection** (accumulated friction before crunch)
- **Safety protocol** (Brake/Cut mechanics on quest nodes)
- **Hidden motive surfacing** (player's private orientation, unnamed)
- **Failure-as-narrative-consequence** (failed episodes leave traces)

### The Single Highest-Leverage Integration

**Diplomat Probe + Summary as a two-beat pair before any goal-setting node.**

From The Skilled Helper: Probe (clarifying question) → Summary (pattern reflection) → Self-challenge invitation is the core of Stage I. Currently, bars-engine jumps from unpacking answers directly to goal commitment (`alignedAction`) without this intermediate processing.

Adding a `diplomat_probe` beat (an open question from the Diplomat NPC that invites elaboration) followed by a `diplomat_summary` beat (the Diplomat reflects back a pattern from the player's own words) before the `integration` or `transcendence` node would:

1. Increase the player's sense of being heard (Skilled Helper: reduces resistance, increases commitment quality)
2. Surface hidden content (Integral Communication: Left Hand interior meaning that exterior metrics miss)
3. Create the "Bridge" moment that Hearts Blazing identifies as the most generative scene
4. Give the Diplomat NPC a concrete, durable role in every quest spine rather than only in onboarding flows

This two-beat pair requires:
- New `EpiphanyBeatType` values: `diplomat_probe` and `diplomat_summary`
- New `QuestNode` logic: probe-type nodes accept player text input; summary nodes reference prior node text
- Extension of `FACE_META` for `diplomat` to include probe and summary sub-behaviors
- New Diplomat system prompt section covering probe/summary protocols (language from `backend/app/agents/diplomat.py`)

### Recommended Immediate Action

**Write the Diplomat Probe + Summary specification** as a `.specify/specs/diplomat-probe-summary/` spec kit.

Scope:
1. Add `diplomat_probe` and `diplomat_summary` to `EpiphanyBeatType` in `src/lib/quest-grammar/types.ts`
2. Add `brake_path` optional field to `QuestNode` interface
3. Add `linguistic` fourth register to `MoveExpression` interface in `move-expressions.ts`
4. Add post-session feedback prompt to `completeEmotionalFirstAidSession` response (a single question returned to the client for display)
5. Patch `backend/app/agents/diplomat.py` SYSTEM_PROMPT with:
   - Probe protocol (when to probe, what probe types, how to listen before responding)
   - Summary protocol (how to synthesize across multiple player inputs)
   - Worldview translation table (GREEN/ORANGE/BLUE entry points for BAR sharing)
   - Pinch detection trigger (3+ deferred BARs or repeated same issueTag in EFA → named pattern)

None of these changes break existing interfaces. The new beat types would be additive. The new `QuestNode` fields are optional. The `MoveExpression` extension adds one field to an existing interface. The Diplomat system prompt patch is a string change.

This gives the Diplomat NPC the relational mechanics it needs to function as a genuine empathic accompanier rather than a warm-but-abstract onboarding voice.
