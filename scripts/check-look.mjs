/* A static check on the Between's look, run from `npm run check` beside the type-check.
   The room reads its look from public/between/look-data.js (copied from six-faces-council council/look/look.json, on
   the board positions bld-look-is-data and bld-light-boundary). This fails when a file in public/between restates one
   of those values instead of reading it, so a look constant cannot crawl back in between stills rounds.

   Three rules, all static and quick, so they run before the lint:
     1. a look colour written as #rrggbb or 0xrrggbb outside look-data.js
     2. a THREE.PointLight given four literals that match a light the dataset's budget holds
     3. a THREE.PointLight that reads LIGHT.<name>.colour but retypes that light's intensity, distance and decay

   The look hash in the report is the one a pull request touching public/between cites. A frame that drifts while
   quoting the right numbers still passes here; the stills comparison is the council's, and it looks at pictures. */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { LOOK, LIGHT, LOOK_HASH } from "../public/between/look-data.js";

const ROOM = path.join(process.cwd(), "public", "between");
const DATASET = "look-data.js";
const EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".html", ".css"]);

function hex(value) {
  return String(value).trim().toLowerCase();
}

function colourFields() {
  const out = new Map();
  LOOK.ramp.colours.forEach((colour, i) => out.set(hex(colour), `LOOK.ramp.colours[${i}]`));
  const palette = LOOK.palette || {};
  for (const field of ["shadow_fill", "rim"]) {
    const entry = palette[field];
    if (entry && entry.colour) out.set(hex(entry.colour), `LOOK.palette.${field}.colour`);
  }
  for (const [name, colour] of Object.entries(palette.light_colours || {})) {
    out.set(hex(colour), LIGHT[name] ? `LIGHT.${name}.colour` : `LOOK.palette.light_colours.${name}`);
  }
  return out;
}

function numberOf(part) {
  if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part, 16);
  if (/^-?\d*\.?\d+$/.test(part)) return Number(part);
  return null;
}

function lightName(part) {
  const found = /^LIGHT\.([A-Za-z_$][\w$]*)(?:\.colour)?$/.exec(part);
  return found ? found[1] : null;
}

function budgetTuples() {
  const out = new Map();
  for (const [name, light] of Object.entries(LIGHT)) {
    const key = [hex(light.colour), Number(light.intensity), Number(light.distance), Number(light.decay)].join(" ");
    out.set(key, name);
  }
  return out;
}

function pointLightProblem(args, tuples) {
  const parts = args.split(",").map((p) => p.trim());
  if (parts.length < 4) return null;
  const numbers = parts.slice(0, 4).map(numberOf);
  if (!numbers.some((n) => n === null)) {
    const key = [`0x${numbers[0].toString(16).padStart(6, "0")}`, numbers[1], numbers[2], numbers[3]].join(" ");
    if (tuples.has(key)) {
      const light = tuples.get(key);
      return `rebuilds the ${light} light (${key}); read LIGHT.${light} from look-data.js`;
    }
  }
  const named = lightName(parts[0]);
  const rest = parts.slice(1, 4).map(numberOf);
  if (named && LIGHT[named] && !rest.some((n) => n === null)) {
    const light = LIGHT[named];
    const declared = [Number(light.intensity), Number(light.distance), Number(light.decay)];
    if (declared.every((value, i) => value === rest[i])) {
      return `reads LIGHT.${named}.colour but retypes its numbers (${rest.join(", ")}); read LIGHT.${named} whole`;
    }
  }
  return null;
}

async function roomFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) out.push(...(await roomFiles(full)));
    else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const colours = colourFields();
const tuples = budgetTuples();
const failures = [];

for (const file of await roomFiles(ROOM)) {
  const name = path.relative(ROOM, file);
  if (name === DATASET) continue;
  const text = await readFile(file, "utf8");
  text.split("\n").forEach((line, i) => {
    const lower = line.toLowerCase();
    for (const [colour, field] of colours) {
      if (lower.includes(colour) || lower.includes(`0x${colour.slice(1)}`)) {
        failures.push(`${name}:${i + 1} restates ${colour}, which the dataset holds as ${field}; read it from look-data.js`);
      }
    }
  });
  for (const match of text.matchAll(/new\s+THREE\.PointLight\(([^)]*)\)/g)) {
    const problem = pointLightProblem(match[1], tuples);
    if (!problem) continue;
    const line = text.slice(0, match.index).split("\n").length;
    failures.push(`${name}:${line} ${problem}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(`\n${failures.length} look value(s) restated in public/between; the look hash is ${LOOK_HASH}. `
    + "Read the dataset instead (bld-look-is-data).");
  process.exit(1);
}
console.log(`public/between reads the look dataset; look hash ${LOOK_HASH}.`);
