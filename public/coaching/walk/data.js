/* The coaching walk's words (Six-faces-council .specify/specs/coaching-walk, FR-007). A plain copy of
   src/lib/coaching/unpacking-walk.ts and coaching-map.ts for the static page; src/lib/coaching/__tests__/walk-data.test.ts
   fails when the two drift apart. No three.js here, so the test can import it. */

export const QUESTIONS = [
  { id: "experience", title: "What experience do you want to create?", hint: "Choose the one closest to yours, or say it in your own words." },
  { id: "toward", title: "What will that give you?", hint: "Choose the feeling you want to walk toward. It becomes your light in the forest. You can choose more than one." },
  { id: "now", title: "Compared to what you want to create, what is life like right now?", hint: "Say it as it is. A sentence or two is enough." },
  { id: "feels", title: "How does it feel to live here?", hint: "Choose where you feel it on the body, then the words that fit. You can choose more than one of each." },
  { id: "truth", title: "What would have to be true for someone to feel this way?", hint: "Answer as if it were about someone else." },
  { id: "reservations", title: "What reservations do you have about creating it?", hint: "These are the voices that most often stop people. Choose any you hear." },
];

export const EXPERIENCES = [
  { id: "build", text: "Finally build what I keep putting off", allyship: false },
  { id: "alive", text: "Feel alive in my days again", allyship: false },
  { id: "pattern", text: "Stop repeating the same pattern with people", allyship: false },
  { id: "show-up", text: "Show up well for people who are treated differently than me", allyship: true },
  { id: "lead", text: "Lead my team or community through something hard", allyship: true },
];

export const CHANNEL_LIGHT = { anger: "#ff9a6b", sadness: "#8fb8ff", fear: "#e6edf5", joy: "#b6f08a", neutrality: "#f3d79a" };

export const SATISFACTIONS = [
  { channel: "anger", state: "triumph", means: "You use your power cleanly, a boundary is honoured, and what was stuck moves." },
  { channel: "sadness", state: "poignance", means: "You are close to what you care about, and it means something." },
  { channel: "fear", state: "excitement", means: "You see the risk clearly and have the nerve to step into it." },
  { channel: "joy", state: "bliss", means: "You feel delight, and you get to share it and play." },
  { channel: "neutrality", state: "peace", means: "You feel settled and present. You can see the whole, and nothing pulls at you." },
];

export const DISSATISFACTIONS = [
  { channel: "fear", state: "anxious" }, { channel: "fear", state: "worried" },
  { channel: "sadness", state: "heavy" }, { channel: "sadness", state: "far from what matters" },
  { channel: "joy", state: "restless" }, { channel: "joy", state: "comparing myself" },
  { channel: "anger", state: "frustrated" }, { channel: "anger", state: "resentful" },
  { channel: "neutrality", state: "numb" }, { channel: "neutrality", state: "flat" },
];

export const BODY_REGIONS = ["head", "throat", "chest", "belly", "arms and hands", "legs and feet"];

export const BELIEFS = [
  { belief: "I’m not ready", sounds: "I need to be further along before I start." },
  { belief: "I’m not worthy", sounds: "Who am I to want this?" },
  { belief: "I’m not capable", sounds: "I will try and get it wrong." },
  { belief: "I’m insignificant", sounds: "It would not matter if I did." },
  { belief: "I don’t belong", sounds: "This is for other people." },
  { belief: "I’m not good enough", sounds: "Someone else would do it better." },
];

/* coaching-map.ts FEELINGS, keyed by channel: each feeling's job, offered at the hollow tree (question 5). */
export const JOBS = {
  anger: "Anger’s job is to find obstacles to be overcome, or boundaries to be created or destroyed.",
  sadness: "Sadness’s job is to point you toward what you care about and how far away you are from it.",
  fear: "Fear’s job is to detect threat and risk.",
  joy: "Joy’s job is to show you what’s aligned with your delight.",
  neutrality: "Neutrality’s job is detachment and perspective, the view that lets you see the whole.",
};

/* The doors at the fire (his steer on cp-send-look-1: book with me, buy the book, the Patreon for the games). */
export const TIERS = [
  { price: "$250", href: "https://calendly.com/wendell-britt/coaching-250" },
  { price: "$150", href: "https://calendly.com/wendell-britt/coaching-150" },
  { price: "$75", href: "https://calendly.com/wendell-britt/coaching-75" },
  { price: "Pay what feels right", href: "https://calendly.com/wendell-britt/pay-what-feels-right" },
];
export const BOOK_HREF = "https://wendellbritt.gumroad.com/l/MTGOAbook";
/* Missing: the Patreon page's address is in no file of the record (council look row cw-walk-look-1 names it). Until he
   names it, the gate's door says so instead of guessing a link. */
export const PATREON_HREF = "";

export const EMPTY = { experience: "", experienceOwn: "", toward: [], now: "", where: [], feels: [], truth: "", reservations: [] };

/* The plain-text record, as unpacking-walk.ts composeWalk writes it, to paste into Calendly's notes box. */
export function composeWalk(w) {
  const lines = ["What I brought out of the forest"];
  const exp = EXPERIENCES.find(e => e.id === w.experience)?.text ?? w.experienceOwn.trim();
  if (exp) lines.push("", `What I want to create: ${exp}`);
  const toward = SATISFACTIONS.filter(s => w.toward.includes(s.channel)).map(s => s.state);
  if (toward.length) lines.push(`What it will get me: ${toward.join(", ")}`);
  if (w.now.trim()) lines.push(`What life is like now: ${w.now.trim()}`);
  if (w.feels.length || w.where.length) lines.push(`How it feels here: ${w.feels.join(", ") || "something"}${w.where.length ? ` (in my ${w.where.join(", ")})` : ""}`);
  if (w.truth.trim()) lines.push(`What would have to be true: ${w.truth.trim()}`);
  if (w.reservations.length) lines.push(`What holds me back: ${w.reservations.join("; ")}`);
  return lines.join("\n");
}

/* The utm tags the visitor arrived with ride on every door, as source-tags.ts passes them: only the five names, empty
   values dropped, at most 100 characters, and a tag already on the link left as it is. */
export const SOURCE_TAGS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
export function withTags(href, search) {
  if (!href) return href;
  const p = new URLSearchParams(search), u = new URL(href);
  for (const n of SOURCE_TAGS) { const v = (p.get(n) || "").trim(); if (v && !u.searchParams.has(n)) u.searchParams.set(n, v.slice(0, 100)); }
  return u.toString();
}
