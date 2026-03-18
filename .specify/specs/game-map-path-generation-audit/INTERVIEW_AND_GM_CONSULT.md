# Interview & Game Master Consult — Lobby-Centric Path Map

**Purpose**: Clarify the vision for the lobby-centric, 8-portal branched map. Game Master voices (Architect, Regent, Shaman, Diplomat, Sage) offer structural questions and interpretive lenses.

---

## What We Heard (Summary)

| Element | Your description |
|---------|------------------|
| **Campaign deck** | Needs of the campaign, translated through I Ching hexagram interpretation |
| **8 portals** | Offered at once, aligned with campaign Kotter stage + allyship domain |
| **Structure** | Portals = nodes in branched graph; lobby = center; 8 directions branch out |
| **4 moves** | Always available: Wake Up, Clean Up, Grow Up, Show Up |
| **Grow Up** | → Adventure tied to one of the schools (Game Master faces / dojos) |
| **Clean Up** | → Links to Emotional First Aid quest |
| **Wake Up** | → Extend the path further OR open up another option in the room |
| **Show Up** | (implicit) — completing quests |

---

## Interview Questions

### 1. The 8 Portals — What Are They?

**Architect**: *"Before we build, we need to know: are the 8 portals the 8 trigrams, the 8 Kotter stages, or something else? You said they're 'offered at once' — does that mean the player sees 8 choices simultaneously, or that the campaign deck produces 8 options that are then interpreted by the hexagram?"*

- When you say "8 offered at once," do you mean:
  - **(A)** The player casts once and gets 8 possible interpretations (e.g. 8 trigram-based readings)?
  - **(B)** The campaign deck has 8 slots/cards, and the hexagram interprets which of those 8 is most relevant?
  - **(C)** The 8 are fixed (e.g. 8 Kotter stages or 8 trigrams), and the hexagram + campaign deck *color* or *prioritize* them?

- How does **allyship domain** (GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING) shape which 8 appear? One domain = one set of 8? Or domain filters/weights the 8?

---

### 2. The Lobby as Center

**Regent**: *"The lobby holds the order. Everything branches from it. But what *is* the lobby in this context — the physical `/lobby` page, the game-map hub, or a conceptual 'you are here' that exists inside the campaign?"*

- Is the lobby:
  - The existing **/lobby** page (global lobby — walk around, meet others)?
  - The **game-map** hub (Campaign, Daily Alchemy, Quest Wallet, etc.)?
  - A **campaign-specific** lobby (e.g. Bruised Banana lobby) that's distinct from the global one?
  - A **room** in the spatial world (`/world`) that serves as the campaign's center?

- When you say "8 directions," is that:
  - Literal (compass: N, NE, E, SE, S, SW, W, NW)?
  - Metaphorical (8 distinct paths/portals, not necessarily spatial)?
  - A mix (e.g. a map where each portal has a direction)?

---

### 3. The 4 Moves — Where Do They Live?

**Shaman**: *"The moves are thresholds. Each one crosses into something. I need to know: are the 4 moves available at every node, or only at certain nodes? And when you 'extend the path' vs 'open another option in the room' — that's two different kinds of crossing."*

- You said the 4 moves are "always available." Does that mean:
  - At **every node** in the graph (including the lobby), the player can choose Wake Up, Clean Up, Grow Up, or Show Up?
  - Or only at **branch nodes** (the 8 portals)?

- **Grow Up → school adventure**: Is "school" = one of the 6 Game Master faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage)? So Grow Up from a given portal could lead to "Study at the Shaman school" or "Study at the Architect school" — how does the player (or system) choose which school?

- **Clean Up → EFA**: Is this a direct link to the Emotional First Aid flow (e.g. `/emotional-first-aid`), or an EFA-style quest that lives *inside* the path (e.g. a passage that triggers EFA logic)?

- **Wake Up — two branches**:
  - **"Extend the path further"**: Does this mean the player creates a *new node* in the graph (e.g. a new passage, a new quest)? Who creates it — the player, the AI, or a template?
  - **"Open up another option in the room"**: Does "room" mean the current node? So at a given node, Wake Up could *reveal* a choice that was hidden (e.g. "You notice a door you didn't see before")? Or add a new exit from that node?

- **Show Up**: Where does it lead? Completing a quest — does that return the player to the lobby, advance them along the path, or something else?

---

### 4. Campaign Deck → Hexagram Translation

**Diplomat**: *"The campaign speaks its needs. The hexagram interprets. But who holds the campaign's voice — the instance, the admin, the collective? And how does the hexagram 'translate' — does it select, rank, or transform the deck?"*

- What is the **campaign deck** in concrete terms?
  - A set of quests/CustomBars that match the campaign's Kotter stage + domain?
  - A set of 8 "portal cards" that the hexagram interprets?
  - Something else (e.g. narrative prompts, BARs, adventure nodes)?

- How does the **hexagram interpretation** work?
  - Does the player cast the I Ching, and the result (hexagramId, changing lines) determines which of the 8 portals to highlight or recommend?
  - Or does the system pre-compute 8 hexagram-based readings (one per portal) and present them?
  - Or does the hexagram *modify* the content of each portal (e.g. same 8 structure, but the text/quest varies by cast)?

---

### 5. "Room" and "Path" — Terminology

**Sage**: *"Words carry structure. 'Room' and 'path' and 'portal' — if we use them inconsistently, the system will be confused. Let me ask: is a 'room' a node, and a 'path' the edge between nodes? Or is a 'path' a sequence of nodes (a route)? And is a 'portal' the same as a branch point, or the entrance to a path?"*

- Can you define, in your own words:
  - **Portal** = ?
  - **Room** = ?
  - **Path** = ?
  - **Branch** = ?

- When you say "open up another option in the room," does "room" = the current node the player is standing in? So the graph can *grow* — a node that had 2 exits could gain a 3rd via Wake Up?

---

### 6. Schools and Adventures

- You said Grow Up leads to "an adventure tied to one of the schools." Are the schools:
  - The 6 Game Master faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage)?
  - The 5 nations (Argyra, Lamenth, Meridia, Pyrakanth, Virelune)?
  - Something else?

- Is each school a separate Adventure (e.g. `shaman-school-adventure`, `architect-school-adventure`), or one Adventure with 6 branches?

---

### 7. What We Might Have Wrong

- Is there anything in the audit (or this interview) that feels *off* — a framing that doesn't match your vision?
- What's the one thing you'd want us to get right above all else?

---

## Game Master Synthesis (Preliminary)

**Architect**: The structure suggests a **hub-and-spoke with recursive branching**. Lobby = hub. 8 portals = first-level spokes. From each portal, the 4 moves are available, creating second-level branches. Grow Up and Clean Up are deterministic (school, EFA). Wake Up is generative (extend path or reveal option). Show Up is completion/return. We need clarity on: (1) whether the 8 are fixed or dynamic, (2) whether "room" = node, and (3) who creates new nodes on "extend path."

**Regent**: The Kotter stage and allyship domain must govern what's *valid* at each moment. The campaign deck is the source of truth for "what the campaign needs." The hexagram is the *oracle* that interprets which of those needs the player should engage. The 8 portals could be 8 Kotter stages, or 8 domain-weighted options — the Regent wants a clear rule: "At stage N, domain D, the 8 portals are X."

**Shaman**: The Wake Up move is the most interesting — it's the threshold between "what exists" and "what emerges." "Extend the path" = creation. "Open another option in the room" = revelation. Both are Wake Up. The Shaman would ask: does the player *choose* which (extend vs reveal), or does the system decide based on context?

**Diplomat**: The campaign deck needs a relational definition. Who speaks for the campaign? The instance? The campaign owner? The collective of players? The hexagram translates *their* needs into something the player can act on. The Diplomat wants to ensure the player doesn't feel like they're being pushed — they're being *invited* into alignment.

**Sage**: The whole system is a map of meaning. The lobby is the center of awareness. The 8 portals are the directions the campaign can go. The 4 moves are the ways a player can *participate* in that movement. The Sage would ask: when a player completes a path (or a leg of it), does the map change for *everyone*, or only for them? Is this a shared world or a personal one?

---

## Clarified Vision (Your Answers)

### 1. The 8 Portals

- **8 hexagrams are cast from the I Ching** → then **campaign allyship domain + current Kotter stage** are applied to each hexagram → producing **8 quest portals** that give players the ability to choose their own adventure.
- **Player sees 8 options at once** — 8 distinct paths from the lobby.
- Flow: Cast 8 hexagrams → contextualize each with (domain, Kotter stage) → 8 portals = 8 CYOA entry points.

### 2. The Lobby

- **Campaign-specific lobby** — not the global `/lobby`, not a spatial world room (yet).
- **8 distinct paths** for now (not literal compass directions).

### 3. The 4 Moves

- **4 moves only at branch nodes** — not at every node; only where paths diverge.
- **Grow Up** → CYOA path where the branch is the **6 faces** of the Game Masters (Shaman, Challenger, Regent, Architect, Diplomat, Sage). One adventure with multiple branches; probably has core 4 moves at branch nodes too.
- **Clean Up** → Links to Emotional First Aid (from earlier).
- **Wake Up** → **Extend the path**: AI agents OR admin create the room. The room = new set of paths aligned with the player's desires. Player does 321 + unpacking questions; paths emerge responsively to player needs.
- **Show Up** → Completion leads **back to the lobby**.

### 4. Campaign Deck & Hexagram

- **Campaign deck** = generated when a new campaign is made. A bunch of **BAR seeds** that can be turned into quests via player engagement.
- **Hexagram interpretation**:
  - **Flavor** — narrative tone for the portal/path
  - **Path suggestion** — via the lines (changing lines suggest which paths to take)
  - **Resolution** — interpreting the result as a function of what the hexagram *changes to* (transformed hexagram)

### 5. Terminology (Canonical)

| Term | Definition |
|------|-------------|
| **Portal** | Takes someone into free-play choose-your-own-adventure |
| **Room** | A place where choices can be made; where branched paths diverge and converge |
| **Path** | The place in between rooms and the lobby |
| **Branch** | A path that moves off of a room |

### 6. Schools

- **Schools** = Game Master faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage), **separate from nations**.
- **School adventure** = one adventure with multiple branches (6 faces); probably has core 4 moves at branch nodes as well.

---

## Structural Model (Architect Synthesis)

```
                    LOBBY (campaign-specific)
                           |
         +-----------------+-----------------+
         |                 |                 |
    [Portal 1]        [Portal 2]  ...    [Portal 8]
    (Hex 1)           (Hex 2)            (Hex 8)
    Kotter-aligned    Kotter-aligned     Kotter-aligned
         |                 |                 |
    [Path] ──► [Room: branch node] ◄── [Path]
                    |
        +-----------+-----------+-----------+
        |           |           |           |
    Wake Up    Clean Up    Grow Up     Show Up
        |           |           |           |
   [New room]   [EFA]    [6-face CYOA]  [→ Lobby]
   (AI/admin)   quest    (schools)
   (321+unpack)
```

**Flow**: Lobby → Path → Room (branch node) → 4 moves. Grow Up → schools CYOA. Wake Up → 321 + unpacking → new room with responsive paths. Show Up → return to lobby.

---

## Next Steps

1. ~~Your answers~~ ✓
2. ~~Refined terminology~~ ✓
3. **Spec draft** — lobby-centric path map with: campaign deck (BAR seeds), 8 hexagram portals (Kotter-aligned), branch nodes with 4 moves, Wake Up → 321 + AI/admin room generation, Grow Up → 6-face schools adventure.
