# Heaven Sect 2D maps (WorkAdventure)

Two design-language files drive every map here:

- `sect-base.json` is shared by all sect maps: tiles, wall colours, named pieces, plaque style, the walk rules and
  the room grammar (what an assembly hall, an Elder's circle, the dojo, the tea library, the altar and a court hold).
- `levels/<map>.json` is one level: its rooms (kind, box, doors, seats), its paved walks and its labelled exits to
  other maps. A level may override any base piece. Changing a level file redraws only that level.

`python3 gen_sect.py --level levels/heaven-sect-court.json [--seed N]` writes `<map>.tmj`, `tiles/` (including the
plaque sheet) and `<map>-render.png`. It refuses to write a map whose rooms are under the meeting-room minimum, whose
doors or walks are under the rule widths, whose seat count differs from the level, or where any seat, door or exit
cannot be reached from the start.

Rooms are meeting zones (`jitsiRoom`, `focusable`). Exits are `exitUrl` areas: the Lantern Walk exists; the Forest
Edge and the Inner Island maps are not built yet.

## The Elders and the lantern rail

No line a player reads lists the six Elders or uses any other word for them. The Steward hands a new player one lantern
from the Elder of the north-west hall (`elder-shaman`'s room); walking into that hall opens her sheet and gives the
first chore (`elder_meet` in `guide.ink`). The player's state is two `WA.player.state` keys, `elders_met` (hall ids)
and `elder_waiting` (`{hall, line}`). The level file's `rail` block draws six lanterns by the gate (`rail-<id>-dark` and
`rail-<id>-lit` layers, one `Rail <id>` area each); `guide.js` lights the ones that wait or have been met and shows a
line on standing at one. Only the first Elder's order and chore are held by the record (council `sect-elders-meet-1`);
the five dark lanterns' "lights when" lines are drafts, and nothing lights them yet. The map's hall labels still carry
role names (`Shaman Elder` ...), a second change.

## The Gate Steward (ink dialogue)

A guide stands in the Gate Court for new players. `guide.ink` holds her lines (all Claude drafts, Wendell's to edit):
a greeting, "Where am I?", "Show me the halls", "Who are the Elders?" and one knot per hall in the level file. The
generator checks that every room has a `hall_<id>` knot carrying a `# path: <id>` tag, then runs `compile_ink.mjs`,
which compiles the ink with inkjs 2.4.0 (MIT, a devDependency) to `guide.json` and copies the `ink.js` runtime beside
it. It also writes `guide-halls.json` (each hall's path layer and the pixel square its door opens on) and one hidden
tile layer per hall, `path-<id>`, a line of lanterns from the Steward to that door.

Standing in the Steward's area and pressing space opens `guide.html` beside the map. Picking a hall shows its
`path-<id>` layer and, if the box's WorkAdventure has `WA.player.moveTo`, walks the player there. `guide_visits` and
`guide_last_hall` are saved with `WA.player.state`, so a returning player is greeted by name of the last hall. Her
figure is the `pyrakanth/still-point` Woka frame drawn as a tile. `python3 gen_sect.py --lit <hall id>` draws one
path into the render for a picture.

Art: Ninja Adventure Asset Pack by Pixel-boy and AAA, CC0 (`../calrunian-dojo/src16/LICENSE-CC0.txt`).
