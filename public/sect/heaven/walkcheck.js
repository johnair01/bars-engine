// Round 24: the walkability check (rules in the council's calrunian-sect.md, "Walkability rules"). It walks a route of
// [x, z] points in 0.1 m steps with the same ground the figure stands on and reports every place where the ground jumps
// more than one riser (0.22 m) between two steps: a flight that ends in the air, a deck that stops short, a ledge.
// Run it in the page before any look of the way is posted: `(await import('/sect/heaven/walkcheck.js')).wayCheck()`.
import { groundAt } from './walk.js';
import { CREST_STAIR, ROAD, ROAD_START, CROWN } from './crag.js';
import { ALTAR } from './altar.js';

export function walkCheck(route, ground = groundAt, maxJump = 0.22) {
  const breaks = []; let prev = null, len = 0;
  for (let i = 1; i < route.length; i++) {
    const [ax, az] = route[i - 1], [bx, bz] = route[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 0.1));
    for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n, y = ground(x, z);
      if (prev !== null && Math.abs(y - prev) > maxJump) breaks.push({ leg: i, at: [+x.toFixed(2), +z.toFixed(2)], from: +prev.toFixed(2), to: +y.toFixed(2) });
      prev = y; }
    len += L;
  }
  return { ok: breaks.length === 0, metres: Math.round(len), breaks };
}
// the sect's one climbing way: the great court, the zigzag, the gate, the bridge and the winding road to the crown
// round 25: the walk goes on past the road's top, along the crown deck, through the crown gate, over the forecourt and up
// the hall's stair to its door (round 24 stopped at the road's last node, which is why it missed the gap to the crown)
export function wayCheck() { const C = CROWN;
  return walkCheck([...CREST_STAIR.slice(0, -1), ...ROAD.slice(ROAD_START).map(([x, z]) => [x, z]), C.at(C.rWall), C.at(C.rStair), C.at(C.rPlinth - 0.8),
  // round 27: on through the gate hall, down its back stair, across the court and in at the founder's south door to the hall's middle
  C.at(C.rBack + 0.3), C.at(C.rFoot - 0.3), C.at(5.5), C.at(-3.5),
  // round 29: out of the north doors, along the walk and up the altar's south stairs to the heart stone
  C.at(-12), C.at(ALTAR.r + ALTAR.R[0] + ALTAR.RUN + 1), C.at(ALTAR.r)]); }
