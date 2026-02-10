import { TwineLogic } from './twine-engine'

export const DEFAULT_INTENTION_INPUTS = [
    {
        key: 'intention',
        label: 'My Intention',
        type: 'textarea',
        required: true,
        placeholder: 'What intention do you want to hold for your journey?'
    }
] as const

export const INTENTION_GUIDED_TWINE_LOGIC: TwineLogic = {
    startPassageId: 'start',
    passages: [
        {
            id: 'start',
            text: 'Let us find your intention. What feels most urgent right now?',
            choices: [
                { text: 'I need clarity about what to focus on.', targetId: 'clarity' },
                { text: 'I need momentum and follow-through.', targetId: 'momentum' },
                { text: 'I want to contribute meaningfully to others.', targetId: 'contribution' }
            ]
        },
        {
            id: 'clarity',
            text: 'What kind of clarity would help you most?',
            choices: [
                {
                    text: 'Clarity on the single next step.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to identify and complete one clear next step that moves my journey forward.',
                        intentionTheme: 'clarity',
                        intentionSource: 'guided-journey'
                    }
                },
                {
                    text: 'Clarity on the impact I want to make.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to align my actions with the impact I most want to create in this community.',
                        intentionTheme: 'clarity',
                        intentionSource: 'guided-journey'
                    }
                }
            ]
        },
        {
            id: 'momentum',
            text: 'Which style of momentum feels most honest for you?',
            choices: [
                {
                    text: 'Small, consistent daily action.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to build steady momentum through one small, meaningful action each day.',
                        intentionTheme: 'momentum',
                        intentionSource: 'guided-journey'
                    }
                },
                {
                    text: 'One brave public commitment.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to make one brave commitment and follow through with visible accountability.',
                        intentionTheme: 'momentum',
                        intentionSource: 'guided-journey'
                    }
                }
            ]
        },
        {
            id: 'contribution',
            text: 'Where do you want your contribution to land first?',
            choices: [
                {
                    text: 'Support one person deeply.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to offer focused support to one person and strengthen a real connection.',
                        intentionTheme: 'contribution',
                        intentionSource: 'guided-journey'
                    }
                },
                {
                    text: 'Contribute to the collective field.',
                    targetId: 'final',
                    effects: {
                        intention: 'I intend to contribute energy, ideas, and follow-through that strengthen the collective.',
                        intentionTheme: 'contribution',
                        intentionSource: 'guided-journey'
                    }
                }
            ]
        },
        {
            id: 'final',
            text: 'Take a breath. Your intention has been clarified. Review it below, then complete the quest to log it.',
            choices: [],
            isFinal: true
        }
    ]
}
