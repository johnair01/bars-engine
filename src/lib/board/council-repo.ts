/** Reads of the council repo (wendell-britt/Six-faces-council) from raw.githubusercontent.com. The repo went private on
 * 2026-10-30, so a raw read needs a fine-grained token with read-only Contents access to that one repo, kept in the
 * COUNCIL_REPO_READ_TOKEN env var. Without the token the headers are empty and a public repo still reads as before. */
export function councilRepoHeaders(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const t = env.COUNCIL_REPO_READ_TOKEN
  return t ? { Authorization: `Bearer ${t}` } : {}
}
