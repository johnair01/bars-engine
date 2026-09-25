import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Color = 'red' | 'green' | 'blue' | 'black' | 'white';
type Seat = 0 | 1;
type Hand = Record<Color, number>;
type Chip = { id: string; color: Color; spoken: boolean; open: boolean; heard?: boolean };
type Player = { name: string; meter: number; hand: Hand };
type Choice = { seat: Seat; stack: number; chipId: string };
type Question = { asker: Seat; speaker: Seat; offer: Color | null; target: Choice };
type Trade = { proposer: Seat; give: Color; want: Color };
type Drag = { seat: Seat; color: Color; startX: number; startY: number; ghost: HTMLElement | null; target: HTMLElement | null };
type ChipDraft = { seat: Seat; color: Color; stack: number; open: boolean; silent: boolean };
type Game = {
  players: [Player, Player];
  stacks: [Chip[][], Chip[][]];
  turn: Seat;
  played: boolean;
  placed: boolean;
  heat: number;
  heatSignals: [boolean, boolean];
  turnDuration: number;
  turnStartedAt: number;
  question: Question | null;
  trade: Trade | null;
  history: string[];
};

const colors: Color[] = ['red', 'green', 'blue', 'black', 'white'];
const moves: Record<Color, { name: string; prompt: string; mark: string }> = {
  red: { name: 'Anger', prompt: 'Name a boundary or change you want.', mark: '✦' },
  green: { name: 'Delight', prompt: 'Name what delights you or what you appreciate.', mark: '✺' },
  blue: { name: 'Sadness', prompt: 'Name the value your sadness points to.', mark: '✧' },
  black: { name: 'Fear', prompt: 'Name an outcome you are afraid of.', mark: '◈' },
  white: { name: 'Neutral', prompt: 'Name an observation or uncertainty.', mark: '◌' },
};
const demoSteps = [
  { title: 'Meet the emotional chips', body: 'Each chip holds one emotional bid. Explore the five colors and flip a chip, then guide Wendell and Giuseppe through a disagreement about a changed plan.', cta: 'Begin the rehearsal' },
  { title: 'Wendell names a boundary', body: 'Wendell: “Please tell me before our plans change. I need to be included.” Place one red anger chip face up in Wendell’s first stack.', cta: 'Place Wendell’s anger chip' },
  { title: 'Giuseppe asks rather than counters', body: 'Giuseppe offers a neutral chip to ask about Wendell’s open bid. Curiosity holds a chip while Wendell answers.', cta: 'Giuseppe asks: tell me more' },
  { title: 'Listen to the extra detail', body: 'Wendell: “I made space for us, then learned the plan had changed. I felt left out.” Giuseppe hears more, so the offered chip returns.', cta: null },
  { title: 'The conversation gets hotter', body: 'Wendell notices their voice speeding up. Signaling heat gives both readers a visible reason to slow this moment down.', cta: 'Signal rising temperature' },
  { title: 'One placement used', body: 'Wendell has made this turn’s placement. Passing moves the active controls to Giuseppe’s side of the board.', cta: 'Finish Wendell’s turn' },
  { title: 'Giuseppe has a feeling too', body: 'Giuseppe: “I was excited about the invitation and made a quick choice. I appreciate that you wanted us to plan together.” Place Giuseppe’s green delight chip.', cta: 'Place Giuseppe’s delight chip' },
  { title: 'Let the turn travel', body: 'The spoken bid is on Giuseppe’s side. Finish Giuseppe’s turn so Wendell can add what remains unsaid.', cta: 'Finish Giuseppe’s turn' },
  { title: 'Dissatisfaction has another layer', body: 'Wendell is still sad about being left out. Add one face-down, unspoken blue chip on top of the red stack. Its height shows unfinished feeling. Giuseppe could offer a chip to ask about this sealed layer; Wendell would choose whether to reveal it.', cta: 'Stack Wendell’s sadness face down' },
  { title: 'Look beneath the new layer', body: 'Select the red chip under the blue one. Wendell can say that the anger was heard, but the stack still cannot move.', cta: 'Select Wendell’s red chip' },
  { title: 'Was this feeling heard?', body: 'If not, leave it. If yes, mark red heard. Blue is still unspoken, so neither chip can be taken yet.', cta: 'Wendell says the anger was heard' },
  { title: 'The blue layer is waiting', body: 'Select Wendell’s blue chip. Speaking an existing chip uses the spoken bid; it does not place a second chip.', cta: 'Select Wendell’s blue chip' },
  { title: 'Sadness points to a value', body: 'Wendell: “I value deciding shared plans together.” Turn the blue chip face up and speak it. Wendell chooses when this layer is open to questions.', cta: 'Reveal and speak Wendell’s sadness' },
  { title: 'The whole stack can be heard', body: 'Wendell now feels heard about the sadness too. Mark blue heard. Both layers are ready, so the stack can finally move.', cta: 'Mark the sadness heard' },
  { title: 'Cool the immediate moment', body: 'Choose cooling for the blue chip. Temperature falls, while Wendell’s hidden conflict meter stays where it was.', cta: null },
  { title: 'Resolve the underlying issue', body: 'The red chip was already heard and the stack is unlocked. Now choose resolution for it; Wendell’s hidden conflict meter can fall.', cta: 'Select the heard red chip' },
  { title: 'One chip, one effect', body: 'Choose resolution in the release dialog. The chip goes to Giuseppe; heat does not change this time.', cta: null },
  { title: 'Return to Giuseppe’s feeling', body: 'Giuseppe’s green chip is still on the board. Select it. Both readers have a stake in how the plan gets repaired.', cta: 'Select Giuseppe’s delight chip' },
  { title: 'Giuseppe decides whether the feeling was heard', body: 'Giuseppe: “I want us to keep room for spontaneous invitations and still check in first.” Mark Giuseppe’s chip heard.', cta: 'Giuseppe says the feeling was heard' },
  { title: 'Giuseppe moves toward resolution', body: 'Choose resolution for Giuseppe’s chip. Giuseppe’s hidden meter falls while the public temperature remains settled.', cta: null },
  { title: 'The board made room and made progress', body: 'Heat rose and had time to cool. Both readers’ hidden conflict meters reached zero through heard chips. Replay, or go to the real game screen.', cta: null },
] as const;
const hand = (): Hand => ({ red: 5, green: 5, blue: 5, black: 5, white: 5 });
const emptyStacks = (): Chip[][] => [[], [], [], [], []];
const other = (seat: Seat): Seat => seat === 0 ? 1 : 0;
const count = (value: Hand) => colors.reduce((sum, color) => sum + value[color], 0);
const key = 'understood-turn-economy-v2';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function restore(): Game | null { try { const saved = localStorage.getItem(key); if (!saved) return null; const game = JSON.parse(saved) as Game; return { ...game, placed: game.placed ?? game.played, heat: game.heat ?? 0, heatSignals: game.heatSignals ?? [false, false], turnDuration: game.turnDuration ?? 90, turnStartedAt: game.turnStartedAt ?? Date.now() }; } catch { return null; } }
function demoGame(): Game { return { players: [{ name: 'Wendell', meter: 1, hand: hand() }, { name: 'Giuseppe', meter: 1, hand: hand() }], stacks: [emptyStacks(), emptyStacks()], turn: 0, played: false, placed: false, heat: 0, heatSignals: [false, false], turnDuration: 0, turnStartedAt: Date.now(), question: null, trade: null, history: ['Wendell and Giuseppe begin a guided conversation.'] }; }

function animateChip(color: Color, from: string, to: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = document.querySelector(from)?.getBoundingClientRect();
  const b = document.querySelector(to)?.getBoundingClientRect();
  if (!a || !b) return;
  const chip = document.createElement('div');
  chip.className = `flight-chip chip-physical chip-${color}`;
  chip.innerHTML = `<span class="chip-core">${moves[color].mark}</span>`;
  chip.style.left = `${a.left + a.width / 2 - 32}px`;
  chip.style.top = `${a.top + a.height / 2 - 32}px`;
  document.body.appendChild(chip);
  const x = b.left + b.width / 2 - a.left - a.width / 2;
  const y = b.top + b.height / 2 - a.top - a.height / 2;
  const motion = chip.animate([
    { transform: 'translate(0,0) rotate(-7deg) scale(.8)', opacity: 1 },
    { transform: `translate(${x / 2}px,${y / 2 - 36}px) rotate(9deg) scale(1.2)`, opacity: 1, offset: .53 },
    { transform: `translate(${x}px,${y}px) rotate(0deg) scale(.94)`, opacity: .8 },
  ], { duration: 580, easing: 'cubic-bezier(.18,.8,.22,1)' });
  motion.onfinish = () => chip.remove();
  motion.oncancel = () => chip.remove();
}

function Token({ color, open = true, silent = false, heard = false, small = false }: { color: Color; open?: boolean; silent?: boolean; heard?: boolean; small?: boolean }) {
  return <span className={`chip-physical chip-${color}${silent ? ' chip-silent' : ''}${heard ? ' chip-heard' : ''}${!open ? ' chip-facedown' : ''}${small ? ' chip-small' : ''}`} aria-label={`${moves[color].name} chip, ${open ? 'face up' : 'face down'}${silent ? ', unspoken' : ''}${heard ? ', heard' : ''}`}>
    <span className="chip-core"><span className="chip-symbol">{!open ? '◆' : silent ? '◌' : moves[color].mark}</span>{!small && <span className="chip-name">{open ? moves[color].name : 'SEALED'}</span>}{!small && <span className="chip-face">{open ? '?' : '↓'}</span>}</span>
  </span>;
}

function Hexagram({ lines, changed = false }: { lines: number[]; changed?: boolean }) {
  return <div className="hexagram" aria-label={changed ? 'Possible changing pattern' : 'Opening hexagram'}>{Array.from({ length: 6 }, (_, index) => {
    const value = lines[5 - index];
    const moving = value === 6 || value === 9;
    const yang = value === 7 || value === 9;
    const solid = changed && moving ? !yang : yang;
    return <div className={`hex-line${value === undefined ? ' pending' : ''}${moving && !changed ? ' moving' : ''}`} key={index} aria-label={value === undefined ? `Line ${6 - index} waiting` : `Line ${6 - index}: ${solid ? 'yang' : 'yin'}${moving && !changed ? ', changing' : ''}`}><span className="hex-line-number">{6 - index}</span><span className={`hex-bars ${solid ? 'solid' : 'broken'}`}><i /><i /></span><span className="hex-moving">{moving && !changed ? value === 6 ? '×' : '○' : ''}</span></div>;
  })}</div>;
}

function App() {
  const [demoMode, setDemoMode] = useState(() => new URLSearchParams(window.location.search).has('demo') || window.location.pathname.endsWith('/demo'));
  const [demoStep, setDemoStep] = useState(0);
  const [game, setGame] = useState<Game | null>(() => new URLSearchParams(window.location.search).has('demo') || window.location.pathname.endsWith('/demo') ? demoGame() : restore());
  const [setupStage, setSetupStage] = useState<0 | 1 | 2 | 3>(0);
  const [starter, setStarter] = useState<Seat>(0);
  const [coinResult, setCoinResult] = useState<Seat | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [castLines, setCastLines] = useState<number[]>([]);
  const [casting, setCasting] = useState(false);
  const [setupTurnDuration, setSetupTurnDuration] = useState(90);
  const [setup, setSetup] = useState<[Pick<Player, 'name' | 'meter'>, Pick<Player, 'name' | 'meter'>]>([
    { name: 'Player one', meter: 3 }, { name: 'Player two', meter: 3 },
  ]);
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const [faces, setFaces] = useState<[boolean, boolean]>([true, true]);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [answeredChipId, setAnsweredChipId] = useState<string | null>(null);
  const [askColor, setAskColor] = useState<Color>('white');
  const [primerColor, setPrimerColor] = useState<Color>('red');
  const [primerOpen, setPrimerOpen] = useState(true);
  const [modal, setModal] = useState<'chip' | 'placed' | 'release' | 'donate' | 'trade' | 'meter' | 'help' | null>(null);
  const [chipDraft, setChipDraft] = useState<ChipDraft | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const [modalSeat, setModalSeat] = useState<Seat>(0);
  const [meterVisible, setMeterVisible] = useState(false);
  const [modalColor, setModalColor] = useState<Color>('white');
  const [tradeGive, setTradeGive] = useState<Color>('white');
  const [tradeWant, setTradeWant] = useState<Color>('red');
  const [message, setMessage] = useState('');
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const ritualTimers = useRef<number[]>([]);

  useEffect(() => { if (demoMode) return; if (game) localStorage.setItem(key, JSON.stringify(game)); else localStorage.removeItem(key); }, [game, demoMode]);
  useEffect(() => () => { ritualTimers.current.forEach(timer => window.clearTimeout(timer)); }, []);
  useEffect(() => { if (!game || game.turnDuration === 0) return; const timer = window.setInterval(() => setClockNow(Date.now()), 1000); return () => window.clearInterval(timer); }, [game?.turnDuration]);
  const change = (fn: (next: Game) => void) => setGame(current => { if (!current) return current; const next = structuredClone(current) as Game; fn(next); return next; });
  const record = (next: Game, text: string) => { next.history.unshift(text); next.history = next.history.slice(0, 12); };
  const flipOpeningCoin = () => {
    if (coinFlipping) return;
    const result = (crypto.getRandomValues(new Uint32Array(1))[0] & 1) as Seat;
    setCoinFlipping(true); setCoinResult(null);
    ritualTimers.current.push(window.setTimeout(() => { setStarter(result); setCoinResult(result); setCoinFlipping(false); }, 1050));
  };
  const drawOpeningHexagram = () => {
    if (casting) return;
    const random = crypto.getRandomValues(new Uint32Array(18));
    const lines = Array.from({ length: 6 }, (_, index) => 6 + [0, 1, 2].reduce((total, coin) => total + (random[index * 3 + coin] & 1), 0));
    setCastLines([]); setCasting(true);
    lines.forEach((line, index) => ritualTimers.current.push(window.setTimeout(() => { setCastLines(current => [...current, line]); if (index === 5) setCasting(false); }, (index + 1) * 480)));
  };
  const begin = () => {
    const now = Date.now();
    setGame({ players: setup.map(p => ({ ...p, hand: hand() })) as [Player, Player], stacks: [emptyStacks(), emptyStacks()], turn: starter, played: false, placed: false, heat: 0, heatSignals: [false, false], turnDuration: setupTurnDuration, turnStartedAt: now, question: null, trade: null, history: [`${setup[starter].name} opens the conversation.`] });
    setClockNow(now);
    setChoice(null); setMessage('');
  };
  const reset = () => { if (demoMode) { setGame(demoGame()); setDemoStep(0); setChoice(null); setModal(null); setFaces([true, true]); setAskColor('white'); setFocus([0, 0]); setPrimerColor('red'); setPrimerOpen(true); setMessage(''); return; } if (window.confirm('Start a new game? This clears the current board.')) { setGame(null); setChoice(null); setModal(null); setSetupStage(0); } };
  const startDemo = () => { window.history.pushState(null, '', window.location.pathname.startsWith('/understood/') ? '/understood/demo' : `${window.location.pathname}?demo=1`); setDemoMode(true); setDemoStep(0); setGame(demoGame()); setChoice(null); setMessage(''); setModal(null); setFaces([true, true]); setAskColor('white'); setFocus([0, 0]); setPrimerColor('red'); setPrimerOpen(true); };
  const leaveDemo = () => { window.location.replace(window.location.pathname.startsWith('/understood/') ? '/understood/play' : window.location.pathname); };
  const openMeter = (seat: Seat) => { setModalSeat(seat); setMeterVisible(false); setModal('meter'); };
  const play = (seat: Seat, color: Color, destination = focus[seat], open = faces[seat], forceSilent = false) => {
    if (!game || game.question || game.trade || seat !== game.turn || game.placed || game.players[seat].hand[color] === 0) return;
    const stack = destination;
    const spoken = seat === game.turn && !game.played && !forceSilent;
    const chip: Chip = { id: uid(), color, spoken, open, heard: false };
    animateChip(color, `#rack-${seat}-${color}`, `#stack-${seat}-${stack}`);
    change(next => {
      next.players[seat].hand[color]--;
      next.stacks[seat][stack].push(chip);
      next.placed = true;
      if (spoken) next.played = true;
      record(next, `${next.players[seat].name} ${spoken ? 'played' : 'silently stacked'} ${moves[color].name.toLowerCase()} in stack ${stack + 1}.`);
    });
    setChoice({ seat, stack, chipId: chip.id });
    setMessage(spoken ? `Speak aloud: ${moves[color].prompt}` : `${moves[color].name} is waiting in stack ${stack + 1}.`);
  };
  const openChip = (seat: Seat, color: Color) => {
    if (!game || seat !== game.turn || game.placed) return;
    setChipDraft({ seat, color, stack: focus[seat], open: faces[seat], silent: seat !== game?.turn || !!game.played });
    setModal('chip');
  };
  const openStackBuilder = (seat: Seat, stack: number) => {
    if (!game || seat !== game.turn || game.placed) return;
    const color = colors.find(item => game.players[seat].hand[item] > 0);
    if (!color) return;
    setChipDraft({ seat, color, stack, open: faces[seat], silent: seat !== game.turn || game.played });
    setModal('chip');
  };
  const placeDraft = () => {
    if (!game || !chipDraft || chipDraft.seat !== game.turn || game.placed || game.players[chipDraft.seat].hand[chipDraft.color] === 0) return;
    const { seat, color, stack, open, silent } = chipDraft;
    play(seat, color, stack, open, silent);
    setModal(null);
    setChipDraft(null);
  };
  const dragStart = (event: React.PointerEvent<HTMLButtonElement>, seat: Seat, color: Color) => {
    if (!game || seat !== game.turn || game.placed || game.players[seat].hand[color] === 0 || game.question || game.trade) return;
    drag.current = { seat, color, startX: event.clientX, startY: event.clientY, ghost: null, target: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current) return;
    if (!current.ghost && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 8) return;
    if (!current.ghost) {
      const chip = event.currentTarget.querySelector('.chip-physical')?.cloneNode(true) as HTMLElement | undefined;
      if (!chip) return;
      chip.classList.add('drag-ghost');
      document.body.appendChild(chip);
      current.ghost = chip;
      event.currentTarget.classList.add('drag-source');
    }
    current.ghost.style.left = `${event.clientX}px`;
    current.ghost.style.top = `${event.clientY}px`;
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('.stack-slot');
    const target = hit?.dataset.seat === String(current.seat) ? hit : null;
    if (target !== current.target) { current.target?.classList.remove('drop-target'); target?.classList.add('drop-target'); current.target = target; }
  };
  const dragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current) return;
    if (current.ghost) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      current.target?.classList.remove('drop-target');
      current.ghost.remove();
      event.currentTarget.classList.remove('drag-source');
      if (event.type === 'pointerup' && current.target) {
        const stack = Number(current.target.dataset.stack);
        setFocus(previous => { const next = [...previous] as [number, number]; next[current.seat] = stack; return next; });
        play(current.seat, current.color, stack);
      }
    }
    drag.current = null;
  };
  const speak = (selected: Chip) => {
    if (!game || !choice || choice.seat !== game.turn || game.played || selected.spoken || game.question || game.trade || count(game.players[choice.seat].hand) === 0) return;
    change(next => { const chip = next.stacks[choice.seat][choice.stack].find(item => item.id === choice.chipId); if (chip) { chip.spoken = true; chip.open = faces[choice.seat]; next.played = true; record(next, `${next.players[choice.seat].name} spoke to ${moves[chip.color].name.toLowerCase()} in stack ${choice.stack + 1}.`); } });
    setMessage(`Speak aloud: ${moves[selected.color].prompt}`);
  };
  const acknowledge = (selected: Chip) => {
    if (!game || !choice || !selected.spoken || selected.heard) return;
    const stack = game.stacks[choice.seat][choice.stack];
    const allHeardAfter = stack.every(chip => chip.id === choice.chipId || chip.heard);
    change(next => {
      const chip = next.stacks[choice.seat][choice.stack].find(item => item.id === choice.chipId);
      if (chip) chip.heard = true;
      record(next, `${next.players[choice.seat].name} felt heard on ${moves[selected.color].name.toLowerCase()} in stack ${choice.stack + 1}.`);
    });
    if (answeredChipId === selected.id) setAnsweredChipId(null);
    if (allHeardAfter) { setModal('release'); setMessage('Every feeling in this stack has been heard. Choose what this chip changes.'); }
    else { setModal(null); setMessage('This feeling has been heard. The stack stays until every layer is heard.'); }
    if (demoMode && demoStep === 13 && allHeardAfter) setDemoStep(14);
    if (demoMode && demoStep === 18 && allHeardAfter) setDemoStep(19);
  };
  const release = (selected: Chip, effect: 'cool' | 'resolve') => {
    if (!game || !choice || !selected.spoken || !selected.heard || !game.stacks[choice.seat][choice.stack].every(chip => chip.heard) || (effect === 'cool' ? game.heat === 0 : game.players[choice.seat].meter === 0)) return;
    animateChip(selected.color, `#stack-${choice.seat}-${choice.stack}`, `#rack-${other(choice.seat)}-${selected.color}`);
    change(next => {
      next.stacks[choice.seat][choice.stack] = next.stacks[choice.seat][choice.stack].filter(chip => chip.id !== choice.chipId);
      if (effect === 'cool') next.heat--;
      else next.players[choice.seat].meter--;
      next.players[other(choice.seat)].hand[selected.color]++;
      record(next, `${next.players[choice.seat].name} felt heard. ${effect === 'cool' ? 'The conversation cooled' : 'Their conflict meter moved down'} one notch; chip moved to ${next.players[other(choice.seat)].name}.`);
      if (next.players[choice.seat].meter === 0) record(next, `${next.players[choice.seat].name} feels resolved on their side.`);
    });
    setChoice(null); setModal(null); setMessage(effect === 'cool' ? 'A heard chip moved to the listener. The conversation cooled.' : 'A heard chip moved to the listener. The conflict moved toward resolution.');
    if (demoMode && demoStep === 14 && effect === 'cool') setDemoStep(15);
    if (demoMode && demoStep === 16 && effect === 'resolve') setDemoStep(17);
    if (demoMode && demoStep === 19 && effect === 'resolve') setDemoStep(20);
  };
  const signalHotter = (seat: Seat) => {
    if (!game || game.heat >= 5 || game.heatSignals[seat] || game.question || game.trade) return;
    change(next => { next.heat++; next.heatSignals[seat] = true; record(next, `${next.players[seat].name} signaled that the conversation grew hotter.`); });
    setMessage(`${game.players[seat].name} signaled rising temperature. Pause and listen to what changed.`);
  };
  const flip = () => {
    if (!game || !choice || choice.seat !== game.turn || game.question || game.trade) return;
    change(next => { const chip = next.stacks[choice.seat][choice.stack].find(item => item.id === choice.chipId); if (chip) chip.open = !chip.open; });
  };
  const ask = (selected: Chip) => {
    if (!game || !choice || game.question || game.trade) return;
    const asker = other(choice.seat);
    const offer = count(game.players[asker].hand) ? (game.players[asker].hand[askColor] ? askColor : colors.find(color => game.players[asker].hand[color] > 0)!) : null;
    if (offer) animateChip(offer, `#rack-${asker}-${offer}`, '#question-spot');
    change(next => { if (offer) next.players[asker].hand[offer]--; next.question = { asker, speaker: choice.seat, offer, target: choice }; record(next, `${next.players[asker].name} asked about ${moves[selected.color].name.toLowerCase()}.`); });
    setModal(null);
    setMessage(selected.open ? 'Ask aloud. The chip waits while your partner shares.' : 'Offer a chip to ask about the sealed feeling. Its owner chooses whether to reveal it.');
  };
  const answer = (outcome: 'shared' | 'nothing' | 'declined') => {
    if (!game?.question) return;
    const q = game.question;
    const shared = outcome === 'shared';
    if (q.offer) animateChip(q.offer, '#question-spot', `#rack-${outcome === 'nothing' ? q.speaker : q.asker}-${q.offer}`);
    change(next => {
      if (q.offer) next.players[outcome === 'nothing' ? q.speaker : q.asker].hand[q.offer]++;
      const chip = next.stacks[q.target.seat][q.target.stack].find(item => item.id === q.target.chipId);
      if (shared && chip) { chip.open = true; chip.spoken = true; }
      next.question = null;
      record(next, shared ? 'An answer was shared; the offered chip returned and the asked-about chip was revealed.' : outcome === 'nothing' ? 'Nothing more was shared; the speaker kept the offered chip.' : 'The question was declined; the offered chip returned and the asked-about chip kept its face.');
    });
    setMessage(shared ? 'The answer was shared. Its owner can now decide whether that resolved this chip.' : outcome === 'nothing' ? 'Nothing more was shared. The speaker kept the offered chip.' : 'The question was declined. The offered chip returned.');
    if (shared && !demoMode) { setAnsweredChipId(q.target.chipId); setChoice(q.target); setModal('placed'); }
    if (demoMode && demoStep === 3 && shared) setDemoStep(4);
  };
  const donate = () => {
    if (!game || game.players[modalSeat].hand[modalColor] === 0) return;
    animateChip(modalColor, `#rack-${modalSeat}-${modalColor}`, `#rack-${other(modalSeat)}-${modalColor}`);
    change(next => { next.players[modalSeat].hand[modalColor]--; next.players[other(modalSeat)].hand[modalColor]++; record(next, `${next.players[modalSeat].name} donated ${moves[modalColor].name.toLowerCase()}.`); });
    setModal(null);
  };
  const proposeTrade = () => {
    if (!game || game.question || game.trade || tradeGive === tradeWant || game.players[modalSeat].hand[tradeGive] === 0 || game.players[other(modalSeat)].hand[tradeWant] === 0) return;
    change(next => { next.trade = { proposer: modalSeat, give: tradeGive, want: tradeWant }; record(next, `${next.players[modalSeat].name} proposed a trade.`); });
    setModal(null);
  };
  const settleTrade = (yes: boolean) => {
    if (!game?.trade) return;
    const t = game.trade, recipient = other(t.proposer);
    const possible = game.players[t.proposer].hand[t.give] > 0 && game.players[recipient].hand[t.want] > 0;
    if (yes && possible) { animateChip(t.give, `#rack-${t.proposer}-${t.give}`, `#rack-${recipient}-${t.give}`); animateChip(t.want, `#rack-${recipient}-${t.want}`, `#rack-${t.proposer}-${t.want}`); }
    change(next => { if (yes && possible) { next.players[t.proposer].hand[t.give]--; next.players[recipient].hand[t.give]++; next.players[recipient].hand[t.want]--; next.players[t.proposer].hand[t.want]++; } next.trade = null; record(next, yes && possible ? 'The spoken disclosure was shared; the chips were traded.' : 'The trade was declined.'); });
  };
  const endTurn = () => {
    if (!game || game.question || game.trade) return;
    const now = Date.now();
    change(next => { next.turn = other(next.turn); next.played = false; next.placed = false; next.heatSignals = [false, false]; next.turnStartedAt = now; record(next, `Turn passed to ${next.players[next.turn].name}.`); });
    setClockNow(now); setChoice(null); setMessage('');
  };

  if (!game) {
    const seat: Seat = setupStage === 2 ? 1 : 0;
    return <main className="setup-screen"><div className="setup-scene"><div className="brand">◌ <span>UNDERSTOOD</span></div><div className="setup-chips"><Token color="blue" /><Token color="green" /><Token color="red" /></div><div><span className="eyebrow">A LIVE GAME FOR TWO</span><h1>Let the chips<br /><em>hold the charge.</em></h1><p>Speak aloud. Place one feeling at a time. Watch the stacks grow until each of you feels heard.</p></div></div><div className="setup-form">{setupStage === 1 ? <><span className="eyebrow">PRIVATE SETUP</span><h2>Pass the device.</h2><p>The first player’s resolution meter is sealed. Give the screen to the other player.</p><button className="primary" onClick={() => setSetupStage(2)}>I’m the second player →</button></> : setupStage === 3 ? <><span className="eyebrow">OPEN THE TABLE</span><h2>Set the stage.</h2><p>Name the issue aloud. Choose who has a coherent first bid, or toss the coin to let chance choose. One player ends each turn; their partner then begins.</p><div className="opening-ritual"><span className="eyebrow">FIRST SPEAKER</span><div className="coin-ritual"><span className={`opening-coin${coinFlipping ? ' flipping' : ''}`} aria-hidden="true"><span>{coinResult === null ? '◌' : coinResult === 0 ? 'I' : 'II'}</span></span><div><button type="button" onClick={flipOpeningCoin} disabled={coinFlipping}>{coinFlipping ? 'Flipping…' : 'Flip for first speaker'}</button><p aria-live="polite">{coinFlipping ? 'The coin is in the air.' : coinResult !== null ? `${setup[coinResult].name} opens, unless you both choose otherwise.` : 'Or choose together below.'}</p></div></div><div className="starter-choices">{([0, 1] as Seat[]).map(index => <button key={index} disabled={coinFlipping} className={starter === index ? 'selected-starter' : ''} onClick={() => { setStarter(index); setCoinResult(null); }}>{setup[index].name}</button>)}</div></div><div className="opening-ritual"><span className="eyebrow">I CHING DRAW</span><p>Three coins, six throws. The lines rise from the bottom. Notice the pattern before you begin.</p><div className="hexagram-stage"><div><span className="hex-title">Opening pattern</span><Hexagram lines={castLines} /></div>{castLines.length === 6 && castLines.some(line => line === 6 || line === 9) && <div><span className="hex-title">Changing toward</span><Hexagram lines={castLines} changed /></div>}</div><button type="button" className="cast-button" onClick={drawOpeningHexagram} disabled={casting}>{casting ? `Drawing line ${Math.min(6, castLines.length + 1)} of 6…` : castLines.length ? 'Draw again' : 'Draw six lines'}</button>{castLines.length === 6 && <p className="ritual-reflection">{castLines.some(line => line === 6 || line === 9) ? `Changing lines: ${castLines.map((line, index) => line === 6 || line === 9 ? index + 1 : null).filter(Boolean).join(', ')}. ` : 'No changing lines. '}What might this pattern invite you to notice as you listen?</p>}</div><label>Turn timer<select value={setupTurnDuration} onChange={event => setSetupTurnDuration(Number(event.target.value))}><option value={0}>No timer</option><option value={60}>1 minute</option><option value={90}>90 seconds</option><option value={120}>2 minutes</option><option value={180}>3 minutes</option></select></label><p className="timer-note">A gentle cue. The board never passes a turn automatically.</p><button className="primary" disabled={castLines.length !== 6 || casting || coinFlipping} onClick={begin}>Begin with {setup[starter].name} →</button></> : <><span className="eyebrow">PRIVATE SETUP · {seat + 1} OF 2</span><h2>{seat === 0 ? 'First player' : 'Second player'}</h2><p>How unresolved does this issue feel? Your number stays hidden on the board.</p><label>Your name<input value={setup[seat].name} maxLength={28} onChange={event => setSetup(current => { const next = structuredClone(current); next[seat].name = event.target.value; return next; })} /></label><label>Unresolved right now <strong>{setup[seat].meter} / 5</strong><input type="range" min="1" max="5" value={setup[seat].meter} onChange={event => setSetup(current => { const next = structuredClone(current); next[seat].meter = Number(event.target.value); return next; })} /></label><div className="scale"><span>A little</span><span>A great deal</span></div><button className="primary" disabled={!setup[seat].name.trim()} onClick={() => seat === 0 ? setSetupStage(1) : setSetupStage(3)}>Seal my meter →</button></>}<button type="button" className="demo-entry" onClick={startDemo}>Try the guided demo with Wendell and Giuseppe →</button><small>Voice is never recorded. The board saves only chip moves in this browser.</small></div></main>;
  }

  const selected = choice ? game.stacks[choice.seat][choice.stack].find(chip => chip.id === choice.chipId) ?? null : null;
  const questionChip = game.question ? game.stacks[game.question.target.seat][game.question.target.stack].find(chip => chip.id === game.question?.target.chipId) : null;
  const stackReady = choice ? game.stacks[choice.seat][choice.stack].every(chip => chip.heard) : false;
  const runDemoStep = () => {
    if (!demoMode) return;
    const ariRed = game.stacks[0][0].find(chip => chip.color === 'red');
    const ariBlue = game.stacks[0][0].find(chip => chip.color === 'blue');
    const beaGreen = game.stacks[1][0].find(chip => chip.color === 'green');
    switch (demoStep) {
      case 0: setDemoStep(1); break;
      case 1: play(0, 'red', 0, true); setDemoStep(2); break;
      case 2: if (selected) { ask(selected); setDemoStep(3); } break;
      case 4: signalHotter(0); setDemoStep(5); break;
      case 5: endTurn(); setDemoStep(6); break;
      case 6: play(1, 'green', 0, true); setDemoStep(7); break;
      case 7: endTurn(); setDemoStep(8); break;
      case 8: play(0, 'blue', 0, false, true); setDemoStep(9); break;
      case 9: if (ariRed) { setChoice({ seat: 0, stack: 0, chipId: ariRed.id }); setDemoStep(10); } break;
      case 10: if (selected && selected.id === ariRed?.id) { acknowledge(selected); setDemoStep(11); } break;
      case 11: if (ariBlue) { setChoice({ seat: 0, stack: 0, chipId: ariBlue.id }); setDemoStep(12); } break;
      case 12: if (selected && selected.id === ariBlue?.id) { speak(selected); setDemoStep(13); } break;
      case 13: if (selected && selected.id === ariBlue?.id) acknowledge(selected); break;
      case 15: if (ariRed) { setChoice({ seat: 0, stack: 0, chipId: ariRed.id }); setModal('release'); setDemoStep(16); } break;
      case 17: if (beaGreen) { setChoice({ seat: 1, stack: 0, chipId: beaGreen.id }); setDemoStep(18); } break;
      case 18: if (selected && selected.id === beaGreen?.id) acknowledge(selected); break;
    }
  };
  const won = game.heat === 0 && game.players.every(player => player.meter === 0);
  const listener = choice ? other(choice.seat) : other(game.turn);
  const freeAsk = count(game.players[listener].hand) === 0;
  const canAsk = !!selected && !game.question && !game.trade;
  const remaining = game.turnDuration ? Math.max(0, game.turnDuration - Math.floor((clockNow - game.turnStartedAt) / 1000)) : null;
  const clockLabel = remaining === null ? '' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  const turnPanel = <div className={`board-turn-panel board-turn-panel-${game.turn}`} aria-label={`${game.players[game.turn].name}'s turn`}>
    <div className="board-turn-heading"><span className="eyebrow">CURRENT TURN · ONE CHIP PLACEMENT</span><button className="seal" onClick={() => openMeter(game.turn)}>{game.players[game.turn].meter === 0 ? 'RESOLVED ✓' : 'METER SEALED ◈'}</button></div>
    <div className="board-turn-main"><h2>{game.players[game.turn].name}</h2><div className="board-turn-actions"><span>{game.placed ? 'Chip placed. Listen, then pass.' : game.played ? 'Bid made. You may place one silent chip, or pass.' : 'Place one chip, speak a waiting chip, or pass.'}</span>{remaining !== null && <span className={`turn-clock${remaining === 0 ? ' expired' : ''}`} role="timer" aria-label={remaining === 0 ? 'Turn time is up' : `${clockLabel} left in this turn`}>{remaining === 0 ? 'Time to pass' : clockLabel}</span>}<button className="primary" disabled={!!game.question || !!game.trade} onClick={endTurn}>{game.played || game.placed ? 'Finish my turn' : 'Pass without speaking'} →</button></div></div>
    <div className="board-turn-economy"><strong>ON YOUR TURN</strong><span>Place one chip, spoken or silent</span><strong>ANYTIME</strong><span>Offer a chip to ask about any chip · donate · trade · release when heard</span></div>
  </div>;

  return <main className="live-page"><header className="live-header"><div className="brand">◌ <span>UNDERSTOOD</span></div><div className="header-actions"><span className="live-label"><i /> LIVE TABLE</span><button onClick={() => setModal('help')}>How to play</button>{demoMode ? <button onClick={leaveDemo}>Skip tutorial → Play</button> : <button onClick={startDemo}>Guided demo</button>}<button onClick={reset}>{demoMode ? 'Replay demo' : 'New game'}</button></div></header><div className={`game-wrap${demoMode ? ' demo-mode' : ''}`}>{demoMode && <section className="demo-guide" aria-live="polite"><div className="demo-guide-top"><span className="eyebrow">GUIDED REHEARSAL · {Math.min(demoStep + 1, demoSteps.length)} / {demoSteps.length}</span><span>FICTIONAL READERS · WENDELL & GIUSEPPE</span></div><h2>{demoSteps[demoStep].title}</h2><p>{demoSteps[demoStep].body}</p>{demoStep === 0 && <div className="demo-chip-lesson"><div className="demo-chip-colors" role="group" aria-label="Five emotional chip colors">{colors.map(color => <button key={color} type="button" className={primerColor === color ? 'selected' : ''} aria-pressed={primerColor === color} onClick={() => setPrimerColor(color)}><Token color={color} small /><span>{moves[color].name}</span></button>)}</div><div className="demo-chip-detail"><Token color={primerColor} open={primerOpen} /><div><strong>{moves[primerColor].name}</strong><p>{moves[primerColor].prompt}</p><button type="button" onClick={() => setPrimerOpen(open => !open)}>Flip to {primerOpen ? 'face down' : 'face up'} ↻</button><small>{primerOpen ? 'Face up: questions are welcome without first asking to reveal the feeling.' : 'Face down: the feeling stays sealed unless its owner accepts a question bid.'}</small></div></div><p className="demo-chip-economy">Each player starts with five of every color. Place one chip per turn; stack more layers when more is waiting. A chip moves to the listener only after its owner feels heard and every layer in that stack has been heard.</p></div>}<div className="demo-guide-actions">{demoSteps[demoStep].cta && <button className="primary" onClick={runDemoStep}>{demoSteps[demoStep].cta} →</button>}{demoStep === 10 && <button onClick={() => setMessage('Wendell is not ready to mark this chip heard. It stays in the stack.')}>Not yet heard</button>}{demoStep === 20 && <><button className="primary" onClick={leaveDemo}>Go to the game →</button><button onClick={reset}>Replay the rehearsal</button></>}{demoStep < 20 && <button className="demo-skip" onClick={leaveDemo}>Skip tutorial → Play</button>}</div></section>}{message && <div className="message" role="status">{message}</div>}{won && <div className="win-message">Both players feel resolved. You can keep playing for the love of the game.</div>}
    <section className="felt-board" aria-label="Live game board"><div className="felt-line" /><div className="board-heart">◌<span>LISTEN · RELEASE</span></div><div className="heat-gauge" aria-label={`Conversation temperature ${game.heat} of 5`}><div><span className="eyebrow">CONVERSATION TEMPERATURE</span><strong>{game.heat === 0 ? 'Settled' : game.heat < 3 ? 'Warming' : 'Hot'}</strong></div><div className="heat-marks" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < game.heat ? 'lit' : ''} />)}</div><span>{game.heat} / 5</span></div><div className="seats">{([0, 1] as Seat[]).map(seat => {
      const player = game.players[seat];
      return <div className={`seat seat-${seat}${game.turn === seat ? ' active-seat' : ''}`} key={seat}>{game.turn === seat ? turnPanel : <div className="seat-head"><div><span>0{seat + 1} / PLAYER</span><h2>{player.name}</h2></div><button className="seal" onClick={() => openMeter(seat)}>{player.meter === 0 ? 'RESOLVED ✓' : 'METER SEALED ◈'}</button></div>}<div className="face-select"><span>CHIP FACE</span><button className={faces[seat] ? 'active' : ''} onClick={() => setFaces(current => { const next = [...current] as [boolean, boolean]; next[seat] = true; return next; })}>? Ask more</button><button className={!faces[seat] ? 'active' : ''} onClick={() => setFaces(current => { const next = [...current] as [boolean, boolean]; next[seat] = false; return next; })}>· Just feeling</button></div><div className="stack-label">FIVE STACKS <span>Drag a chip here, or tap a stack and chip</span></div><div className="stack-grid">{game.stacks[seat].map((stack, index) => <button key={index} className={`stack-slot${focus[seat] === index ? ' focused' : ''}`} id={`stack-${seat}-${index}`} data-seat={seat} data-stack={index} onClick={() => { setFocus(current => { const next = [...current] as [number, number]; next[seat] = index; return next; }); if (stack.length) { setChoice({ seat, stack: index, chipId: stack.at(-1)!.id }); setModal('placed'); } else setChoice(null); }} aria-label={`${player.name} stack ${index + 1}, ${stack.length} chips${stack.length ? `, top chip ${stack.at(-1)!.open ? 'face up' : 'face down'}` : ''}`}><span className="slot-number">0{index + 1}</span>{stack.length > 1 && <span className="stack-count" aria-hidden="true">{stack.length}</span>}<span className="pile">{stack.length ? stack.slice(-6).map((chip, layer) => <span className="pile-chip" key={chip.id} style={{ bottom: `${layer * 8}px`, zIndex: layer + 1, transform: `rotate(${(layer % 3 - 1) * 3}deg)` }}><Token color={chip.color} open={chip.open} silent={!chip.spoken} heard={!!chip.heard} /></span>) : <span className="empty-pile">◎</span>}</span>{stack.length > 0 && !stack.at(-1)!.open && <span className="stack-face">FACE DOWN</span>}<span className="slot-depth">{stack.length ? `${stack.length} ${stack.length === 1 ? 'CHIP' : 'LAYERS'}` : 'EMPTY'}</span></button>)}</div><div className="rack-heading"><span>AVAILABLE CHIPS</span><span>{count(player.hand)} IN HAND</span></div><div className="rack">{colors.map(color => <button className="rack-chip" id={`rack-${seat}-${color}`} key={color} disabled={seat !== game.turn || game.placed || player.hand[color] === 0 || !!game.question || !!game.trade} onPointerDown={event => dragStart(event, seat, color)} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } openChip(seat, color); }} aria-label={`${player.name} drag ${moves[color].name} chip to a stack, ${player.hand[color]} available`}><Token color={color} small /><span>{moves[color].name}</span><b>×{player.hand[color]}</b></button>)}</div><button className="heat-signal" disabled={game.heat >= 5 || game.heatSignals[seat] || !!game.question || !!game.trade} onClick={() => signalHotter(seat)}>↑ Signal it is getting hotter</button><p className="seat-help">{game.turn === seat ? (game.placed ? 'Your chip is on the board. You can place another on your next turn.' : game.played ? 'Your bid was spoken. You may still place one silent chip.' : count(player.hand) ? 'Place one chip: drag it to a stack, or tap to choose its face.' : 'Your hand is empty. Ask about your partner’s chips or receive a chip.') : 'You can place your next chip when your turn begins.'}</p></div>;
    })}</div><div className="board-utilities"><button onClick={() => { setModalSeat(game.turn); setModalColor('white'); setModal('donate'); }}>↗ Donate a chip</button><button onClick={() => { setModalSeat(game.turn); setModal('trade'); }}>⇄ Trade chips</button></div></section>
    <section className="below-board"><div className="inspector">{selected && choice ? <><Token color={selected.color} open={selected.open} silent={!selected.spoken} heard={!!selected.heard} /><div className="inspector-copy"><span className="eyebrow">{game.players[choice.seat].name.toUpperCase()} · STACK {choice.stack + 1}</span><h3>{moves[selected.color].name}{selected.spoken ? selected.heard ? ' · heard' : '' : ' · unspoken'}</h3><p>{selected.spoken ? moves[selected.color].prompt : 'This feeling is present. Its story can wait for a future turn.'}</p><div className="inspector-actions">{!selected.spoken && <button className="primary" disabled={choice.seat !== game.turn || game.played || !!game.question || !!game.trade || count(game.players[choice.seat].hand) === 0} onClick={() => speak(selected)}>Speak this chip</button>}{selected.spoken && <><button className="primary" disabled={selected.heard && (!stackReady || (game.players[choice.seat].meter === 0 && game.heat === 0))} onClick={() => selected.heard ? setModal('release') : acknowledge(selected)}>{selected.heard ? stackReady ? 'Release heard chip' : 'Heard · waiting for stack' : answeredChipId === selected.id ? 'That answer resolved this chip' : 'I feel heard'}</button><button disabled={choice.seat !== game.turn || !!game.question || !!game.trade} onClick={flip}>Flip to {selected.open ? 'feeling only' : 'invite questions'}</button></>}{canAsk && <div className="ask-action"><select value={askColor} disabled={freeAsk} onChange={event => setAskColor(event.target.value as Color)}>{colors.filter(color => game.players[listener].hand[color] > 0).map(color => <option key={color} value={color}>{moves[color].name}</option>)}</select><button onClick={() => ask(selected)}>{freeAsk ? `${game.players[listener].name} asks · free` : `${game.players[listener].name} bids to ask · offer chip`}</button></div>}</div><div className="layers"><span>LAYERS IN THIS STACK</span>{game.stacks[choice.seat][choice.stack].map((chip, index) => <button key={chip.id} className={chip.id === choice.chipId ? 'selected-layer' : ''} onClick={() => setChoice({ seat: choice.seat, stack: choice.stack, chipId: chip.id })}><Token color={chip.color} small />{index + 1}. {moves[chip.color].name}{chip.spoken ? chip.heard ? ' · heard' : '' : ' · unspoken'}</button>)}</div></div></> : <><span className="inspector-empty">◌</span><div><span className="eyebrow">THE CHIP HOLDS THE FEELING</span><h3>Select a stack to explore it.</h3><p>Each player has five places to hold what is emerging. A chip moves only when its owner feels heard.</p></div></>}</div><div className="move-key"><span className="eyebrow">THE FIVE MOVES</span><div>{colors.map(color => <div key={color}><Token color={color} small /><span><strong>{moves[color].name}</strong>{moves[color].prompt}</span></div>)}</div></div></section><div className="bottom-rule"><span>One chip placement per turn · place it spoken or unspoken</span><span>A heard chip cools the conversation or lowers its owner’s conflict meter</span></div></div>
    {game.question && <div className="overlay"><div className="dialog"><span className="eyebrow">TELL ME MORE</span><div id="question-spot" className="question-spot"><Token color={game.question.offer ?? 'white'} /></div><h2>{game.players[game.question.asker].name} is curious.</h2><p>{demoMode ? 'Giuseppe asks: “What was most important about being told before the plan changed?” Wendell answers aloud in the next step. ' : questionChip && !questionChip.open ? `${game.players[game.question.speaker].name} may reveal this sealed feeling and answer aloud, or keep it sealed. ` : 'Ask aloud about this chip. Listen without interruption. '}{game.question.offer ? 'The offered chip returns if an answer is shared or the question is declined. If there is nothing more to tell, the speaker keeps it.' : 'There was no chip to offer; curiosity is still a valid move.'}</p><div className="dialog-buttons question-options"><button className="primary" onClick={() => answer('shared')}>{questionChip && !questionChip.open ? 'Reveal and share' : 'Share more'}</button><button disabled={demoMode} onClick={() => answer('declined')}>Decline · return bid</button><button disabled={demoMode} onClick={() => answer('nothing')}>Nothing more · keep bid</button></div></div></div>}
    {game.trade && <div className="overlay"><div className="dialog"><span className="eyebrow">TRADE OFFER</span><h2>Trade through disclosure.</h2><p>{game.players[game.trade.proposer].name} offers {moves[game.trade.give].name.toLowerCase()} for {moves[game.trade.want].name.toLowerCase()}. The partner chooses what they would like to hear. Share aloud only if both agree.</p><div className="dialog-buttons"><button className="primary" onClick={() => settleTrade(true)}>Disclosure shared · trade</button><button onClick={() => settleTrade(false)}>Decline</button></div></div></div>}
    {modal && <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><div className="dialog"><button className="dialog-close" aria-label="Close" onClick={() => setModal(null)}>×</button>{modal === 'release' && selected && choice ? <><span className="eyebrow">A FEELING WAS HEARD</span><h2>What changed?</h2><p>{game.players[choice.seat].name} chooses where the relief goes. The heard chip moves to the listener either way.</p><div className="release-options"><button disabled={game.heat === 0 || (demoMode && demoStep !== 14)} onClick={() => release(selected, 'cool')}><strong>Cool the conversation</strong><span>{game.heat === 0 ? 'Temperature is already settled' : <>Visible temperature {game.heat} → {game.heat - 1} / 5</>}</span></button><button disabled={game.players[choice.seat].meter === 0 || (demoMode && demoStep !== 16 && demoStep !== 19)} onClick={() => release(selected, 'resolve')}><strong>Resolve part of the issue</strong><span>Private conflict meter −1</span></button></div></> : modal === 'placed' && selected && choice ? <>
      <span className="eyebrow">{game.players[choice.seat].name.toUpperCase()} · STACK {choice.stack + 1}</span>
      <h2>{moves[selected.color].name}{selected.spoken ? selected.heard ? ' · heard' : '' : ' · unspoken'}</h2>
      <div className="draft-preview"><Token color={selected.color} open={selected.open} silent={!selected.spoken} heard={!!selected.heard} /><div><p>{selected.spoken ? moves[selected.color].prompt : 'This feeling is waiting to be spoken on a future turn.'}</p>{selected.spoken && !selected.heard && <p>If answering the question resolved this chip, its owner can mark it heard now. Otherwise, leave it here.</p>}</div></div>
      <div className="draft-section"><span className="eyebrow">CHIP FACE</span><div className="draft-faces"><button className={selected.open ? 'selected-draft' : ''} disabled={choice.seat !== game.turn || !!game.question || !!game.trade} onClick={() => { if (!selected.open) flip(); }}>? Face up <small>Questions welcome</small></button><button className={!selected.open ? 'selected-draft' : ''} disabled={choice.seat !== game.turn || !!game.question || !!game.trade} onClick={() => { if (selected.open) flip(); }}>· Face down <small>Feeling only</small></button></div></div>
      <div className="draft-section"><span className="eyebrow">CHIPS IN THIS STACK</span><div className="placed-layers">{game.stacks[choice.seat][choice.stack].map((chip, index) => <button key={chip.id} className={chip.id === choice.chipId ? 'selected-draft' : ''} onClick={() => setChoice({ seat: choice.seat, stack: choice.stack, chipId: chip.id })}><Token color={chip.color} small /><span>{index + 1}. {moves[chip.color].name}{chip.spoken ? chip.heard ? ' · heard' : '' : ' · waiting'}</span></button>)}</div></div>
      <div className="placed-actions">{!selected.spoken && <button className="primary" disabled={choice.seat !== game.turn || game.played || count(game.players[choice.seat].hand) === 0} onClick={() => speak(selected)}>Speak this chip</button>}{selected.spoken && <button className="primary" disabled={selected.heard && (!stackReady || (game.players[choice.seat].meter === 0 && game.heat === 0))} onClick={() => selected.heard ? setModal('release') : acknowledge(selected)}>{selected.heard ? stackReady ? 'Release heard chip' : 'Heard · waiting for stack' : answeredChipId === selected.id ? 'That answer resolved this chip' : 'I feel heard'}</button>}{answeredChipId === selected.id && !selected.heard && <button onClick={() => { setAnsweredChipId(null); setModal(null); }}>Not resolved yet</button>}{canAsk && <div className="placed-ask">{!freeAsk && <select aria-label="Chip to offer" value={game.players[listener].hand[askColor] ? askColor : colors.find(color => game.players[listener].hand[color] > 0)} onChange={event => setAskColor(event.target.value as Color)}>{colors.filter(color => game.players[listener].hand[color] > 0).map(color => <option key={color} value={color}>{moves[color].name}</option>)}</select>}<button onClick={() => ask(selected)}>{freeAsk ? `${game.players[listener].name} asks · free` : `${game.players[listener].name} bids to ask · offer chip`}</button></div>}<button disabled={choice.seat !== game.turn || game.placed || count(game.players[choice.seat].hand) === 0} onClick={() => openStackBuilder(choice.seat, choice.stack)}>Add a chip to this stack</button></div>
    </> : modal === 'chip' && chipDraft ? <>
      <span className="eyebrow">{game.players[chipDraft.seat].name.toUpperCase()} · BUILD A STACK</span>
      <h2>Place a feeling.</h2>
      <div className="draft-preview"><Token color={chipDraft.color} open={chipDraft.open} /><div><strong>{moves[chipDraft.color].name}</strong><p>{moves[chipDraft.color].prompt}</p><small>{game.players[chipDraft.seat].hand[chipDraft.color]} in hand</small></div></div>
      <div className="draft-section"><span className="eyebrow">CHOOSE A CHIP</span><div className="draft-colors">{colors.map(color => <button key={color} className={chipDraft.color === color ? 'selected-draft' : ''} disabled={game.players[chipDraft.seat].hand[color] === 0} onClick={() => setChipDraft(current => current && { ...current, color })}><Token color={color} small /><span>{moves[color].name}</span></button>)}</div></div>
      <div className="draft-section"><span className="eyebrow">CHOOSE ITS FACE</span><div className="draft-faces"><button className={chipDraft.open ? 'selected-draft' : ''} onClick={() => setChipDraft(current => current && { ...current, open: true })}>? Face up <small>Questions welcome</small></button><button className={!chipDraft.open ? 'selected-draft' : ''} onClick={() => setChipDraft(current => current && { ...current, open: false })}>· Face down <small>Feeling only</small></button></div></div>
      <div className="draft-section"><span className="eyebrow">CHOOSE A STACK</span><div className="draft-stacks">{game.stacks[chipDraft.seat].map((stack, index) => <button key={index} className={chipDraft.stack === index ? 'selected-draft' : ''} onClick={() => setChipDraft(current => current && { ...current, stack: index })}><b>0{index + 1}</b><span>{stack.length} {stack.length === 1 ? 'chip' : 'chips'}</span></button>)}</div><div className="draft-pile" aria-label={`Stack ${chipDraft.stack + 1} preview`}>{game.stacks[chipDraft.seat][chipDraft.stack].length ? game.stacks[chipDraft.seat][chipDraft.stack].slice(-7).map((chip, index) => <span key={chip.id} style={{ transform: `translateY(${-index * 6}px) rotate(${index % 2 ? 4 : -4}deg)` }}><Token color={chip.color} open={chip.open} silent={!chip.spoken} heard={!!chip.heard} small /></span>) : <span className="draft-empty">An empty place for this feeling</span>}</div><p>Stack {chipDraft.stack + 1} holds {game.stacks[chipDraft.seat][chipDraft.stack].length} {game.stacks[chipDraft.seat][chipDraft.stack].length === 1 ? 'chip' : 'chips'}. Each new chip rests on top.</p></div>
      {chipDraft.seat === game.turn && !game.played && <div className="draft-section"><span className="eyebrow">THIS TURN</span><div className="draft-faces"><button className={!chipDraft.silent ? 'selected-draft' : ''} onClick={() => setChipDraft(current => current && { ...current, silent: false })}>Speak this chip <small>Uses your bid</small></button><button className={chipDraft.silent ? 'selected-draft' : ''} onClick={() => setChipDraft(current => current && { ...current, silent: true })}>Stack silently <small>Tell it later</small></button></div></div>}
      <button className="primary" disabled={chipDraft.seat !== game.turn || game.placed} onClick={placeDraft}>Place chip · use this turn’s placement</button><button className="draft-done" onClick={() => { setModal(null); setChipDraft(null); }}>Done with this stack</button>
    </> : modal === 'meter' ? <><span className="eyebrow">PRIVATE METER</span><h2>{game.players[modalSeat].name}</h2><p>Pass the device to {game.players[modalSeat].name}. The other player looks away. Keep the number hidden while you play.</p><button className="meter-hold" onPointerDown={() => setMeterVisible(true)} onPointerUp={() => setMeterVisible(false)} onPointerLeave={() => setMeterVisible(false)} onPointerCancel={() => setMeterVisible(false)} onKeyDown={event => { if (event.key === " " || event.key === "Enter") setMeterVisible(true); }} onKeyUp={() => setMeterVisible(false)}>Press and hold to see your meter</button><div className="meter-number" aria-live="off">{meterVisible ? <>{game.players[modalSeat].meter}<small> / 5</small></> : <span className="meter-covered">SEALED ◈</span>}</div><p>A heard chip moves this down one notch when you choose resolution instead of cooling the conversation.</p><button className="primary" onClick={() => { setMeterVisible(false); setModal(null); }}>Reseal and return to the board</button></> : modal === 'donate' ? <><span className="eyebrow">OUT-OF-TURN MOVE</span><h2>Donate a chip</h2><p>Offer a chip so your partner can speak or deepen a stack. Donation alone does not count as hearing.</p><label>Give from<select value={modalSeat} onChange={event => setModalSeat(Number(event.target.value) as Seat)}>{game.players.map((player, index) => <option key={index} value={index}>{player.name}</option>)}</select></label><label>Chip<select value={modalColor} onChange={event => setModalColor(event.target.value as Color)}>{colors.map(color => <option key={color} value={color}>{moves[color].name} · {game.players[modalSeat].hand[color]} left</option>)}</select></label><button className="primary" disabled={game.players[modalSeat].hand[modalColor] === 0} onClick={donate}>Slide chip across →</button></> : modal === 'trade' ? <><span className="eyebrow">VOLUNTARY EXCHANGE</span><h2>Trade chips</h2><p>Propose the colors. If the partner agrees, they choose what they would like you to disclose aloud. Either player may decline.</p><label>Proposer<select value={modalSeat} onChange={event => setModalSeat(Number(event.target.value) as Seat)}>{game.players.map((player, index) => <option key={index} value={index}>{player.name}</option>)}</select></label><div className="trade-grid"><label>Offer<select value={tradeGive} onChange={event => setTradeGive(event.target.value as Color)}>{colors.map(color => <option key={color} value={color}>{moves[color].name} · {game.players[modalSeat].hand[color]}</option>)}</select></label><label>Receive<select value={tradeWant} onChange={event => setTradeWant(event.target.value as Color)}>{colors.map(color => <option key={color} value={color}>{moves[color].name} · {game.players[other(modalSeat)].hand[color]}</option>)}</select></label></div><button className="primary" disabled={tradeGive === tradeWant || game.players[modalSeat].hand[tradeGive] === 0 || game.players[other(modalSeat)].hand[tradeWant] === 0} onClick={proposeTrade}>Offer this trade →</button></> : <><span className="eyebrow">HOW TO PLAY</span><h2>Speak aloud. Let the chips carry the rest.</h2><ol><li>Choose who opens and set a turn timer. The clock is a cue; it never passes automatically. On your turn, place one spoken chip, speak one waiting chip, or pass.</li><li>On your turn, place one chip in any of your five stacks, spoken or unspoken. Tap a hand chip to choose its face, or drag it to a stack. Tap a placed chip to inspect it.</li><li>At any time, either player may offer a chip to ask about any chip, donate, trade, or release a chip once its owner feels heard. These moves do not use a chip placement.</li><li>Speak to a chip’s color. Face up welcomes questions; face down holds the feeling until its owner reveals it or accepts a question bid.</li><li>Select any spoken chip. Only its owner decides when that feeling has been heard. Mark a spoken chip heard when its owner feels heard. Every layer in a stack must be heard before any chip leaves. On release, the chip goes to the listener; the owner chooses whether to cool visible temperature or lower their hidden conflict meter one notch.</li><li>If unheard, add a chip to that stack on a later turn. If a move makes the conversation hotter, either player may signal it on their side of the board, once per turn. A partner can donate a chip when needed.</li><li>Offer one of your chips to ask about any chip, even face down. Its owner may reveal and answer, decline and return the bid, or say there is nothing more and keep the bid. After an answer, the owner can mark that chip heard if the answer resolved it. With no chips, you may ask for free. Both private meters reaching zero while the conversation is settled completes the conflict.</li></ol><button className="primary" onClick={() => setModal(null)}>Back to the board</button></>}</div></div>}
    {demoMode && (game.question || modal) && <button className="demo-overlay-skip" onClick={leaveDemo}>Skip tutorial → Play</button>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
