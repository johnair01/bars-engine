# Strand: Tighten Basic Game Loop — Admin vs Player

**Strand ID**: `kfp71utqm82lolhvpgm6vvr4`  
**Output BAR**: `qpge72s55nprdbeh9wjlrvn0`  
**Subject**: Admin/player needs conflated; more admin tools than player experiences; one-button admin quest generation; explore blockers proactively.

---

## Architect (diagnostic spec)

**Title**: Tighten the Basic Game Loop Diagnostic

**Description**:
This diagnostic spec aims to refine the core game loop by addressing the conflated needs of players and admins. Admins should easily generate player content, while players efficiently complete campaign quests. The goal is to enhance the cycle where admins create content with one click, players unlock opportunities, resulting in further content creation. This diagnostic identifies and prioritizes blockers for admin quest generation and player completion loops.

---

## Problem (from user)

1. **Two user types**: Player and admin. Their needs are conflated.
2. **Imbalance**: Far more admin tools than player experiences.
3. **Goal**: Admin generates player content → players unlock opportunities → admin creates more content.
4. **Content that matters**: Completing campaign quests.
5. **Admin need**: One-button press to create easily editable, grammatical quests from context.
6. **Explore blockers proactively** — don't run into them blindly.

---

## Current Admin Quest Generation Paths (from codebase)

| Path | Location | One-click? | Grammatical? | Editable? |
|------|----------|------------|--------------|-----------|
| **upsertQuest** | admin.ts, pack/thread pages | Manual form (title, description) | No | Yes |
| **Quest Grammar** | /admin/quest-grammar | Multi-step: unpack → compile → publish | Yes (Epiphany Bridge/Kotter) | Yes (passages) |
| **generateQuestFromReading** | generate-quest.ts, DashboardCaster | One button (hexagram) | Yes | Creates quest + adventure |
| **generateQuestProposalFromBar** | bar-quest-generation | BAR → proposal → admin review → publish | Structured | Yes after publish |
| **Book analysis** | book-analyze.ts | One trigger per book | AI-generated | Yes |
| **Gameboard slot** | GameboardClient handleCreateQuestForAid | Context: slot + aid offer | Uses compileQuestWithAI | Yes |
| **Quest Proposals** | /admin/quest-proposals | BAR → proposal → approve | From BAR interpretation | Yes |

---

## Likely Blockers (to explore)

### Admin one-click quest generation

1. **Context input** — What context does admin provide? Campaign ref? Kotter stage? Slot? Template? Today there's no unified "generate from context" API.
2. **Grammar choice** — Epiphany Bridge vs Kotter. Quest Grammar requires unpacking; generateQuestFromReading uses hexagram. No "campaign slot + domain" → grammatical quest.
3. **Editable output** — Quest Grammar produces Twine passages; generateQuestFromReading produces adventure. CustomBar fields (title, description, inputs) vs Twine vs both?
4. **Campaign linkage** — Generated quest must land in campaign (gameboard slot, thread). Does it auto-attach or require manual placement?
5. **OPENAI_API_KEY** — Many flows require it; deterministic fallbacks produce stubs. Admin may hit "no key" or rate limits.

### Player completion loop

1. **Discovery** — Can players find campaign quests? Gameboard, Market, threads?
2. **Completion** — completeQuestForPlayer, passage completion, attestation. What blocks?
3. **Unlock signal** — When player completes, what unlocks for admin? Instance funding? Kotter advance? New slot? No clear "player completed → admin can create more" hook.
4. **Feedback loop** — Admin creates → player completes → ??? → admin creates more. The middle step (unlock/capacity) may be missing.

### Conflation

1. **Same UI for both** — Dashboard shows admin controls mixed with player content. Quest detail has admin edit link. Gameboard has "Generate grammatical quest (admin)".
2. **No separation** — Admin tools live in /admin/* but player flows (dashboard, gameboard, Hand) embed admin-only actions. Gate by role, but UX is blended.
3. **Content ownership** — Who creates campaign quests? Admin. Who completes? Player. The handoff (admin publishes → player sees) may have gaps.

---

## Recommended next steps

1. **Strand or spec** — Turn this into a spec: "Admin One-Click Quest Generation" with API contract (generateQuestFromContext(context)) and prioritized blockers.
2. **Audit** — Map every admin quest-creation path. Document: input, output, grammar, edit surface, campaign linkage.
3. **Unlock hook** — Define: when player completes campaign quest X, what happens? Instance funding? Stage advance? New slot? Use that to close the loop.
4. **Separation** — Consider: admin-only routes vs player routes. Or: admin actions in admin panel only; player flows stay clean.
