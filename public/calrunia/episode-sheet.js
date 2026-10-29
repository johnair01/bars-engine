/* From one player's charge to one episode's prep: the Lazy Dungeon Master's eight steps, filled by the world grammar.

   A port of Six-faces-council council/tools/episode_sheet.py (pass charge-to-world-1, build 1), so the Between can take
   a charge and show its episode sheet without a server. src/lib/between/__tests__/episode-sheet.test.ts checks that the
   sample player's sheet here is the same, line for line, as the one the Python tool wrote
   (council/charge-to-world/sample-player/episode.md).

   What is deterministic and what is drafted, as in the tool: the grammar's tables decide the lands, weather, encounter,
   villain, regions, resources and seed, so the same charge gives the same sheet; the free text a game master writes
   (strong start, secrets, location names and aspects, NPC lines, the week's capability) comes only from the charge's
   `drafted` block, is marked "(drafted)", and is listed as "to draft" when missing. Nothing here invents that text. */

// The ontology's development_lines (ontology/v0.1/source/design-ontology-v0.1.yaml), in its order.
export const LINES = ["emotional", "somatic", "interpretive", "epistemic", "relational", "integrity", "strategic", "creative",
  "narrative_agency", "helping", "stewardship", "authorship", "collective", "systemic_participation", "rest_refusal_release"];
// The world grammar's tables (ontology/v0.1/proposals/world-grammar.md), copied from episode_sheet.py.
export const LIFE_DOMAINS = ["relationships", "career", "money", "creativity", "health", "home", "community"];
export const QUADRANTS = {
  upper_left: ["inside me", "pilgrimage"], upper_right: ["my body and what I do", "apprenticeship"],
  lower_left: ["between me and others", "fellowship"], lower_right: ["systems and structures", "founding"],
};
export const SATISFACTION = {
  delighted: "wood", energized: "wood", free: "wood", triumphant: "fire", proud: "fire", peaceful: "earth", fulfilled: "earth",
  excited: "metal", relieved: "metal", poignant: "water", blissful: "water",
};
const ENVIRONMENT = { wood: "forest", fire: "mountain", earth: "plains", metal: "cave", water: "lake" };
const RESOURCE = { wood: "fruit", fire: "embers", earth: "clay", metal: "ore", water: "well water" };
export const DISTANCE = { "next door": 1, "a day's walk": 2, "over the mountains": 3, "across the sea": 4 };
export const OBSTACLE = {
  time: "a river", money: "a wall", "a person": "a closed house", health: "a steep climb", "a place": "a border",
  "a skill": "a broken bridge", "a duty": "a toll road",
};
export const DISSATISFACTION = {
  scared: "fear", anxious: "fear", worried: "fear", frustrated: "anger", stuck: "anger", disappointed: "sadness",
  isolated: "sadness", empty: "sadness", overwhelmed: "neutrality_numb", numb: "neutrality_numb",
};
const WEATHER = { fear: "frost and mist", anger: "heat and dry wind", sadness: "rain and a high tide", neutrality_numb: "a still fog" };
export const STRENGTH = ["a breeze", "a storm", "a season"];
const TRUTH = {
  anger: ["something must be defended, or an obstacle overcome", "What is in the way, or what needs protecting?", "a wall to cross or a boundary to set"],
  sadness: ["something you care about is far away", "What do you care about, and how far is it?", "a beloved keepsake seen across water, reached or mourned"],
  fear: ["there is a threat to escape or avoid", "What is the threat, and how close is it?", "a hunter or hazard, escaped, hidden from, or found smaller than it looked"],
  neutrality_numb: ["something that should matter has fallen silent", "What has fallen silent that used to matter?", "a sleeping figure to wake, gently"],
};
export const VILLAINS = {
  "I'm not ready": ["the Fog Warden", "lengthens the road; the haze thickens", "taking one step before feeling ready"],
  "I'm not worthy": ["the Usher", "bars gates and asks for proof", "entering when a resident invites the character"],
  "I'm not capable": ["the Weigher", "makes tools and resources heavy", "a small act done with what the character already has"],
  "I'm insignificant": ["the Eraser", "wipes the character's footprints so the world seems not to answer", "seeing a mark the character made still standing"],
  "I don't belong": ["the Border Guard", "turns townsfolk and residents away", "being welcomed by one of them by name"],
  "I'm not good enough": ["the Measurer", "dims the McGuffin's light beside other people's", "claiming a shard as it is, unmeasured"],
};
export const DAEMONS = ["the Protector", "the Controller", "the Skeptic", "the Fixer", "the Victim", "the Damaged Self", "the Emotional Body"];
const RIGHT_HAND = new Set(["upper_right", "lower_right"]);
export const SECRETS_WANTED = 10;

const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const article = w => "aeiou".includes(w.slice(0, 1)) ? "an" : "a";
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

/** Python's json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False), for the charge's seed. */
export function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";
  return JSON.stringify(v);
}
export async function sha256(text) {
  const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Check the charge against the grammar and return what the tables decide, or { errors } on any refusal. */
export async function read(charge) {
  const errs = [];
  const [q1, q2, q3, q4, , q6] = ["q1", "q2", "q3", "q4", "q5", "q6"].map(k => charge[k] || {});
  const line = charge.line;
  if (!LINES.includes(line)) errs.push(`line '${line}' is not one of the ontology's development_lines`);
  const domain = q1.domain;
  if (!LIFE_DOMAINS.includes(domain)) errs.push(`q1.domain '${domain}' is not a life domain`);
  const quadrant = q1.quadrant || "upper_right";
  if (!QUADRANTS[quadrant]) errs.push(`q1.quadrant '${quadrant}' is not a quadrant`);
  const feelings = q2.feelings || [];
  if (!feelings.length || feelings.some(f => !SATISFACTION[f])) errs.push("q2.feelings must name at least one satisfied feeling");
  const distance = q3.distance || "a day's walk";
  if (!DISTANCE[distance]) errs.push(`q3.distance '${distance}' is not a distance`);
  const obstacles = q3.obstacles || [];
  if (obstacles.some(o => !OBSTACLE[o])) errs.push("q3.obstacles must come from the obstacle table");
  const weather = q4.weather || [];
  for (const w of weather) {
    if (!DISSATISFACTION[w.feeling]) errs.push(`q4 feeling '${w.feeling}' is not a dissatisfied feeling`);
    if (!STRENGTH.includes(w.strength || "a breeze")) errs.push(`q4 strength '${w.strength}' is not a strength`);
  }
  if (!weather.length) errs.push("q4.weather needs the week's feeling (episode scale asks question 4)");
  const beliefs = q6.beliefs || [];
  const loudest = q6.loudest || beliefs[0] || null;
  if (!VILLAINS[loudest] || beliefs.some(b => !VILLAINS[b])) errs.push("q6 beliefs must come from the belief table");
  const when = q6.when;
  if (when != null && !obstacles.includes(when)) errs.push(`q6.when '${when}' must be one of the obstacles named in q3`);
  const d = charge.drafted || {};
  if (d.daemon != null && !DAEMONS.includes(d.daemon)) errs.push(`drafted.daemon '${d.daemon}' is not a daemon`);
  const cap = d.capability || {};
  if (Object.keys(cap).length && !RIGHT_HAND.has(cap.quadrant)) errs.push("drafted.capability must be a right-hand act (wg-quadrant-genre)");
  if (errs.length) return { errors: errs };

  const first = SATISFACTION[feelings[0]];
  let env = ENVIRONMENT[first];
  if (first === "water" && DISTANCE[distance] > 2) env = "ocean";
  const week = weather[0], channel = DISSATISFACTION[week.feeling];
  const [villain, effect, overcome] = VILLAINS[loudest];
  const regionCause = when || obstacles[0] || null;
  return {
    line, domain, quadrant, genre: QUADRANTS[quadrant][1], element: first, environment: env, resource: RESOURCE[first],
    lands: [...new Set(feelings)].map(f => [SATISFACTION[f], ENVIRONMENT[SATISFACTION[f]]]),
    rings: DISTANCE[distance], distance, regions: obstacles.map(o => [o, OBSTACLE[o]]),
    week, channel, weather: WEATHER[channel], strength: week.strength || "a breeze", truth: TRUTH[channel],
    belief: loudest, villain, effect, overcome, lieutenants: beliefs.filter(b => b !== loudest).map(b => VILLAINS[b][0]),
    regionCause, region: regionCause ? OBSTACLE[regionCause] : null,
    hash: await sha256(canonical(charge)),
  };
}

const drafted = (v, fallback = "to draft") => v ? `${v} *(drafted)*` : `**[${fallback}]**`;
const said = v => v ? `"${v}"` : "**[the player has not answered]**";

/** Three places: the week's encounter site, the villain's ground, the road home. Each one is an asset brief. */
export function locations(charge, g) {
  const names = (charge.drafted || {}).locations || {};
  const region = g.region ? `${g.region} (${g.regionCause}), on the ${g.environment}'s edge` : `deep in the ${g.environment}`;
  const slots = [
    ["encounter", `${g.element} land: the ${g.environment}`, 2, `the week's encounter: ${g.truth[2]}`],
    ["villain", `obstacle region: ${region}`, 3, `${g.villain}'s ground, where the belief is met`],
    ["road-home", "the homeroom's rim, where the townsfolk live", 4, "the road home and the homeroom table"],
  ];
  return slots.map(([role, land, scene, purpose]) => {
    const given = names[role] || {}, name = given.name, aspects = [...(given.aspects || [])];
    const lid = name ? slug(name) : `${role}-to-name`;
    const weather = role === "encounter" ? `, ${g.weather}` : "";
    return {
      location: name || `[to draft: ${role}]`, drafted: !!name, role, land, element: g.element, purpose,
      aspects: aspects.length ? aspects : ["[to draft: a sight]", "[to draft: a sound or the air]", "[to draft: an object to touch or use]"],
      line: g.line, scene, state: { element: g.element, line: g.line, seed: g.hash.slice(0, 8) },
      needs: [
        { id: `set-${lid}`, kind: "set", brief: `${name || role}: ${aspects[0] || "to draft"}`, tool: "brief", status: "brief", line: g.line },
        { id: `prop-${lid}`, kind: "prop", brief: aspects[2] || "to draft: the object the player touches", tool: "brief", status: "brief", line: g.line },
      ],
      concept_prompt: aspects.length ? "game environment concept art, third-person view, " + (name ? `${name}: ` : "") + aspects.slice(0, 3).join(", ")
        + `, in a ${g.environment} at dusk${weather}, a small traveller, soft multi-directional light, depth, painterly` : null,
    };
  });
}

export function characters(charge, g) {
  const d = charge.drafted || {}, folk = (charge.q3 || {}).townsfolk || [], lines = d.npc_lines || {};
  const npcs = folk.slice(0, 2).map(f => ({ name: f.name, role: f.role, archetype: "townsfolk (3d)", line: lines[f.name] }));
  npcs.push({ name: d.daemon || "[to draft: the daemon the belief rides]", role: `ridden by ${g.villain}`,
    archetype: "daemon, met and befriended (hj-voice-wears-pack)", line: lines[d.daemon] });
  return npcs;
}

/** The one page, in the Lazy DM's order: the same Markdown episode_sheet.py writes. */
export function sheet(charge, g) {
  const d = charge.drafted || {};
  const [q1, , , , q5, q6] = ["q1", "q2", "q3", "q4", "q5", "q6"].map(k => charge[k] || {});
  const locs = locations(charge, g), npcs = characters(charge, g), secrets = [...(d.secrets || [])], cap = d.capability || {};
  const key = (q5.keys || {})[g.channel];
  const out = [
    `# Episode sheet: ${charge.player || "a player"}, ${charge.episode || "episode 1"}`,
    "",
    `From the charge \`${charge.id || "charge"}\` (sha256 \`${g.hash.slice(0, 12)}\`) by \`council/tools/episode_sheet.py\`.`
      + " Plain text comes from the world grammar's tables; *(drafted)* text was written by the session that prepared"
      + " the charge and is the game master's to strike or change.",
    "",
    "## 1. Review the characters (Sage)",
    `- **The McGuffin:** ${said(q1.words)}; ${article(g.genre)} ${g.genre} (${QUADRANTS[g.quadrant][0]}),`
      + ` in ${g.domain}, waiting in the ${g.environment} (${g.element}), ${g.rings} ring(s) of haze away (${g.distance}).`,
    `- **Line this episode works:** ${g.line}. **Domain:** ${g.domain}.`,
    `- **Loudest belief:** "${g.belief}", which is ${g.villain} (${g.effect}).` + (g.lieutenants.length ? ` Lieutenants: ${g.lieutenants.join(", ")}.` : ""),
    `- **This week:** ${g.week.feeling}, ${g.strength}: ${g.weather} over the near land.`,
    "",
    "## 2. Strong start (Diplomat)",
    `The player steps out of the homeroom into the ${g.environment} under ${g.weather}; ${g.villain} ${g.effect.split(";")[0]}.`,
    "",
    drafted(d.strong_start),
    "",
    "## 3. Potential scenes (Architect)",
    `1. Orientation: the ${g.environment} under the week's weather, felt through ${g.villain}'s effect.`,
  ];
  locs.forEach((loc, i) => out.push(`${i + 2}. ${loc.purpose[0].toUpperCase() + loc.purpose.slice(1)}, at ${loc.location}.`));
  out.push("", `## 4. Secrets and clues (Shaman), on the ${g.line} line, tied to no place`);
  for (const s of secrets) out.push(`- ${s} *(drafted)*`);
  if (secrets.length < SECRETS_WANTED) out.push(`- **[to draft: ${SECRETS_WANTED - secrets.length} more]**`);
  out.push("", "## 5. Fantastic locations (Architect); each one is an asset brief in locations.yaml");
  for (const loc of locs) out.push(`- **${loc.location}**${loc.drafted ? " *(drafted)*" : ""} (${loc.land}): ${loc.aspects.join("; ")}.`);
  out.push("", "## 6. Important NPCs (Diplomat)");
  for (const n of npcs) out.push(`- **${n.name}**, ${n.role} (${n.archetype}).${n.line ? ` "${n.line}" *(drafted)*` : ""}`);
  out.push(
    "",
    "## 7. Relevant monsters (Challenger)",
    `- **${g.villain}**, the belief "${g.belief}", met at ${locs[1].location}. It ${g.effect}. Overcome by ${g.overcome}.`,
    `- Hoard: ${said(q6.hoard)}.`,
    `- Hazard: the week's ${g.weather}; the encounter it holds is ${g.truth[2]}.`,
    "",
    "## 8. Treasure (Regent)",
    `- A ${cap1(g.element)} shard of the McGuffin, and ${g.resource} from the land's nodes.`,
    `- The key, carved from question 5 (${g.truth[1]}): ${said(key)}`,
    `- **On the ${g.line} line, the capability to take back to life this week (right-hand):** ${drafted(cap.act)}`,
    "",
    "## Not on this sheet",
    "- Anything the session finds at the table. The Lazy DM's rule: prepare what makes the game better, and no more.",
  );
  return out.join("\n") + "\n";
}

/** What the session still has to draft before the sheet is whole. */
export function todo(charge) {
  const d = charge.drafted || {}, gaps = [];
  if (!d.strong_start) gaps.push("strong_start");
  const n = (d.secrets || []).length;
  if (n < SECRETS_WANTED) gaps.push(`secrets (${n} of ${SECRETS_WANTED})`);
  for (const role of ["encounter", "villain", "road-home"]) if (!((d.locations || {})[role] || {}).name) gaps.push(`locations.${role}`);
  if (!(d.capability || {}).act) gaps.push("capability");
  return gaps;
}
