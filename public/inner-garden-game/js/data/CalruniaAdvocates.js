/**
 * Calrunia NPC roster — imported from Casey's Birthday Deck:
 * `The Library/04 Quests/Casey's Birthday Deck/Calrunia NPC Grid (5 × 8).md`
 *
 * 5 nations × 8 trigram-advocate archetypes.
 *
 * **World NPCs:** Do not invent one-off names for new walkable NPCs. Add entries to
 * `ADVOCATE_WORLD_SPAWNS` using `advocateId` values from `ADVOCATES` (see
 * `getAdvocatesAvailableForWorld()` for who is not on the map yet).
 */

export const NATION_META = {
    argyra: { label: 'Argyra', channel: 'Metal / Fear', color: '#b8c4d0' },
    pyrakanth: { label: 'Pyrakanth', channel: 'Fire / Anger', color: '#e07050' },
    lamenth: { label: 'Lamenth', channel: 'Water / Sadness', color: '#5a9ae8' },
    meridia: { label: 'Meridia', channel: 'Earth / Neutrality', color: '#9a8a6e' },
    virelune: { label: 'Virelune', channel: 'Wood / Joy', color: '#6ec86e' },
};

/**
 * @typedef {Object} Advocate
 * @property {string} id — stable slug (nation + archetype key)
 * @property {keyof typeof NATION_META} nationId
 * @property {string} archetype — e.g. "Bold Heart (Heaven)"
 * @property {string} name
 * @property {string} title — epithet
 */

/** @type {Advocate[]} */
export const ADVOCATES = [
    // Argyra
    { id: 'argyra_heaven', nationId: 'argyra', archetype: 'Bold Heart (Heaven)', name: 'Kael Virex', title: 'The Unyielding Vector' },
    { id: 'argyra_earth', nationId: 'argyra', archetype: 'Devoted Guardian (Earth)', name: 'Doran Kest', title: 'The Iron Ward' },
    { id: 'argyra_mountain', nationId: 'argyra', archetype: 'Still Point (Mountain)', name: 'Kael Virex', title: 'The Unmoving Edge' },
    { id: 'argyra_fire', nationId: 'argyra', archetype: 'Truth Seer (Fire)', name: 'Veyra Null', title: 'The Cutting Lens' },
    { id: 'argyra_lake', nationId: 'argyra', archetype: 'Joyful Connector (Lake)', name: 'Selen Marr', title: 'The Measured Bridge' },
    { id: 'argyra_water', nationId: 'argyra', archetype: 'Danger Walker (Water)', name: 'Oris Vale', title: 'The Edge Navigator' },
    { id: 'argyra_thunder', nationId: 'argyra', archetype: 'Decisive Storm (Thunder)', name: 'Rax Corven', title: 'The Final Cut' },
    { id: 'argyra_wind', nationId: 'argyra', archetype: 'Subtle Influence (Wind)', name: 'Irix Sol', title: 'The Quiet Pressure' },
    // Pyrakanth
    { id: 'pyrakanth_heaven', nationId: 'pyrakanth', archetype: 'Bold Heart (Heaven)', name: 'Serin Ashfall', title: 'The Blazing Oath' },
    { id: 'pyrakanth_earth', nationId: 'pyrakanth', archetype: 'Devoted Guardian (Earth)', name: 'Brakka Thorne', title: 'The Burning Shield' },
    { id: 'pyrakanth_mountain', nationId: 'pyrakanth', archetype: 'Still Point (Mountain)', name: 'Caldris Vein', title: 'The Held Flame' },
    { id: 'pyrakanth_fire', nationId: 'pyrakanth', archetype: 'Truth Seer (Fire)', name: 'Serin Ashfall', title: 'The Truth Seer' },
    { id: 'pyrakanth_lake', nationId: 'pyrakanth', archetype: 'Joyful Connector (Lake)', name: 'Liora Pyre', title: 'The Radiant Bond' },
    { id: 'pyrakanth_water', nationId: 'pyrakanth', archetype: 'Danger Walker (Water)', name: 'Varn Keth', title: 'The Ember Diver' },
    { id: 'pyrakanth_thunder', nationId: 'pyrakanth', archetype: 'Decisive Storm (Thunder)', name: 'Kaelis Drav', title: 'The Breaking Flame' },
    { id: 'pyrakanth_wind', nationId: 'pyrakanth', archetype: 'Subtle Influence (Wind)', name: 'Nyra Voss', title: 'The Whispering Spark' },
    // Lamenth
    { id: 'lamenth_heaven', nationId: 'lamenth', archetype: 'Bold Heart (Heaven)', name: 'Eira Lune', title: 'The Open Tide' },
    { id: 'lamenth_earth', nationId: 'lamenth', archetype: 'Devoted Guardian (Earth)', name: 'Thalos Mere', title: 'The Deep Shelter' },
    { id: 'lamenth_mountain', nationId: 'lamenth', archetype: 'Still Point (Mountain)', name: 'Eira Lune', title: 'The Quiet Basin' },
    { id: 'lamenth_fire', nationId: 'lamenth', archetype: 'Truth Seer (Fire)', name: 'Maelis Thren', title: 'The Sorrow Mirror' },
    { id: 'lamenth_lake', nationId: 'lamenth', archetype: 'Joyful Connector (Lake)', name: 'Lethra Vane', title: 'The Gentle Current' },
    { id: 'lamenth_water', nationId: 'lamenth', archetype: 'Danger Walker (Water)', name: 'Orin Vale', title: 'The Drowned Path' },
    { id: 'lamenth_thunder', nationId: 'lamenth', archetype: 'Decisive Storm (Thunder)', name: 'Kaelith Moor', title: 'The Breaking Wave' },
    { id: 'lamenth_wind', nationId: 'lamenth', archetype: 'Subtle Influence (Wind)', name: 'Sira Lune', title: 'The Lingering Echo' },
    // Meridia
    { id: 'meridia_heaven', nationId: 'meridia', archetype: 'Bold Heart (Heaven)', name: 'Tomas Vale', title: 'The Steady Hand' },
    { id: 'meridia_earth', nationId: 'meridia', archetype: 'Devoted Guardian (Earth)', name: 'Halden Root', title: 'The Living Wall' },
    { id: 'meridia_mountain', nationId: 'meridia', archetype: 'Still Point (Mountain)', name: 'Tomas Vale', title: 'The Quiet Ground' },
    { id: 'meridia_fire', nationId: 'meridia', archetype: 'Truth Seer (Fire)', name: 'Bren Talos', title: 'The Plain Speaker' },
    { id: 'meridia_lake', nationId: 'meridia', archetype: 'Joyful Connector (Lake)', name: 'Mira Solen', title: 'The Open Field' },
    { id: 'meridia_water', nationId: 'meridia', archetype: 'Danger Walker (Water)', name: 'Corin Dhal', title: 'The Weight Bearer' },
    { id: 'meridia_thunder', nationId: 'meridia', archetype: 'Decisive Storm (Thunder)', name: 'Jarek Stone', title: 'The Breaking Stillness' },
    { id: 'meridia_wind', nationId: 'meridia', archetype: 'Subtle Influence (Wind)', name: 'Elin Voss', title: 'The Gentle Shift' },
    // Virelune
    { id: 'virelune_heaven', nationId: 'virelune', archetype: 'Bold Heart (Heaven)', name: 'Luma Vire', title: 'The Rising Bloom' },
    { id: 'virelune_earth', nationId: 'virelune', archetype: 'Devoted Guardian (Earth)', name: 'Selenya Grove', title: 'The Tending Hand' },
    { id: 'virelune_mountain', nationId: 'virelune', archetype: 'Still Point (Mountain)', name: 'Aeri Thal', title: 'The Rooted Light' },
    { id: 'virelune_fire', nationId: 'virelune', archetype: 'Truth Seer (Fire)', name: 'Lyra Venn', title: 'The Revealing Vine' },
    { id: 'virelune_lake', nationId: 'virelune', archetype: 'Joyful Connector (Lake)', name: 'Luma Vire', title: 'The Joyful Connector' },
    { id: 'virelune_water', nationId: 'virelune', archetype: 'Danger Walker (Water)', name: 'Neris Vale', title: 'The Wild Current' },
    { id: 'virelune_thunder', nationId: 'virelune', archetype: 'Decisive Storm (Thunder)', name: 'Kaelis Thorn', title: 'The Unbound Growth' },
    { id: 'virelune_wind', nationId: 'virelune', archetype: 'Subtle Influence (Wind)', name: 'Iri Sol', title: 'The Hidden Bloom' },
];

const byNpcId = new Map();
for (const a of ADVOCATES) {
    byNpcId.set(`adv_${a.id}`, a);
}

export function getAdvocateByNpcId(npcId) {
    return byNpcId.get(npcId) || null;
}

export function advocatesByNation(nationId) {
    return ADVOCATES.filter((a) => a.nationId === nationId);
}

/** World spawns: one flagship advocate per nation + two extras (tutorial garden visitors). */
export const ADVOCATE_WORLD_SPAWNS = [
    { advocateId: 'argyra_lake', x: 320, y: 420, spriteType: 'merchant' },
    { advocateId: 'pyrakanth_fire', x: 920, y: 380, spriteType: 'disciple' },
    { advocateId: 'lamenth_water', x: 180, y: 620, spriteType: 'sage' },
    { advocateId: 'meridia_earth', x: 1050, y: 620, spriteType: 'merchant' },
    { advocateId: 'virelune_wind', x: 720, y: 720, spriteType: 'disciple' },
    { advocateId: 'argyra_thunder', x: 560, y: 280, spriteType: 'disciple' },
    { advocateId: 'pyrakanth_heaven', x: 840, y: 180, spriteType: 'sage' },
];

/**
 * Advocate ids currently used as walkable world NPCs (via `ADVOCATE_WORLD_SPAWNS`).
 * @returns {Set<string>}
 */
export function getSpawnedAdvocateIds() {
    return new Set(ADVOCATE_WORLD_SPAWNS.map((s) => s.advocateId));
}

/**
 * Advocates from the deck roster not yet placed on the map. Use this when choosing
 * the next `advocateId` for a new `ADVOCATE_WORLD_SPAWNS` row.
 * @returns {Advocate[]}
 */
export function getAdvocatesAvailableForWorld() {
    const placed = getSpawnedAdvocateIds();
    return ADVOCATES.filter((a) => !placed.has(a.id));
}
