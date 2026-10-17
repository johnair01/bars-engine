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
  across the arm, which flipped cuff points from side to side (9.5 mm in Node). The share is now an option
  (`armSideShare`, 0.5); 0.3 shook more (16.3), and `armSide` 0.03 did nothing (15.9). The forearm stays covered:
  0.98 / 0.96 mean, 0.96 / 0.96 least (`ANY=1 cover.mjs`). J5d: cuff 9.4 mm, cost 3.65 ms a figure, standing still.
- T1 stays reported, not gated (`cd-panel-t1-eye`): rim lag 0 to 1 frames, coherence 0.95 to 0.96 at the walk.

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
  so leaves a few points through. `garments.py --all` re-drapes those in a fresh process (`DRAPE_TRIES`). Compare
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
