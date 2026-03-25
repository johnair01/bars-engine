import Link from 'next/link'

export const metadata = {
  title: 'Your Adventure Path — Wiki',
  description: 'How the CYOA intake and spoke adventure system works for players.',
}

const MOVES = [
  {
    key: 'wakeUp',
    name: 'Wake Up',
    color: 'text-sky-400',
    border: 'border-sky-800/50',
    bg: 'bg-sky-950/20',
    meaning: 'See what is actually true',
    detail:
      "A Wake Up adventure asks you to look clearly at something you've been avoiding or missing. The path tends toward awareness, honest naming, and threshold-crossing.",
  },
  {
    key: 'cleanUp',
    name: 'Clean Up',
    color: 'text-amber-400',
    border: 'border-amber-800/50',
    bg: 'bg-amber-950/20',
    meaning: 'Take responsibility and repair',
    detail:
      'A Clean Up adventure moves through acknowledgement, amends, and honest reckoning. The path tends toward restoring broken things — inside you, or between you and others.',
  },
  {
    key: 'growUp',
    name: 'Grow Up',
    color: 'text-emerald-400',
    border: 'border-emerald-800/50',
    bg: 'bg-emerald-950/20',
    meaning: 'Build real capability',
    detail:
      'A Grow Up adventure challenges you to expand past your current edge. The path tends toward development, new skills, and genuine maturation — not just knowledge but capacity.',
  },
  {
    key: 'showUp',
    name: 'Show Up',
    color: 'text-rose-400',
    border: 'border-rose-800/50',
    bg: 'bg-rose-950/20',
    meaning: 'Act with committed presence',
    detail:
      "A Show Up adventure calls you into decisive action. The path tends toward being fully here, stepping toward others, and doing what you've been holding back.",
  },
]

const PHASES = [
  {
    num: '1',
    title: 'Where are you right now?',
    description:
      'A quick reading of your current state — how stuck or in flow you feel (a 1–10 slider), and which emotional current is most present for you right now (the five channels: joy, anger, neutrality, fear, sadness). This is not a test. It is a tuning fork.',
  },
  {
    num: '2',
    title: 'How intense is that?',
    description:
      'One more calibration: is the feeling running hot, neutral, or flowing? This sets the depth of the adventure you will enter — stuck-and-in-it lands differently than clear-and-ready.',
  },
  {
    num: '3',
    title: 'The story',
    description:
      'A short branching narrative — usually 4–8 scenes. You make real choices. Each choice is weighted, but not in a way you can see. The system reads your navigation as a signal, not a test. There are no wrong paths. At the end, a terminal scene closes.',
  },
  {
    num: '4',
    title: 'Your path is prepared',
    description:
      'Once you reach the end of the intake story, the system generates (or retrieves) a personalized spoke adventure — a second, longer CYOA shaped to where you are right now. This is your actual journey for the session.',
  },
]

export default function CyoaAdventureGuidePage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <Link href="/wiki/player-guides" className="hover:text-zinc-400">Player guides</Link>
          {' / '}
          <span>Your adventure path</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Your Adventure Path</h1>
        <p className="text-sm text-zinc-400 max-w-xl">
          The CYOA intake is a short reading and branching story that routes you into a personalized
          adventure. Here is what it is, how it works, and what to expect.
        </p>
      </header>

      {/* What it is */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">What is this?</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          When you enter a campaign&apos;s adventure path, you go through a short intake — a combination
          of emotional calibration and a choose-your-own-adventure story. The intake is not a
          quiz. It reads your current state and your choices, then routes you into a personalized
          spoke adventure: a second, deeper story built for where you are right now.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The routing is invisible by design. You navigate the story; the system reads the signal.
          Two players can take the same intake and land in completely different adventures —
          each calibrated to them without either one knowing the routing happened.
        </p>
      </section>

      {/* The four phases */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">The four phases</h2>
        <div className="space-y-3">
          {PHASES.map((phase) => (
            <div key={phase.num} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex gap-4">
              <span className="text-2xl font-bold text-zinc-600 leading-none mt-0.5 w-5 shrink-0">{phase.num}</span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">{phase.title}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The four moves */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">The four move types</h2>
        <p className="text-sm text-zinc-400">
          Every adventure is ultimately oriented around one of the four moves. You will not be told
          which one you are in — but you may feel it. Here is what each means:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MOVES.map((move) => (
            <div key={move.key} className={`rounded-xl border ${move.border} ${move.bg} p-4 space-y-1.5`}>
              <p className={`text-sm font-bold ${move.color}`}>{move.name}</p>
              <p className="text-xs text-zinc-400 font-medium">{move.meaning}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{move.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          The move you land in comes from how you navigated the intake — your emotional state,
          your channel, and your choices in the story. It is a reading, not an assignment.{' '}
          <Link href="/wiki/moves" className="text-amber-400 hover:text-amber-300">Learn more about the four moves →</Link>
        </p>
      </section>

      {/* Spoke adventure */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">The spoke adventure</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Once the intake completes, a spoke adventure is prepared for you. This is a full
          branching story — longer than the intake — shaped to your current move orientation and
          the campaign&apos;s context. It may include NPCs from the campaign world who appear
          specifically in your path.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Spoke adventures are generated the first time a particular combination is needed, then
          cached for others who land in the same territory. The story you get was written for your
          orientation — but it is shared with any player who arrives at the same junction.
        </p>
      </section>

      {/* NPCs */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">NPCs in your path</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Some passages in your spoke adventure will name specific characters from the campaign
          world. These are live NPCs drawn from the campaign&apos;s cast. The system selects them by
          role — prioritizing characters you have not encountered yet in this session, and among
          those you have, the ones you met longest ago.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Encountering an NPC in your adventure creates a record. This is how the game tracks
          relational territory — who you have met, when, and what you were navigating when you did.
        </p>
      </section>

      {/* Resuming */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Resuming mid-adventure</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your progress is saved as you go. If you close the tab or navigate away, you will resume
          from your last passage when you return. The check-in step will not repeat if you have already
          completed it today — you will drop straight into the story.
        </p>
      </section>

      {/* For GMs */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-300">For campaign stewards</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          The intake story and its routing weights are authored in the campaign&apos;s Adventure
          template. Spoke adventures are generated automatically on first use and cached per
          orientation. Re-saving the master template invalidates all existing spoke caches —
          new players will trigger fresh generation. The admin interface for this is under{' '}
          <code className="text-xs bg-zinc-800 px-1 rounded text-zinc-400">/admin/adventures</code>.
        </p>
      </section>

      <p className="text-sm">
        <Link href="/wiki/player-guides" className="text-amber-400 hover:text-amber-300">
          ← Player guides
        </Link>
      </p>
    </div>
  )
}
