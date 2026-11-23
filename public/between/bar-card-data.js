// The BAR as one card with two sides: the pure part (no imports, so a test reads it). Board bar-two-sides-look-1, A
// (Wendell, 2026-11-21): a seal the player draws with the brush on one side, the moment it was made in on the other.
// Every surface (the Elder's altar, the farm, the sheet) draws the same card from the same record: { seal, moment }.
export const GIVEN_AT = 'the Heaven sect altar, by the Elder';
export const MAX_STROKES = 12, MAX_POINTS = 240;

/** Strokes as the pad collects them, [[x, y]...][] in 0..1 of the pad. Keeps finite points inside the pad, caps the count. Pure. */
export function cleanSeal(strokes) {
  if (!Array.isArray(strokes)) return [];
  const out = [];
  for (const s of strokes.slice(0, MAX_STROKES)) {
    if (!Array.isArray(s)) continue;
    const pts = s.slice(0, MAX_POINTS).filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map(p => [Math.min(1, Math.max(0, +p[0].toFixed(3))), Math.min(1, Math.max(0, +p[1].toFixed(3)))]);
    if (pts.length) out.push(pts);
  }
  return out;
}

const clip = t => String(t || '').replace(/[\s.,;]+$/, '').trim();
/** The fields on the back, read from the sentence the player wrote ("what, who it reaches, by when, what it costs").
 *  Only what the sentence says: a field it does not name is left out, never guessed. Pure. */
export function momentFields(sentence) {
  const s = String(sentence || '').replace(/\s+/g, ' ').trim(), f = {};
  const costs = s.match(/\b(?:it )?costs? (?:me|us)\s+(.+?)(?:[.;]|$)/i);
  if (costs) f.costs = clip(costs[1]);
  const body = costs ? s.slice(0, costs.index) : s;
  const by = body.match(/\bby\s+((?:the )?(?:end of (?:the )?\w+|tomorrow|tonight|noon|midnight|\w+day|before (?:i|we) \w+|\d{1,2}(?::\d\d)?\s*(?:am|pm)?|[^,.;]{1,24}?))\s*(?:[,.;]|$)/i);
  if (by) f.by = clip(by[1]);
  else { const bf = body.match(/\bbefore (?:i|we) \w+/i); if (bf) f.by = clip(bf[0]); }
  const reach = body.match(/\b(?:call|calls|tell|ask|thank|text|write to|visit|help|meet|email|apologi[sz]e to|talk to|speak to|say (?:it )?to)\s+((?:my|our|the|a|an)\s+[a-z' -]+?|[A-Z][a-z]+)(?=\s+(?:and|about|by|before|to|for|so|at|on|tomorrow|tonight)\b|[,.;]|$)/);
  if (reach) f.reaches = clip(reach[1]);
  return f;
}

/** The rows the back prints, in order. A row appears only when there is a value. Pure. */
export function backRows(moment) {
  const m = moment || {}, f = momentFields(m.sentence), rows = [];
  if (f.reaches) rows.push(['Reaches', f.reaches]);
  if (f.by) rows.push(['By', f.by]);
  if (f.costs) rows.push(['Costs', f.costs]);
  rows.push(['Given at', m.given || GIVEN_AT]);
  return rows;
}
/** "21 Nov" from an ISO date or a Date. Pure. */
export function shortDate(d) {
  const t = d instanceof Date ? d : new Date(d || 0);
  return isNaN(+t) || !+t ? '' : `${t.getUTCDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][t.getUTCMonth()]}`;
}
