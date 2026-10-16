# Cloth: what we learned, and what to read before changing cloth.js

The robe's skirt is cloth every frame (`cloth.js`, the same code in the game and in Blender through
`cloth_walk.mjs`). This file holds what rounds 1 to 6 of J5 taught, so the same problems do not come back. Read it
before any change to `cloth.js`, the robe's skin weights below the belt, the leg capsules or the hem bones.

## Measure first, then look

Round 6 began with a rig, `tools/blender-cloud/tests/cloth_measure.mjs` (`cloth_walk.mjs`'s walk run in Node on the robe job
garments.py writes to `$W/cloth-jobs`, about two seconds a run). It measures:

- **float**: how far above its standing height a hem point sits while no leg is within 5 cm of it. A hem with
  nothing under it should hang at or below its standing height. Round 5: 70 mm on average at a normal stride.
  Round 6: about 3 mm.
- **back hem rise**: the 95th percentile of the back hem's rise over the walk. Round 5: 27 cm. Round 6: about 11 cm.
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
is `blend` (0.2 times the point's distance from the belt along the cloth). `blendStiff` (0.1) makes it a pull
rather than a wall, so a leg always wins. Two conditions made it work:

- The skinned place must follow the legs. Round 5 hung the whole skirt's skin from the pelvis. A band toward a skirt
  that never moves fights every leg, and the knee came through the cloth (test J5, 120 points). Round 6 skins the
  skirt as round 4 did, with the front panel on `hemF`, the back on `hemB` and the sides on their thighs. The band
  then pulls the cloth toward a skirt that already swings.
- The skinned place must hang. Round 4's `hemB` followed the heel (`hip + 0.6 knee`), so the band held the back
  hem up behind the kicking heel (25 cm). `hemB` now follows the thigh behind (`0.9 max(hipL, hipR)`), in
  `character.py` and `cloth_walk.mjs` alike.

The band skips cloth that is on a leg or within 8 cm of one (`blendClear`), and it first lifts the skinned place out
of any capsule it has sunk into. A band that pulls cloth into a bending knee shows the knee through the gaps between
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

Wendell on round 5: "there’s jitteriness in the belt now". Round 6 found two causes and fixed both:

- **The robe showed through the sash.** The robe is solidified 4 mm outward (`THICK`), and the sash's edges sat 3
  mm off the robe's inner face. At every bend the robe's outer face came through the band's edges in ragged teeth.
  The sash now sits `THICK` + 3 mm (edges) and `THICK` + 8 mm (middle) off.
- **The cloth below the belt bulged over the sash.** With no blend band and a fat pelvis capsule, the free cloth just
  under the belt stood 5 cm off the body, rose over the sash's lower edge and hid the knot's tails. The backstop and
  the band hold it to 1.5 cm standing, and the tails lie `TAIL_OFF` (2.2 cm) off the robe.

J5d (`j5_cloth.mjs`) stands a fifth figure still and fails if the belt row's motion relative to the body changes by
more than 0.2 mm from frame to frame. Some motion at the belt while walking is the walk itself: `pose()` drops the
hips by `|sin|`, which has a corner at each footfall. That is the figure's walk, J4's, and it moves the belt with
the body.

## Rounds 1 to 5, in one line each

- **Bone weights never move like cloth.** Rounds 1 to 4 drove the skirt with hem bones and slit weights. Every fix
  stayed local (his words, round 4: "every fix is still too localized"). The skirt became cloth in round 5. The hem
  bones remain only as the cloth's skinned place.
- **A fold 6 mm thick cannot be held by springs.** The turned hem (points marked 3) is not simulated. Each point
  follows its anchor's frame, or the fold flips inside out.
- **Friction on a leg carries cloth up.** Round 5 used 0.08. Round 6 uses 0, since with the band in place the
  cloth needs no help to stay on a leg.
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
  every stiffness, and XPBD compliance is the way to make them independent of it.
- Kim, Chentanez, Müller-Fischer, "Long Range Attachments: A Method to Simulate Inextensible Clothing in Computer
  Games", SCA 2012, https://diglib.eg.org/items/909412a2-8791-41ce-acba-f084965a2633/full: the tethers. Unreal
  warns they can look puppet-like when tight. `tetherSlack` is 1.02.
- Unity, `ClothSkinningCoefficient.maxDistance`,
  https://docs.unity3d.com/ScriptReference/ClothSkinningCoefficient-maxDistance.html: each cloth point kept within a
  distance of its skinned place, 0 where it is attached. This is the blend band.
- NVIDIA PhysX cloth guide, https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/Cloth.html:
  inertia scale and local-space simulation for fast characters, and why a variable time step makes cloth jitter.
  `cloth.js` keeps a fixed sub-step.
- Choi and Ko, "Stable but responsive cloth", SIGGRAPH 2002: buckling, which cloth does instead of resisting
  compression.
