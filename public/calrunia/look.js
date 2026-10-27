/* The look: sprout's creator contract, so a look made in the Between's homeroom opens Chapter 1 with ?look= and a look
   made in Chapter 1 opens the homeroom (six-faces-council relationship-creature, br-look-is-sprouts).
   The text is <shape>.<build>.<skin>.<hair>.<hair colour>.<outfit>.<dye>, as sprout slice/creator.js writes it (KEYS,
   option ids, swatches, CLOTH and DYED copied from sprout branch claude/project-thread-3ag8x2, commit d1104da). A look is
   choices, never a photo (ba-likeness-choices).
   Plain module, no three.js: the Cave of Lessons and Big Mind take it as it is. */

export const KEYS = ["shape", "build", "skin", "style", "colour", "outfit", "dye"];

// Body shapes are named by shape, not gender; sprout's sheets keep their own ids inside.
export const SHAPES = [
  { id: "a", label: "Straight", line: "Straight up and down, light on the feet." },
  { id: "b", label: "Shouldered", line: "Wide at the shoulder, narrow at the hip." },
  { id: "c", label: "Curved", line: "Narrow shoulders, a full chest and hips." },
];
export const BUILDS = [
  { id: "slender", label: "Slender" }, { id: "average", label: "Average" }, { id: "broad", label: "Broad" }, { id: "round", label: "Round" },
];

export const mixHex = (a, b, t = 0.5) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");

// Eight river stones: the traveler's five skins, and three that lie halfway between two of them.
const FIVE = { light: "#e4a47c", amber: "#ea9f54", olive: "#ae6b3f", brown: "#76513a", black: "#442725" };
export const SKINS = [
  { id: "light", label: "Light", swatch: FIVE.light },
  { id: "fawn", label: "Fawn", swatch: mixHex(FIVE.light, FIVE.olive) },
  { id: "amber", label: "Amber", swatch: FIVE.amber },
  { id: "olive", label: "Olive", swatch: FIVE.olive },
  { id: "chestnut", label: "Chestnut", swatch: mixHex(FIVE.amber, FIVE.brown) },
  { id: "brown", label: "Brown", swatch: FIVE.brown },
  { id: "umber", label: "Umber", swatch: mixHex(FIVE.brown, FIVE.black) },
  { id: "black", label: "Black", swatch: FIVE.black },
];
export const STYLES = [{ id: "sweep", label: "Sweep" }, { id: "afro", label: "Afro" }, { id: "page", label: "Page" }, { id: "spiked", label: "Spiked" }];
export const COLOURS = [
  { id: "black", label: "Black", swatch: "#1c2222" }, { id: "dark_brown", label: "Dark brown", swatch: "#421603" },
  { id: "red", label: "Red", swatch: "#cb0000" }, { id: "blonde", label: "Blonde", swatch: "#e09e2b" },
  { id: "gray", label: "Gray", swatch: "#777777" }, { id: "blue", label: "Blue", swatch: "#0041b4" },
];
export const OUTFITS = [{ id: "jacket", label: "Jacket" }, { id: "dress", label: "Wrap dress" }, { id: "coat", label: "Long coat" }];
export const DYES = [{ id: "violet", label: "Violet", swatch: "#6e5a86" }, { id: "saffron", label: "Saffron", swatch: "#d9a03a" }];

// Each outfit's four cloth colours (main, light, shade, trim), and what each dye turns them into.
export const CLOTH = { jacket: ["#4a3a5e", "#6e5a86", "#2a2033", "#d9a03a"], dress: ["#b07a2a", "#d9a03a", "#7a5220", "#6e5a86"], coat: ["#3a2c48", "#56446a", "#1e1826", "#d9a03a"] };
export const DYED = { violet: { jacket: CLOTH.jacket, dress: CLOTH.jacket, coat: CLOTH.coat }, saffron: { jacket: CLOTH.dress, dress: CLOTH.dress, coat: ["#8e6224", "#b07a2a", "#5a3c18", "#6e5a86"] } };

const OPTS = { shape: SHAPES, build: BUILDS, skin: SKINS, style: STYLES, colour: COLOURS, outfit: OUTFITS, dye: DYES };
export const optionsOf = k => OPTS[k];

// The creator's beats, as rows a Look sheet can show.
export const BEATS = [
  { id: "shape", title: "The mist takes shape", groups: [{ k: "shape", label: "Shape" }, { k: "build", label: "Build, narrow to wide" }] },
  { id: "reflection", title: "The glass", groups: [{ k: "skin", label: "Skin, a river stone" }, { k: "style", label: "Hair" }, { k: "colour", label: "Hair colour" }] },
  { id: "satchel", title: "The satchel", groups: [{ k: "outfit", label: "Clothes" }, { k: "dye", label: "Dye" }] },
];

export const DEFAULT_LOOK = { shape: "a", build: "average", skin: "light", style: "afro", colour: "black", outfit: "coat", dye: "violet" };

export const lookText = l => KEYS.map(k => l[k]).join(".");

/** A look from its text, or null when any part is not one of the creator's choices. */
export function parseLook(t) {
  const v = String(t || "").split(".");
  if (v.length !== KEYS.length) return null;
  const l = Object.fromEntries(KEYS.map((k, i) => [k, v[i]]));
  return KEYS.every(k => OPTS[k].some(o => o.id === l[k])) ? l : null;
}

/** "Choose for me": one choice from each row. `rnd` is any function giving 0 to 1. */
export const randomLook = (rnd = Math.random) => Object.fromEntries(KEYS.map(k => [k, OPTS[k][Math.floor(rnd() * OPTS[k].length)].id]));

/** The colours a figure is tinted with: skin, hair, and the dyed cloth (main, light, shade, trim). */
export function colorsOf(look) {
  const l = typeof look === "string" ? parseLook(look) : look;
  if (!l) return null;
  return {
    skin: SKINS.find(s => s.id === l.skin).swatch,
    hair: COLOURS.find(c => c.id === l.colour).swatch,
    cloth: DYED[l.dye][l.outfit].slice(),
  };
}

/** How the look reads in words, for a screen reader or a caption. */
export const lookWords = l => [SHAPES, BUILDS, SKINS, STYLES, COLOURS, OUTFITS, DYES].map((opts, i) => opts.find(o => o.id === l[KEYS[i]]).label.toLowerCase()).join(", ");
