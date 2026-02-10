export type TwineChoice = {
    text: string;
    targetId: string;
    condition?: string; // Optional conditional logic (simple JS expression for now)
    effects?: Record<string, any>; // Effects to apply upon choosing
};

export type TwinePassage = {
    id: string;
    text: string;
    choices: TwineChoice[];
    isFinal?: boolean; // If true, this passage can trigger quest completion
    action?: string;   // Optional action to trigger on entry
};

export type TwineLogic = {
    passages: TwinePassage[];
    startPassageId: string;
};

export type TwineGameState = {
    currentPassageId: string;
    variables: Record<string, any>;
    history: string[];
};

export function getInitialState(logic: TwineLogic): TwineGameState {
    return {
        currentPassageId: logic.startPassageId,
        variables: {},
        history: [logic.startPassageId],
    };
}

export function navigate(logic: TwineLogic, state: TwineGameState, choiceIndex: number): TwineGameState | null {
    const currentPassage = logic.passages.find(p => p.id === state.currentPassageId);
    if (!currentPassage) return null;

    const choice = currentPassage.choices[choiceIndex];
    if (!choice) return null;

    // TODO: Evaluate choice.condition if present

    const nextState: TwineGameState = {
        ...state,
        currentPassageId: choice.targetId,
        history: [...state.history, choice.targetId],
    };

    // Apply effects
    if (choice.effects) {
        nextState.variables = { ...nextState.variables, ...choice.effects };
    }

    return nextState;
}

export function getCurrentPassage(logic: TwineLogic, state: TwineGameState): TwinePassage | null {
    return logic.passages.find(p => p.id === state.currentPassageId) || null;
}
