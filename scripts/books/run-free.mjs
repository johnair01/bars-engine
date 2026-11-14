/** Run book-analysis prompts on a free model (Pollinations anonymous tier, GPT-OSS 20B) over the same chunks.
 *  usage: node run-free.mjs chunks.json outDir arm=promptFile ...   (arm "old" reads SYSTEM_PROMPT from book-analyze.ts;
 *  other arms read SECT_LENS_PROMPT from the given sect-lens.ts). One call per 46s: the tier allows 1 reply per 45s per IP. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
const [chunksF, outDir, ...armSpecs] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })
const chunks = JSON.parse(readFileSync(chunksF, 'utf8'))
const grab = (file, name) => readFileSync(file, 'utf8').match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`\\n'))[1]
const ctx = readFileSync('src/lib/allyship-domains-parser-context.ts', 'utf8').match(/PARSER_CONTEXT_SHORT = `([\s\S]*?)`/)[1]
const promptFor = (spec) => {
  const [arm, file] = spec.split('=')
  if (arm === 'old') return [arm, grab('src/actions/book-analyze.ts', 'SYSTEM_PROMPT').replace('${ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT}', ctx)]
  return [arm, grab(file, 'SECT_LENS_PROMPT') || '']
}
const FORMAT = `\n\nAnswer with JSON only: {"quests":[{"title":string,"description":string,"moveType":"wakeUp|cleanUp|growUp|showUp","elder":string|null,"sourceSentence":string|null,"restPath":string|null}]}. Use null for elder, sourceSentence and restPath if the instructions above do not ask for them.`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function call(system, text) {
  for (let t = 0; t < 6; t++) {
    const r = await fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai-fast', max_tokens: 12000, reasoning_effort: 'low', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system + FORMAT }, { role: 'user', content: `Analyze this book chunk and extract quests:\n\n---\n${text}\n---` }] }) })
    const j = await r.json().catch(() => ({}))
    const c = j?.choices?.[0]?.message?.content
    if (c) { try { return JSON.parse(c.replace(/^```json\s*|```$/g, '')).quests ?? [] } catch { console.error('bad json, retry'); } }
    else console.error('retry', j?.error?.message?.slice(0, 80))
    await sleep(46000)
  }
  return []
}
for (const spec of armSpecs) {
  const [arm, system] = promptFor(spec)
  const f = `${outDir}/free-${arm}.json`
  const out = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
  for (const c of chunks) {
    if (out[c.index]?.length) continue
    out[c.index] = await call(system, c.text)
    console.error(arm, c.index, out[c.index].length)
    writeFileSync(`${outDir}/free-${arm}.json`, JSON.stringify(out, null, 1))
    await sleep(46000)
  }
}
