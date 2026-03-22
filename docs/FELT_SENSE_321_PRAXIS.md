# Felt Sense & 321 Process Praxis

> Source: *Complete Focusing Instructions* — Eugene T. Gendlin
> Admin library pillar: `felt_sense`
> Related praxis spec: `.specify/specs/library-praxis-three-pillars/`

---

## The Core Thesis (from the text)

Gendlin's *Focusing* establishes that the body carries a kind of knowing that arrives *before* words do. He calls this a **felt sense** — not an emotion, not a thought, but an unclear bodily quality that holds the whole of a situation implicitly. When you stop and attend to it, when you let it speak in its own time, it *shifts*. The shift is physiologically real and typically feels like relief, release, or a new clarity.

The central move Gendlin teaches is **checking**: forming a word or image that might name the felt sense, then pausing and asking the body whether that is right. The body answers — not with certainty but with a subtle yes/no signal, a quality of fit. This is trainable. Most people have the capacity but have never been shown how to access it.

Focusing is not therapy, not meditation, not journaling. It is a specific somatic attention skill. With practice it becomes available in ordinary life — in meetings, during creative work, in conflict — not just in dedicated sessions.

---

## Why This Belongs in BARS

BARS is a developmental game. Its quests, moves, and emotional alchemy mechanics only work if players can actually sense what they are feeling — not just label it conceptually. Players who cannot access felt sense will:
- Choose quest options cognitively rather than somatically
- Disengage from the 321 Shadow Work process (it feels abstract)
- Complete arcs without integration (the charge dissipates without being metabolized)

Conversely, players who develop felt-sense skill will:
- Select move types that genuinely match their emotional charge
- Use the 321 process as a real practice, not a form to fill out
- Generate richer, more resonant charges that seed better quests

**Felt sense is a trainable competitive advantage in BARS.** Teaching it directly is both ethical (it serves the player) and strategic (it deepens engagement).

---

## The 321 Process as Felt-Sense Practice

The BARS 321 Shadow Work process is a direct application of Gendlin's method, adapted for the game context:

| Step | Gendlin's move | BARS application |
|---|---|---|
| **3 breaths** | Creating space — the Clearing a Space exercise | Slow the nervous system; make room for something implicit to form |
| **2 observations** | Coming to the felt sense — attending without forcing | Name two things you notice (body, thought, image) without explaining them |
| **1 articulation** | The handle — a word, phrase, or image that fits | One sentence: "What this whole thing feels like is…" |

The critical instruction Gendlin repeats throughout the text: *don't reach for the first answer*. The first answer is usually the already-known conceptual response. The felt sense needs time — typically 20–30 seconds of quiet attention — to form. The 321 process at its best is that pause.

### Copy guidance for the 321 page

The felt-sense scaffolding copy on `src/app/shadow/321/page.tsx` is intentionally minimal:

> *"This process works at the pace of felt sense — the bodily knowing that arrives before words do. Move slowly. Let something form rather than reaching for the first answer."*

This is consistent with Gendlin's teaching: the instruction should *invite* the pause, not explain it. Over-explanation activates cognition and defeats the purpose.

---

## Felt Sense at Other Quest Touchpoints

### Charge capture (`/capture`)

When a player logs a charge, they are at the moment closest to raw felt sense — the charge has just arisen. The copy:

> *"Before you type — pause for a moment. Notice where in your body the charge lives."*

This is a Gendlin "body location" prompt. It is the first Focusing instruction: **find where in the body the felt sense lives**. Location is not required for the charge to proceed, but it increases the quality of the subsequent quest seed.

### Quest unpack (`/quest/[id]/unpack`)

When a player opens a quest, they have a felt relationship to it — interest, resistance, curiosity, dread. The copy:

> *"Notice what the quest stirs in you right now — not what you think about it, but what you feel about it."*

This is a "checking" prompt: does this quest fit my current felt sense? The distinction between thinking *about* it and feeling *about* it is precisely Gendlin's.

---

## Skill Levels and Developmental Progression

Felt sense capacity is not binary. Gendlin describes a natural learning curve, and BARS can honor that:

| Level | Typical player experience | BARS response |
|---|---|---|
| **Pre-focusing** | "I don't know what I'm feeling" or immediate conceptual labels | Gentle somatic prompts; location questions; slow down the interface |
| **Early focusing** | Partial contact; words come but don't quite fit | Encourage checking; offer multiple framings to try against the body |
| **Developing** | Can pause and let something form; notices the "not quite right" signal | Less scaffolding needed; quest arcs can go deeper |
| **Practiced** | Felt sense is available in real time; shadows metabolize faster | Advanced quest types; Experiment/Integrate expression arcs |

The game does not need to assess this explicitly. The 321 process is calibrated: players at different levels will get different amounts from the same practice. The scaffolding copy is written for early-stage players; practiced players will simply move faster.

---

## Non-Clinical Note

Focusing as taught by Gendlin is explicitly non-clinical. It is not trauma processing, not therapy, not a substitute for professional support. BARS should maintain this boundary:

- The 321 process is **a skill practice**, not a therapeutic intervention.
- If a player surfaces intense material, the game should have a graceful exit (e.g., "this feels too big for a quest right now — that's useful signal too").
- The felt-sense scaffolding copy should never imply clinical depth. It is somatic attention, not catharsis.

For players in active mental health treatment, Gendlin's own recommendation is to do Focusing with a trained companion, not alone. BARS is not that companion.

---

## Integration with Other Pillars

- **Antifragile** (Taleb): A player with developed felt sense is more antifragile. They metabolize setbacks through the body rather than getting stuck in cognitive loops.
- **Commons / Networks** (Benkler): Quality contributions to a peer-production commons require presence. Felt sense is the somatic basis for that presence.

---

## External Resources

- [Focusing Institute](https://focusing.org/) — official resources, certified trainers
- Gendlin's original 1978 *Focusing* — a shorter, more accessible entry point than *Complete Focusing Instructions*

---

## See Also

- `src/app/shadow/321/page.tsx` — 321 Shadow Work player-facing page
- `src/app/capture/page.tsx` — charge capture with somatic prompt
- `src/app/quest/[questId]/unpack/page.tsx` — quest unpack with felt-sense copy
- `docs/PLAYER_SUCCESS.md` — how felt sense connects to player success definitions
- `.specify/specs/player-handbook-orientation-system/HANDBOOK_DRAFT.md` — felt-sense touchpoints in the handbook
