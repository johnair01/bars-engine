# Values and polarities (canonical)

This document is the **terminology authority** for BARs when we talk about **values** (developmental / worldview layer) versus **polarities** and **tension pairs** (both-and maps). It complements [grid axis derivation](../.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md) (how row labels are computed).

**Player-facing wiki (footnote-friendly):** in the app, **`/wiki/values-and-polarities`** — hash links **`#footnote`** (snapshot), **`#in-the-app`** (journey), **`#terms`** (table). Source: `src/app/wiki/values-and-polarities/page.tsx`.

---

## Why this exists

English overloads **“value”**:

1. **Barry Johnson (polarity thinking)** often calls each **pole** of a map a “value” — two **sibling goods** that stay in tension.
2. **Spiral Dynamics** uses **vMEMEs** as **value-system attractors** — deep containers for what feels legitimate, shameful, or “obviously true.”
3. **BARs product** also has **Prisma `Polarity`**, which names **nation move** tags — unrelated to developmental value systems or grid row labels.

Without separate words, design and code drift into **soup**. This file fixes vocabulary.

---

## Terms

| Term | Meaning in BARs | Not the same as |
|------|-----------------|-----------------|
| **Value system (vMeme layer)** | A **developmental / worldview container**: recurring needs, fears, and legitimacy rules (Spiral Dynamics: vMEME as attractor). Context shifts which system is “up.” | A single word on a grid corner; not Prisma `Polarity`. |
| **Tension pair / polarity (map)** | A **recurring interdependent pair** where **both poles matter**; health is **balance or rhythm**, not picking a permanent winner (polarity thinking / polarity maps). | A vMeme “color” or stage label. |
| **Axis pair (Scene Atlas)** | **Two independent** tension dimensions; **4 row labels** = their combinations. Authored metaphors (e.g. nation element + playbook trigram). See spec kit `creator-scene-grid-deck`. | Prisma `Polarity` rows. |
| **Move polarity (implementation)** | Database tag on **nation moves** (`NationMove.polarityId`). | Grid axes, vMemes, or Johnson poles. |

**Johnson nuance:** In his vocabulary, a polarity *is* a pair of “values.” In **player copy**, prefer **pole** or **good** for map ends, and reserve **value system** for developmental / worldview language — so we do not sound like we are ranking souls.

---

## How you might interact with this in BARs

Use this when writing UI, quests, or wiki text.

1. **Onboarding / nation & playbook**  
   You choose a **Nation** and **Archetype (playbook)**. Those selections **do not** assign a Spiral “color.” They **do** feed **optional derived labels** for **Scene Atlas**’s two axes (metaphorical “stakes” + relational frame).

2. **Scene Atlas (`/creator-scene-deck`)**  
   You see **four rows** (four combinations of two axis pairs). Each row is a **tension mix**, not a vMeme. Writing a BAR into a cell is **mapping your note to a both-and corner** of the workspace — practice, not diagnosis.

3. **Wake Up / orientation adventures (when wired)**  
   An adventure may write **`storyProgress.gridPolarities`**, **overriding** derived row labels with **your chosen tension language**. That is the closest in-product analogue to **naming the polarities you want to steer** (still not the same as declaring a vMeme).

4. **Moves and quests**  
   **Moves** may reference **move polarity** tags for game logic or copy. That taxonomy is **orthogonal** to grid axes and vMemes.

5. **Reading the wiki**  
   If copy says **“polarity pair”** for the grid, it means **axis pair / tension pair**. If we discuss **values** in a developmental sense, we mean **value systems** or **worldview layers**, not Prisma enums.

**Wiki footnote URL:** `/wiki/values-and-polarities#footnote` (short snapshot) and `/wiki/values-and-polarities#in-the-app` (this list in narrative form).

---

## Six Game Master faces (research lenses)

Each face asks a different question of the same distinction. Useful for design review, not required for players.

| Face | Question |
|------|----------|
| **Shaman** | Where is the **felt tug**? Value systems shape what *hurts*; tension pairs describe the **swing** between two goods. |
| **Regent** | What are we **stewarding**? Polarity **management** = neither pole starves. vMemes shape **what counts as legitimate care**. |
| **Challenger** | What **collapses** when we confuse stage conflict with pole conflict, or treat a map as identity? |
| **Architect** | What belongs in **which data concept**? Developmental layer vs tension map vs move tag — **three schemas**, three names. |
| **Diplomat** | What **bridge words** do players need so “values” in Johnson vs Spiral vs everyday speech don’t merge? |
| **Sage** | How do **Integral** frames (levels vs types vs lines) align? vMemes sit closer to **levels / worldview**; tension pairs are **recurring dynamics** to balance, often in Wilber’s “both/and” sense. |

---

## References (external)

- Barry Johnson / Polarity Map® — [Polarity Partnerships](https://www.polaritypartnerships.com/applications-impact)  
- Spiral Dynamics / vMEMEs — [Wikipedia](https://en.wikipedia.org/wiki/Spiral_Dynamics); [SD and memetics](https://www.spiral-dynamics.com/aboutsd_memetics.htm)  
- Integral polarities — [Integral Life — Polarities](https://integrallife.com/key-concept-polarities/)

---

## Related repo paths

- Grid axis math & vocabulary: [`.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md`](../.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md)  
- Wiki article: `/wiki/values-and-polarities`
