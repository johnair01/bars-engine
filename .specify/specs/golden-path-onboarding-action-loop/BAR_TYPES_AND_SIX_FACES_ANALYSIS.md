# BAR Types and the Six-Faces Frame — Broader Analysis

**Purpose**: BAR is a data type. Hexagram is one kind of BAR. The game is a function of what kinds of BARs can be created. With the six-faces-as-levels frame, what new BAR types become possible—and how do quests, daemons, talismans, campaigns, and characters express as BARs?

---

## BAR as Data Type

From FOUNDATIONS: *"A BAR is a kernel. A kernel is a compressed unit of potential: small enough to carry, rich enough to bloom. A BAR can become: a quest, a rule, a piece of lore, a design decision, a feature spec, an implementation plan, a community norm, a forked branch of reality."*

**BAR = kernel.** The type system is: what does this kernel bloom into? What is its primary manifestation?

| BAR kind | Current schema | Bloom / manifestation |
|----------|----------------|------------------------|
| **Hexagram** | `Bar` (id 1–64) | Canonical I Ching reading; quest cast; PlayerBar acquisition |
| **Quest** | `CustomBar` type=quest/vibe/onboarding | Completable; vibeulons; completion effects |
| **Daemon** | `Daemon` (separate model) | Summonable; has moves; not currently a BAR |
| **Talisman** | `BlessedObjectEarned` | Earned from inner work; not currently a BAR |
| **Campaign** | `Instance` | Container; has narrativeKernel; not currently a BAR |
| **Character** | `Nation` + `Archetype` | Identity; not currently a BAR |

**Gap**: Daemon, Talisman, Campaign, Character are not modeled as BARs. They are adjacent types. The question: should they be BARs, or should they *reference* BARs as their kernel?

---

## Two Design Stances

### Stance A: BAR as Kernel, Others as Blooms

Everything that can be created *has* a BAR kernel. The BAR is the seed; the bloom is the runtime object.

- **Quest** = CustomBar. The BAR *is* the quest. ✓ (already)
- **Daemon** = Daemon model, but `sourceBarId` links to the BAR that spawned it. Daemon is a bloom from a BAR.
- **Talisman** = BlessedObjectEarned, but `sourceBarId` or `kernelBarId` links to the BAR that earned it. Talisman is a bloom from a BAR.
- **Campaign** = Instance has `narrativeKernel` (text). Could be `kernelBarId` → BAR. Campaign is a bloom from a BAR.
- **Character** = Nation + Archetype. Could have `identityBarId` — a BAR that encodes "who you are." Character is a bloom from a BAR.

### Stance B: BAR as One of Several Kernel Types

BAR (hexagram, quest) is one kernel type. Daemon, Talisman, Campaign, Character are *other* kernel types. They share the same developmental grammar (six faces) but are not BARs.

- **Quest** = BAR (CustomBar)
- **Daemon** = Daemon (its own kernel)
- **Talisman** = BlessedObject (its own kernel)
- **Campaign** = Instance (its own kernel)
- **Character** = Nation + Archetype (its own kernel)

**Recommendation**: Stance A. The game is richer when everything that can be created traces back to a BAR. BAR is the universal kernel. Daemon, Talisman, Campaign, Character are *blooms*—runtime manifestations of a BAR.

---

## What Kinds of BARs Can Be Created (With Six-Faces Frame)

### 1. Quest BARs

**Current**: CustomBar with type quest/vibe/onboarding. Can have hexagramId, completionEffects, campaignRef.

**With six faces**:
- **Orientation quest BAR** — Face-keyed. Nation L1 = Shaman quest BAR. Archetype L1 = Shaman quest BAR. Player L1 = Shaman quest BAR.
- **Campaign quest BAR** — Face-keyed per Kotter stage or per campaign phase.
- **Daemon-spawned quest BAR** — Quest created by a daemon; daemon has a BAR kernel.

**Creatable now**: Orientation quests (6 per dimension). Campaign quests with face metadata. Quest BARs that unlock on face completion.

---

### 2. Daemon BARs

**Current**: Daemon is a separate model. Source: 321_wake_up, school. Has channel, altitude, moveIds.

**As BAR**: A daemon could be *spawned from* a BAR. The BAR is the daemon's constitution—its channel, its mission, its face. Completing a 321 session or school quest creates a BAR; that BAR blooms into a Daemon.

**With six faces**:
- **Daemon kernel BAR** — Each daemon has a source BAR. The BAR encodes: face (1–6), channel, altitude. Daemon level = face depth.
- **Daemon creation quest** — "Wake a daemon" = complete a quest that creates a BAR, which blooms into a Daemon.

**Creatable now**: Daemon-spawning quest BARs. BAR → Daemon pipeline. Daemon level = face of source BAR.

---

### 3. Talisman BARs

**Current**: BlessedObjectEarned. Source: efa, 321, stage_talisman, campaign_completion, personal. No BAR link.

**As BAR**: A talisman could be *earned from* a BAR. Completing inner work (EFA, 321, quest at stage) creates or unlocks a BAR; that BAR is the talisman's kernel. The talisman is the bloom—the thing you carry.

**With six faces**:
- **Talisman kernel BAR** — Each talisman has a source BAR. The BAR encodes: face (1–6), stage, provenance. Talisman "level" = face of source BAR.
- **Stage talisman** — Kotter stage 1–8 could map to faces 1–6 (or 8 talismans per campaign). Each stage talisman = BAR.

**Creatable now**: Talisman-earning quest BARs. BAR → BlessedObjectEarned pipeline. Talisman face = face of source BAR.

---

### 4. Campaign BARs

**Current**: Instance. Has narrativeKernel (text), targetDescription, campaignRef. BarDeck links Instance to cards (hexagrams).

**As BAR**: A campaign could have a *kernel BAR*. The narrativeKernel could be a BAR—the campaign's constitution, its story, its face. The Instance is the bloom—the runtime container.

**With six faces**:
- **Campaign kernel BAR** — Instance has kernelBarId → BAR. The BAR encodes: campaign story, face (which face the campaign embodies), allyship domain.
- **Campaign phase BAR** — Campaign progresses through faces. Phase 1 = Shaman (threshold). Phase 6 = Sage (integration). Each phase could have a BAR.

**Creatable now**: Campaign BARs as narrative kernels. Instance.kernelBarId. Campaign phase = face.

---

### 5. Character BARs

**Current**: Nation + Archetype. Player has nationId, archetypeId. Identity.

**As BAR**: A character could have an *identity BAR*. The BAR encodes: nation, archetype, face depth. Nation level 1–6 = 6 BARs (one per face). Archetype level 1–6 = 6 BARs.

**With six faces**:
- **Nation orientation BAR** — 6 BARs per nation (Shaman through Sage). Completing Nation L1 = acquiring Nation Shaman BAR.
- **Archetype orientation BAR** — 6 BARs per archetype. Completing Archetype L1 = acquiring Archetype Shaman BAR.
- **Character BAR** — Composite: nation + archetype + player face. The "who you are" kernel.

**Creatable now**: Nation BARs (6 per nation). Archetype BARs (6 per archetype). Character = sum of acquired nation + archetype BARs.

---

## The Game as a Function of BAR Types

**The game** = what BARs can be created, acquired, and bloomed.

| BAR type | Created by | Acquired by | Blooms into |
|----------|------------|-------------|-------------|
| **Quest** | Admin, player, daemon, campaign | Picking up, completing | Vibeulons, completion effects, next BARs |
| **Hexagram** | Canonical (64) | Cast, orientation, PlayerBar | Quest reading, level token |
| **Daemon kernel** | 321, school quest | Completing spawn quest | Daemon (summonable) |
| **Talisman kernel** | EFA, 321, stage quest | Completing inner work | BlessedObjectEarned (carryable) |
| **Campaign kernel** | Admin, fork | Joining campaign | Instance (playable) |
| **Character kernel** | Orientation quest | Completing nation/archetype face | Nation level, Archetype level |

**With six faces**: Every BAR type can be face-keyed. Face 1 = Shaman. Face 6 = Sage. Level = face. Depth = face progression.

---

## What Becomes Creatable Now

### Immediate (schema-light)

1. **Orientation quest BARs** — 6 per dimension (nation, archetype, player). Face-keyed. hexagramId = FACE_CANONICAL_HEXAGRAM[face].
2. **Quest BARs with face metadata** — CustomBar.face (1–6) or CustomBar.gmFace. Filter, sort, gate by face.
3. **Talisman from BAR** — BlessedObjectEarned.sourceBarId. When earning a talisman, link to the BAR that generated it.
4. **Daemon from BAR** — Daemon.sourceBarId. When spawning a daemon, link to the BAR that generated it.

### Medium (schema addition)

5. **Instance.kernelBarId** — Campaign has a kernel BAR. narrativeKernel could be BAR id or BAR content.
6. **PlayerNationFaceProgress** / **PlayerArchetypeFaceProgress** — Track face completion. Each completion = BAR acquired (PlayerBar or equivalent).

### Larger (new BAR types)

7. **Daemon as BAR** — Daemon could be a CustomBar with type=daemon. Same kernel logic; different bloom behavior.
8. **Talisman as BAR** — BlessedObject could reference a BAR. The BAR is the talisman's definition; the earned instance is the player's copy.
9. **Campaign as BAR** — Instance could reference a BAR as its constitution. Campaign fork = BAR fork.

---

## Summary: The Game Function

**The game** = f(BAR types, six faces, creation pipelines).

- **BAR types**: Quest, Hexagram, Daemon kernel, Talisman kernel, Campaign kernel, Character kernel.
- **Six faces**: Shaman, Regent, Challenger, Architect, Diplomat, Sage. Each BAR type can be face-keyed.
- **Creation pipelines**: Quest → completion → BAR acquired → bloom (daemon, talisman, level up).

**What we can create now**:
- Face-keyed orientation quests (nation, archetype, player)
- Face-keyed campaign quests
- BAR → Daemon pipeline (daemon has source BAR)
- BAR → Talisman pipeline (talisman has source BAR)
- Campaign kernel BAR (Instance references BAR)
- Character depth BARs (6 per nation, 6 per archetype)

The six-faces frame doesn't add new BAR types. It adds a **dimension** (face/level) to every BAR type. Every BAR can now answer: *Which face does this embody? Which level does completing it unlock?*
