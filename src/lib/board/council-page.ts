/**
 * The Council Board page needs three things at serve time that the claude.ai artifact got from its runtime.
 * Its Send button fires a Claude Code Remote routine through `mcp.callTool`, which bars-engine does not offer: the save
 * itself reaches the board, so Send has nothing left to ask for. The same
 * substitutions as six-faces-council board/nonprofit/build.py make the bar say so. Each replacement is optional, so a
 * template change in six-faces-council degrades to the shim's "sending is turned off" message instead of a 503;
 * `missingCouncilPatches` names what no longer matched so a test (and a log line) can say so.
 */
const PATCHES: [string, string][] = [
  ['btn.hidden = !mcp || !n;', 'btn.hidden = true;'],
  ['else msg.textContent = mcp ? `', 'else msg.textContent = false ? `'],
  ['`${what} saved. This view cannot reach Claude, so tell Claude in chat that you saved.`',
   // His answer is live the moment it saves; main only keeps a record of rulings (Wendell, 2026-11-03: "The answers
   // aren't supposed to land of main for any reason aside from a record of decisions"). The bar says what happens next.
   "`${what} saved. Claude starts the work within the hour. Nobody needs telling.`"],
  ["const PICKUP_TRIGGER = 'trig_01L138vKTaN9MSJoFKRmaBNx'", "const PICKUP_TRIGGER = ''"],
]

export function patchCouncilPage(html: string): string {
  let out = html
  for (const [from, to] of PATCHES) out = out.includes(from) ? out.replace(from, () => to) : out
  return out
}

export function missingCouncilPatches(html: string): string[] {
  return PATCHES.map(([from]) => from).filter(from => !html.includes(from))
}
