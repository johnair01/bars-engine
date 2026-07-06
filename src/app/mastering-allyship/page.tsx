/**
 * @route /mastering-allyship
 * @entity CAMPAIGN
 * @description The MTGOA cold sales letter — the "Charge Rooms" long-form page for
 *   the book + Oracle deck + coaching. A single top-to-bottom scroll of full-bleed
 *   element-colored rooms (ember → slate → forest → plum → umber → teal → magenta →
 *   close). Every CTA routes to the offer; both quiz cards route to the real quiz
 *   routes. Public, no auth, no AI, static content.
 * @permissions public
 * @dimensions WHO:cold reader, WHAT:book+deck+coaching sale, WHERE:mtgoa funnel, ENERGY:show_up
 *
 * Ported pixel-close from the Claude Design handoff
 * (.specify/specs/mtgoa-sales-letter/design/sales-page/Sales-Letter.dc.html). Per an
 * explicit call, this marketing surface prioritizes fidelity to the Claude Design
 * output over the UI-covenant token system: it uses the design's literal hex inline.
 * Type families still flow through --bars-font-* (Jost / Nunito / Space Mono);
 * aesthetic motion + hover classes live in mastering-allyship.css.
 *
 * Business open-items (README): real offerHref (checkout), Wendell portrait photo.
 */
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { LoopDiagram, SpiralDiagram, LineupDiagram, RoadDiagram } from './SalesDiagrams'

export const metadata: Metadata = {
  title: 'Mastering the Game of Allyship',
  description:
    'The game you were handed was never built for you to win. So let’s design one that is — allyship rebuilt around your real strengths and your actual, un-apologized-for joy.',
}

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

// Business wiring (see header open-items). Every buy button points here; the quiz
// cards point at the real quiz routes.
const OFFER_HREF = '/launch'
const SUPERPOWER_HREF = '/superpower'
const MYTHS_HREF = '/mastering-allyship/myths-read'

const ROOM: CSSProperties = { padding: 'clamp(70px,12vh,120px) 0' }

const GOLD_CTA: CSSProperties = {
  display: 'inline-block',
  textDecoration: 'none',
  fontFamily: DISPLAY,
  fontWeight: 700,
  fontSize: 'clamp(18px,2.6vw,21px)',
  color: '#12100e',
  background: 'linear-gradient(135deg,#ffe08a,#e6b93f 55%,#c07a1e)',
  padding: '19px 44px',
  borderRadius: 13,
  boxShadow: '0 18px 44px -16px rgba(230,185,63,.8)',
}

export default function MasteringAllyshipPage() {
  return (
    <main
      className="sl-page"
      style={{
        fontFamily: BODY,
        color: '#cbc6d0',
        background: '#0b0910',
        overflowX: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ================= HERO ================= */}
      <div
        style={{
          position: 'relative',
          padding: 'clamp(48px,9vh,80px) 24px clamp(56px,10vh,90px)',
          overflow: 'hidden',
          background: 'radial-gradient(125% 100% at 50% -10%,#241134,#0b0910 62%)',
        }}
      >
        <div
          className="sl-breath"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: -60,
            transform: 'translateX(-50%)',
            width: 640,
            height: 420,
            maxWidth: '120vw',
            background: 'radial-gradient(ellipse,rgba(255,95,168,.30),rgba(34,211,238,.14) 52%,transparent 76%)',
            filter: 'blur(16px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', display: 'flex', gap: 44, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="sl-float" style={{ flex: 'none', width: 224, filter: 'drop-shadow(0 30px 54px rgba(0,0,0,.7))' }}>
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mastering-allyship/cover-front.png"
                alt="Mastering the Game of Allyship — a field guide by Wendell Britt"
                style={{ display: 'block', width: '100%', borderRadius: '3px 8px 8px 3px' }}
              />
              <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 10, background: 'linear-gradient(90deg,rgba(0,0,0,.55),transparent)', borderRadius: '0 8px 8px 0' }} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 300, maxWidth: 480 }}>
            <div className="sl-kick" style={{ color: '#ff5fa8' }}>
              Field guide · Oracle deck · Coaching
            </div>
            <h1 className="sl-hl" style={{ margin: '18px 0 0', fontSize: 'clamp(30px,5.4vw,42px)', color: '#fff' }}>
              The game you were handed was never built for you to win.
            </h1>
            <p style={{ margin: '18px 0 0', fontSize: 'clamp(16px,2.3vw,18.5px)', lineHeight: 1.55, color: '#cfc9d6' }}>
              So let’s design one that is — allyship rebuilt around your real strengths and your actual, un-apologized-for joy.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 26, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="#offer" className="sl-cta" style={{ textDecoration: 'none', fontFamily: DISPLAY, fontWeight: 700, fontSize: 16, color: '#0c0910', background: 'linear-gradient(135deg,#ff5fa8,#e6b93f)', padding: '15px 30px', borderRadius: 12, boxShadow: '0 16px 38px -14px rgba(255,95,168,.7)' }}>
                Start the game →
              </a>
              <a href="#quizzes" className="sl-under" style={{ textDecoration: 'none', fontFamily: MONO, fontSize: 12, letterSpacing: '.06em', color: '#b6aec2', borderBottom: '1px solid rgba(182,174,194,.4)', paddingBottom: 2 }}>
                or take the quiz
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ROOM 1 · EMBER · THE OPEN ================= */}
      <section style={{ background: 'linear-gradient(180deg,#2a0d06,#180a12)', ...ROOM, color: '#d8cfc9' }}>
        <div className="sl-col">
          <div className="sl-kick" style={{ color: '#ff8a5c' }}>01 · The open</div>
          <p className="sl-hl" style={{ margin: '26px 0 0', fontWeight: 600, fontSize: 'clamp(26px,4.8vw,40px)', lineHeight: 1.12, color: '#ffe7d8' }}>
            You started this work for a reason.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>
            It’s just hard to connect with that reason over all the fire. So much fire, for a mere Thursday afternoon — and yet here you are.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>
            There’s the volunteer who generates two problems for every one they solve, with real enthusiasm. There’s the conflict that is technically minor and functionally a crisis, because nobody in the building has thirty spare minutes or a single conflict-resolution skill between them, including — you’d admit at gunpoint — you. There’s the consultant you hired <em style={{ color: '#ffcdb8' }}>specifically because</em> they said they took this seriously, who took it so seriously you burned out ahead of schedule. Nobody warned you burnout could be a deliverable.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>So you did the responsible things.</p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>
            You told your therapist everything. She listens. Beautifully. You are now the most thoroughly understood person ever to burn all the way to the ground. Your coach had a plan — care less, keep your eyes on the prize — which is a bit like telling someone who’s drowning to try being less wet. Once a month you and four colleagues — organizers, board members, other directors — get lunch and agree that it’s all impossible, and that lunch is, if you’re honest, the only system in your life that reliably works.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>
            And when you get home and open your phone to <em style={{ color: '#ffcdb8' }}>not think about it</em> for ten minutes, your phone has prepared a full briefing on every way you are currently insufficient. The algorithm, at least, is fully committed to your cause.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>
            The general verdict, spoken and unspoken, is that you’re drowning because you never learned to hold it all with grace — grace being the skill you were supposed to build in your zero spare minutes, using your zero remaining energy.
          </p>
          <p className="sl-p" style={{ color: '#d6c8c0' }}>Here’s the thing nobody in that whole lineup will say to you. So I will.</p>
          <p className="sl-hl" style={{ margin: '34px 0 0', fontSize: 'clamp(32px,6.4vw,56px)', lineHeight: 1.02, color: '#ff6a4d' }}>
            You are not failing at this.
          </p>
          <p style={{ margin: '26px 0 0', fontSize: 'clamp(18px,2.6vw,22px)', lineHeight: 1.5, color: '#ffe0d2' }}>
            You are playing a game that was built to feed on exactly the feeling you’re having right now — and to produce more of it.
          </p>
        </div>
        <figure className="sl-fig" style={{ padding: '0 24px' }}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <LoopDiagram />
          </div>
          <figcaption className="sl-cap" style={{ color: '#c98a6a' }}>The game you were handed. It was never designed to close.</figcaption>
        </figure>
      </section>

      {/* ================= ROOM 2 · SLATE · THE LINEUP ================= */}
      <section style={{ background: 'linear-gradient(180deg,#12161d,#0d1015)', ...ROOM, color: '#c3c8d1' }}>
        <div className="sl-col">
          <div className="sl-kick" style={{ color: '#b9c1cb' }}>02 · The lineup</div>
          <h2 className="sl-hl" style={{ margin: '18px 0 0', fontSize: 'clamp(28px,5vw,42px)', color: '#e6eaf0' }}>
            Look at everyone who’s tried to help.
          </h2>
          <p className="sl-p" style={{ color: '#c0c5ce' }}>
            The therapist gave you understanding. The coach gave you distance. The consultant gave you a strategy. The lunch table gives you company. Every one of them is kind. Not one of them gave you a <em style={{ color: '#e6eaf0' }}>move</em> — a specific thing to do on Thursday, in the fire, with the volunteer and the conflict and the eight minutes you have before the next meeting.
          </p>
          <p className="sl-p" style={{ color: '#c0c5ce' }}>
            And here’s the part that’s harder to say. You have never once left that lunch with a plan. You leave with a reservation for next month. On some level, quietly, everyone at that table needs you to still be struggling by then — because if you climbed out, the water would look different for all of them. Misery is not just loving company. Misery is <em style={{ color: '#e6eaf0' }}>recruiting</em>.
          </p>
          <p className="sl-p" style={{ color: '#c0c5ce' }}>
            That’s not a reason to leave your friends. It’s a reason to notice that the room agreeing with you is not the same as the room helping you.
          </p>
        </div>
        <figure className="sl-fig" style={{ maxWidth: 460, padding: '0 24px' }}>
          <div style={{ maxWidth: 460, margin: '0 auto' }}>
            <LineupDiagram />
          </div>
          <figcaption className="sl-cap" style={{ color: '#9aa4b0', maxWidth: 400 }}>
            Therapist, coach, consultant, lunch. All pointing in. The center — a move — stays empty.
          </figcaption>
        </figure>
      </section>

      {/* ================= ROOM 3 · FOREST · THE TURN ================= */}
      <section style={{ background: 'linear-gradient(180deg,#04220f,#06120b)', ...ROOM, color: '#c2d6ca' }}>
        <div className="sl-col">
          <div className="sl-kick" style={{ color: '#4fe0a0' }}>03 · The turn</div>
          <p style={{ margin: '26px 0 0', fontSize: 'clamp(18px,2.6vw,21px)', lineHeight: 1.6, color: '#dcefe4' }}>
            So let me tell you what’s actually happening, because once you see it you can’t unsee it, and unseeing it was the only thing keeping you in your seat.
          </p>
          <p className="sl-p" style={{ color: '#bcd6c8' }}>
            The game you’re playing was designed not to be fun. It runs on your dissatisfaction. It takes your care — the realest thing about you — and converts it into a debt you can never pay down, then bills you monthly in guilt. The worse you feel, the harder you play. The harder you play, the worse you feel. That’s not a bug you haven’t fixed yet. That’s the product working as intended.
          </p>
          <p className="sl-hl" style={{ margin: '38px 0 0', fontWeight: 600, fontSize: 'clamp(24px,4.4vw,36px)', lineHeight: 1.14, color: '#eafff4' }}>
            You’ve now hit enough dissatisfaction to suspect there has to be a better way.
          </p>
          <p style={{ margin: '22px 0 0', fontSize: 'clamp(18px,2.6vw,22px)', lineHeight: 1.5, color: '#dcefe4' }}>
            You’re right. There is. And it is not <em style={{ color: '#6fe6b2' }}>care less</em>.
          </p>
          <p className="sl-p" style={{ color: '#bcd6c8' }}>
            The move is to put the game down. Not the caring — the <em style={{ color: '#eafff4' }}>game</em>. The one you were handed, with its unwinnable rules and its unpayable debt, and to build a different one. One tuned to your actual satisfaction and the actual satisfaction of the people you’re trying to stand beside. Because if the way you help requires you to disappear, collapse, or drown, you both lost — that was never allyship, that was just a nicer word for it.
          </p>
          <p className="sl-hl" style={{ margin: '34px 0 0', fontSize: 'clamp(26px,4.8vw,40px)', lineHeight: 1.08, color: '#6fe6b2' }}>
            Care by design.
            <br />
            <span style={{ color: '#eafff4' }}>Not out of social obligation.</span>
          </p>
        </div>
        <figure className="sl-fig" style={{ padding: '0 24px' }}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <SpiralDiagram />
          </div>
          <figcaption className="sl-cap" style={{ color: '#5db98c' }}>The game you design. It’s built to open.</figcaption>
        </figure>
        <div className="sl-col">
          <p className="sl-p" style={{ color: '#bcd6c8' }}>
            This is the part of the movie where someone waves a set wall and it wobbles, or offers you a particular pill, or where you finally notice you can’t win the game because you didn’t design it — and it was never built for you to win. Pick your metaphor. It’s the same scene. You’re waking up inside something someone else built.
          </p>
        </div>
      </section>

      {/* ================= ROOM 4 · PLUM · THE DISCLOSURE ================= */}
      <section style={{ background: 'linear-gradient(180deg,#1c1030,#120a1c)', ...ROOM, color: '#cdc4d8' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
          <div className="sl-kick" style={{ color: '#d9a8f0' }}>04 · The disclosure</div>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 22 }}>
            <div style={{ flex: 1, minWidth: 280, maxWidth: 520 }}>
              <h2 className="sl-hl" style={{ margin: 0, fontSize: 'clamp(26px,4.6vw,38px)', color: '#f0e6fa' }}>
                Now — I should say this before you do.
              </h2>
              <p className="sl-p" style={{ color: '#cbc2d8' }}>
                I am a man on the internet promising that allyship can be <em style={{ color: '#ecd9f6' }}>fun</em>. I hear it too. Somewhere in you a small, sensible voice just went, <em style={{ color: '#ecd9f6' }}>oh no, it’s one of these.</em>
              </p>
              <p className="sl-p" style={{ color: '#cbc2d8' }}>Keep the voice. You’ll want it. It’s good at spotting a grift.</p>
              <p className="sl-p" style={{ color: '#cbc2d8' }}>
                But notice something about it, gently: it is the same voice that has kept you exactly where you are for years. And in all that time, for all its vigilance, it has never once offered you a plan. It’s very good at <em style={{ color: '#ecd9f6' }}>no</em>. It has no idea what <em style={{ color: '#ecd9f6' }}>yes</em> looks like.
              </p>
            </div>
            <figure style={{ flex: 'none', width: 260, margin: 0 }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(217,168,240,.25)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06),0 24px 50px -24px rgba(0,0,0,.8)',
                  aspectRatio: '4 / 5',
                  background: '#1a1226',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                }}
              >
                {/* Portrait slot — swap for a real candid <img> of Wendell (mid-sentence, ~4:5). */}
                <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.1em', lineHeight: 1.7, textAlign: 'center', color: '#7c6b90' }}>
                  Drop a candid photo of Wendell — mid-sentence, not a headshot
                </span>
              </div>
              <figcaption style={{ margin: '12px 2px 0', fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#a48ec0' }}>
                Wendell Britt · in the middle of it
              </figcaption>
            </figure>
          </div>
          <div style={{ maxWidth: 640 }}>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>So here’s who’s actually asking.</p>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>
              I ran DEI and inclusivity at Blue Sky Studios (the animation studio behind the <em style={{ color: '#ecd9f6' }}>Ice Age</em> films), where the job was making the place actually work for the artists in it — which mostly meant helping people advocate for their own needs instead of waiting to be rescued. I’ve built allyship curriculum and run the room where people practice it. I ran alumni engagement at a college on a belief I’ve never been able to shake: people are moved by <em style={{ color: '#ecd9f6' }}>satisfaction</em>, not scarcity, and you don’t need a mountain of resources to make a real change — you need a better game. And around all of that, my life reads like someone shuffled a deck of unrelated careers and dealt me the whole thing: I’ve sold phones, taught writing to Baltimore kids for five years, hosted a podcast about loving things well instead of only tearing them apart. Every one of those rooms was the same lesson in a different costume — how to help a specific kind of person get effective without burning to the ground.
            </p>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>
              I’m trained in the deep end of this, too — IFS, shadow work, Integral, Jungian — and I design games for a living. That’s the toolkit I bring to your corner. Not theory I read. Rooms I’ve stood in.
            </p>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>
              I’m not asking you to trust me. Three years ago, four hundred people did — they funded this before it existed, on the strength of a promise and a course I’d already built and run once, in 2020, and then they waited while I learned the hard way that you cannot build a thing about allyship from a place of scarcity and self-punishment without becoming a worse ally in the process. (I did that. Publicly. It’s in the book.) They’re still here. I finally finished. That’s the whole résumé.
            </p>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>
              And this isn’t theory, or new. People have been doing this work with me for years — before the book, before the deck, back when it was just me, a small room, and a lot of uncomfortable questions. Here’s one of them, after going into the part of himself he’d been at war with since he was nine:
            </p>
            <blockquote style={{ margin: '32px 0 0', padding: '26px 30px', borderLeft: '2px solid #d9a8f0', background: 'linear-gradient(120deg,rgba(217,168,240,.10),rgba(217,168,240,.02))', borderRadius: '0 12px 12px 0' }}>
              <p style={{ margin: 0, fontFamily: BODY, fontStyle: 'italic', fontSize: 'clamp(17px,2.4vw,20px)', lineHeight: 1.55, color: '#efe7f6' }}>
                “An entire cast of characters came forth… the wounds my Warrior has been carrying for nearly two decades are finally being seen and healed, after all this time. This is some magical work you’re bringing forth, Wendell.”
              </p>
              <cite style={{ display: 'block', marginTop: 14, fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontStyle: 'normal', color: '#a48ec0' }}>
                — A participant, on meeting his Warrior
              </cite>
            </blockquote>
            <p className="sl-p" style={{ color: '#cbc2d8' }}>
              I won’t tell you that’s typical, or promise you the same. I’m telling you it’s <em style={{ color: '#ecd9f6' }}>possible</em> — from someone who was pretty sure it wasn’t.
            </p>
          </div>
        </div>
      </section>

      {/* ================= ROOM 5 · UMBER · THE OFFER ================= */}
      <section id="offer" style={{ background: 'radial-gradient(120% 80% at 50% 0%,#2a1704,#160d05 66%)', padding: 'clamp(80px,13vh,130px) 0', color: '#d8c9a8', borderTop: '1px solid rgba(230,185,63,.14)' }}>
        <div className="sl-col" style={{ textAlign: 'center' }}>
          <div className="sl-kick" style={{ color: '#e6b93f' }}>05 · What this actually is</div>
          <h2 className="sl-hl" style={{ margin: '18px 0 0', fontSize: 'clamp(28px,5.2vw,44px)', color: '#f5e2b0' }}>
            Three things, built to work as one.
          </h2>
        </div>
        <div style={{ maxWidth: 760, margin: '44px auto 0', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* The Deck */}
          <div style={{ borderRadius: 16, padding: '28px 30px', background: 'rgba(20,14,6,.6)', border: '1px solid rgba(230,185,63,.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e6b93f' }}>The Deck</div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8a7440' }}>a move in your pocket</div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 'clamp(15.5px,2.2vw,17px)', lineHeight: 1.6, color: '#cfc2a4' }}>
              When your Thursday is on fire, you don’t need a framework. You need to know what to <em style={{ color: '#eeddb0' }}>do</em> in the next ninety seconds. You pull a card. It asks you one sharp question and hands you a move — through the lens of whichever part of you the moment is calling for. You don’t like that one? Pull again. Keep pulling until one fits. Let the cards decide, so you don’t have to be the person who solves it perfectly under pressure (that person is exhausted; we’ve met her). There’s an intake, so the deck learns your actual situation and hands you cards tuned to it. It’s the plan nobody in the lineup would give you, small enough to fit in a pocket.
            </p>
          </div>
          {/* The Book */}
          <div style={{ borderRadius: 16, padding: '28px 30px', background: 'rgba(20,14,6,.6)', border: '1px solid rgba(230,185,63,.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e6b93f' }}>The Book</div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8a7440' }}>the new map</div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 'clamp(15.5px,2.2vw,17px)', lineHeight: 1.6, color: '#cfc2a4' }}>
              The deck gives you moves. The book gives you the game. Six roles you’re already playing whether you named them or not, the shadow each one throws when you’re tired, and — the actual point — how to stop running the game you were handed and design one that’s yours. It’s the map for the redesign.
            </p>
          </div>
          {/* Coaching — highlighted */}
          <div style={{ position: 'relative', borderRadius: 16, padding: '28px 30px', background: 'linear-gradient(150deg,rgba(230,185,63,.16),rgba(230,185,63,.03))', border: '1px solid rgba(230,185,63,.5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06),0 0 34px -14px rgba(230,185,63,.6)', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 22, right: 26, fontFamily: MONO, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#12100e', background: 'linear-gradient(135deg,#ffe08a,#e6b93f)', padding: '5px 10px', borderRadius: 6, fontWeight: 700 }}>
              Go all the way
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#f5d478' }}>Coaching</div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#b79a54' }}>someone in your corner</div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 'clamp(15.5px,2.2vw,17px)', lineHeight: 1.6, color: '#e2d3ac' }}>
              This is the one only I do. I’m not another person who’ll listen, and I’m definitely not going to tell you to care less. I’ll be your Allyship Game Master. Together we go find the parts of you still loyal to the old rules — the ones convinced you have to suffer to be good — and instead of fighting them, we enroll them. Turn the saboteurs into allies. It’s the deprogramming, done with someone who’s in the fire with you instead of watching from a chair.
            </p>
          </div>
        </div>
        <figure className="sl-fig" style={{ maxWidth: 460, padding: '0 24px' }}>
          <div style={{ maxWidth: 460, margin: '0 auto' }}>
            <RoadDiagram />
          </div>
          <figcaption className="sl-cap" style={{ color: '#c9a45a', maxWidth: 400 }}>
            Deck, book, coaching — they converge into one paved road. Deck + book is the yes. Coaching is the go-all-the-way.
          </figcaption>
        </figure>
        <div style={{ maxWidth: 760, margin: '36px auto 0', padding: '0 24px', textAlign: 'center' }}>
          <a href={OFFER_HREF} className="sl-cta" style={GOLD_CTA}>
            Start the game →
          </a>
        </div>
      </section>

      {/* ================= ROOM 6 · TEAL · THE PROOF ================= */}
      <section style={{ background: 'linear-gradient(180deg,#06202a,#0a1418)', ...ROOM, color: '#b6cdd2' }}>
        <div className="sl-col">
          <div className="sl-kick" style={{ color: '#4fd0e0' }}>06 · What actually happens</div>
          <h2 className="sl-hl" style={{ margin: '18px 0 0', fontSize: 'clamp(28px,5vw,42px)', color: '#d6f2f6' }}>
            Here’s what I’ll stand behind.
          </h2>
          <p className="sl-p" style={{ color: '#b6cdd2' }}>
            Let me tell you what I actually see — and I’ll keep it to what I’d stand behind with my name on it.
          </p>
          <p className="sl-p" style={{ color: '#b6cdd2' }}>
            People who <em style={{ color: '#daf0f4' }}>do</em> this work — do it, not just read about it — tend to walk out with something they came in without. Not a motivational high that’s gone by Monday. Sustainable emotional resources: an actual, refillable supply where the fear and the dissatisfaction used to be. That’s the reliable one. That’s the one I’ll promise.
          </p>
          <p className="sl-p" style={{ color: '#b6cdd2' }}>
            Then there’s the part I didn’t design and can’t fully explain. Once someone sees themselves — and the game they’ve been playing — clearly, things start to move. People change jobs. End the relationship that was quietly costing them everything. Finally move to the city they’d been talking about for years. One parent came to this work trying to get support services for their disabled child, and left it running for — and winning — a seat on a major city’s school board. From asking for help to holding office. The things blocking a life that actually fits start falling away. I keep expecting it to stop happening. It hasn’t.
          </p>
          <p style={{ margin: '30px 0 0', fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(20px,3.4vw,26px)', lineHeight: 1.2, letterSpacing: '-.01em', color: '#d6f2f6' }}>
            You don’t have to take my word for any of it. Take theirs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginTop: 44 }}>
            {[
              { claim: 'On the reframe — that allyship can deepen your life instead of empty it', quote: '“My most important insight was that allyship is a tool to deepen and have more authentic relationships. My ideal ally integrates it into work, life, and friendships — especially the close ones.”' },
              { claim: 'On whether it’s for someone like you — who helps for a living and lost where the joy went', quote: '“As a counselor, I’ve worked with people from every walk of life and found ways to connect with everyone. The work has been to find the fun in that — and for most of my career, that’s been missing. This is helping me find my way.”' },
              { claim: 'On the part of you certain it has to earn every good thing — the one this work finds', quote: '“OH, IT’S YOU who’s been getting in the way of my fun all these years. This part just loves to make me feel guilty for anything that isn’t ‘productive.’ He’s internalized compound interest and applied it to my entire life. laugh sob. I’d love to change his mind, just a little — so I can enjoy what’s out there without a judgmental voice in my ear.”' },
              { claim: 'And on the fact that, against all odds, it’s fun', quote: '“Bwahahaha. Honestly, I was ready for my guide to be Mr. Rogers — gentle, compassionate, caring. Nope. Instead I got a magic mushroom. Hella weird and cute. Sounds about right.”' },
            ].map(({ claim, quote }) => (
              <div key={claim}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: '#4fd0e0', lineHeight: 1.5 }}>{claim}</div>
                <blockquote style={{ margin: '14px 0 0', padding: '22px 26px', borderRadius: 12, background: 'rgba(8,26,34,.6)', border: '1px solid rgba(79,208,224,.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: 'clamp(16px,2.3vw,18.5px)', lineHeight: 1.56, color: '#daf0f4' }}>{quote}</p>
                </blockquote>
              </div>
            ))}
          </div>
          <p className="sl-p" style={{ color: '#b6cdd2' }}>
            That last one is the tell. This work goes deep — it finds old wounds and it doesn’t flinch. But somewhere in it, people start laughing again. That isn’t a side effect. That’s the redesign working.
          </p>
        </div>
      </section>

      {/* ================= ROOM 7 · MAGENTA · THE ON-RAMPS ================= */}
      <section id="quizzes" style={{ background: 'linear-gradient(180deg,#1c0f2a,#120a1c)', ...ROOM, color: '#cbc0d0' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
          <div className="sl-kick" style={{ color: '#ff5fa8' }}>07 · Two on-ramps</div>
          <h2 className="sl-hl" style={{ margin: '18px 0 0', fontSize: 'clamp(28px,5vw,42px)', color: '#f6e0ee' }}>
            Not ready to buy a thing from a man promising fun. Fair. Play instead.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, marginTop: 40 }}>
            <a href={SUPERPOWER_HREF} className="sl-quiz-card" style={{ textDecoration: 'none', position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 16, padding: '30px 30px 26px', background: 'rgba(24,14,34,.6)', border: '1px solid rgba(255,95,168,.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)', overflow: 'hidden', ...({ '--sl-card-border-hover': 'rgba(255,95,168,.6)', '--sl-card-glow': 'rgba(255,95,168,.6)' } as CSSProperties) }}>
              <div style={{ position: 'absolute', right: -24, top: -24, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,95,168,.26),transparent 66%)' }} />
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#ff5fa8' }}>Quiz 01 · the flip</div>
              <h3 className="sl-hl" style={{ margin: '12px 0 0', fontSize: 'clamp(21px,3vw,26px)', color: '#f6e0ee' }}>The Superpower Quiz</h3>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: '#c7bcd4' }}>
                Surfaces the private belief quietly running your allyship — and shows you the superpower on the other side of it. The belief and the gift are the same charge, pointed two different directions.
              </p>
              <div style={{ marginTop: 20, fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: '#ff77b6' }}>Find your superpower →</div>
            </a>
            <a href={MYTHS_HREF} className="sl-quiz-card" style={{ textDecoration: 'none', position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 16, padding: '30px 30px 26px', background: 'rgba(24,14,34,.6)', border: '1px solid rgba(255,95,168,.28)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)', overflow: 'hidden', ...({ '--sl-card-border-hover': 'rgba(199,123,255,.6)', '--sl-card-glow': 'rgba(168,85,247,.5)' } as CSSProperties) }}>
              <div style={{ position: 'absolute', right: -24, top: -24, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,.28),transparent 66%)' }} />
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: '#c77bff' }}>Quiz 02 · the mirror</div>
              <h3 className="sl-hl" style={{ margin: '12px 0 0', fontSize: 'clamp(21px,3vw,26px)', color: '#f6e0ee' }}>The Myths Quiz</h3>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: '#c7bcd4' }}>
                Finds which myth of “good allyship” is currently running you — being good, saying the right words, never causing harm — and reframes it toward the real game. Names the trap, then the redesign.
              </p>
              <div style={{ marginTop: 20, fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, color: '#c77bff' }}>Name the myth →</div>
            </a>
          </div>
        </div>
      </section>

      {/* ================= ROOM 8 · THE CLOSE ================= */}
      <section id="close" style={{ background: 'radial-gradient(120% 100% at 50% 100%,#1a1030,#0b0910 64%)', padding: 'clamp(80px,14vh,140px) 0 clamp(64px,9vh,100px)', color: '#bdbac6' }}>
        <div className="sl-col" style={{ textAlign: 'center' }}>
          <div className="sl-kick" style={{ color: '#e6b93f' }}>08 · The close</div>
          <p style={{ margin: '26px auto 0', maxWidth: 600, fontSize: 'clamp(17px,2.4vw,19.5px)', lineHeight: 1.62, color: '#bdbac6' }}>
            One honest thing before you decide — because you should know what you’re walking into.
          </p>
          <p style={{ margin: '16px auto 0', maxWidth: 600, fontSize: 'clamp(17px,2.4vw,19.5px)', lineHeight: 1.62, color: '#bdbac6' }}>
            This tends to change things. Not in a workshop-glow way that fades by the weekend. In a you-leave-the-job, you-end-the-arrangement, you-redraw-the-whole-map way — once you can finally see the map. If what you want is to feel a little better while everything around you stays exactly as it is, this is the wrong door, and I’d rather tell you that now than take your money and pretend otherwise.
          </p>
          <p className="sl-hl" style={{ margin: '28px auto 0', maxWidth: 600, fontWeight: 600, fontSize: 'clamp(20px,3.6vw,28px)', lineHeight: 1.16, color: '#f4f1ea' }}>
            This is for the version of you that’s already done pretending the current setup is working.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(24px,7vw,60px)', margin: '44px auto 0', maxWidth: 440 }}>
            <div style={{ flex: 1, maxWidth: 150, opacity: 0.9 }}>
              <LoopDiagram />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 22, color: '#6b6965' }}>→</div>
            <div style={{ flex: 1, maxWidth: 150, opacity: 0.9 }}>
              <SpiralDiagram />
            </div>
          </div>
          <h2 className="sl-hl" style={{ margin: '46px 0 0', fontSize: 'clamp(26px,4.8vw,40px)', color: '#f4f1ea' }}>
            So here’s the only real question.
          </h2>
          <p style={{ margin: '26px auto 0', maxWidth: 600, fontSize: 'clamp(17px,2.4vw,19.5px)', lineHeight: 1.62, color: '#bdbac6' }}>
            Do you want to fit in and keep drowning politely, alongside people who’d be a little threatened if you stopped? Or do you want to find out how far this actually goes — allyship built around your real strengths and your real, un-apologized-for joy?
          </p>
          <p style={{ margin: '24px auto 0', maxWidth: 600, fontSize: 'clamp(17px,2.4vw,19.5px)', lineHeight: 1.62, color: '#bdbac6' }}>
            It’s going to be hard either way. That part isn’t on the table. The work is hard whether you play the old game or design a new one.
          </p>
          <p className="sl-hl" style={{ margin: '34px auto 0', maxWidth: 600, fontWeight: 600, fontSize: 'clamp(22px,4vw,32px)', lineHeight: 1.14, color: '#f4f1ea' }}>
            But it is your one, aggressively non-refundable life.
          </p>
          <p className="sl-hl" style={{ margin: '16px 0 0', fontSize: 'clamp(30px,6vw,52px)', lineHeight: 1.04, color: '#e6b93f' }}>
            You might as well have fun in it.
          </p>
          <div style={{ marginTop: 44 }}>
            <a href={OFFER_HREF} className="sl-cta" style={GOLD_CTA}>
              Start the game →
            </a>
            <div style={{ marginTop: 20 }}>
              <a href="#quizzes" className="sl-under" style={{ textDecoration: 'none', fontFamily: MONO, fontSize: 12.5, letterSpacing: '.08em', color: '#8a8790', borderBottom: '1px solid rgba(138,135,144,.4)', paddingBottom: 2 }}>
                or just take the quiz
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{ padding: '30px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,.06)', background: '#0b0910' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mastering-allyship/mtgoa-logo.png" alt="MTGOA" style={{ width: 26, height: 26, objectFit: 'contain', opacity: 0.8, filter: 'drop-shadow(0 0 8px rgba(255,95,168,.4))' }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#6b6965' }}>
          Mastering the Game of Allyship · © Wendell Britt
        </span>
      </footer>
    </main>
  )
}
