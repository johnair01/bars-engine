// The baked robe (round 5): the J5 robe's cloth simulated once over the figure's Walk and stored as one shape per clip frame
// (bars-engine J5 bake.mjs, six-faces-council callsheet calrunia-creator.md). No three.js here, so tools/figure-robe-probe.mjs
// runs the same code in node.
//   const r = bakedRobe({ base, normal, frames, frameNormals, fps, arm });   // flat Float32Arrays from the GLB, frames as deltas
//   r.pose(t, { cx, cz, hips: [w, d], chest: [w, d], shift, caps });          // writes r.pos and r.nor for clip time t
// pose() blends the two stored frames around t, widens the robe to the body's shape and build (the bake is on the average
// body; it never narrows, since a slighter body under the average robe pokes through less than a robe drawn in), moves the
// sleeves (arm: each point's share of arm in the skinned robe) out with the shoulders by `shift` instead, then pushes every point out of the arm capsules (docs/3d-math.md rule 5: a collider is a position push to its
// surface, the closest point on the bone segment plus the radius), so a sleeve that trails the swing never shows the arm.
export const BAND = [0.9, 1.1];   // metres: below the waist the robe takes the hips' width and depth, from the chest up the chest's
// The outfit cuts: where the robe's hem falls (metres above the floor, rest pose; 0 is the robe's own hem at the ankle), whether
// the sash is tied, and which of the look's cloth colours the robe's light bands (collar, cuffs, hem) take: 1 light, 3 trim
export const CUT = { jacket: { hem: 0.73, sash: false, band: 1 }, dress: { hem: 0.36, sash: true, band: 1 }, coat: { hem: 0, sash: false, band: 3 } };
// Robe clipping, the durable fix (his note 2026-10-22: "legs are moving through the robe"), the two things games do instead of
// chasing cloth: the body is not drawn where the robe covers it (hidden-surface removal: what is never drawn can never show
// through), and the robe below the waist is driven by the legs (each thigh and shin is a capsule the cloth is pushed off, with
// a soft margin so it rides over the leg instead of creasing). See six-faces-council docs/3d-math.md rule 7.
//   maskBand(cut) -> [lo, hi]: leg skin whose rest height lies between lo and hi is never drawn under that cut. Below lo it is
//   drawn, because a shin swinging back can leave the hem (ROBE_HEM is the baked robe's lowest point; MARGIN keeps the band of
//   leg just above the hem drawn, so a leg never shows a hole where it leaves the robe; the leg capsules cover that band).
export const ROBE_HEM = 0.08, MASK_MARGIN = 0.12, MASK_TOP = 0.95;
export const maskBand = C => [(C.hem || ROBE_HEM) + MASK_MARGIN, MASK_TOP];
// the leg capsules: thigh and shin per side, radius = the leg's skin (85th percentile of its distance from the bone) plus the
// travel pants at that height (figure.js grows them up to 12 mm over the thigh, 26 mm at the shin) plus a pad; SOFT is the
// margin over which the push fades out, so the cloth eases over the leg
export const LEG = [['hipL', 'kneeL', 0.012], ['kneeL', 'ankleL', 0.026], ['hipR', 'kneeR', 0.012], ['kneeR', 'ankleR', 0.026]];
export const LEG_PAD = 0.012, LEG_SOFT = 0.03;

export function bakedRobe({ base, normal, frames, frameNormals, fps, arm = null }) {
  const n = base.length / 3, N = frames.length, pos = new Float32Array(base.length), nor = new Float32Array(base.length);
  const ease = y => { const u = Math.min(1, Math.max(0, (y - BAND[0]) / (BAND[1] - BAND[0]))); return u * u * (3 - 2 * u); };
  function pose(t, { cx = 0, cz = 0, hips = [1, 1], chest = [1, 1], shift = 0, caps = [] } = {}) {
    const f = ((t * fps) % N + N) % N, k0 = Math.floor(f) % N, k1 = (k0 + 1) % N, u = f - Math.floor(f);
    const a = frames[k0], b = frames[k1], na = frameNormals[k0], nb = frameNormals[k1];
    for (let i = 0; i < n * 3; i += 3) {
      const y = base[i + 1] + a[i + 1] + (b[i + 1] - a[i + 1]) * u, e = ease(y);
      const fx = Math.max(1, hips[0] + (chest[0] - hips[0]) * e), fz = Math.max(1, hips[1] + (chest[1] - hips[1]) * e);
      const x0 = base[i] + a[i] + (b[i] - a[i]) * u, z0 = base[i + 2] + a[i + 2] + (b[i + 2] - a[i + 2]) * u, w = arm ? arm[i / 3] : 0;
      let x = (cx + (x0 - cx) * fx) * (1 - w) + (x0 + Math.sign(x0 - cx) * shift) * w, z = (cz + (z0 - cz) * fz) * (1 - w) + z0 * w;
      let px = 0, py = 0, pz = 0;
      for (const c of caps) {   // c: [ax, ay, az, bx, by, bz, r, soft]
        const sx = c[3] - c[0], sy = c[4] - c[1], sz = c[5] - c[2], ss = sx * sx + sy * sy + sz * sz;
        const s = Math.min(1, Math.max(0, ((x - c[0]) * sx + (y - c[1]) * sy + (z - c[2]) * sz) / ss));
        const dx = x + px - (c[0] + sx * s), dy = y + py - (c[1] + sy * s), dz = z + pz - (c[2] + sz * s), d = Math.hypot(dx, dy, dz);
        const R = c[6], S = c[7] || 0;   // a hard push to R; with a soft margin S, points within R + S ease out to R..R+S
        if (d < R + S && d > 1e-6) { const t = S ? R + S * (d / (R + S)) ** 2 : R, p = (t - d) / d; if (p > 0) { px += dx * p; py += dy * p; pz += dz * p; } }
      }
      pos[i] = x + px; pos[i + 1] = y + py; pos[i + 2] = z + pz;
      for (let j = 0; j < 3; j++) nor[i + j] = normal[i + j] + na[i + j] + (nb[i + j] - na[i + j]) * u;
    }
    return { pos, nor };
  }
  return { n, pos, nor, frames: N, duration: N / fps, pose };
}

// each baked point's share of arm: the arm bones' skin weight of the nearest point of the skinned robe posed at the bake's first
// frame (`skinned` flat positions, `armW` its per-point arm weight)
export function armShare(base, skinned, armW) {
  const n = base.length / 3, m = skinned.length / 3, out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let best = 0, bd = Infinity;
    for (let j = 0; j < m; j++) { const d = (base[i * 3] - skinned[j * 3]) ** 2 + (base[i * 3 + 1] - skinned[j * 3 + 1]) ** 2 + (base[i * 3 + 2] - skinned[j * 3 + 2]) ** 2; if (d < bd) { bd = d; best = j; } }
    out[i] = armW[best]; }
  return out;
}

// the arm capsules from the body: one per upper arm and forearm, from each bone to its child (the hand from the wrist along the
// forearm's line, `hand` metres), radius from the skin weighted to that bone (85th percentile of its distance, plus `pad`)
export function armRadii(dist) {   // dist: { bone: [distances] } in the bind pose
  const r = {}; for (const [b, d] of Object.entries(dist)) { const s = [...d].sort((p, q) => p - q); r[b] = s[Math.floor(0.85 * (s.length - 1))] ?? 0.04; }
  return r;
}

// the leg capsules' radii from the body's leg skin distances in the bind pose ({ hipL: [...], kneeL: [...], ... }, keyed by the
// capsule's first bone), and the capsules themselves for this frame from `at(name)` = that bone's position in robe space
export function legRadii(dist) { const r = armRadii(dist), out = {}; for (const [a, , pants] of LEG) out[a] = (r[a] ?? 0.06) + pants + LEG_PAD; return out; }
export function legCapsules(at, rad) {
  return LEG.map(([a, b]) => { const A = at(a), Bp = at(b); return [A[0], A[1], A[2], Bp[0], Bp[1], Bp[2], rad[a], LEG_SOFT]; });
}
