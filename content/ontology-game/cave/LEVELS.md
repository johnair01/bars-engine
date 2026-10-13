# The cave's levels: home, the hall of the six, their tunnels, and the centre of the self

**Draft plan, 13 October 2026.** Every choice his words or the record do not settle is marked **(choice)**; each stands
on the Council Board as a position (`lv-*` rows) unless he flips it.

Wendell, 13 October 2026:

> The Game Master Branches popping off the main loop doesn't quite make sense anymore now that we have the WAVE room, the
> ability to sit down and channel spirits which means the main loop should be a room that branches off of the game masters.
> This is 6 minigames connected to a hub. Walking the daemons through the minigames is the exploration. Branches should be
> downwind skills
>
> My vision for this is aligned with some of the hub and spoke architecture in bars-engine
>
> the idea being that one could have an issue they want to work through in allyship and then be able to walk the path of that
> issues and when tehy get blocked have the path fork toward what they need to work on
>
> so we'd need a "home base" which is the current WAVE room- there should be a door or a portal to the hub- eventually we will
> need a guide that a player can talk to and get the whole thing explained, but the doors should lead to a cave that is
> designed for the experience of each of those tunnels. They should all ultimately lead to the "center of the self" at that
> particular altitude and give people the ability to walk through a different portal to a different game master face.

An earlier ruling already points the same way. `sb-no-pass-at-daemon` (13 October, `council/callsheets/wave-room.md`): "The
room is where the journey begins: the player lets spirits in there, or starts a cave journey from there."

## The map

```text
                    HOME BASE: the WAVE room
          (the issue is named here; the guide lives here, later)
                │ the portal                      ▲ "Take it home" from anywhere
                ▼                                 │
          THE HALL OF THE SIX (the hub)  ─────────┘
     ┌──────┬──────┬──────┬──────┬──────┬──────┐
  Magenta  Red   Amber  Orange Green  Teal        six doors, one per face
     │      │      │      │      │      │
  tunnel tunnel tunnel tunnel tunnel tunnel       each a cave built for its face's minigame
     │      │      │      │      │      │         a block forks a branch toward the skill it needs,
     │      │      │      │      │      │         and the branch loops back onto the tunnel
     └──────┴──────┴──┬───┴──────┴──────┘
                      ▼
          THE CENTRE OF THE SELF (at this altitude)
     five portals to the other faces' tunnels, a way back to the hall, a way home
```

Four kinds of place, and one rule for moving between them: every move is a walk or a door, never a menu.

| Place | What it is | What the player does there | Built from |
|---|---|---|---|
| Home base | The WAVE room | Names the issue, sits with whatever turns up, keeps spirits, leaves through the portal | `openRoom` |
| The hall of the six | The hub | Chooses a door; each door shows its face and the face's question | new; the six stones and `FACES` |
| A face's tunnel | One minigame, one cave | Walks the issue through that face's game; blocks fork toward a skill | the tunnel engine (`layoutMain`, `buildTube`, `FACE_LOOK`, `CAVE_SHAPE`) |
| The centre of the self | Where every tunnel ends | Hears the issue said back with what the tunnel gave, then picks the next door | new |

## How this maps onto bars-engine's hub and spoke

`.specify/specs/campaign-hub-spoke-landing-architecture/spec.md` is the campaign version of the same shape. The cave takes
four of its rules and leaves the campaign-only ones.

| Hub and spoke (campaign) | The cave | Kept? |
|---|---|---|
| A hub with spokes | The hall of the six with six doors | yes, six in place of eight |
| A spoke must be walked to reach its landing; no teleport | A tunnel must be walked to reach the centre | yes |
| The landing is a card | The centre of the self is the landing; what the player leaves with is shown as a card | yes **(choice)** |
| An alchemy trace from hub through spoke to the next node | The issue and the charges and spirits the player carries, from home through the tunnel to the centre | yes |
| First beats: choose a move and a Game Master face | The hall's door is the face; the issue is named at home | yes |
| I Ching cast orders the spokes each period | Not used now. Later, a cast could light the door the field suggests | later |
| Vault caps and the compost modal | Not used | no |
| Persistence: session-only for short spokes (option A) | The words stay on the page, as the cave already does | yes |

## Home base: the WAVE room

The room stays as it is (`openRoom`: the seat, the door the charges come in by, the W.A.V.E. steps, the 3-2-1, up to three
creatures). It gains a portal, an issue and a place for the guide.

- **The portal.** A second arch in the room's wall, behind and to the side of the seat, glowing faintly. The charge's door
  stays the charge's door **(choice)**: what comes in comes through the door, and the player goes out through the portal, so
  each opening keeps one meaning. The portal is there from the start of a sitting; a charge worked through the whole W.A.V.E.
  comes along as a spirit (it follows, carrying its light, `carryLight`), and one still being worked stays in the room
  (Wendell, 13 October 2026: "It should only emerge once it's been engaged with").
- **The issue.** Before the portal opens the first time, the room asks for the issue: "What are you working through?" One
  line the player writes, about allyship or anything else, with "I'd rather not say" **(choice)**. It stays on the page and
  is not saved, like every other line the player writes in the cave. The issue travels: the tunnels and the centre read it
  back.
- **The guide's place.** Wendell: "eventually we will need a guide that a player can talk to and get the whole thing
  explained". The guide stands in the home room, beside the portal **(choice)**, so the explanation comes before the hall.
  Not in the first slices; the spot is kept clear.

The front page's two buttons become one way in: the body map opens the room (it already can), and the cave is reached from
the room. "Take it home" from a daemon in any tunnel still carries the charge to the room, and "Back to the lantern"
returns to the tunnel where it was left.

## The hall of the six (the hub)

A round chamber of the J1 stone, wider and taller than any tunnel, with six doors spaced round its wall and the portal
home behind the player as they enter.

- Each door wears its face: its stone beside it in the face's colour (`FACES`), its arch lit in the face's light
  (`FACE_LOOK`), and its question on the stone when the player comes near ("What rule or tradition is this about?").
- The player walks to a door; it opens with the reveal the face branches already use (the veil, the sparks, `reveal`).
- A door already walked in this sitting keeps a small lantern in its colour **(choice)**.
- Order round the ring is the altitude order (magenta, red, amber, orange, green, teal) **(choice)**, so the hall itself
  reads as a spiral.

The six-stone Game masters' gate in the current walk retires. Its face branches become the six tunnels and its looks carry
over.

## The six tunnels

Wendell: "the doors should lead to a cave that is designed for the experience of each of those tunnels." Each tunnel is one
face's minigame and has its own cave. All six share the engine already built: one swept tube, the stone, the carried light
and fog of war, the pane and modal, the breath, the spirits that follow, Sit down here, and the daemon met the Big Mind way.
What differs per tunnel is a table row: its shape, its look, its stops and what each stop asks.

The minigames below are first sketches from each face's lens in `council/faces.yaml` **(choice: all six)**. Each will get
its own council pass before it is built; the first build slice uses none of them.

| Face (altitude) | The cave | The minigame, first sketch |
|---|---|---|
| Shaman (magenta) | Close and warm, woven with roots and glowing caps; a fire circle at the far end | Presence. The player calls in who belongs to this issue (people, ancestors, parts). Each one called comes as a spirit and walks with them. The tunnel opens as the circle fills |
| Challenger (red) | Hot, cracked, narrow; fallen stone across the way | The push. "What power are you trying to move or assert?" Stone across the path moves only on a held push timed to the breath. A daemon that holds the way is met turn by turn, the WAVE battle's form (`wave-battle.md`) |
| Regent (amber) | Carved: steps, pillars, a hall of tablets | The vow. The player names the rules at play in the issue and sorts each onto a tablet: an obligation, or a preference. A gate opens on a rule they choose to keep |
| Architect (orange) | A clear geode: crystal, lenses, straight lines of light | The mechanism. "What must be true?" The player links crystals cause to effect; a lit chain lights the way on |
| Diplomat (green) | Many alcoves with a figure in each, echoing | The voices. Each alcove holds someone the issue touches. The player stands in their place (the 3-2-1's Be it staging) and writes one line as them. Each voice heard lights its alcove |
| Sage (teal) | Wide and moving, water and mycelium running through | The pattern. The player follows the flow and sees where it feeds the other five tunnels; the issue is read back from each face's side |

Wendell: "Walking the daemons through the minigames is the exploration." The spirits the player brings from home, and any
daemon met and thanked on the way, walk with them through the tunnel and carry their light, so the lit circle grows with
what they bring (this is built: `followSpirits`, `carryLight`). A tunnel can ask something of a spirit that walks with
the player **(choice)**: the Shaman's circle counts them, the Challenger's push is stronger with them, the Diplomat's alcoves
can hold them.

## Branches are the skills downstream

Wendell: "Branches should be downwind skills"; "when they get blocked have the path fork toward what they need to work on."
A branch no longer belongs to a face. It belongs to a skill, and which skill it opens toward depends on what blocked the
player. The fork mechanics are already built (the opening ahead, the loop that leaves forward and comes back onto the same
spot, nesting, the daemon wall); what changes is how a branch is chosen and dressed.

| What blocked the player | The branch opens toward | Built as |
|---|---|---|
| A feeling too loud to walk with | Sitting with it: the W.A.V.E. in place | Sit down here (`sitDown`, `ROOM_STEPS`) |
| A daemon in the way | Meeting it: its permission, its place, its questions | the Big Mind way (`meet`, `meetCard`) |
| A daemon that will not step aside | Talking with it: the 3-2-1 | `talk321` in the staged scene |
| A charge too big for here | Going home with it | Take it home (`takeHome`) to the room |
| No element to work with | The pool: naming the element, its clean up move | the pool stop (`setElementOn`) |
| Not knowing what blocks | The question the face asks, in the face's words | the face's question (`precisionQuestions`) |

Each branch is a loop that comes back onto the exact spot it left from, as now. The skills are the same in every tunnel;
each tunnel dresses them in its own look **(choice)**, so a sit-down in the red tunnel is hot and one in the teal tunnel
moves. A skill branch walked often enough could later be practised on its own from home; not in these slices.

## The centre of the self

Wendell: "They should all ultimately lead to the 'center of the self' at that particular altitude and give people the
ability to walk through a different portal to a different game master face."

- **One chamber, worn by the altitude the player came by** **(choice)**. Each tunnel ends in the same round chamber: a still
  pool at its middle and six portals round it, matching the hall. Arriving from the amber tunnel, the chamber is amber: its
  light, its stone, its fog. It is the centre of the self seen from that altitude. The other reading, a separate centre for
  each of the player's own levels of development stacked as floors, is kept for later: the bars-engine spec already talks of
  "multi-floor growth", and the six-door hall would repeat on each floor.
- **What happens there.** The pool says the issue back, with what the tunnel gave: the move, the rule kept, the voices
  heard, the spirits met. This is the landing, shown as a card the player can keep for the sitting **(choice)**.
- **The portals.** The five other faces' portals glow; each leads into the start of its tunnel, so the player goes from
  centre to tunnel to centre without going back through the hall. The portal of the tunnel just walked is dim. A way back
  to the hall, and a way home, are always there.

## What happens to the current walk

Today the main loop is the W.A.V.E. walk: the body map, the doorway, seven stretches, the six-stone gate with its face
branches, the pool and the daemon, the way out. Wendell: "the main loop should be a room that branches off of the game
masters."

- The W.A.V.E. moves to the places that already hold it: the room (home) and Sit down here (in any tunnel). The seven
  stretches are not walked as a level any more **(choice)**.
- The six-stone gate and its face branches become the hall and the six tunnels.
- The pool, the daemon stop and the way out become stops a tunnel can use, and the daemon met the Big Mind way stays.
- The current walk stays reachable until the hall and at least one tunnel are played on his phone, so nothing he has
  tested disappears before its replacement is in his hand **(choice)**.

## Code shape

Everything stays in `cave.js` and one page. One new table describes the level, as `STRETCHES` and `ROOM_STEPS` describe
theirs:

```js
var LEVEL = {
  home: { kind: "room", exits: { portal: "hall" } },
  hall: { kind: "hall", doors: ["magenta", "red", "amber", "orange", "green", "teal"], back: "home" },
  tunnels: { // one row per face: its cave shape, its look, its stops (the minigame), what each stop asks
    amber: { shape: "carved", look: "amber", stops: [ /* the vow */ ] }, /* ... */
  },
  centre: { kind: "hall", portals: "faces", back: ["hall", "home"], wears: "arrival" },
};
```

- **Moving between places.** One `goTo(place, from)` fades out, builds the next scene in the same renderer and fades in, as
  the dive does now. The sitting (issue, spirits, creatures, what each tunnel gave) is one object passed along.
- **Round chambers.** The hall and the centre are the same builder with different dressing: a short wide tube closed into a
  ring, with the reveal's openings for doors. `openRoom` already builds a round room from the kit's rings; it is the model.
- **A tunnel.** `layoutMain` with the tunnel's own stops in place of `STRETCHES`, dressed by `FACE_LOOK` and a
  `CAVE_SHAPE` per face. Branches use `layoutBranch` as now, chosen by the block table above.
- **Tests.** `cave-test.mjs` walks home → portal → hall → a door → its tunnel → centre → another portal → home at 390 by 844.

## Build order

1. **The walkable skeleton** (recommended first): the portal in the room, the hall with six doors, six tunnels that are
   each the current face branch made longer and dressed in the face's look and shape, ending in the face's question, and
   the centre with its portals. No minigames yet, no issue line yet. Sit down here and Take it home work inside the tunnels
   as they do now. The current walk stays reachable from the front page. **Why first:** it makes the whole shape playable on
   his phone, so he walks the topology before anyone spends a pass on six minigames, and every later slice drops into a
   place that already exists.
2. **The issue and the skill branches**: the issue line at home, read back in the tunnel and the centre; a block forks
   toward the skill by the table above.
3. **The first minigame**: one face's tunnel built for real, after its council pass. **(choice)** the Diplomat's voices,
   because it reuses the 3-2-1's staging that is already built and needs no new mechanics beyond alcoves.
4. **The centre's card** and the spirits' part in the minigames.
5. **The guide** in the home room.
6. The other five minigames, one slice each, then retiring the old walk.
