/**
 * @route /mastering-allyship
 * @entity CAMPAIGN
 * @description The MTGOA cold sales page — a long-form sales letter for the book +
 *   the Oracle Deck, with the Myths Read quiz and the Superpower quiz as the two
 *   on-ramps. Every CTA and both quizzes route to the same stacked offer
 *   (Deck + Book + Coaching). Public, no auth, deterministic (no AI on the reader
 *   path). Social posts point here.
 * @permissions public
 * @dimensions WHO:cold reader, WHAT:book+deck sale, WHERE:mtgoa funnel, ENERGY:show_up
 *
 * Spec: .specify/specs/mtgoa-sales-letter/ — copy adapted faithfully from the Claude
 * Design draft (design/sales-page/MTGOA_SALES_PAGE_DRAFT_v1.md). Testimonials are
 * from earlier method participants, framed as "people who've done this work with
 * me" (permission/verification pending — see spec Open threads). The full copy is
 * pending WB's voice pass before launch; structure + wiring are final.
 *
 * UI_COVENANT: --bars-* tokens + page-local --mtgoa-* accents (mastering-allyship.css);
 * Tailwind/inline for layout only. No hardcoded hex in this file.
 */
import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { offerHref } from '@/lib/launch/offers'
import { SuperpowerQuiz } from '@/components/superpowers/SuperpowerQuiz'
import { MythsReadClient } from './myths-read/MythsReadClient'
import { ChapterOneCapture } from './ChapterOneCapture'
import { LoopDiagram, SpiralDiagram } from './Diagrams'
import { OfferStack } from './OfferStack'

export const metadata: Metadata = {
  title: 'Mastering the Game of Allyship',
  description:
    'A book, a deck, and a game for people who are done performing allyship. You are not failing at this — you are playing a game that was built to feed on the feeling you are having right now.',
}

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p style={{ ...MONO, color: 'var(--bars-gold)' }} className="text-[10px] uppercase tracking-[0.28em]">
      {children}
    </p>
  )
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[16px] leading-[1.7]">
      {children}
    </p>
  )
}

function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`mtgoa-section mx-auto flex w-full max-w-[620px] flex-col gap-5 ${className}`}>{children}</section>
}

function Quote({ children, claim }: { children: ReactNode; claim?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      {claim && (
        <figcaption style={{ ...MONO, color: 'var(--mtgoa-coral)' }} className="text-[10px] uppercase tracking-[0.16em]">
          {claim}
        </figcaption>
      )}
      <blockquote className="mtgoa-quote px-4 py-3">
        <p style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[15px] italic leading-[1.6]">
          {children}
        </p>
      </blockquote>
    </figure>
  )
}

export default function MasteringAllyshipPage() {
  const deckHref = offerHref('deck-digital')

  return (
    <main
      className="min-h-screen w-full px-5 py-16 sm:px-6"
      style={{
        background: 'radial-gradient(120% 40% at 50% -4%, #17110b 0%, var(--bars-bg-base) 46%)',
        color: 'var(--bars-text-primary)',
      }}
    >
      <div className="mx-auto flex max-w-[620px] flex-col gap-20">
        {/* 1 · Hero / the open (recognition) */}
        <Section className="pt-4">
          <Eyebrow>A book, a deck, and a game for people done performing allyship</Eyebrow>
          <h1 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[52px]">
            You are not failing at this.
          </h1>
          <Prose>
            You started this work for a reason. It’s just hard to connect with that reason over all the
            fire — so much fire, for a mere Thursday afternoon, and yet here you are. You told your
            therapist everything; you are now the most thoroughly understood person ever to burn all the
            way to the ground. Your coach had a plan — <em>care less</em> — which is a bit like telling
            someone who’s drowning to try being less wet.
          </Prose>
          <Prose>
            Here’s the thing nobody in that whole lineup will say to you. So I will. You are not failing at
            this. <strong style={{ color: 'var(--bars-text-primary)' }}>You are playing a game that was built to feed on exactly the feeling you’re
            having right now — and to produce more of it.</strong>
          </Prose>
          <LoopDiagram />
        </Section>

        {/* 2 · The lineup (agitation) */}
        <Section>
          <Eyebrow>Look at everyone who’s tried to help</Eyebrow>
          <Prose>
            The therapist gave you understanding. The coach gave you distance. The consultant gave you a
            strategy. The lunch table gives you company. Every one of them is kind. Not one of them gave
            you a <em>move</em> — a specific thing to do on Thursday, in the fire, with the eight minutes
            you have before the next meeting.
          </Prose>
          <Prose>
            And you never once left that lunch with a plan. You leave with a reservation for next month.
            The room agreeing with you is not the same as the room helping you.
          </Prose>
        </Section>

        {/* 3 · The turn (the reframe) */}
        <Section>
          <Eyebrow>So let me tell you what’s actually happening</Eyebrow>
          <Prose>
            The game you’re playing was designed not to be fun. It runs on your dissatisfaction — it takes
            your care, the realest thing about you, and converts it into a debt you can never pay down,
            then bills you monthly in guilt. That’s not a bug you haven’t fixed. That’s the product working
            as intended.
          </Prose>
          <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[22px] font-bold leading-[1.35]">
            The move is to put the game down. Not the caring — the <em>game</em>. And to build a different
            one, tuned to your actual satisfaction and the actual satisfaction of the people you’re trying
            to stand beside.
          </p>
          <Prose>Care by design. Not out of social obligation.</Prose>
          <SpiralDiagram />
        </Section>

        {/* 4 · The disclosure (meet Wendell) */}
        <Section>
          <Eyebrow>Now — I should say this before you do</Eyebrow>
          <Prose>
            I am a man on the internet promising that allyship can be <em>fun</em>. I hear it too. Keep the
            sensible voice that just went <em>oh no, it’s one of these</em> — you’ll want it; it’s good at
            spotting a grift. But notice, gently: it’s the same voice that has kept you exactly where you
            are for years, and in all that time it has never once offered you a plan.
          </Prose>
          <Prose>
            I’m not asking you to trust me. Three years ago, four hundred people did — they funded this
            before it existed, and then waited while I learned the hard way that you cannot build a thing
            about allyship from scarcity and self-punishment without becoming a worse ally in the process.
            (I did that. Publicly. It’s in the book.) They’re still here. I finally finished.
          </Prose>
          <Quote>
            An entire cast of characters came forth… the wounds my Warrior has been carrying for nearly
            two decades are finally being seen and healed, after all this time. This is some magical work
            you’re bringing forth, Wendell.
          </Quote>
        </Section>

        {/* 5 · The stacked offer */}
        <Section>
          <Eyebrow>What this actually is</Eyebrow>
          <h2 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[30px] font-bold leading-tight">
            Three things, built to work as one.
          </h2>
          <Prose>
            The deck gives you moves. The book gives you the game. Coaching is the one only I do — someone
            in the fire with you instead of watching from a chair.
          </Prose>
          <OfferStack />
        </Section>

        {/* 6 · Proof */}
        <Section>
          <Eyebrow>What actually happens</Eyebrow>
          <Prose>You don’t have to take my word for any of this. Take theirs.</Prose>
          <Quote claim="On allyship deepening your life instead of emptying it">
            My most important insight was that allyship is a tool to deepen and have more authentic
            relationships — integrated into work, life, and friendships, especially the close ones.
          </Quote>
          <Quote claim="On finding the fun again">
            As a counselor I’ve found ways to connect with everyone. The work has been to find the fun in
            that — and for most of my career that’s been missing. This is helping me find my way.
          </Quote>
          <Quote claim="On the part that makes you earn every good thing">
            OH, IT’S YOU who’s been getting in the way of my fun all these years. He’s internalized
            compound interest and applied it to my entire life. I’d love to change his mind, just a little.
          </Quote>
          <Prose>
            This work goes deep — it finds old wounds and doesn’t flinch. But somewhere in it, people start
            laughing again. That isn’t a side effect. That’s the redesign working.
          </Prose>
        </Section>

        {/* 7 · The two on-ramps (quizzes) */}
        <Section>
          <Eyebrow>Two on-ramps · play instead</Eyebrow>
          <Prose>
            Not ready to buy a thing from a man promising fun. Fair. Play instead — two short reads, no
            account, and you’ll have <em>felt the game work on you</em> before you paid a cent.
          </Prose>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[18px] font-bold">
                Which myth is running you?
              </p>
              <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[14px] leading-[1.5]">
                The mirror. Twelve honest questions find the false claim about allyship you’re quietly
                playing — then where the book takes it apart.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[430px]">
              <MythsReadClient />
            </div>
          </div>

          <div id="superpower" className="mt-8 flex flex-col gap-3 scroll-mt-8">
            <div className="flex flex-col gap-1">
              <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[18px] font-bold">
                What are you built for?
              </p>
              <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[14px] leading-[1.5]">
                The turn. Twelve choices reveal your allyship superpower — and the deck knows which of the
                120 moves are yours.
              </p>
            </div>
            <div className="mx-auto w-full max-w-[430px]">
              <SuperpowerQuiz />
            </div>
            <a href={deckHref} className="mr-gold-btn mx-auto flex min-h-[44px] w-full max-w-[430px] items-center justify-center px-6 py-3.5 text-[15px] font-bold" style={DISPLAY}>
              The Oracle has your moves — get the Deck →
            </a>
          </div>
        </Section>

        {/* 8 · The close */}
        <Section>
          <Eyebrow>So here’s the only real question</Eyebrow>
          <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[24px] font-bold leading-[1.35]">
            Do you want to fit in and keep drowning politely — or find out how far this actually goes:
            allyship built around your real strengths and your real, un-apologized-for joy?
          </p>
          <Prose>
            It’s going to be hard either way; that part isn’t on the table. But it is your one, aggressively
            non-refundable life. You might as well have fun in it.
          </Prose>
          <a href={deckHref} className="mr-gold-btn flex min-h-[48px] items-center justify-center px-6 py-4 text-[17px] font-bold" style={DISPLAY}>
            Start the game →
          </a>
          <ChapterOneCapture />
        </Section>

        <footer className="mx-auto max-w-[620px] pt-6 text-center">
          <p style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9.5px] uppercase tracking-[0.18em]">
            Built by hand in Portland · no countdown, no fake scarcity
          </p>
        </footer>
      </div>
    </main>
  )
}
