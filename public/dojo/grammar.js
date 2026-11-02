// Generated from src/lib/dojo-loop-lab/grammar.ts; see dojo-loop-lab/plan.md.

// src/lib/alchemy/alchemy-graph.ts
var CHANNEL_META = {
  fear: {
    element: "metal",
    resource: "discernment",
    dissatisfied: { label: "anxiety", aliases: ["anxious", "worried", "dread"] },
    neutral: { label: "Fear", aliases: ["clean fear", "discernment", "risk signal"] },
    satisfied: { label: "excitement", aliases: ["courage", "wonder", "openness"] },
    stabilize: { id: "fear_stabilize", name: "Orient Fear" },
    transcend: { id: "metal_transcend", name: "Step Through" }
  },
  sadness: {
    element: "water",
    resource: "meaning",
    dissatisfied: { label: "grief", aliases: ["heavy sadness", "distance", "loss"] },
    neutral: { label: "Sadness", aliases: ["clean sadness", "care signal", "honoring"] },
    satisfied: { label: "poignance", aliases: ["connection", "fulfillment", "receiving"] },
    stabilize: { id: "sadness_stabilize", name: "Hold Sadness" },
    transcend: { id: "water_transcend", name: "Reclaim Meaning" }
  },
  joy: {
    element: "wood",
    resource: "possibility",
    dissatisfied: { label: "restlessness", aliases: ["restless", "mania", "comparison", "hyperstimulation"] },
    neutral: { label: "Joy", aliases: ["clean joy", "aliveness", "delight signal"] },
    satisfied: { label: "bliss", aliases: ["delight", "flourishing", "participation"] },
    stabilize: { id: "joy_stabilize", name: "Settle Joy" },
    transcend: { id: "wood_transcend", name: "Commit to Growth" }
  },
  anger: {
    element: "fire",
    resource: "agency",
    dissatisfied: { label: "frustration", aliases: ["hot anger", "resentment", "attack"] },
    neutral: { label: "Anger", aliases: ["clean anger", "boundary signal", "directed passion"] },
    satisfied: { label: "triumph", aliases: ["warmth", "honored boundary", "agency"] },
    stabilize: { id: "anger_stabilize", name: "Aim Anger" },
    transcend: { id: "fire_transcend", name: "Achieve Breakthrough" }
  },
  neutrality: {
    element: "earth",
    resource: "presence",
    dissatisfied: { label: "apathy", aliases: ["numbness", "boredom", "stagnation", "flatness"] },
    neutral: { label: "Neutral", aliases: ["neutrality", "clean neutrality", "whole-system signal"] },
    satisfied: { label: "peace", aliases: ["peaceful", "coherence", "grounded presence", "stillness"] },
    stabilize: { id: "neutrality_stabilize", name: "Restore Neutrality" },
    transcend: { id: "earth_transcend", name: "Stabilize Coherence" }
  }
};
var SHENG_CYCLE = {
  joy: "anger",
  anger: "neutrality",
  neutrality: "fear",
  fear: "sadness",
  sadness: "joy"
};
var GENERATIVE_MOVE_META = {
  joy: { id: "wood_fire", name: "Declare Intention" },
  anger: { id: "fire_earth", name: "Integrate Gains" },
  neutrality: { id: "earth_metal", name: "Reveal Stakes" },
  fear: { id: "metal_water", name: "Deepen Value" },
  sadness: { id: "water_wood", name: "Renew Vitality" }
};
var CONTROL_MOVE_META = {
  joy: { id: "wood_earth", name: "Consolidate Energy" },
  anger: { id: "fire_metal", name: "Temper Action" },
  neutrality: { id: "earth_water", name: "Reopen Sensitivity" },
  fear: { id: "metal_wood", name: "Activate Hope" },
  sadness: { id: "water_fire", name: "Mobilize Grief" }
};
function stateKey(state) {
  return `${state.channel}:${state.altitude}`;
}
function vectorKey(from, to) {
  return `${stateKey(from)}->${stateKey(to)}`;
}
function getAlchemyStateMeta(state) {
  const meta = CHANNEL_META[state.channel];
  const altitudeMeta = meta[state.altitude];
  return {
    ...state,
    key: stateKey(state),
    element: meta.element,
    label: altitudeMeta.label,
    aliases: altitudeMeta.aliases,
    resource: meta.resource
  };
}
function buildEdge(operation, from, to) {
  const fromMeta = getAlchemyStateMeta(from);
  const toMeta = getAlchemyStateMeta(to);
  const channelMeta = CHANNEL_META[from.channel];
  if (operation === "stabilize") {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: channelMeta.stabilize.id,
      moveName: channelMeta.stabilize.name,
      doctrineLineageId: channelMeta.transcend.id,
      prompt: `Let ${fromMeta.label} become clean ${toMeta.label}.`
    };
  }
  if (operation === "transcend") {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: channelMeta.transcend.id,
      moveName: channelMeta.transcend.name,
      prompt: `Practice clean ${fromMeta.label} until it opens into ${toMeta.label}.`
    };
  }
  if (operation === "translate") {
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: `${from.channel}_to_${to.channel}_translate`,
      moveName: `Translate ${fromMeta.label} Into ${toMeta.label}`,
      prompt: `Let clean ${fromMeta.label} become available as clean ${toMeta.label}.`
    };
  }
  if (operation === "generate") {
    const move = GENERATIVE_MOVE_META[from.channel];
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: move.id,
      moveName: move.name,
      prompt: `Let ${fromMeta.label} nourish ${toMeta.label}.`
    };
  }
  if (operation === "control") {
    const move = CONTROL_MOVE_META[from.channel];
    return {
      operation,
      from,
      to,
      vector: vectorKey(from, to),
      moveId: move.id,
      moveName: move.name,
      prompt: `Use ${fromMeta.label} to precisely reach ${toMeta.label}.`
    };
  }
  return {
    operation,
    from,
    to,
    vector: vectorKey(from, to),
    moveId: `${from.channel}_controlled_descent`,
    moveName: `Descend with ${fromMeta.label}`,
    prompt: `Step down from ${fromMeta.label} into ${toMeta.label} without collapse.`
  };
}
function buildAlchemyEdge(operation, from, to) {
  return buildEdge(operation, from, to);
}

// src/lib/alchemy/thought-string-triad.ts
function nextShengState(state) {
  return { channel: SHENG_CYCLE[state.channel], altitude: state.altitude };
}
function deriveElementalTriad(root) {
  const middle = nextShengState(root);
  const end = nextShengState(middle);
  return {
    ruleVersion: "ea-v1",
    states: [root, middle, end],
    shengEdges: [
      buildAlchemyEdge("generate", root, middle),
      buildAlchemyEdge("generate", middle, end)
    ],
    keClosingEdge: buildAlchemyEdge("control", root, end)
  };
}
function firstConfirmedWordId(anchors, state) {
  return anchors.filter((anchor) => anchor.status === "confirmed" && stateKey(anchor.state) === stateKey(state)).map((anchor) => anchor.wordId).sort()[0] ?? null;
}
function deriveSupportedElementalTriads(anchors) {
  const roots = anchors.filter((anchor) => anchor.status === "confirmed").map((anchor) => anchor.state).sort((a, b) => stateKey(a).localeCompare(stateKey(b)));
  const seen = /* @__PURE__ */ new Set();
  const supported = [];
  for (const root of roots) {
    const triad = deriveElementalTriad(root);
    const [first, second, third] = triad.states;
    const wordIds = [
      firstConfirmedWordId(anchors, first),
      firstConfirmedWordId(anchors, second),
      firstConfirmedWordId(anchors, third)
    ];
    if (wordIds[0] === null || wordIds[1] === null || wordIds[2] === null) continue;
    const key = triad.states.map(stateKey).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    supported.push({
      ...triad,
      confirmedWordIds: [wordIds[0], wordIds[1], wordIds[2]]
    });
  }
  return supported;
}

// src/lib/dojo-loop-lab/grammar.ts
var exampleAnchors = {
  wonder: { wordId: "wonder", state: { channel: "fear", altitude: "satisfied" }, status: "proposed" },
  poignance: { wordId: "poignance", state: { channel: "sadness", altitude: "satisfied" }, status: "proposed" },
  joy: { wordId: "joy", state: { channel: "joy", altitude: "satisfied" }, status: "proposed" }
};
function deriveExample(decisions) {
  const anchors = Object.keys(exampleAnchors).map((id) => ({ ...exampleAnchors[id], status: decisions[id] }));
  return deriveSupportedElementalTriads(anchors).find((t) => t.states[0].channel === "fear" && t.states[1].channel === "sadness" && t.states[2].channel === "joy") ?? null;
}
var forms = [
  { id: "bounded_pilot_design", domain: "SKILLFUL_ORGANIZING", personalMove: "grow_up", label: "Skillful Organizing \xB7 Grow Up", title: "Design a 45-minute pilot", prompt: "Draft a 45-minute pilot: capacity, roles, one exercise, and one feedback question.", condition: "A bounded run-of-show exists." },
  { id: "witness_invitation", domain: "GATHERING_RESOURCES", personalMove: "open_up", label: "Gathering Resources \xB7 Open Up", title: "Invite three witnesses", prompt: "Choose and invite three suitable witnesses.", condition: "Three invitations are sent, whether or not they are accepted." },
  { id: "pilot_invitation_copy", domain: "RAISE_AWARENESS", personalMove: "wake_up", label: "Raise Awareness \xB7 Wake Up", title: "Write the invitation", prompt: "Write one paragraph explaining what it is, who it is for, and an easy no.", condition: "The invitation copy exists." },
  { id: "host_pilot", domain: "DIRECT_ACTION", personalMove: "show_up", label: "Direct Action \xB7 Show Up", title: "Host the pilot", prompt: "Host the scheduled pilot.", condition: "You offer and host the room; attendance or approval is not required." }
];
function resolveForm(id) {
  return forms.find((form) => form.id === id) ?? null;
}
export {
  deriveExample,
  exampleAnchors,
  forms,
  resolveForm
};
