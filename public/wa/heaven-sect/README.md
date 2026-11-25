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

Art: Ninja Adventure Asset Pack by Pixel-boy and AAA, CC0 (`../calrunian-dojo/src16/LICENSE-CC0.txt`).
