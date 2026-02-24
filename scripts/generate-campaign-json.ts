// Script to generate the Twine JSON from the provided skeleton
import fs from 'fs'
import path from 'path'

const campaignDir = path.join(process.cwd(), 'content', 'campaigns', 'wake_up')

// Create dir if not exists
if (!fs.existsSync(campaignDir)) {
    fs.mkdirSync(campaignDir, { recursive: true })
}

const nodes = {
    // 0) CENTER
    'Center_Witness': {
        id: 'Center_Witness',
        text: "(Facts)\n- Fired by text (Feb 18), day before birthday\n- Feb 21 party proof: 25 people, characters created, quests assigned, BARs traded physical+digital\n- Heist at the Construct Conclave: Oceans 11 x Gundam/Eva, Five Nations power constructs, annual awards, this year robbed\n\nChoose an interpretive lens.",
        choices: [
            { text: "Choose an interpretive lens", targetId: "Center_ChooseLens" }
        ]
    },
    'Center_ChooseLens': {
        id: 'Center_ChooseLens',
        text: "Choose a Face (altitudinal path). Exploration is allowed; onboarding requires completion of at least one path quest.",
        choices: [
            { text: "Shaman (Magenta)", targetId: "Path_Sh_Start" },
            { text: "Challenger (Red)", targetId: "Path_Ch_Start" },
            { text: "Regent (Amber)", targetId: "Path_Re_Start" },
            { text: "Architect (Orange)", targetId: "Path_Ar_Start" },
            { text: "Diplomat (Green)", targetId: "Path_Di_Start" },
            { text: "Sage (Teal)", targetId: "Path_Sa_Start" },
            { text: "If onboarding already unlocked, continue", targetId: "Center_PostUnlock" }
        ]
    },

    // 2a) Shaman
    'Path_Sh_Start': {
        id: 'Path_Sh_Start',
        text: "(Entering Shaman Path)\n<<set $active_face = \"shaman\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Sh_Interpret" }]
    },
    'Path_Sh_Interpret': {
        id: 'Path_Sh_Interpret',
        text: "(Interpretation stub: mythic rupture, threshold)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Sh_Step1" }]
    },
    'Path_Sh_Step1': {
        id: 'Path_Sh_Step1',
        text: "Step 1 (private): create Tension BAR (threshold in life)\n<<set $tension_bar_id = \"BAR_TENSION_SHAMAN_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Sh_Step2" }]
    },
    'Path_Sh_Step2': {
        id: 'Path_Sh_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (symbolic act)\n<<set $action_bar_id = \"BAR_ACTION_SHAMAN_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 2b) Challenger
    'Path_Ch_Start': {
        id: 'Path_Ch_Start',
        text: "(Entering Challenger Path)\n<<set $active_face = \"challenger\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Ch_Interpret" }]
    },
    'Path_Ch_Interpret': {
        id: 'Path_Ch_Interpret',
        text: "(Interpretation stub: provocation, decisive break)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Ch_Step1" }]
    },
    'Path_Ch_Step1': {
        id: 'Path_Ch_Step1',
        text: "Step 1 (private): create Tension BAR (something tolerated)\n<<set $tension_bar_id = \"BAR_TENSION_CHALLENGER_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Ch_Step2" }]
    },
    'Path_Ch_Step2': {
        id: 'Path_Ch_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (visible disruption)\n<<set $action_bar_id = \"BAR_ACTION_CHALLENGER_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 2c) Regent
    'Path_Re_Start': {
        id: 'Path_Re_Start',
        text: "(Entering Regent Path)\n<<set $active_face = \"regent\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Re_Interpret" }]
    },
    'Path_Re_Interpret': {
        id: 'Path_Re_Interpret',
        text: "(Interpretation stub: structure, boundary, authority)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Re_Step1" }]
    },
    'Path_Re_Step1': {
        id: 'Path_Re_Step1',
        text: "Step 1 (private): create Tension BAR (missing boundary/rule)\n<<set $tension_bar_id = \"BAR_TENSION_REGENT_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Re_Step2" }]
    },
    'Path_Re_Step2': {
        id: 'Path_Re_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (establish boundary/rule)\n<<set $action_bar_id = \"BAR_ACTION_REGENT_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 2d) Architect
    'Path_Ar_Start': {
        id: 'Path_Ar_Start',
        text: "(Entering Architect Path)\n<<set $active_face = \"architect\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Ar_Interpret" }]
    },
    'Path_Ar_Interpret': {
        id: 'Path_Ar_Interpret',
        text: "(Interpretation stub: system redesign, prototype mind)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Ar_Step1" }]
    },
    'Path_Ar_Step1': {
        id: 'Path_Ar_Step1',
        text: "Step 1 (private): create Tension BAR (system inefficiency)\n<<set $tension_bar_id = \"BAR_TENSION_ARCHITECT_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Ar_Step2" }]
    },
    'Path_Ar_Step2': {
        id: 'Path_Ar_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (structural adjustment)\n<<set $action_bar_id = \"BAR_ACTION_ARCHITECT_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 2e) Diplomat
    'Path_Di_Start': {
        id: 'Path_Di_Start',
        text: "(Entering Diplomat Path)\n<<set $active_face = \"diplomat\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Di_Interpret" }]
    },
    'Path_Di_Interpret': {
        id: 'Path_Di_Interpret',
        text: "(Interpretation stub: relational field, coalition)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Di_Step1" }]
    },
    'Path_Di_Step1': {
        id: 'Path_Di_Step1',
        text: "Step 1 (private): create Tension BAR (relational thread)\n<<set $tension_bar_id = \"BAR_TENSION_DIPLOMAT_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Di_Step2" }]
    },
    'Path_Di_Step2': {
        id: 'Path_Di_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (reach out / repair)\n<<set $action_bar_id = \"BAR_ACTION_DIPLOMAT_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 2f) Sage
    'Path_Sa_Start': {
        id: 'Path_Sa_Start',
        text: "(Entering Sage Path)\n<<set $active_face = \"sage\">>\n<<set $step1_done = false>>\n<<set $step2_done = false>>",
        choices: [{ text: "Continue", targetId: "Path_Sa_Interpret" }]
    },
    'Path_Sa_Interpret': {
        id: 'Path_Sa_Interpret',
        text: "(Interpretation stub: pattern integration, synthesis)",
        choices: [{ text: "Name the tension (Step 1)", targetId: "Path_Sa_Step1" }]
    },
    'Path_Sa_Step1': {
        id: 'Path_Sa_Step1',
        text: "Step 1 (private): create Tension BAR (pattern across 2 domains)\n<<set $tension_bar_id = \"BAR_TENSION_SAGE_PLACEHOLDER\">>\n<<set $step1_done = true>>",
        choices: [{ text: "Commit an action (Step 2)", targetId: "Path_Sa_Step2" }]
    },
    'Path_Sa_Step2': {
        id: 'Path_Sa_Step2',
        text: "Step 2 (private): create Action BAR linked to tension (behavior change from synthesis)\n<<set $action_bar_id = \"BAR_ACTION_SAGE_PLACEHOLDER\">>\n<<set $step2_done = true>>",
        choices: [{ text: "Complete quest", targetId: "Path_Complete" }]
    },

    // 3) Shared Completion Node 
    'Path_Complete': {
        id: 'Path_Complete',
        text: "Quest Complete.\n<<complete_active_face>>",
        choices: [
            { text: "Return to Center", targetId: "Center_PostUnlock" },
            { text: "Go back to Center", targetId: "Center_ChooseLens" }
        ]
    },

    // 4) Center After Unlock
    'Center_PostUnlock': {
        id: 'Center_PostUnlock',
        text: "(Onboarding is now available.)\n\nYou can:\n- Explore another altitude path (adds starting quest variety)\n- Proceed to onboarding (character creation + nation/archetype)",
        choices: [
            { text: "Explore another lens", targetId: "Center_ChooseLens" },
            { text: "Proceed to Onboarding", targetId: "Onboarding_Start" }
        ]
    },

    // 5) Onboarding Start 
    'Onboarding_Start': {
        id: 'Onboarding_Start',
        text: "(Character creation begins here)\n\n- Create character\n- Choose Nation\n- Choose Archetype\n- Starting quest pool is derived from completed altitude flags",
        choices: [
            { text: "Continue", targetId: "Onboarding_QuestPool" }
        ]
    },

    // 6) Quest Pool Derivation
    'Onboarding_QuestPool': {
        id: 'Onboarding_QuestPool',
        text: "(Stub: show starting quests derived from completed flags.)\n\n<<print_status_report>>",
        choices: [
            { text: "Enter the game", targetId: "Game_Login" }
        ]
    }

}

// Save all nodes
for (const [id, node] of Object.entries(nodes)) {
    fs.writeFileSync(path.join(campaignDir, `${id}.json`), JSON.stringify(node, null, 2))
}

const map = {
    startNodeId: 'Center_Witness',
    nodes: Object.keys(nodes)
}
fs.writeFileSync(path.join(campaignDir, 'map.json'), JSON.stringify(map, null, 2))

console.log("Twine Draft generated.")
