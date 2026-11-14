/* The council's three-coin cast, ported from wendell-britt/six-faces-council council/iching/cast.py (pass bar-intake-1,
   brief "BAR intake, build 1"). The readings are hexagrams.json beside this file, a copy of council/iching/hexagrams.yaml
   (its `source` names the commit). src/lib/between/__tests__/iching-cast.test.ts checks every cast here against
   cast.py --json on the same tosses, field for field.

   Each line is three coin tosses, heads 3 and tails 2, built from the bottom up. 6 is old yin and 9 old yang, both
   changing; 7 is young yang and 8 young yin. Changing lines flip to give the hexagram it becomes. The coins inform the
   reading; they never decide the work (iching-casting spec, position bi-coins-inform). */

export const LINE = { 6: [0, true, "old yin, changing"], 7: [1, false, "young yang"], 8: [0, false, "young yin"], 9: [1, true, "old yang, changing"] };

let tablePromise = null;
export function loadTable(url = "/between/iching/hexagrams.json") {
  if (!tablePromise) tablePromise = fetch(url).then(r => r.json());
  return tablePromise;
}

function reading(h, tri) {
  const lo = tri[h.lower], up = tri[h.upper];
  const pick = t => ({ symbol: t.symbol, name: t.name, quality: t.quality });
  return {
    n: h.n, name: h.name ?? null, cn: h.cn, pinyin: h.pinyin, lines: h.lines,
    shows: h.shows ?? null, image: h.image ?? null, situation: h.situation ?? null,
    lower: { trigram: h.lower, ...pick(lo) }, upper: { trigram: h.upper, ...pick(up) },
  };
}

/** One toss of three coins: [2|3, 2|3, 2|3]. `rand` returns [0, 1). */
export const tossThree = (rand = Math.random) => [0, 1, 2].map(() => (rand() < 0.5 ? 2 : 3));

/** The cast for six tosses (bottom line first), as cast.py builds it for one agent. */
export function castFromTosses(tosses, table, agent = "agent") {
  if (tosses.length !== 6 || tosses.some(t => t.length !== 3 || t.some(c => c !== 2 && c !== 3))) throw new Error("six tosses of three coins (2 or 3) each");
  const byLines = new Map(table.hexagrams.map(h => [h.lines.join(""), h]));
  const values = tosses.map(t => t[0] + t[1] + t[2]);
  const primary = values.map(v => LINE[v][0]);
  const changing = values.flatMap((v, i) => (LINE[v][1] ? [i + 1] : []));
  const becomes = primary.map((b, i) => (LINE[values[i]][1] ? 1 - b : b));
  const c = { agent, method: "three coins", tosses: tosses.map(t => [...t]), values, changing_lines: changing, ...reading(byLines.get(primary.join("")), table.trigrams) };
  if (changing.length) c.becomes = reading(byLines.get(becomes.join("")), table.trigrams);
  return c;
}

/** The lines laid so far (one to six), for drawing the hexagram as it builds. */
export const lineOf = toss => { const v = toss[0] + toss[1] + toss[2]; return { value: v, yang: LINE[v][0] === 1, changing: LINE[v][1], says: LINE[v][2] }; };
