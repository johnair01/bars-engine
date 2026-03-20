---
description: Trust decomposition into Capability, Integrity, Benevolence — and how trust relates to emotional alchemy channels
---

# Trust Framework

Trust is **not an emotion**. It is a cognitive assessment that can be *inflected* with any of the five emotional alchemy channels. A player can feel fear toward someone they distrust on Capability grounds. They can feel anger toward someone they distrust on Integrity grounds. The channel names the feeling; trust names the structural assessment underneath it.

## The Three Components

| Component | Question | Failure mode |
|---|---|---|
| **Capability** | Can I do this? / Can they do this? | Incompetence, untested skill, overconfidence |
| **Integrity** | Will I do this? / Will they do this? | Broken commitments, gap between words and actions |
| **Benevolence** | Am I good? / Are they good? | Self-interest over shared interest, exploitation |

A player (or daemon, or NPC) can be high on one axis and low on another:
- High Capability + Low Integrity = skilled but unreliable
- High Integrity + Low Benevolence = consistent but self-serving
- High Benevolence + Low Capability = well-meaning but ineffective

## Trust and Emotional Channels

Because trust is structural, not emotional, it can pair with any emotional channel:

| Feeling | What it signals | Example |
|---|---|---|
| **Fear** (Metal) | Capability uncertainty | "I don't know if I can pull this off" |
| **Anger** (Fire) | Integrity violation | "They said they would, and they didn't" |
| **Sadness** (Water) | Benevolence absence | "They don't actually care if I succeed" |
| **Joy** (Wood) | All three components felt | Trust is metabolized as delight |
| **Neutrality** (Earth) | Witnessed, held without dispatch | The Sage's relationship to trust |

## In-Game Implications

### Player ↔ Daemon trust
Daemons develop trust with the player across BigMind depth layers. A player who never completes 3-2-1s may have a Capability trust gap with their daemon (the daemon doesn't believe the player can do the work). A player who starts but abandons consistently has an Integrity gap.

### Carried Weight and Integrity
Abandoned quests are an Integrity signal — not a moral judgment, but a structural observation. The system should surface this as information, not shame. "You've carried this weight for 14 days" is a Capability or Integrity reflection prompt, not an accusation.

### NPC trust accumulation
NPCs (and eventual AI daemons) build trust assessments of players over time based on:
- BAR completions (Capability evidence)
- Quest follow-through (Integrity evidence)
- Shadow work depth (Benevolence toward self — prerequisite for benevolence toward community)

### Vibeulons and trust
Vibeulons minted from metabolizing Carried Weight are an Integrity repair artifact. The player is acknowledging the gap between what they said they'd do and what they did, and metabolizing the gap rather than ignoring it. This is the closest thing the system has to trust repair.

## Design Rule

> Do not build trust as an emotion. Build it as a structural field on relationships (Player↔NPC, Player↔Campaign, Player↔Daemon) that is assessed across three axes and then surfaces as an emotion via the alchemy routing system.

A relationship's trust score is not stored as "trusted: true" but as three separate fields — capability confidence, integrity confidence, benevolence confidence — each a continuous value updated by behavior evidence.
