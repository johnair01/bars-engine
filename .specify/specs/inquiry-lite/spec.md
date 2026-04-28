# Inquiry (The Work) — Byron Katie Lite

## ID
`INQ` | Personal Ops Funnel | Priority 2.02

---

## 1. Concept & Vision

A mobile-first, single-session Inquiry practice using Byron Katie's four questions plus the bars-engine emotional alchemy layer.

**The modality:** Mindfulness / inquiry — not animist parts-work (that distinction matters for output types). This is about questioning a belief, not externalizing it as a presence.

**The hook:** "Where are you stuck?" is the entry point — language that maps directly to bars-engine's unstuckness mechanic (Wake/Clean/Grow/Show Up).

**The differentiator:** Emotional alchemy integration. Every Q3 answer gets a "how do I feel when I react this way?" and "how do I want to feel?" — creating a complete EA move recommendation that feeds the BAR seed.

**Who it's for:** A single practitioner (Wendell) building a daily personal ops practice.

---

## 2. Design Language

### Aesthetic
Clean, minimal, mobile-first. Private journal feel — no game-world framing, no NPCs.

### Color palette
```
background:    #0D0D0F (near-black)
surface:      #18181B (zinc-900)
border:       #27272A (zinc-800)
text primary: #FAFAFA
text muted:   #A1A1AA (zinc-400)
accent:       #A78BFA (violet-400) — transformation / alchemical reveal
warning:      #FBBF24 (amber-400) — the question moments
success:      #34D399 (emerald-400) — completion
```

### Typography
System sans-serif. No custom fonts. Keep bundle light.

### Motion
Minimal. Fade transitions between steps (150ms). Contemplative, not theatrical.

---

## 3. User Flow

```
[1. Stuckness Input]
        ↓
[2. Q1 — Is it true?]
        ↓
[3. Q2 — Can I absolutely know it's true?] (if Q1 = Yes)
        ↓
[4. Q3 — How do I react?] + sub-questions
        ↓
[5. Q4 — Who would I be without the thought?] (if Q1 = No, or Q2 = No)
        ↓
[6. Turnaround — 3 ways]
        ↓
[7. Alchemical Transformation]
        ↓
[8. BAR Seed — copy to clipboard]
```

**Total steps: 8**

---

## 4. Step-by-Step Specification

### Step 1: Stuckness Input

**Prompt:** "Where are you stuck?"

**Sub-text:** "What's stopping you from doing what needs to get done?"

**Input:** Single textarea, placeholder: "I can't seem to finish… / I'm avoiding… / I keep putting this off…"

**Constraints:** 10–500 characters. Minimum 10 chars to proceed.

**State stored:** `stuckness: string`

**Note:** This is the belief / charge. The belief itself becomes the BAR subject.

---

### Step 2: Q1 — Is it true?

**Prompt:** "Is it true?"

**Instruction text:** "Take a moment. Can you absolutely know that this is true?"

**Input:** Two large buttons — **"Yes"** and **"No"** (required)

**If "No" selected:** Jump directly to Q4 (skip Q2 and Q3).

**If "Yes" selected:** Continue to Q3.

**State stored:** `q1Answer: 'yes' | 'no' | null`

---

### Step 3: Q3 — How do I react when I believe that thought?

This step has **three parts** — presented sequentially but on the same screen:

**Part A — Reaction:** 
Prompt: "How do you react when you believe that thought?"
Instruction text: "Notice what happens in your body. What emotions arise? What do you do — or stop doing?"
Input: Textarea, 3–10 rows. Minimum 10 characters.
State stored: `q3Response: string`

**Part B — Feeling about reaction:**
Prompt: "How do you feel when you react this way?"
Input: Feeling chip selector (Wuxing dissatisfied vocabulary). User selects one.
State stored: `q3DissatisfiedFeeling: FeelingChip`

**Part C — Desired feeling:**
Prompt: "How do you want to feel instead?"
Input: Feeling chip selector (Wuxing satisfied vocabulary). User selects one.
State stored: `q3DesiredFeeling: FeelingChip`

**Note:** Parts B and C together enable an EA move recommendation on the Alchemy step. If either is missing, no recommendation is made.

**State stored:** `q3Response: string`, `q3DissatisfiedFeeling: FeelingChip`, `q3DesiredFeeling: FeelingChip`

---

### Step 4: Q3 — How do I react?

**Prompt:** "How do you react when you believe that thought?"

**Instruction text:** "Notice what happens in your body. What emotions arise? What do you do—or stop doing?"

**Input:** Textarea, 3–10 rows. Minimum 10 characters.

**State stored:** `q3Response: string`

### Step 4b: Dissatisfied feeling chips (multi-select)

**Prompt:** "How do you feel when you react this way? Select all that fit."

**Input:** Multi-select feeling chips. Up to 3 chips from the dissatisfied vocabulary. Chips toggle on/off. At least 1 required before proceeding.

**Display:** Selected chips show with a filled state. Can deselect any chip.

**State stored:** `q3DissatisfiedFeelings: FeelingChip[]` (array, max 3)

### Step 4c: Desired feeling chips (multi-select)

**Prompt:** "How do you want to feel instead? Select all that fit."

**Input:** Multi-select feeling chips. Up to 3 chips from the satisfied vocabulary. Chips toggle on/off. At least 1 required before proceeding.

**Display:** Selected chips show with a filled state.

**State stored:** `q3DesiredFeelings: FeelingChip[]` (array, max 3)

**EA recommendation:** If both 4b and 4c have selections, compute the EA move recommendation. Derive from the dominant channel in q3DissatisfiedFeelings and q3DesiredFeelings. Display the recommendation at Step 7.

---

### Step 4: Q4 — Who would I be without the thought?

**Shown in two cases:**
- (A) Q1 = "No" — skip to here directly
- (B) Q1 = "Yes" AND Q2 = "No" — Q2 led here; skip Q3

**Prompt:** "Who would you be if you couldn't hold this thought?"

**Instruction text:** "Imagine your life without this belief. What changes? How do you feel? What becomes possible?"

**Input:** Textarea, 3–10 rows. Minimum 10 characters.

**State stored:** `q4Response: string`

---

### Step 5: Q2 — Can I absolutely know it's true?

**Shown only if Q1 = "Yes".**

**Prompt:** "Can you absolutely know that it's true?"

**Instruction text:** "Can you be 100% certain? What would it take to be certain?"

**Input:** Two large buttons — **"Yes, absolutely"** and **"No, I can't know for certain"**

**State stored:** `q2Answer: 'yes' | 'no' | null`

---

### Step 6: Turnaround

**Prompt:** "Turn it around."

**Instruction text:** "Find at least 3 genuine turnarounds of the original belief. The opposite might be as true — or more true."

**Display:** Original stuckness shown in a callout box (read-only).

**Input:** Three textareas, labeled:
1. "Turn it toward yourself:"
2. "Turn it toward the other person (or situation):"
3. "Turn it to the opposite:"

**Hint text below each:** "e.g. 'I'm not good enough' → 'I am good enough' / 'Others aren't good enough for me' / 'I am enough exactly as I am'"

**State stored:** `turnaround1: string`, `turnaround2: string`, `turnaround3: string`

---

### Step 7: Alchemical Transformation

**Prompt:** "Now alchemize."

**If EA data is present (q3DissatisfiedFeeling + q3DesiredFeeling):**
Display the EA move recommendation:
```
[Dissatisfied Channel] → [Satisfied Channel]
```
Example: `Metal (fear) → Metal (peaceful)`

User can accept the recommendation or override with different feeling chips.

**If EA data is missing:**
Prompt: "What feeling do you want to alchemize?"
Auto-detect attempt from Q3 response keywords, but user must confirm.
Fallback: feeling chip selector for dissatisfied + desired.

**State stored:** `dissatisfiedFeeling: FeelingChip`, `desiredFeeling: FeelingChip`, `alchemyMove: string`

---

### Step 8: BAR Seed

**Prompt:** "Your BAR seed is ready."

**Display:** A composed BAR seed text block — the belief, top turnaround, and EA move in a shareable format.

**Example output:**
```
I'm stuck on: I can't finish what I start.

Turn it around: I can't start what I finish.

Alchemy: Metal → Metal (fear → peace)
```

**Actions:**
1. **Copy to clipboard** — copies the BAR seed as formatted text. User pastes it into bars-engine manually.
2. **Do a full 321** — routes to `/shadow/321` with `stuckness` prefilled as `chargeDescription`.
3. **Start over** — clears session, returns to step 1.
4. **Done** — returns to home.

**State stored:** `barSeedText: string`, `dispatchChoice: 'copy' | 'full-321' | 'restart' | 'close'`, `completedAt: timestamp`

---

## 5. Technical Architecture

### Platform
zo.space — React page at `/inquiry`

### State Management
- React `useState` + `sessionStorage`
- Session key: `inquiry_progress`
- No server-side state until the user copies the BAR seed

### BAR Seed Composition (deterministic algorithm)
```
BAR seed = {
  stuckness (the belief)
  + top turnaround (turnaround1)
  + EA move: [dissatisfied channel] → [desired channel]
  + optional: Q4 insight line (first sentence)
}
```

### Later (Phase 2 API integration)
- `POST /api/bars/from-inquiry` — replaces copy/paste
- Zo secret `BARS_ENGINE_API_KEY` for admin auth
- bars-engine receives: belief, turnaround, EA tags, stuckness signal
- bars-engine does NOT receive: full Q&A, personal narrative

### Query param prefill
- `/inquiry?stuckness=X` — accepts pre-filled stuckness text
- Used by SPC (750words) output to pass stuckness forward

---

## 6. Copy Deck

### Step headers (progressive)
1. "Where are you stuck?"
2. "Is it true?"
3. "Can you absolutely know?"
4. "How do you react?"
5. "Who would you be without it?"
6. "Turn it around"
7. "Alchemize"
8. "Your BAR seed"

### Emotional alchemy labels (Wuxing — dissatisfied)
```
Metal:     anxious, scared, guarded, defended
Water:     heavy, grief, loss, numb
Wood:      envious, competitive, restless, lost
Fire:      frustrated, rage, contempt, impatient
Earth:     overwhelmed, flat, stuck, checked-out
```

### Emotional alchemy labels (Wuxing — satisfied)
```
Metal:     peaceful, clear, open, trusting
Water:     at ease, allowing, surrendered, held
Wood:      purposeful, generative, expanding, alive
Fire:      warm, connected, loved, cherished
Earth:     grounded, centered, stable, present
```

### Completion copy
"For today, The Work is done. What you discovered belongs to you."

---

## 7. Relationship to Full 321

| Aspect | Inquiry (This) | 321 Introspection |
|---|---|---|
| Modality | Mindfulness / inquiry | Animist / parts-work |
| Entry point | "Where are you stuck?" | "What are you carrying?" |
| Core mechanic | Question belief → turnaround | Externalize → name → dialogue |
| EA integration | Q3 sub-questions → EA move | Alchemy step |
| Output types | BAR seed (MVP: copy/paste) | BAR + daemon + quest |
| Guide NPCs | None | 6 (Vorm, Ignis, etc.) |
| Deep Cavern | No | Yes |
| BAR seed dispatch | Copy/paste (Phase 1) | Full API |
| Compost path | No | Yes |

---

## 8. Open Questions

1. **Copy format:** Is the example BAR seed format right? Should turnaround2 and turnaround3 also appear in the seed?
2. **EA auto-detect:** Keyword → feeling mapping is deterministic. Validate against 10 sample Q3 responses.
3. **Q3 screen structure:** Three sequential prompts on one screen vs three separate steps? (Sequential on one screen = faster, less context switching.)
4. **SPC → INQ routing:** `?stuckness=X` query param works. Later: shared session via Zo API?

---

## 9. Verification Criteria

- [ ] 8 steps navigable on mobile (375px width)
- [ ] "No" on Q1 skips to Q4 directly
- [ ] Q3 shows all three sub-questions (reaction + feeling + desired)
- [ ] EA move recommendation appears when both feeling chips are selected
- [ ] "Copy to clipboard" produces correctly formatted BAR seed
- [ ] "Do a full 321" routes to bars-engine with stuckness prefilled
- [ ] Session persists through page refresh (sessionStorage)
- [ ] Completion screen shows with correct copy
- [ ] No bars-engine auth required for Phase 1 (copy/paste)
- [ ] `/inquiry?stuckness=X` pre-fills the stuckness field