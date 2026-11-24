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

## The Oddboro office (first room: the Mote Well)

`levels/oddboro-mote-well.json` is the agent office's first level, on the same base (new room kind `mote_well`, new
pieces `mote` and `mote_well`). 40x30 tiles, a 16x15 room (interior 14x13, 30% over the 10x9 office minimum), a 3-wide
door and hall, six seats round the well, the ladder plate on the north wall, the Cloister Round as a named exit that is
not built. A level with a `walk` also writes `<map>-walk.gif`: a visitor walks in and spirits rise over the well.
The `motes` sheet is drawn by `gen_sect.py`, not taken from the pack. The well rim is a placeholder statue until the
WizardGenie tiles land (`/mnt/project-files/calrunian-dojo/round-3/`).

### The Cloister Round (second room)

`levels/oddboro-cloister.json`: new room kind `cloister` (a planted garden at the centre, a covered round about it, four
seats on the outer edge, the round's plate on the north wall). Interior 13x12, so a 15x14 box, at the scale Wendell
answered on odb-mote-well-look-3. The west exit goes back to the Mote Well; the Staff Hall exit is named, not built.
Its `walk` block has a `daemon` loop: one daemon (the walker redrawn in water-teal, with a glow under it) walks the
round once in `oddboro-cloister-walk.gif`. The walk code now works with or without a well.

### The whole office on one map (the Staff Hall, and the three rooms joined)

`levels/oddboro-office.json` puts the Mote Well, the Cloister Round and the Staff Hall on one 58x30 map along one 4-wide
hall, west to east in the order a worker climbs. Each room keeps the box and plan Wendell answered on (Mote Well
16x15, Cloister 15x14, Staff Hall 15x14 with a 13x12 inside). New room kind `staff_hall`: six named desks in two rows of
three, each person standing behind a desk, an empty desk with its chair pushed back, name plates drawn through the plaque
system, a 3-row aisle. New pieces `desk` (drawn by `gen_sect.py`, added by a level with `"sheets": {"desks": "@desks"}`
so the other maps' output does not change) and `chair`. The generator now checks that each person has
`rules.clear_round_npc` (2) squares clear round them and that every desk can be reached from the hall. The walk GIF can
start the daemon when the visitor reaches a named square (`daemon.starts_when_visitor_at`).
The standalone Staff Hall sketch (`/mnt/project-files/oddboro-office/staff-hall-1/gen_staffhall.py`) is replaced by this.
