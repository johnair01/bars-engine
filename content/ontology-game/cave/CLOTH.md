# Cloth: what we learned, and what to read before changing cloth.js

The robe's skirt is cloth every frame (`cloth.js`, the same code in the game and in Blender through
`cloth_walk.mjs`), and since round 11 its sleeves hang from spring chains in the same file. This file holds what
rounds 1 to 11 of J5 taught, so the same problems do not come back. Read it
before any change to `cloth.js`, the robe's skin weights below the belt, the leg capsules or the hem bones.

## Measure first, then look

Round 6 began with a rig, `tools/blender-cloud/tests/cloth_measure.mjs` (`cloth_walk.mjs`'s walk run in Node on the robe job
garments.py writes to `$W/cloth-jobs`, about two seconds a run). It measures:

- **float**: how far above its standing height a hem point sits while no leg is within 5 cm of it. A hem with
  nothing under it should hang at or below its standing height. Round 5: 70 mm on average at a normal stride.
  Round 6: about 4 mm.
- **back hem rise**: the 95th percentile of the back hem's rise over the walk. Round 5: 27 cm. Round 6: about 13 cm.
- **stand**: the hem's height after the figure has stood for four seconds. It must hang at or a few mm below its
  draped height.
- **bulge under the belt**: how far the cloth just below the belt strays from its skinned place. Round 5: 5.5 cm
  even standing, which hid the sash's tails. Round 6: 1.5 cm standing, 2 cm walking.
- **belt jitter**: the frame-to-frame change in the belt row's motion relative to its skinned place. J5d now checks
  it on a figure standing still.

Every number above moved only when the cause was found. Most of the knobs that look like the cause (damping, bend,
mass, air drag, sub-step rate) moved the float by a few mm. Measure before tuning. Tuning without a measure took
hours on round 6 and changed nothing.

## The causes and the fixes

**1. A leg capsule fatter than the leg holds cloth up.** Capsules are sized so 99% of the leg's points lie inside
them, plus a margin. The pelvis capsule is 14 cm round, wider than the hips. Standing, it pushed the skirt 5 cm out
from where it was draped. Fix: the pelvis capsule is a *backstop* (`backstop` in its capsule entry). It pushes a
point out no further than the point's skinned place. Chaos Cloth and APEX call this a backstop, and Unity's
`maxDistance` is the same idea.

**2. Cloth needs a place to hang toward, and that place must move with the legs.** A position-based cloth tied only
at the belt behaves like a stiff bell: once a leg has pushed it out, nothing brings it back but gravity on a
light sheet. Games fix this by keeping each cloth point within a distance of its skinned place. Unity calls it
`ClothSkinningCoefficient.maxDistance`, and Chaos calls it Max Distance, painted from 0 at the waist upward. Here it
is `blend` (0.2 times the point's distance from the belt along the cloth). Since round 9 the pull is a bounded
force (`blendK`, `blendAcc`, `blendDamp`), so a leg always wins; rounds 6 to 8 took a share of the overshoot back
each substep (`blendStiff` 0.1), which round 9 found was the hem's shake at the shins. Two conditions made it work:

- The skinned place must follow the legs. Round 5 hung the whole skirt's skin from the pelvis. A band toward a skirt
  that never moves fights every leg, and the knee came through the cloth (test J5, 120 points). Round 6 skins the
  skirt as round 4 did, with the front panel on `hemF`, the back on `hemB` and the sides on their thighs. The band
  then pulls the cloth toward a skirt that already swings.
- The skinned place must hang. Round 4's `hemB` followed the heel (`hip + 0.6 knee`), so the band held the back
  hem up behind the kicking heel (25 cm). `hemB` now follows the thigh behind (`0.9 max(hipL, hipR)`), in
  `character.py` and `cloth_walk.mjs` alike.

Rounds 6 to 8 skipped cloth on a leg or within 8 cm of one (`blendClear`); round 9 dropped that, since a bounded
force never beats a leg. The band first lifts the skinned place out of any capsule it has sunk into. A band that pulls cloth into a bending knee shows the knee through the gaps between
the cloth's points.

**3. A hem has weight.** `hemMass` 4: the hem's edge points weigh four times the cloth's, since a turned hem is
three layers. In a position-based solve the heavier end moves less when a constraint corrects, so the hem pulls the
cloth above it down instead of being pulled up (PBD's inverse-mass weighting, Müller et al. 2007). Alone it gives a
few mm. It counts once the band and the backstop are in.

**4. Damping slows the fall as much as the swing.** Round 5 damped every point's velocity by 1.2 a second. Round 6
damps by 0.3 and adds air drag across the cloth's face only (`dragQ`, `dragL`). The drag acts on motion along the
cloth's normal, relative to the body's own motion there, so a flap is slowed and a fall along the cloth is not. Air
drag on cloth is a pressure on its face, so this is the physical form. Chaos Cloth has drag and lift coefficients
on the same basis.

**5. Cloth buckles.** `compress` 0.2: an edge resists squashing at a fifth of its stretch stiffness. Real cloth has
almost no resistance to compression, which is why it folds. Choi and Ko (2002), "Stable but responsive cloth", is
the standard reference.

**6. The leg moves the cloth it pushes.** `kick` 1: the push a leg gives becomes the cloth's velocity, as an
inelastic contact should. At 0 (tried on round 6 to stop the hem being thrown) the cloth lags the leg each sub-step
and the knee comes through between its points. Leave it at 1.

## The belt

Wendell on round 5: "there’s jitteriness in the belt now". Round 6 found four causes and fixed all of them:

- **The walk's keys swung the long way round.** Blender keyed the walk with Bezier curves, and the glTF exporter
  wrote them as cubic splines whose quaternions flip sign between some keys (hips, `hemB`, both hips' joints, both
  shoulders) with tangents near 48. three.js interpolates cubic quaternion keys component by component and does not
  take the short way, so between those keys the hips and the hem bones swung and snapped back on every step. The belt
  row's skinned places jumped 3 cm from one frame to the next. The export now samples the walk at every frame and
  writes linear keys (`export_force_sampling`, `character.py`), and three.js slerps linear quaternion keys the short
  way. J5d's walking belt measure went from 132 mm to 6 mm. Blender keeps its Bezier curves: keyed linear in Blender
  too, the walk moved off the formula between keys and the slight figure's knee came through by 1 to 3 points. Blender
  never showed this, because Blender evaluates its own curves, and the Node walk (`cloth_walk.mjs`) poses by formula.
  Only a test in three.js with the exported GLB sees what the game sees. Any new animation goes through J5d or a test
  like it.
- **A point on the edge of the leg clearance buzzed.** The blend band let go of any point within `blendClear` of a
  leg and pulled every other point. A point sitting on that edge was pulled one substep and let go the next, and
  buzzed by 1.5 mm at 30 a second on a figure standing still. The pull now fades in over a second `blendClear` beyond
  the first (smoothstep), and the buzz is gone (3.4 mm to under 0.03 mm in J5d). Fading it in inside the first band
  instead let the knee through. Round 9 removed the switch: the band
  is now a bounded force that is always on.

- **The robe showed through the sash.** The robe is solidified 4 mm outward (`THICK`), and the sash's edges sat 3
  mm off the robe's inner face. At every bend the robe's outer face came through the band's edges in ragged teeth.
  The sash now sits `THICK` + 3 mm (edges) and `THICK` + 8 mm (middle) off.
- **The cloth below the belt bulged over the sash.** With no blend band and a fat pelvis capsule, the free cloth just
  under the belt stood 5 cm off the body, rose over the sash's lower edge and hid the knot's tails. The backstop and
  the band hold it to 1.5 cm standing, and the tails lie `TAIL_OFF` (2.2 cm) off the robe.

J5d (`j5_cloth.mjs`) stands a fifth figure still and fails if the belt row's motion relative to the body changes by
more than 0.2 mm from frame to frame, or by more than 10 mm (99th percentile) on a walking figure. It runs game time
at a fixed 60 frames a second. Before round 6 it used the headless browser's own frame time (about 16 a second),
where the cloth's 16 substeps covered 33 ms of a 50 ms frame, and both the jitter and the cost were wrong. Some motion at the belt while walking is the walk itself: `pose()` drops the
hips by `|sin|`, which has a corner at each footfall. That is the figure's walk, J4's, and it moves the belt with
the body.

## The cuffs, the ankles and the hem (round 7)

Wendell on round 6: "Better hems around arms and legs still a bit jittery". J5d now measures the sleeve cuffs, the
ankle ties, the hem's edge and its turned fold as **jitter**: a point's frame-to-frame change in speed (its second
difference) less the mean of that change over the five frames around it. A smooth swing, however fast, scores nothing;
a corner in the motion scores its size. Each is a pass condition, walking (99th percentile) and standing (largest).

- **The walk turned corners.** cave.js poseAvatar, which J4 baked, bends the knee by `max(0, cos)`, folds the elbow by
  `max(0, -sin)` and sinks the hips by `|sin|`. Each starts at full speed from a standstill, twice a step: the knee's
  speed jumps by 6 radians a second, which throws the ankle 45 mm off its path in one frame at 60 a second. The cuffs
  and ankles are skinned, not cloth, so this was all of their jitter. `ramp()` and `sabs()` (character.py and
  cloth_walk.mjs) round each corner over ±0.3: the slope is a smoothstep, so neither the speed nor the acceleration
  jumps. The knee keeps 3° more bend at its straightest. cave.js's own avatar still walks with the corners; the
  figures bring their own Walk to the game.
- **The clip began late.** The glTF exporter writes a key's time as frame / fps, so a walk keyed from frame 1 started
  its clip at 1/24 s, and three.js held the first pose that long at every loop: a hitch once a second. The GLB's keys
  now start at frame 0.
- **The GLB carries 60 keys a second.** One a frame at the game's 60, from `pose()` itself, made only while the GLB is
  written (Blender keeps its 24 Bezier keys for the through test). Alone, 60 keys did not help (the corners were the
  cause), but they keep the game on the formula the Node walk and the pictures use. 9 KB more per figure.
- Cuffs 29 to 1.6 mm, ankle ties 35 to 3.2 mm walking; both 0 standing.
- **The fold hung from the edge.** The turned hem (points marked 3) followed the hem's edge in a frame whose `t` pointed
  at all the edge point's neighbours. The two along the edge cancel to the hem's curve, so where the hem curved round a
  shin `t` swung between up the cloth and into the curve, and the fold, 3 cm deep, swung with it as a stiff lip. It cut
  through the cloth in the cream teeth along the hem in the round 6 pictures. Each fold point now follows the cloth
  point it lies against, so it keeps only its 6 mm off the cloth and takes the cloth's own curve: 68 to 31 mm.
- **The hem's edge meets the shins.** The edge (28 mm) and the skirt (22 mm) jitter where the shins pass through the
  cloth. Without the leg capsules both fall to about 7 mm, so it is contact, but none of contact without bounce (the
  cloth leaving a leg no faster than its surface), friction 0, a wider margin, half the kick, 960 substeps or a lighter
  hem moved it. It is the next place to look, after his look at round 7.

## The slit hem and the sleeve cuffs (round 8)

Wendell on round 7 marked five pictures ("Problem areas to fix"): flat cream bars across the hem where a slit parts,
and the cuffs as torn cream patches on the forward arm and a stiff flap with ragged cream edges below the hand.

- **A fold point anchored across a slit.** Round 7 anchored each turned-fold point (marked 3) to the nearest cloth
  point by straight distance. Beside a slit the nearest point can be on the other panel: on the average dusk robe 3
  of 80 fold points anchored 14 edges away through the mesh, across the slit, and when the slit parted they stretched
  into the cream bars he circled. The anchor is now the nearest point reachable within `anchorHops` (4) edges through
  the mesh, walking further only if none is found. All 80 then anchor within 4 edges. cloth_walk.mjs counts fold
  points whose anchor is more than 8 edges away (`fold_far` in report.json), and J5 requires 0 on every robe.
- **The sleeve end was 40 cm deep.** `CUFF_W` 0.40 made an open end 80 cm round, which hung from the wrist far below
  the hand. The sleeves are skinned to the arm, not cloth, so that hanging part swung with the forearm as a stiff flap,
  and when the arm went forward it folded over the hand, hiding the cuff band except in patches. The sleeve still
  widens toward 0.40 (`SLEEVE_W`) from the armpit, so the upper arm has the room the walking fit needs, and from the
  elbow it narrows to `CUFF_W` 0.26 at the end. The end then hangs a hand's depth below the wrist and the hand shows.
  Narrowing the whole sleeve instead (`CUFF_W` 0.26 or 0.22 along its length) let the upper arm and elbow through.
- **The cuff's corners were not sewn.** The sleeve's top and bottom seams stopped one column short of the cuff, so the
  front and back panels' corners hung apart in a ragged tongue of trim. The seams now run to the cuff's corners. The
  cuff's open edge is smoothed 60 rounds (was 25) before the trim is cut, which rounds the corner where the seams meet.

## The hem at the shins (round 9)

Wendell on round 8: "Let’s do the shins fix and then I think we’re golden." The hem's edge shook where the shins
pass (J5d walking p99: hem 28.7 mm, skirt 22, fold 34; at a fast stride 86 mm in the Node rig). Round 7 had tried
every contact option without effect, and this round found why: the shake was the blend band, not the contact.

- **Where the shake came from.** A Node rig logged, for the worst 1% of hem jitter, which solver step moved the point.
  Most of those points touched no leg; they were the slit corners and the hem beside them. The band moved them,
  and the stretch and bend constraints passed it on. A leg striding through a slit carries the corner up to 40 cm from
  its skinned place, 25 cm past the band's reach. The band let go within `blendClear` of a leg and took 10% of the
  overshoot back every substep everywhere else, so as the shin passed, the corner was caught (25 mm in one substep),
  dropped and caught again. A projection of 25 mm a substep at 480 a second is an acceleration of about 12,000 m/s2,
  switched on and off. The fade from round 6 smoothed the switch over distance, but the leg covers that distance in a
  frame or two.
- **The fix: the band is a force.** Past its reach a point is drawn back by `blendK` (400 /s2) per metre past it, at
  most `blendAcc` (80 m/s2), and its motion away from its skinned place is damped by `blendDamp` (10 /s). The pull is
  on everywhere (no `blendClear`), so nothing switches when a leg passes; a leg is a hard contact and always beats
  a bounded force. This is how Unity's and Chaos's skinning constraints are meant to be used: a soft pull toward the
  skin, never a snap. J5d walking p99: hem 28.7 to 16.8 mm, skirt 22.3 to 14.2, fold 33.7 to 20.3, belt 8.1 to 5.6.
  At a fast stride the hem went from 86 to 27 mm. The hem hangs better too: float 9.6 to -0.6 mm walking.
- **What it costs.** The back hem flies higher behind the trailing leg at a fast stride (p95 rise 8 to 18 cm, about
  the same at a normal stride). The old band hauled it down by the same yank that made the shake. If it reads too
  lively, raise `blendAcc` (it trades straight back toward the shake: at 150, the fast hem's jitter rises again).
- **The legs taper.** Each thigh and shin capsule was as wide as its widest point all the way down, so at the hem's
  height the shin's capsule stood about 1.3 cm off the ankle and the hem caught on air. Capsules now carry `rb`, the
  radius at their lower joint (garments.py, from the points in the bottom quarter): shin 6.3 to 5.3 cm, thigh 8.8 to
  7.1. It lowered the float and the standing hem's drift (18.6 to 10.8 mm) more than the jitter.
- **A fold point shook on a figure standing still.** J5d caught it once the band changed: a turned-fold point moved
  0.9 mm a frame while the cloth point it follows crept 5 microns. The follower's frame took its direction `t` from the
  sum toward all the anchor's neighbours, which cancels to almost nothing at an anchor inside the cloth (round 8's
  anchors can be), so `t` swung with every micron. `t` now points at one neighbour, chosen once at rest: 0.9 to 0.08
  mm standing, and the walking fold fell from 27 to 21 mm.
- **The figures' clip is named Walk again.** Blender 5.2's exporter names the clip of the active action
  `export_nla_strips_merged_animation_name` ("Animation" by default), so J4 failed on round 8's export; character.py
  now passes "Walk".
- **Tried and dropped.** Velocity-level contact (the cloth leaves a leg no faster than the leg's surface), friction
  relative to the leg's surface, a soft pre-contact zone, damping along the edges, a stiffer hem line and heavier
  slit corners: none moved the jitter, and the soft zone made it worse. A band that shifts the point without changing
  its speed halved the jitter but let the hem float 3 cm, the round 5 problem. 960 substeps made it worse, since
  stiffness per substep grows with the count (XPBD's compliance would fix that; not needed now).
- **How to measure.** Before guessing, log which step moves the worst points (the round 9 rig: solver phase per
  substep, per point). The worst points were not where the eye looked.

## The cuffs (round 10)

Wendell on round 9's queue: "we do still need to fix the cuffs". His round 7 marks circled the cuffs as torn cream
patches and a flap with ragged edges below the hand; round 8 shortened the flap and sewed the corners, but at rest the
cuff's edge was still a crumpled loop with a tongue hanging below the hand, and the trim cut along it came out ragged.
The sleeves are skinned, not cloth, so all of this is geometry and weights, and it stands whatever the skirt's cloth
becomes.

- **The drape crumples the sleeve's end.** The cloth solver lets the sleeve's end fall round the hand and settle in
  folds, and its open edge comes out a ragged loop. 60 rounds of smoothing along that edge (round 8) rounded the
  ripples but pulled the loop into the hand. `clean_cuffs()` now rebuilds the last `CUFF_LOFT` (10 cm) of each sleeve
  from the drape: each ring of the pattern round the forearm keeps its size and its droop, but its points are spread
  evenly round it, its radius keeps only `CUFF_HARM` (2) harmonics and its reach along the forearm only a tilt. The
  rings ease into that shape toward the edge, so the sleeve narrows into the cuff without a crease. The hem keeps its
  60 rounds; the cuffs skip them.
- **The tongue was the turned fold at the seam.** Where the cuff's ring crosses the top and bottom seams the front
  and back panels face apart, so the cloth's normal there cancels, and the turned fold (`hemmed()`) shot off along
  whatever was left: a spike below the hand. The fold also turned in toward the wearer's middle, which on the ring's
  inner side is outward. A cuff's fold now turns in toward its forearm's axis, all the way round.
- **The cuff rides the forearm.** A sleeve point took the weights of its nearest body points, which near the hand
  mixed the hand in. From the middle of the forearm on, the sleeve now blends to the forearm alone, so the ring keeps
  its shape as the arm swings.

## The sleeves (round 11)

Wendell on round 10: "Better but still bad. They are moving like solid objects and not clothes." The six-face pass
`cloth-designer1` (council, 2026-10-17; board position `cd-sleeve-springs`) named the cause: the sleeves were skinned,
so every point of them moved on the same frame as the forearm, and uniform motion is what makes cloth read as stiff
(Bi, Jin, Nienborg and Xiao, Journal of Vision 2019). Stylized games give sleeves and sashes spring bones.

- **Three spring chains per sleeve** (`cloth.js`, the `spring*` options). Each runs from 40% down the forearm
  (`springFrom`) to the sleeve's end, with joints at its root, its middle and its end, evenly round the sleeve. A
  joint is the middle of the four sleeve points nearest it, so where the arm would hold it comes from the same skinned
  points the robe already has, and the GLB needs no new bones. Each joint is a damped spring (`springHz` 1.0,
  `springZeta` 0.7) toward where the arm would hold it, hung from the joint before it, so the delay grows toward the
  free edge, and the sleeve swings past and settles after the arm stops. The joints of each ring keep their distances,
  and the sleeve between two rings moves with their rigid turn and shift blended, so each cross-section, the round 10
  cuff ring above all, keeps its shape and tilts and swings whole. Plain JavaScript in `cloth.js`, so the game, the
  Node walk and J5d run the same springs; `three-vrm-springbone` needs three.js and a VRM's nodes, and the Node walk
  has neither.
- **The hand is inside the cuff, and it decides how far the cuff can trail.** Left free, the chains trail the forearm
  by 6 frames with a coherence of 0.68 (T1's target), and the hand passes 6 cm through the cuff. Two limits keep it
  out, both smooth, because J5d counts any hard stop as jitter (a hard angle clamp and a hard push off the hand made
  the cuffs 27 and 31 mm; the limit is 5):
  - a soft max distance: a link's drawn stray from where the arm holds it is `r tanh(d / r)` with `r` = `springMax`
    (0.6) times its length, and the spring stiffens as it strays (four times at `r`);
  - each sleeve point's swing toward the forearm, the hand or a leg is eased toward the gap it had there,
    `gap tanh(s / gap)`, so it never reaches the capsule (`keepOff`). The forearm and hand capsules are new in the GLB's
    extras (`arm_capsules` in garments.py, marked `arm`; the skirt does not use them).
- **The measures** (`cloth_walk.mjs` sleeves, J5d `sleeve_lag_frames` and `sleeve_coherence`): T1, the rim's lag
  behind the forearm in frames and its coherence with it (1 skinned; asks 3 to 6 frames and under 0.8); T2, `arm_mm`
  and `leg_mm`, the most a sleeve point goes into the forearm, hand or a leg past where skinning puts it, at the walk
  and at cave.js's fast swing (J5 requires 1 mm or less on every robe). Round 11 on the average robe: lag 2 frames,
  coherence 0.94 to 0.95, the rim strays up to 11 cm (95th percentile), cuff jitter 2.8 mm walking, 0 standing, and
  the springs cost about 0.16 ms a figure in Node (J5d: 2.25 ms a figure for all the cloth, round 10 1.98).
- **T1 does not pass with this cut**, and the reason is the cut: a cuff that hugs the hand cannot trail it by 3 to 6
  frames, since 4 frames behind a hand moving 1.2 m/s is 8 cm. A wider opening would let it (round 8 narrowed it
  from 0.40 to 0.26 because the skinned flap hung stiffly below the hand; with springs a wider bell would swing). A
  cut is his ruling (`cd-keep-cut`), so it goes to the board.
- **A bug the springs found.** `attach` first placed each bone's joint from the bind matrices alone, and on J5d's
  figures those joints came out shifted by the figure's own offset from the middle of the line: a figure half a metre
  to the side had its chains built on the wrong points, and its cuffs jittered 11 mm. The joints now come back through
  the bone's own skinning, the way `skin()` places points, and any figure's chains match.

## The sleeve panels (round 12)

Wendell chose `cd-sleeve-open` C, "Re-cut into panels" (2026-10-17). Below 0.3 of the forearm each sleeve's top and
bottom seams are open (`garments.py` `panels()`), so it hangs as a front and a back panel. Two ways of moving the
panels have been tried; neither is ready for his look.

- **Panels on spring chains** (`springPanels`, the default). Each panel hangs on two detuned chains and moves as the
  rigid turn and shift of its rings, as round 11's ring did. On the average dusk robe (Node walk, 2026-10-17 rerun):
  41 forearm points through at the worst key, rim strays 21 cm (95th percentile), coherence 0.64 to 0.84. A panel
  moved whole sweeps its triangles across the forearm: pushing points off the arm one by one cannot stop a triangle
  whose corners land on both sides of it.
- **Panels as cloth** (`SLEEVE_CLOTH=1 garments.py`): the panels are marked cloth like the skirt below the belt, so the
  cuff's edge becomes a weighted hem (2) and its turned trim followers (3), and the forearm and hand capsules collide
  with the sleeve's cloth only (`slvIdx`). The mitten hand is flatter than its 6 cm capsule and the cuff hugs it (176
  cuff points start inside it), so an arm capsule keeps a point no nearer than its skinned place, the backstop rule
  (`collide`), and the blend band ignores arm capsules. `armBlend` sets the panels' reach (`armLen` makes it grow
  faster toward the cuff). Through on the average robe: 11 at the worst key at `armBlend` 0.5, 2 at 0.3, 23 at 0.8;
  the remaining points sit at the elbow, where the bending forearm meets the panels' tops. T1 trades against it: at
  0.3 the rim lags 0 frames, coherence 0.94; at 0.6 with `armLen` 0.12 it lags 4, coherence 0.83 walking and 0.69
  fast, but the rim strays 28 to 43 cm. In the browser clip the panels fall in toward the forearm and bunch, the
  forearm shows bare between them and the cuff trim hangs below the hand in spikes. Cost: about 3.4 ms a step in Node
  for the whole robe (the skirt alone about 2.3).
- **What T1 asks may be out of reach for a short panel.** A cloth pendulum 15 cm long swings at about 1.3 Hz, above the
  walk's 1 Hz arm swing, so it follows the arm in phase: coherence stays near 0.9 unless the band lets it fly.
- The rim jitter cloth_walk.mjs prints (about 55 mm walking, both ways) is not J5d's: it spans the frames the walk cuts
  short at each sample. J5d's cuff measure in the browser is the one to trust.

### Round 12, third pass: why the forearm shows bare (2026-10-17)

- **Look in the close clip, not the Node numbers.** `j5_clip.mjs` with `VIEW=side DIST=1.6 LOOK_Y=0.85 WALK=3 STAND=1`
  shows the sleeves at hand size; the default camera hides what goes wrong. The Node walk's own measures stayed clean
  while the clip was wrong: no panel point fell in toward the arm (`fall_in`, the share nearer the arm's line than 0.6
  of its skinned gap: 0), no cuff trim turned over (`trim_spike`: 0), and the panels kept their width and area.
- **The cause.** Each cloth sleeve drifts off its forearm as a whole, toward the body and back: mean offset from the
  skinned place 5 cm inward on the left sleeve and 11 cm back on the right (Node probe of `CaveCloth.attach` on the
  GLB, `/mnt/project-files/3d-build/j5-panels-r12c-2026-10-17/probe.mjs`). Every point stays outside the arm's
  capsules, but the triangles between them cross the forearm, so the forearm shows through the sleeve from elbow to
  wrist and only the trim ring is seen, trailing the hand. J5's through test lets a forearm show between the two panels
  (garments.py, round 12), so it reads 0 at every key while the whole forearm is out.
- **Tried, all off by default, none fixes it:** `armBend` 0.6 and `armCompress` 1 (stiffer panels), `armGap` 0.8 (a
  panel point keeps 0.8 of its skinned gap from the arm's line), `seamOpen`/`seamFrom` (the opened seams as slits held
  to 0.3 to 6 cm, even held shut). `armEdges` (`edgeCollide`: each panel edge pushed off the forearm and hand capsules)
  made it worse: it pushes the sleeve off the arm from the elbow down, because near the elbow the capsules are fatter
  than the sleeve that hugs the arm (the reason the point backstop exists). With `armEdges` and slits the walk's T1
  coherence first went under 0.8 (0.797 walking, 0.64 fast), for a sleeve that no longer covers the arm.
- **The backstop on edges covers the forearm again.** `edgeCollide` now keeps the point backstop (an edge pushed no
  further out than its skinned place). With `{"armEdges": true, "seamOpen": [0.003, 0.05], "seamFrom": 0.5}` the
  close clip shows the sleeve covering the forearm to the wrist, the hand coming out of it and the trim trailing
  (`edges-backstop-close.jpg` and `-slow.mp4` in the folder below). Node walk: rim swing 65 mm walking and 104 fast,
  arm 0.2 mm (T2), the panels out of step with each other (sync 0.36 and 0.41), but coherence 0.93 and lag 0 (T1
  fails, as the 1.3 Hz finding above predicts). Cost 4.9 ms a step in Node for the whole robe, against 3.4 without.
- **Next:** make those options the cloth sleeve's defaults, check J5d's cost line in the browser, the robe under
  150 KB, T1's line as a board position, then the clip against round 11 and Wendell's look. Pictures:
  `/mnt/project-files/3d-build/j5-panels-r12c-2026-10-17/`.

### Round 12, the defaults (2026-10-17)

The cloth panels are now the sleeves: `garments.py` marks them cloth unless `SLEEVE_CLOTH=0`, and cloth.js runs them
with `armEdges` on and the opened seams as slits (`seamOpen` [0.003, 0.05], `seamFrom` 0.5). On the average dusk robe
the springs leave 17 forearm points through at the walk (J5 fails) and the cloth panels none.

- Size: the cloth panels put the robe at 156,436 bytes. Each point's colour is now written as four bytes instead of
  four 16-bit numbers (`colours_as_bytes`, after `tidy_nodes`): 147,452 bytes, under the 150 KB line.
- Cost (J5d, four figures, the same cloud runner): springs 2.65 ms a figure, cloth panels 5.5, 4.85 to 5.0 once
  `edgeCollide` skips edges outside each capsule's box. Running the edges every other substep saved 0.6 ms more and
  made the cuff shake 15.5 mm; it was undone. J5d's line for a robe with cloth sleeves is 5.5 ms and the cloth cuff's
  walking shake 12 mm (10.7 measured); board position `cd-panel-cost`, and his phone judges the frame rate.
- J5d's page counted the cloth sleeves as the skirt's belt row (42 mm walking); it now leaves sleeve points out of the
  belt, skirt, hem and fold groups, and its largest-of with a spread no longer overflows on the longer arrays.
- T1 is reported, not gated (board position `cd-panel-t1-eye`): the panels read lag 0, coherence 0.91 in the browser.
- Still open: in the close clip against round 11 (`VIEW=side DIST=1.6 LOOK_Y=0.85`, project files
  `3d-build/j5-panels-r12d-2026-10-17/`) the near forearm shows bare from elbow to wrist mid-swing, the panels trailing
  behind it, with f0d3875's cloth.js too. Tighter leashes make it no better (`armBlend` 0.3 and 0.15 leave the whole
  forearm bare), so the panels' leash target itself may sit off the forearm: check the sleeve points' skinned targets
  (`c.tgt`) against the drawn skinned sleeve before tuning anything else. Edge collision only covers edges; a forearm
  capsule can also pass through a panel's face.

### Round 13: why the forearm showed bare, and the fix (2026-10-17)

- **The targets were right.** The sleeve points' skinned places (`c.tgt`) cover the forearm: rays out from the
  forearm's line between 0.35 and 0.95 of its length meet the skinned sleeve 98 to 100% of the time. The cloth met them
  67% of the time at the walk, and still under 80% with a leash 50 times tighter (`blendK` 20000, `blendAcc` 2000,
  `armBlend` 0.05), so the leash was never the cause. Standing still, the cloth covered 88 to 94%.
- **The cause: collision forgot which side of the arm a point belongs on.** `collide` pushes a point out of the arm's
  capsule along the line from the arm to the point. When the swinging forearm passed a panel point (its faces are up to
  13 cm across, wider than the forearm, so the arm slips between points), the point was then pushed out on the far
  side and held there, and the leash's bounded pull could not drag it back across the arm. The sleeve trailed behind a
  bare forearm.
- **The fix, `armSide` (0.05 m, on by default).** Within 5 cm of a forearm or hand capsule, beside its line (not past
  its ends, so the cuff below the hand stays free), a panel point on the far side of the arm from its skinned place is
  put back across the arm along that place's direction. Average dusk robe, Node walk: forearm covered 96% (min 92%), the
  sleeve's mean stray from its skinned place 1.8 cm (p90 3.4) against 5.1 (p90 14.3), panel area 4% over skinned
  against 22%. The close clip against round 11 shows the sleeve over the forearm to the wrist at every frame.
  Measure: `/mnt/project-files/3d-build/j5-round13-2026-10-17/cover.mjs` (`ANY=1` counts any crossing, as the eye
  does; without it, ray parity).
- **Two follow-ups the fix needed.** Moved all the way out, a point at the arm's side (just past the plane through
  the arm's line) jumped back and forth every few substeps: a standing figure's cuff shook 38 mm in J5d. The point now
  goes half way out (0.5 of the capsule, or of its skinned place if nearer), and the move carries its last place with
  it, so it gains no speed. And `armEdges` (round 12) is off: the edges were pushed out on the wrong side as the points
  were, and they shook the walking cuff 18 mm; with `armSide` the forearm stays covered without them, and J5d's cost
  drops from 5.85 to 4.4 ms a figure.
- **Round 13b: the walking cuff, 14.2 mm to 9.4 (line 12).** J5d's cuff set (the 59 points within 4 cm of the
  sleeve's far end) is all turned-back cuff: fold points that follow an anchor on the panel's last row. Measured in
  Node (`cuffset-jit.mjs`, the hf() measure on that set), the folds shook 15.2 mm against their anchors' 12.0: each
  fold kept its offset in the cloth's own frame, and that frame turned with every twitch of the panel's normal, so the
  fold swung more than the point it hangs from. `folSkin` (on) keeps a sleeve fold at its skinned offset from its
  anchor instead (11.4 mm). `armSideT` 0.9 leaves the panel's last tenth to the capsule's plain push, not the put-back
  across the arm, which flipped cuff points from side to side (9.5 mm in Node). `armSide` 0.03 did nothing (15.9).
- **Round 13b: J5 T2 failed on round 13's half way put-back.** The put-back set a point half the capsule's radius from
  the arm's line, inside the forearm: the slight robe's sleeve went 7.4 mm into the arm walking and 22.8 at the fast
  swing (T2's line is 1 mm). The share is now an option, `armSideShare`, at 1 (all the way out): with the cuff's tip
  out of the put-back it no longer jumps, T2 reads 0, and the cuff set shakes 8.1 mm in Node (0.3 shook 16.3). The
  forearm stays covered: 0.98 / 0.97 mean, 0.96 / 0.95 least (`ANY=1 cover.mjs`).
- T1 stays reported, not gated (`cd-panel-t1-eye`): rim lag 0 to 1 frames, coherence 0.95 to 0.96 at the walk.

### Round 14: the sleeve is one tube again, with a cloth hem band (2026-10-21)

Wendell on round 9: "the sleeve hems should flow like the shin hem does"; on the round 12/13 panels: "still quite bad...
sleeves aren't operating as one piece, hand moves through them, weird strings". Measured over the walk in Node
(`hem.mjs`, `cover.mjs SEG=hand`, `heel.mjs` in `/mnt/project-files/3d-build/j5-sleeve-hem-2026-10-21/probes/`):

- **What the shin hem does that the sleeve did not.** Shin hem: its points trail their skinned places by 4 frames,
  coherence 0.52, sway 27 cm peak to peak. Round 13b's sleeve end: 1 frame, 0.99, 6 cm: it moved with the hand.
- **Why the panels cannot get there.** Even with no arm contact at all a 15 cm panel trails only 2 frames (it swings
  faster than the arm). Air that moves with the trunk instead of the forearm (`armAir`) plus a put-back that eases out
  down the panel (`armSideFade`) did get the panels' ends to 3 frames, 0.94, 18 cm, but the hand came out of the
  sleeve: rays from the hand met the sleeve 25 to 34% of the time against 65 to 87% for round 13b. A sleeve end can only
  trail a hand it surrounds if there is room between them, and two open panels let the hand leave instead.
- **The change.** `garments.py` keeps each sleeve one closed tube (`SLEEVE_TUBE`, no `panels()`), skinned to the arm,
  and only its last `SLEEVE_BAND` (12 cm) is cloth: a hem band hung from the tube, weighted as the skirt's hem is, held
  within `armBlend` (1) of its skinned place, swinging in the trunk's air (`armAir` 1), and kept no nearer the forearm
  and hand than its skinned place (the backstop). The cuff opens to `CUFF_W` 0.40 (round 8's bell) so the band has room
  round the hand. No slits, so no strings; `armSide` is 0 (nothing to put back across).
- **The hem band's shake was friction.** With the legs' friction (0.15) on the sleeve's cloth the band caught on the hand
  and let go: J5d cuff 12.3 mm, over its 12 mm line. `armFriction` 0.05 (0 hardly moves the band: 2.4 cm of sway).
- **Numbers (average dusk robe, walk, Node):** forearm covered 0.99 to 1.00; the hand inside the sleeve exactly as
  often as when skinned (0.56 / 0.68 of rays from the hand meet the sleeve, cloth and skinned alike; round 13b's panels
  0.65 / 0.87 skinned, and the trailing panels tried above 0.25 / 0.34); band end lag 1 frame, coherence 0.99, sway
  5.2 cm peak to peak (8.1 at a fast stride), jitter 7.6 mm p99. J5d passes: cuff 8.2 mm walking, 2.65 ms a figure
  (round 13b 3.65). Robe about 135 KB. The band moves, but far less than the shin hem (26 cm, lag 5): a 12 cm band on
  a sleeve that rides the arm cannot trail like 70 cm of skirt.
- **Heels.** A ball capsule at each ankle was tried and dropped: it put J5d's walking hem and fold past their lines
  (27.0 and 30.7 mm). In this walk the foot comes through the skirt in 6 of 80 sampled frames, almost all toes at ankle
  height in front (the hem over the planted foot), one heel point behind (`heel.mjs`); round 13b's robe: 4 of 80.
- **The wrist's twist** (`twist.mjs`) is 11.5 degrees and constant in character.py's walk, 7 to 11 in the mocap walk:
  it does not pinch the sleeve, which rides the forearm bone alone from the middle of the forearm on (round 10).

### Round 15: no sliver faces in the reduced robe; the foot capsule stays off (2026-10-22)

Measured on the slight and average dusk robes (`garments.py --build ... --palette dusk`, its `through at key` lines)
and in Node (`heel.mjs`, `j5_cloth.mjs`, copied from `/mnt/project-files/3d-build/j5-sleeve-hem-2026-10-21/probes/`):

- **What was through on the slight robe.** After the cloth walk, 12 points at keys 2 to 5: the front of the left knee
  (thigh and knee points at 0.44 to 0.51 m), 12 to 18 cm from any slit's edge, not at a slit and not the forearm. Every
  cloth point stood at its capsule's radius plus the margin (103 mm from the knee ball's middle); the knee came through
  the middle of a face. Blender's decimation (`reduce`, ROBE_VERTS) had laid the flat skirt in slivers: the face over
  the knee had sides of 5, 30 and 34 cm, and the reduced robes had 520 to 550 cloth edges over 10 cm, the longest 34 to
  37 cm. Keeping a spread of points through the decimation (one every 8 cm) did not help: it still made slivers between them.
- **The change.** After the decimation, each face's longest edge is cut at its middle while it is longer than `MAX_EDGE`
  (0.14 m; longest-edge bisection, so no face gets thinner). That adds about 450 points, so `ROBE_VERTS` drops from 1450
  to 1100 and the robes keep their size (129 to 144 KB, under the 150 KB line; 0.12 m with 1200 made the slight robe
  157 KB). The slight robe: none through. A retry could not fix this: the same drape made the same slivers.
- **Retries change something.** `DRAPE_TRIES` is 3 (was 6) and each try drapes with its own `CLEAR`
  (`DRAPE_CLEARS` 0.006, 0.004, 0.005). Alone, the slight dusk robe left none through at 0.006 (three runs), 1 at
  0.004 (a belt point), 6 at 0.005 (the forearm inside the tube), and 212 at 0.008 and 487 at 0.010, so the tries
  stay near 0.006.
- **The heels came from the slivers too.** Foot points through the skirt in 80 sampled frames of the walk (average
  dusk; round 14: 6), and J5d's walking hem and fold jitter (lines 24 and 28). Two drapes came out of the same settings,
  so both are shown:

  | foot capsule | poke frames | J5d hem / fold (mm) |
  |---|---|---|
  | round 14 robe, none | 6 | 19.6 / 20.1 |
  | none | 0 (drape A), 1 (drape B, twice) | 16.3 / 18.6 (A), 15.1 / 18.9 (B) |
  | `FOOT_CAP` 0.8 | 2 (B) | 16.5 / 19.4 |
  | 0.9 | 15 (a third drape) | 18.9 / 20.0 |
  | 1.0 | 3 (B) | 17.5 / 21.9 |
  | 0.8, `FOOT_BACK` | 1 (B) | 16.1 / 19.5 |
  | 0.9, `FOOT_BACK` | 2 (A) | 16.7 / 20.6 |
  | 1.0, `FOOT_BACK` | 0 (A) | 19.1 / 21.0 |

  No capsule setting does better than none, and each shakes the hem more, so `FOOT_CAP` stays 0 and the front hem is not
  cut higher.
- **Masking and skinning (docs/3d-math.md rule 8 in the council's repo).** The toes that poke sit below the hem (0.15 m
  above the floor), outside what the robe covers, so a body mask could not hide them. The knee points sit under the skirt,
  but below the slits' tops (0.54 m), where the leg steps out through a slit in the walk, so masking them would leave a
  hole that shows through the slit. Skinning the hem to the shin would stop the shin hem's swing, which is the motion
  the sleeves were asked to match (round 14); the skirt already rides capsule pushes with a soft margin (2.5 cm), and
  J5 and the probes already test by rays cast out from body points.
- **Tests.** J5 passes on all nine (36 garments, none through at 25 keys, 23 to 144 KB, 427 s on 4 cores); an
  earlier run, with tries at 0.006, 0.008 and 0.010, failed on the slight dusk robe alone. J5d passes: 3.23 ms a figure
  (2.65 in round 14: the robe has about 300 more cloth points), walking jitter cuff 3.7, ties 3.2, hem 17.7, fold 18.3 mm.

## Rounds 1 to 5, in one line each

- **Bone weights never move like cloth.** Rounds 1 to 4 drove the skirt with hem bones and slit weights. Every fix
  stayed local (his words, round 4: "every fix is still too localized"). The skirt became cloth in round 5. The hem
  bones remain only as the cloth's skinned place.
- **A fold 6 mm thick cannot be held by springs.** The turned hem (points marked 3) is not simulated. Each point
  follows its anchor's frame, or the fold flips inside out.
- **Friction keeps cloth with the leg under it.** Round 5 used 0.08. Round 6 tried 0 and the back of the knee came
  through on some drapes: the band pulled the cloth one way while the leg slid out from under it. At 0.15 every drape
  tested holds, and the float barely changes (`friction`).
- **The through test is ray parity.** A body point is covered when a ray out from its bone crosses the cloth an
  odd number of times (one crossing for a plain skirt, three through a fold). The nearest face alone is fooled
  where cloth folds.
- **Sample at the exact times.** `cloth_walk.mjs` steps to land a frame exactly on each sample time. A sample a
  frame late shows a different leg.
- **Update the view layer before reading the figure's places.** Blender's `view_layer.update()` must run after posing
  and before reading posed points, or the sheet shows the last pose's cloth on this pose's body.
- **Drapes differ from process to process.** Blender's drape settles differently each run, and one run in four or
  so leaves a few points through. `garments.py --all` re-drapes those in a fresh process (`DRAPE_TRIES`), each with its own `CLEAR` (round 15). Compare
  cloth settings on the same drape, and give each parallel run its own `W`. The cloth jobs live in `$W/cloth-jobs`,
  and two runs sharing one `W` overwrite each other's jobs.

## Sources

- Müller, Heidelberger, Hennix, Ratcliff, "Position Based Dynamics", 2007: inverse-mass weighting of corrections.
- Macklin, Müller, Chentanez, "XPBD: Position-Based Simulation of Compliant Constrained Dynamics", 2016, and
  Macklin et al., "Small Steps in Physics Simulation", 2019: substeps over iterations. `cloth.js` runs fixed
  substeps (480 a second), so its stiffnesses do not change with the frame rate. A change to `substepHz` changes
  every stiffness, and XPBD compliance is the way to make them independent of it. Each frame is cut into whole
  substeps no longer than 1/480 s, so the cloth always lands on the body's time. Carrying a remainder over to the
  next frame made a 60-frame second hold 7, 8 or 9 substeps a frame by rounding, and the pins covered each frame's move
  at a varying speed. The cloth costs about 1.9 ms per figure for each 1/60 s in headless Chromium.
- Kim, Chentanez, Müller-Fischer, "Long Range Attachments: A Method to Simulate Inextensible Clothing in Computer
  Games", SCA 2012, https://diglib.eg.org/items/909412a2-8791-41ce-acba-f084965a2633/full: the tethers. Unreal
  warns they can look puppet-like when tight. `tetherSlack` is 1.02.
- Unity, `ClothSkinningCoefficient.maxDistance`,
  https://docs.unity3d.com/ScriptReference/ClothSkinningCoefficient-maxDistance.html: each cloth point kept within a
  distance of its skinned place, 0 where it is attached. This is the blend band.
- NVIDIA PhysX cloth guide, https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/Cloth.html:
  inertia scale and local-space simulation for fast characters, and why a variable time step makes cloth jitter.
  `cloth.js` keeps a fixed sub-step.
- Bi, Jin, Nienborg and Xiao, Journal of Vision 2019 (as cited by the council's pass cloth-designer1): changing only
  how uniformly nearby points move changed how stiff cloth looked (round 11's coherence).
- VRM spring bone (pixiv, `@pixiv/three-vrm-springbone`): stiffness toward where the parent holds a link, drag, and
  sphere and capsule colliders; round 11's chains follow it in plain JavaScript.
- Choi and Ko, "Stable but responsive cloth", SIGGRAPH 2002: buckling, which cloth does instead of resisting
  compression.
