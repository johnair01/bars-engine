/**
 * NPC Name Grammar — deterministic nation-phonological name generation.
 *
 * Inspired by:
 *   - The Laobaixing (老百姓) — the Chinese "hundred surnames" concept: a finite
 *     set of heritable family names that carry cultural weight and accumulate
 *     meaning as the community plays.
 *   - Taoist cultivation novels and Will Wight's Cradle series: personal names
 *     carry elemental resonance, and earned titles mark developmental altitude.
 *
 * Three naming layers (earned progressively):
 *   [Cultivation Rank] [Family Surname] [Personal Name], [Role Title(s)]
 *
 * Example: "Mirror-Keeper Solern Merenoth, Witness of Lamenth"
 *
 * NOTE: All generation is zero-token — hash + lookup only.
 * Surnames are deterministic from playerId × nationId.
 * The same player always receives the same name.
 */

// ---------------------------------------------------------------------------
// Nation surname sets — the Laobaixing of each nation.
// Each surname carries implicit cultural weight even without explicit meaning.
// 20 surnames per nation; can expand as community history accumulates.
// ---------------------------------------------------------------------------

/** The five canonical nations keyed by lowercase name. */
export const CANONICAL_NATIONS = ['argyra', 'pyrakanth', 'lamenth', 'virelune', 'meridia'] as const
export type CanonicalNation = typeof CANONICAL_NATIONS[number]

export const NATION_LAOBAIXING: Record<string, readonly string[]> = {
  // Argyra — Metal/Silver: crisp sibilants, bright front vowels, precise stops
  argyra: [
    'Sael', 'Mirren', 'Kaelveth', 'Edriith', 'Silvorn',
    'Thornveil', 'Crystin', 'Aryen', 'Kaeldris', 'Venmir',
    'Silrath', 'Aelken', 'Thyrveil', 'Mirrath', 'Kaelthor',
    'Silven', 'Edrath', 'Ariven', 'Thyssel', 'Vaedrith',
  ],

  // Pyrakanth — Fire: fricatives, open back vowels, strong stops
  pyrakanth: [
    'Pyreth', 'Kanthari', 'Zaravok', 'Volarn', 'Rashkiv',
    'Embrix', 'Solkrath', 'Pyroven', 'Zarkath', 'Voldreth',
    'Kannish', 'Ashvorn', 'Rakoven', 'Pyrelith', 'Kanthrel',
    'Zorvak', 'Embrath', 'Solvek', 'Zivaren', 'Volvath',
  ],

  // Lamenth — Water: liquids and nasals, soft fricatives, low-mid vowels
  lamenth: [
    'Solern', 'Lamerev', 'Thelaren', 'Soreveth', 'Lamoros',
    'Merinsol', 'Delath', 'Selenorn', 'Moravel', 'Solendis',
    'Larethen', 'Merenoth', 'Thelonir', 'Solameth', 'Lamoreth',
    'Delornin', 'Merethol', 'Selenath', 'Lamindor', 'Thornmel',
  ],

  // Virelune — Wood: voiced continuants, high vowels, open syllables
  virelune: [
    'Virelen', 'Lunevorn', 'Renveld', 'Wynvale', 'Livrel',
    'Sylvoire', 'Brelvir', 'Lirenvey', 'Wynnover', 'Vilunel',
    'Sylvaren', 'Brenvyre', 'Luniveth', 'Virewood', 'Relvyne',
    'Lunvire', 'Wyelorn', 'Sylvren', 'Lunvale', 'Brevilor',
  ],

  // Meridia — Earth: labials and dentals, mid-round vowels, steady rhythm
  meridia: [
    'Torveth', 'Brenmere', 'Gaelord', 'Olvern', 'Brindeth',
    'Goldmore', 'Merrath', 'Torvalen', 'Brendis', 'Gaelvorn',
    'Olvaren', 'Morbridge', 'Torindel', 'Brenmar', 'Gaelith',
    'Olthren', 'Mergate', 'Brindath', 'Torvorn', 'Gaelmere',
  ],
}

// ---------------------------------------------------------------------------
// Personal name phoneme tables — nation-specific syllable grammar.
// Names are generated from: onset + nucleus (+ optional coda).
// 2-syllable names are standard; 1-syllable is terse/marked (rare NPCs);
// 3-syllable is formal/elder (Tier 3-4 only).
// ---------------------------------------------------------------------------

// Personal name phonology — pre-made syllable inventories per nation.
// Names are built as: FirstSyllable + secondSyllable (standard)
// Each list contains complete, phonotactically valid syllables.
// First syllable is PascalCase; second is lowercase.
// Target: 5–9 character personal names.

// Two distinct inventories per nation:
// `opens`  — opening syllables (PascalCase), set the nation's character
// `closes` — closing syllables (lowercase), provide rhythm and closure
// Names: Opens[i] + closes[j] — guaranteed distinct phoneme profiles

const NATION_SYLLABLES: Record<string, { opens: readonly string[], closes: readonly string[] }> = {
  // Argyra — Metal/Silver: bright sibilants, front vowels, precision
  argyra: {
    opens:  ['Kae', 'Syl', 'Ven', 'Mir', 'Ael', 'Thal', 'Sael', 'Kir', 'Vel', 'Nar', 'Sev', 'Ith'],
    closes: ['rith', 'seth', 'vael', 'len', 'ith', 'elth', 'ael', 'neth', 'veth', 'ilen', 'rath', 'sel'],
  },

  // Pyrakanth — Fire: fricatives, back vowels, strong stops
  pyrakanth: {
    opens:  ['Pyr', 'Kan', 'Zar', 'Vol', 'Rak', 'Kiv', 'Vor', 'Zan', 'Bek', 'Thar', 'Solv', 'Emb'],
    closes: ['rath', 'iketh', 'aven', 'okh', 'ekar', 'ivath', 'oran', 'aketh', 'ixar', 'orvek', 'ath', 'ivan'],
  },

  // Lamenth — Water: liquids, nasals, soft and flowing
  lamenth: {
    opens:  ['Sol', 'Lam', 'Mer', 'The', 'Mor', 'Del', 'Sel', 'Sor', 'Lan', 'Elm', 'Nor', 'Mel'],
    closes: ['elen', 'ath', 'inor', 'areth', 'olath', 'anel', 'irel', 'orneth', 'aleth', 'enor', 'iel', 'oran'],
  },

  // Virelune — Wood: voiced continuants, open syllables, organic
  virelune: {
    opens:  ['Vir', 'Lun', 'Wyn', 'Syl', 'Ren', 'Brel', 'Liv', 'Vel', 'Ryn', 'Glyn', 'Wye', 'Niv'],
    closes: ['elov', 'yneth', 'irel', 'over', 'elwyn', 'yrne', 'ivel', 'orel', 'yvern', 'irel', 'oven', 'yrel'],
  },

  // Meridia — Earth: labials, dentals, round vowels, steady rhythm
  meridia: {
    opens:  ['Mer', 'Tor', 'Bren', 'Gael', 'Olv', 'Brin', 'Dor', 'Nav', 'Ren', 'Gav', 'Mor', 'Tel'],
    closes: ['iath', 'orveth', 'enath', 'aelorn', 'inden', 'avel', 'oreth', 'arend', 'elorn', 'aveth', 'endra', 'orvael'],
  },
}

// ---------------------------------------------------------------------------
// Cultivation titles — face × tier.
// Prepended to full name in formal address.
// ---------------------------------------------------------------------------

export const CULTIVATION_TITLES: Record<string, readonly [string, string, string, string]> = {
  //                   Tier 1              Tier 2              Tier 3            Tier 4
  shaman:     ['Threshold-Walker', 'Veil-Keeper',    'Mirror-Keeper',  'Hollow Seer'],
  challenger: ['Edge-Strider',     'Blade-Sworn',    'Iron-Willed',    'Unbroken Edge'],
  regent:     ['Steward',          'Warden',         'Pattern-Holder', 'Silent Sovereign'],
  architect:  ['Scribe',           'Blueprint-Bearer','System-Weaver', 'Grand Architect'],
  diplomat:   ['Bridge-Walker',    'Thread-Weaver',  'Web-Keeper',     'Resonant Voice'],
  sage:       ['Apprentice Mirror','Depth-Reader',   'Layered Elder',  'Vast Silence'],
}

// ---------------------------------------------------------------------------
// Hash — same djb2 as shadow-name-grammar for consistency
// ---------------------------------------------------------------------------

function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return h >>> 0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface NpcNameResult {
  surname: string
  personalName: string
  /** Informal address — what players use day-to-day */
  informalName: string
  /** Formal name with cultivation title prepended */
  formalName: string
}

/**
 * Generate a deterministic name for an NPC.
 *
 * @param playerId   - The Player.id (stable seed)
 * @param nationKey  - Lowercase nation key: 'argyra' | 'pyrakanth' | 'lamenth' | 'virelune' | 'meridia' | 'veritas'
 * @param face       - The NPC's cultivated face: 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
 * @param tier       - Constitutional tier 1–4
 * @param roleTitles - Optional earned role titles to append (e.g. ['Witness of Lamenth'])
 */
export function generateNpcName(
  playerId: string,
  nationKey: string,
  face: string,
  tier: 1 | 2 | 3 | 4,
  roleTitles: string[] = []
): NpcNameResult {
  const nation = nationKey.toLowerCase()
  const surnames = NATION_LAOBAIXING[nation] ?? NATION_LAOBAIXING['meridia']
  const cultivationTitles = CULTIVATION_TITLES[face] ?? CULTIVATION_TITLES['sage']

  const h = hash(playerId + nation)

  // Surname: stable from playerId + nation
  const surname = surnames[h % surnames.length]

  // Personal name: pick two syllables from the nation inventory.
  // First syllable is PascalCase (already capitalised in the table for indices 0-7).
  // Second syllable is lowercase (indices 8+ in the table, or lowercased pick).
  // Tier 3-4: occasionally 3 syllables.

  const syls = NATION_SYLLABLES[nation] ?? NATION_SYLLABLES['meridia']

  const syl1 = syls.opens [(h >>> 4)  % syls.opens.length]
  const syl2 = syls.closes[(h >>> 12) % syls.closes.length]

  let personalName: string
  if (tier >= 3 && (h >>> 24) % 3 === 0) {
    // Tier 3-4 elders: extra closing syllable for a more formal, longer name
    const h2 = hash(playerId + nation + 'ext')
    const syl3 = syls.closes[h2 % syls.closes.length]
    personalName = syl1 + syl2 + syl3
  } else {
    personalName = syl1 + syl2
  }

  // Informal: Surname + PersonalName (cultivation novel convention — surname first)
  const informalName = `${surname} ${personalName}`

  // Formal: CultivationTitle + Surname + PersonalName[, RoleTitle, ...]
  const cultivationTitle = cultivationTitles[tier - 1]
  const roleAppendix = roleTitles.length > 0 ? `, ${roleTitles.join(', ')}` : ''
  const formalName = `${cultivationTitle} ${surname} ${personalName}${roleAppendix}`

  return { surname, personalName, informalName, formalName }
}

/**
 * Generate just the cultivation title for a face+tier combination.
 * Used for role grant announcements.
 */
export function getCultivationTitle(face: string, tier: 1 | 2 | 3 | 4): string {
  return (CULTIVATION_TITLES[face] ?? CULTIVATION_TITLES['sage'])[tier - 1]
}

/**
 * Detect likely NPC players by contact value pattern.
 * Matches the '@simulated.local' pattern used by the simulation seed scripts.
 */
export function isSimulatedContactValue(contactValue: string): boolean {
  return contactValue.endsWith('@simulated.local') || contactValue.startsWith('agent-sim-')
}
