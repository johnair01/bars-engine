/* The newcomer's own walk (Six-faces-council hdw-oix-4, his A "Claude takes it", 2026-11-16).
   Early in the walk the newcomer leaves one true thing they want, in their own words, and taps the one wall in the way.
   Mara's card in the Hollow answers that wall. The walls are the episode sheet's obstacle table, so the map and the card
   speak the same terrain. The two answers live in this tab's sessionStorage ("walk-own") and nowhere else. */
import { OBSTACLE } from "../calrunia/episode-sheet.js";

export const KEY = "walk-own";
export const MAX_WANT = 140;

/** Mara's light card and her line back, one pair per wall. The grammar is the deck's own (friendcraft/deck.js, canon card-turn):
    a card is one small ask in the owner's voice that a friend can do today, "Ask me ..., then listen to the whole answer", and
    the line back is the owner's plain answer, a thing she did, with thanks. No metaphor, no advice, no digit. The wall picks
    which ask, so the answer comes out of Mara's own life and tells the newcomer how she met a wall like theirs. */
const CARDS = {
  time: { words: "Ask me where I find an hour when the week is full, then listen to the whole answer.", back: "After supper, with the dishes left in the sink and the phone in another room. Thank you for asking." },
  money: { words: "Ask me what I cut first when money ran short, then listen to the whole answer.", back: "The second coffee went and the bus pass stayed. Thank you for asking." },
  "a person": { words: "Ask me who I could not ring for a whole year, then listen to the whole answer.", back: "My brother. I wrote him one line about his dog before I wrote anything else. Thank you for asking." },
  health: { words: "Ask me what I do on the days my body says no, then listen to the whole answer.", back: "I sit on the back step with tea and let the walk wait until tomorrow. Thank you for asking." },
  "a place": { words: "Ask me what I packed first when I had to move, then listen to the whole answer.", back: "My mother's kettle and the one good knife. Thank you for asking." },
  "a skill": { words: "Ask me what I was bad at for the longest time, then listen to the whole answer.", back: "Bread. Four loaves like bricks before one rose. Thank you for asking." },
  "a duty": { words: "Ask me what I put down when I could not carry it all, then listen to the whole answer.", back: "The Thursday committee. I told them plainly, and they managed. Thank you for asking." },
};
export const WALLS = Object.keys(OBSTACLE).map(k => ({ key: k, terrain: OBSTACLE[k] }));
export const PROMPT = "What do you want, and what is in the way?";

const clean = s => String(s || "").replace(/\s+/g, " ").trim().slice(0, MAX_WANT);

/** The saved own want and wall, or null when the newcomer walked in some other way. */
export function own() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return v && v.want && OBSTACLE[v.wall] ? { want: clean(v.want), wall: v.wall } : null;
  } catch (e) { return null; }
}
export function keep(want, wall) {
  const w = clean(want);
  if (!w || !OBSTACLE[wall]) return null;
  try { sessionStorage.setItem(KEY, JSON.stringify({ want: w, wall })); } catch (e) { /* the walk goes on with today's card */ }
  return { want: w, wall };
}

/** Mara's card for this wall, with the newcomer's want as its ribbon. A missing or unknown wall gives null (today's card). */
export function cardFor(wall, want) {
  const c = CARDS[wall];
  return c ? { words: c.words, back: c.back, goalText: clean(want) } : null;
}
export const cap = t => t ? t[0].toUpperCase() + t.slice(1) : "";

/* The wall drawn as terrain on the map (hdw-own-walk-look-1 B, 2026-11-16). The seven pieces are the episode sheet's obstacle
   table: a river, a wall, a closed house, a steep climb, a border, a broken bridge, a toll road. Each lies across the map's path
   in the same brown ink as the road. Plain 2D calls only, so a test can run it against a recording stand-in. */
export const MAP_W = 512, MAP_H = 364;
const INK = "rgba(90,60,40,.85)";
function piece(x, wall) {
  x.lineWidth = 2.5; x.strokeStyle = INK; x.lineJoin = "round"; x.lineCap = "round";
  if (wall === "time") { // a river: a blue band with two wavering banks
    x.fillStyle = "rgba(74,132,170,.55)"; x.beginPath(); x.moveTo(-18, -78);
    for (let y = -78; y <= 78; y += 12) x.lineTo(-18 + Math.sin(y / 11) * 7, y);
    for (let y = 78; y >= -78; y -= 12) x.lineTo(18 + Math.sin(y / 11 + 1) * 7, y);
    x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = "rgba(240,248,252,.8)"; x.lineWidth = 1.5; for (let y = -60; y <= 60; y += 30) { x.beginPath(); x.moveTo(-8, y); x.quadraticCurveTo(0, y - 6, 8, y); x.stroke(); }
  } else if (wall === "money") { // a wall: courses of stone across the road
    x.fillStyle = "#b9aa90";
    for (let r = 0, y = -78; y < 78; y += 13, r++) for (let c = 0; c < 2; c++) { const px = -20 + c * 20 + (r % 2 ? 10 : 0) - 10; x.fillRect(px, y, 20, 13); x.strokeRect(px, y, 20, 13); }
  } else if (wall === "a person") { // a closed house: a roof, a shut door, a shuttered window
    x.fillStyle = "#d8c4a2"; x.fillRect(-30, -28, 60, 50); x.strokeRect(-30, -28, 60, 50);
    x.fillStyle = "#9a5a3a"; x.beginPath(); x.moveTo(-38, -28); x.lineTo(0, -62); x.lineTo(38, -28); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = "#5b3a24"; x.fillRect(-9, -2, 18, 24); x.strokeRect(-9, -2, 18, 24);
    x.beginPath(); x.arc(5, 12, 1.8, 0, 7); x.fill();
    x.strokeRect(14, -20, 10, 10); x.beginPath(); x.moveTo(19, -20); x.lineTo(19, -10); x.stroke();
  } else if (wall === "health") { // a steep climb: a ridge of hills with a stair of steps going up
    x.fillStyle = "#a8b890"; x.beginPath(); x.moveTo(-60, 50); x.lineTo(-28, -30); x.lineTo(-6, 4); x.lineTo(20, -56); x.lineTo(60, 50); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-6, 44); for (let i = 0; i < 6; i++) { x.lineTo(-6 + i * 4, 44 - i * 13 - 0); x.lineTo(-2 + i * 4, 44 - i * 13 - 0); x.lineTo(-2 + i * 4, 44 - (i + 1) * 13); } x.stroke();
  } else if (wall === "a place") { // a border: a dashed line of posts with a flag at the middle post
    x.setLineDash([7, 7]); x.beginPath(); x.moveTo(0, -78); x.lineTo(0, 78); x.stroke(); x.setLineDash([]);
    x.fillStyle = "#6b4b36"; for (const y of [-70, -35, 0, 35, 70]) { x.fillRect(-4, y - 7, 8, 14); x.strokeRect(-4, y - 7, 8, 14); }
    x.fillStyle = "#c06a4a"; x.beginPath(); x.moveTo(4, -7); x.lineTo(30, -1); x.lineTo(4, 5); x.closePath(); x.fill(); x.stroke();
  } else if (wall === "a skill") { // a broken bridge: a river, the planks stopping short of the far bank
    x.fillStyle = "rgba(74,132,170,.55)"; x.fillRect(-36, -78, 72, 156); x.strokeRect(-36, -78, 72, 156);
    x.fillStyle = "#a98258"; for (const px of [-34, -23, -12, 15, 26]) { x.fillRect(px, -12, 9, 24); x.strokeRect(px, -12, 9, 24); }
    x.beginPath(); x.moveTo(-1, -12); x.lineTo(4, -3); x.lineTo(-2, 4); x.lineTo(3, 12); x.stroke();
  } else if (wall === "a duty") { // a toll road: a booth with a barrier pole lowered across the road, and a coin
    x.fillStyle = "#d8c4a2"; x.fillRect(-30, -78, 26, 30); x.strokeRect(-30, -78, 26, 30);
    x.fillStyle = "#9a5a3a"; x.fillRect(-34, -86, 34, 9); x.strokeRect(-34, -86, 34, 9);
    x.save(); x.lineWidth = 7; x.strokeStyle = "#8a3b2a"; x.beginPath(); x.moveTo(6, 52); x.lineTo(6, -56); x.stroke(); x.restore();
    x.fillStyle = "#d6a93c"; x.beginPath(); x.arc(26, 40, 8, 0, 7); x.fill(); x.stroke();
  }
}
/** Draws the newcomer's wall across the map's road. Does nothing for an unknown wall. @param {CanvasRenderingContext2D} x @param {string} wall */
export function drawWall(x, wall) {
  if (!OBSTACLE[wall]) return;
  x.save(); x.translate(300, 200);
  if (wall !== "a person" && wall !== "health") x.rotate(-0.93); // the road's heading there; a long piece lies across it, a house and a hill stand upright on it
  piece(x, wall);
  x.restore();
  x.fillStyle = "rgba(90,60,40,.8)"; x.font = "italic 22px Marcellus, serif"; x.fillText(OBSTACLE[wall], 24, 340);
}
