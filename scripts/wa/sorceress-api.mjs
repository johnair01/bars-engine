#!/usr/bin/env node
/**
 * Sorceress Tool API runner. Reads the API key from the app's private secret
 * store (or SORCERESS_API_KEY env / ~/.sorceress-api-key); the key value is
 * never printed, logged, or committed.
 *
 *   node scripts/wa/sorceress-api.mjs probe                 # auth + endpoint check, 0 credits
 *   node scripts/wa/sorceress-api.mjs tools                 # list models + costs, 0 credits
 *   node scripts/wa/sorceress-api.mjs generate --prompt-file p.txt --model nano-banana-pro \
 *        --aspect 9:16 [--resolution 1K] [--ref url1,url2]   # costs credits
 *   node scripts/wa/sorceress-api.mjs poll <jobId>          # 0 credits
 *   node scripts/wa/sorceress-api.mjs download <url> <out>  # 0 credits
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'

const args = process.argv.slice(2)
const cmd = args[0]

const BASE = process.env.SORCERESS_BASE || 'https://sorceress.games'

function loadKey() {
  if (process.env.SORCERESS_API_KEY) return process.env.SORCERESS_API_KEY
  const userFile = `${homedir()}/.sorceress-api-key`
  if (existsSync(userFile)) return readFileSync(userFile, 'utf8').trim()
  const secretDir = `${homedir()}/.deepai-code/userdata/secrets`
  if (existsSync(secretDir)) {
    // any secret-request-*.bin (JSON {value}) — the entry id rotates per request
    const cands = readdirSync(secretDir)
      .filter((f) => /^secret-request-[a-f0-9]+\.bin$/.test(f))
      .map((f) => `${secretDir}/${f}`)
      .filter((f) => statSync(f).size > 32)
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    for (const f of cands) {
      try {
        const v = String(JSON.parse(readFileSync(f, 'utf8')).value)
        if (v) return v
      } catch { /* skip unreadable */ }
    }
  }
  console.error('no sorceress API key found (env SORCERESS_API_KEY, ~/.sorceress-api-key, or app secret store)')
  process.exit(2)
}

function headers(key, style) {
  return style === 'x-api-key'
    ? { 'x-api-key': key, 'content-type': 'application/json' }
    : { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }
}

async function api(path, opts = {}) {
  const key = loadKey()
  const style = opts.style || 'bearer'
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers: headers(key, style),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch { /* leave as text */ }
  return { status: res.status, json, text }
}

async function main() {
  if (cmd === 'probe') {
    for (const style of ['bearer', 'x-api-key']) {
      for (const path of ['/api/v1/tools', '/api/v1/jobs/00000000-0000-0000-0000-000000000000']) {
        const r = await api(path, { style }).catch((e) => ({ status: `ERR ${e.cause?.code || e.message}` }))
        console.log(`${style} GET ${path} -> ${r.status}`)
      }
    }
    return
  }

  if (cmd === 'tools') {
    const r = await api('/api/v1/tools').catch((e) => ({ text: String(e) }))
    if (r.json) {
      const tools = r.json.tools || r.json
      console.log(JSON.stringify(tools, null, 1))
    } else {
      console.log(r.status, r.text?.slice(0, 500))
    }
    return
  }

  if (cmd === 'generate') {
    const flag = (name) => {
      const i = args.indexOf(`--${name}`)
      return i >= 0 ? args[i + 1] : undefined
    }
    const promptFile = flag('prompt-file')
    const promptInline = flag('prompt')
    const prompt = promptFile ? readFileSync(promptFile, 'utf8') : promptInline
    if (!prompt) { console.error('need --prompt-file or --prompt'); process.exit(2) }
    const body = {
      model: flag('model') || 'gpt-image-2',
      prompt,
      aspectRatio: flag('aspect') || '1:3',
      params: { resolution: flag('resolution') || '2K' },
    }
    const refs = flag('ref')
    if (refs) body.refImages = refs.split(',').map((s) => s.trim()).filter(Boolean)
    const r = await api(`/api/v1/tools/image_generate`, { method: 'POST', body }).catch((e) => ({ text: String(e) }))
    console.log(JSON.stringify(r.json ?? { status: r.status, text: r.text?.slice(0, 400) }, null, 1))
    return
  }

  if (cmd === 'poll') {
    const r = await api(`/api/v1/jobs/${args[1]}`).catch((e) => ({ text: String(e) }))
    console.log(JSON.stringify(r.json ?? { status: r.status, text: r.text?.slice(0, 400) }, null, 1))
    return
  }

  if (cmd === 'download') {
    const res = await fetch(args[1])
    if (!res.ok) { console.error(`download failed: ${res.status}`); process.exit(1) }
    writeFileSync(args[2], Buffer.from(await res.arrayBuffer()))
    console.log(`saved ${args[2]}`)
    return
  }

  console.error('unknown command; see header of scripts/wa/sorceress-api.mjs')
  process.exit(2)
}

main()
