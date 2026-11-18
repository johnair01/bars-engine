/** Prints the three scripted runs of the founder support chain. No screen, no model, no network. */
import { RUNS, render, runChain } from '../src/lib/founder-demo/scripted-run'
import { mkdirSync, writeFileSync } from 'node:fs'

const dir = process.argv[2]
if (dir) mkdirSync(dir, { recursive: true })
RUNS.forEach((r, i) => {
  const text = render(runChain(r.name, r.seed, r.choice))
  console.log(text)
  if (dir) writeFileSync(`${dir}/run-${'ABC'[i]}.txt`, text)
})
