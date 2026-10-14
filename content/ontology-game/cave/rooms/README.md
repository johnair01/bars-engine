# Rooms from a written description

A cave room can start as a paragraph: a description Wendell gets from ChatGPT, or writes himself. The words are concept
only, like ChatGPT pictures (`cs-chatgpt-ai-art`): every piece is rebuilt here from our own scripts or CC0 models.

First proof, 14 October 2026: `listening-room/`. Renders and the before/after sheet are in the project files,
`3d-build/room-from-text-2026-10-14/`.

## The four steps

1. **The description.** Plain prose, one room. `listening-room/description.md` is a stand-in written in ChatGPT's
   style; a real one replaces it. A description comes in through the Cave studio inbox like any other ChatGPT file
   (`cs-chatgpt-by-drive`). The prompt below gets ChatGPT to write the kind that translates well.
2. **The spec.** Claude reads the description and writes `room.json` by the rules below. The spec is plain JSON, so it
   can also be written or edited by hand, with no model at all.
3. **The build.** `room.py` turns the spec into a room in Blender:

   ```bash
   /home/user/blenv/bin/python content/ontology-game/cave/rooms/room.py content/ontology-game/cave/rooms/listening-room/room.json
   ```

   It writes `room.glb`, `report.json` and six renders (the bare shell and the dressed room, each from the door, from
   the far end and from above) to `/tmp/blender-cloud/rooms/<id>`. Setup is in `tools/blender-cloud/README.md`; a
   BlenderKit model needs the network the first time it is fetched. The first build took about two minutes.
4. **The look.** Open the renders before anything else. `report.json` lists every part with the words it came from,
   its source, licence and face count, what the description had that no model can carry, and any check it missed.

## Rules for writing a spec from a description

- **Every part quotes its words.** Each opening and object (`things` in the spec) has `says`, the phrase it came from. Anything in the
  description that no model can carry (a smell, a sound, an action, a mood) goes in `left_out` with what the page could do
  with it instead. Nothing is silently dropped.
- **Sizes become metres.** A pace is 0.75 m; "almost touch the ceiling" is about 2.6 m. The room's centre on the
  floor is 0, 0, 0, x runs to the right as you come in and y runs away from the door.
- **Sources, in this order.** Our own work first: a kit piece (`kit`, from `cave-kit.glb`), roots or mushrooms
  (`procgen`), or a builder in `objects.py` (`script`). Then the greenery picks already exported (`local`). Then a
  BlenderKit model, CC0 only, pinned by query, result number and id (`blenderkit`), so a changed search result stops
  the build instead of swapping the model.
- **Doors are openings.** An opening is cut from the wall at an angle (0 is the far end, 180 the door you came in by),
  with an optional stone frame and an optional fill such as a door model. An unfilled one reads as a way on.
- **Lights come from the description.** An object that gives light gets a `light`. A fill light is allowed only with a
  `why`.

## The prompt for ChatGPT

Sizes are given in player heights, because the cave's walking figure is 3.6 units tall (`AVATAR_H` in `cave.js`), not a
real person's 1.7 m. A description in metres or paces comes out at the wrong scale; one in player heights scales to
whatever the figure is. The table after the prose is what the spec is built from; the prose carries the mood.

> I'm designing one room for a small 3D walking game, seen on a phone. The player is a small faceless figure; use the
> player's height as the unit for every size and distance ("2 player heights wide"). The player walks freely, so leave
> clear walking lanes at least 1.5 player heights wide between everything.
>
> The room is [WHAT THE ROOM IS FOR, e.g. "the place where the player meets the six game masters, one at each of six
> doors"]. Give it one focal point the eye goes to on entering, and 3 to 5 spots the player walks to, each at least 3
> player heights from the next.
>
> Write two parts.
>
> 1. One paragraph of 120 to 200 words describing what the player sees on entering: shape, ceiling, floor and walls,
>    light, and mood. No people, creatures or written words.
> 2. A layout table. Put the room's centre at 0, 0; x runs to the right as you enter, y runs away from the entrance.
>    One row per item, with columns: item, x, y (in player heights), width, depth, height (in player heights), what
>    it's made of, gives light (yes/no and colour), and why it's there. Include the room's overall width, length and
>    ceiling height, every door or opening (which wall, how wide, how tall), and the spots the player walks to.
>    Keep it to 12 items or fewer, each simple enough to model.

## What the first proof found

- The whole path runs: 17 parts from one paragraph, every check passed (on the floor or hung below the dome, inside
  the walls), 1.65 MB GLB, 53,000 triangles.
- BlenderKit gave the door, the two stone lanterns, the table and the paper lantern, all CC0 and Poly Haven or
  Davide Tirindelli. Our pipeline gave the roots, the mushrooms, the cushions and the pool; the greenery picks gave the
  boulder and the fern.
- The door came out pale, where the words say dark wood with iron bands. BlenderKit's glTF of this door carries grey
  colour maps (every pixel has equal red, green and blue; one leaf averages 87% white), so the wood colour is lost
  before it reaches us. A spec could tint a model (not built yet), or the search could try the next door.
- The pool reads as a teal rug from above. The kit's pool is a flat disc; a still pool needs a reflective surface or
  a darker one.
- The GLB's walls and floor lose their stone pattern: `chamber.py` bakes the pattern to JPEGs and `room.py` does not
  yet. The renders show the pattern because Blender draws it live.
- The room is too heavy for the phone as it stands. The mushroom drift alone is 10,000 faces; the 3 MB cave budget
  needs a face budget per procgen part.

## The WAVE test room (14 October 2026)

`wave-room/` is built from Wendell's ChatGPT concept picture (Cave studio inbox, `quiet_cave_room_concept.png`; the
picture stays in Drive, as concept only). The spec is read off the picture by eye, with the figure in it as one player
height, and written in player heights (`"units": "player_heights"`, `player_height_m` 1.7). `room.py` turns every size
and position into metres, and light power by the square.

Added for it: `tint` (the castle door's grey colour maps take the wood colour), an `arch` frame from the kit's portal
arch, `bench`, `block` and `ring` builders, our own GLBs as a source (the body map's figure stands in for scale), lights
of their own in the spec, and `views` for a camera at the player's eye that sees the dome. Concept and build side by
side: `3d-build/wave-room-test-2026-10-14/concept-vs-built.png` in the project files.

The layout carries over: the door and its lantern, the seat facing it, the ring where the charge stops, crystals round
the wall, boulders at the edge. What the picture has and the build lacked: walls of big rock forms with hollows for the
crystals, moss in the cracks, the warm glow across the whole dome, and a pointed arch.

**Rock walls and hollows (14 October, later).** A shell can now take `rock` (count, size and depth of the rounded rock
faces the wall is made of; the largest face wins at each point, and the seams between faces stay sharp, so they read as
cracks) and `hollows` (arched recesses at an angle and height, each with a flat floor). A thing with `hollow` stands
on that hollow's floor, set back into it; a light with `hollow` sits at its mouth. Rock stays clear of doors and
hollows. The WAVE room's crystals now sit in four hollows. Before and after: `3d-build/wave-room-test-2026-10-14/rock-walls.png`.
Still to do: the hollows' edges step with the wall grid, the rock has no surface pattern or moss, and the dome is plain.
