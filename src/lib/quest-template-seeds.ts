/**
 * Quest Template Seed Data — Campaign Self-Serve L1
 *
 * Canonical quest templates available in the campaign creation wizard.
 * Each template has:
 *  - key: unique machine identifier
 *  - name: wizard display name
 *  - description: helper text explaining what this quest does
 *  - category: grouping in wizard UI
 *  - defaultSettings: canonical config (read-only to end users)
 *  - copyTemplate: JSON blueprint cloned into Campaign.questTemplateConfig
 *  - narrativeHooks: L3 reserved (null for now)
 *  - sortOrder: display ordering within category
 *
 * Categories:
 *  - onboarding: first-touch quests for new players joining a campaign
 *  - fundraising: resource gathering / donation quests
 *  - awareness: raise awareness / storytelling quests
 *  - direct_action: concrete action / organizing quests
 *  - community: relationship building / gathering quests
 *  - custom: blank slate templates
 *
 * Bruised Banana is backfilled as the reference implementation.
 */

export type QuestTemplateSeedData = {
  key: string
  name: string
  description: string
  category: string
  defaultSettings: Record<string, unknown>
  copyTemplate: Record<string, unknown>
  narrativeHooks: Record<string, unknown> | null
  sortOrder: number
}

// ---------------------------------------------------------------------------
// Onboarding templates — first-touch quests
// ---------------------------------------------------------------------------

const ONBOARDING_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'onboarding-welcome',
    name: 'Welcome Quest',
    description:
      'First quest a new player encounters. Introduces them to the campaign mission and asks them to set an intention.',
    category: 'onboarding',
    defaultSettings: {
      moveType: 'wakeUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 1,
      estimatedMinutes: 5,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Welcome to {campaignName}',
      description:
        "You've joined {campaignName}. Take a moment to learn our story, then set one intention for your participation.",
      successCondition: 'Intention written and submitted.',
      steps: [
        { type: 'read', label: 'Learn the story', field: 'wakeUpContent' },
        {
          type: 'input',
          label: 'Set your intention',
          field: 'playerIntention',
          inputType: 'textarea',
          placeholder: 'What do you want to contribute or receive?',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
  {
    key: 'onboarding-introduce-yourself',
    name: 'Introduce Yourself',
    description:
      'Prompts new players to share a brief introduction with the community.',
    category: 'onboarding',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 1,
      estimatedMinutes: 5,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Introduce Yourself',
      description:
        'Tell the community a little about who you are and what brought you here.',
      successCondition: 'Introduction submitted.',
      steps: [
        {
          type: 'input',
          label: 'Your name (or alias)',
          field: 'displayName',
          inputType: 'text',
          placeholder: 'What should people call you?',
        },
        {
          type: 'input',
          label: 'What brought you here?',
          field: 'introMessage',
          inputType: 'textarea',
          placeholder: 'Share what drew you to this campaign...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 1,
  },
  {
    key: 'onboarding-first-action',
    name: 'First Action',
    description:
      'A quick-win quest giving new players immediate momentum. Completes in under 10 minutes.',
    category: 'onboarding',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'DIRECT_ACTION',
      reward: 1,
      estimatedMinutes: 10,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Take Your First Action',
      description:
        'Complete one small, concrete action to contribute to {campaignName}.',
      successCondition: 'Action completed and recorded.',
      steps: [
        {
          type: 'choice',
          label: 'Pick your first action',
          field: 'actionChoice',
          options: [
            'Share the campaign with one person',
            'Post about it on social media',
            'Sign up for the next event',
            'Something else',
          ],
        },
        {
          type: 'input',
          label: 'What did you do?',
          field: 'actionReport',
          inputType: 'textarea',
          placeholder: 'Describe what you did...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 2,
  },
]

// ---------------------------------------------------------------------------
// Fundraising templates
// ---------------------------------------------------------------------------

const FUNDRAISING_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'fundraiser-pledge',
    name: 'Pledge Drive',
    description:
      'Players commit to a specific contribution amount or resource pledge. Tracks progress toward a goal.',
    category: 'fundraising',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 2,
      estimatedMinutes: 5,
      requiresAuth: true,
      trackProgress: true,
    },
    copyTemplate: {
      title: 'Make Your Pledge',
      description:
        'Commit to supporting {campaignName} with a specific contribution.',
      successCondition: 'Pledge recorded.',
      steps: [
        {
          type: 'choice',
          label: 'Pledge type',
          field: 'pledgeType',
          options: ['Financial', 'Time/Volunteer', 'Skills/Expertise', 'Materials/Supplies'],
        },
        {
          type: 'input',
          label: 'What will you contribute?',
          field: 'pledgeDetail',
          inputType: 'textarea',
          placeholder: 'Describe your pledge...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
  {
    key: 'fundraiser-share-story',
    name: 'Share Your Why',
    description:
      'Players create a personal testimony about why the campaign matters. Shareable for fundraising amplification.',
    category: 'fundraising',
    defaultSettings: {
      moveType: 'wakeUp',
      allyshipDomain: 'RAISE_AWARENESS',
      reward: 2,
      estimatedMinutes: 15,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Share Your Why',
      description:
        'Tell the story of why {campaignName} matters to you. Your testimony helps others understand the mission.',
      successCondition: 'Story submitted.',
      steps: [
        {
          type: 'input',
          label: 'Your story',
          field: 'personalStory',
          inputType: 'textarea',
          placeholder: 'Why does this campaign matter to you?',
        },
        {
          type: 'choice',
          label: 'Can we share this publicly?',
          field: 'shareConsent',
          options: ['Yes, share with my name', 'Yes, but anonymously', 'No, keep it private'],
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 1,
  },
]

// ---------------------------------------------------------------------------
// Awareness templates
// ---------------------------------------------------------------------------

const AWARENESS_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'awareness-amplify',
    name: 'Amplify the Message',
    description:
      'Players share campaign content on their own platforms (social media, word of mouth, community boards).',
    category: 'awareness',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'RAISE_AWARENESS',
      reward: 1,
      estimatedMinutes: 10,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Amplify the Message',
      description:
        'Help spread the word about {campaignName} by sharing it on your platform of choice.',
      successCondition: 'Content shared on at least one platform.',
      steps: [
        {
          type: 'choice',
          label: 'Where will you share?',
          field: 'platform',
          options: [
            'Social media',
            'Email / messaging',
            'In person / word of mouth',
            'Community board / newsletter',
          ],
        },
        {
          type: 'input',
          label: 'How did it go?',
          field: 'shareReport',
          inputType: 'textarea',
          placeholder: 'Brief note about your outreach...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
  {
    key: 'awareness-learn-the-story',
    name: 'Learn the Story',
    description:
      'Guided reading quest where players engage with campaign background material and reflect.',
    category: 'awareness',
    defaultSettings: {
      moveType: 'wakeUp',
      allyshipDomain: 'RAISE_AWARENESS',
      reward: 1,
      estimatedMinutes: 15,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Learn the Story Behind {campaignName}',
      description:
        'Read the campaign story, then share one thing that resonated with you.',
      successCondition: 'Reflection submitted.',
      steps: [
        { type: 'read', label: 'Read the campaign story', field: 'wakeUpContent' },
        {
          type: 'input',
          label: 'What resonated?',
          field: 'resonance',
          inputType: 'textarea',
          placeholder: 'One thing that stood out to you...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 1,
  },
]

// ---------------------------------------------------------------------------
// Direct action templates
// ---------------------------------------------------------------------------

const DIRECT_ACTION_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'action-organize-event',
    name: 'Organize a Gathering',
    description:
      'Players commit to hosting or organizing a small event (meetup, workshop, rally, potluck).',
    category: 'direct_action',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'SKILLFUL_ORGANIZING',
      reward: 3,
      estimatedMinutes: 30,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Organize a Gathering',
      description:
        'Plan and host a small gathering in support of {campaignName}.',
      successCondition: 'Event planned and at least 2 people confirmed.',
      steps: [
        {
          type: 'input',
          label: 'Event name',
          field: 'eventName',
          inputType: 'text',
          placeholder: 'What will you call this gathering?',
        },
        {
          type: 'input',
          label: 'When and where?',
          field: 'eventDetails',
          inputType: 'textarea',
          placeholder: 'Date, time, and location...',
        },
        {
          type: 'input',
          label: 'Who will you invite?',
          field: 'inviteeDescription',
          inputType: 'textarea',
          placeholder: 'Describe who you plan to invite...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
  {
    key: 'action-complete-task',
    name: 'Complete a Campaign Task',
    description:
      'A concrete, single-session action item. Steward defines the task; player reports completion.',
    category: 'direct_action',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'DIRECT_ACTION',
      reward: 2,
      estimatedMinutes: 20,
      requiresAuth: true,
    },
    copyTemplate: {
      title: '{taskTitle}',
      description: '{taskDescription}',
      successCondition: 'Task completed and reported.',
      steps: [
        {
          type: 'input',
          label: 'What did you do?',
          field: 'completionReport',
          inputType: 'textarea',
          placeholder: 'Describe what you accomplished...',
        },
        {
          type: 'choice',
          label: 'How did it go?',
          field: 'difficulty',
          options: ['Easy — done quickly', 'Moderate — took some effort', 'Challenging — pushed my limits'],
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 1,
  },
  {
    key: 'action-reach-out',
    name: 'Reach Out to Someone',
    description:
      'Players contact one specific person to support the campaign — outreach, ask, invitation.',
    category: 'direct_action',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 2,
      estimatedMinutes: 10,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Reach Out to One Person',
      description:
        'Contact someone who could support or benefit from {campaignName}.',
      successCondition: 'One outreach completed.',
      steps: [
        {
          type: 'input',
          label: 'Who will you reach out to?',
          field: 'targetPerson',
          inputType: 'text',
          placeholder: 'Name or description (e.g., "my neighbor")',
        },
        {
          type: 'choice',
          label: 'How will you reach them?',
          field: 'method',
          options: ['In person', 'Phone call', 'Text/message', 'Email', 'Social media'],
        },
        {
          type: 'input',
          label: 'How did it go?',
          field: 'outreachReport',
          inputType: 'textarea',
          placeholder: 'Brief report on your outreach...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 2,
  },
]

// ---------------------------------------------------------------------------
// Community templates
// ---------------------------------------------------------------------------

const COMMUNITY_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'community-share-resource',
    name: 'Share a Resource',
    description:
      'Players contribute a useful resource (link, document, tool, contact) to the campaign knowledge base.',
    category: 'community',
    defaultSettings: {
      moveType: 'growUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 1,
      estimatedMinutes: 10,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Share a Resource',
      description:
        'Contribute something useful to {campaignName} — a link, a tool, a document, a contact.',
      successCondition: 'Resource shared with the community.',
      steps: [
        {
          type: 'input',
          label: 'Resource title',
          field: 'resourceTitle',
          inputType: 'text',
          placeholder: 'What is this resource?',
        },
        {
          type: 'input',
          label: 'Link or description',
          field: 'resourceContent',
          inputType: 'textarea',
          placeholder: 'Paste a link or describe the resource...',
        },
        {
          type: 'input',
          label: 'Why is this useful?',
          field: 'resourceReason',
          inputType: 'textarea',
          placeholder: 'Brief note on why this helps the campaign...',
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
  {
    key: 'community-reflect-report',
    name: 'Reflect and Report',
    description:
      'End-of-cycle reflection quest. Players report outcomes, learnings, and next steps.',
    category: 'community',
    defaultSettings: {
      moveType: 'cleanUp',
      allyshipDomain: 'RAISE_AWARENESS',
      reward: 1,
      estimatedMinutes: 10,
      requiresAuth: true,
    },
    copyTemplate: {
      title: 'Reflect and Report',
      description:
        'Take a few minutes to reflect on your campaign participation and share one outcome or learning.',
      successCondition: 'Reflection submitted.',
      steps: [
        {
          type: 'input',
          label: 'What did you accomplish?',
          field: 'accomplishment',
          inputType: 'textarea',
          placeholder: 'One concrete outcome...',
        },
        {
          type: 'input',
          label: 'What did you learn?',
          field: 'learning',
          inputType: 'textarea',
          placeholder: 'One insight or lesson...',
        },
        {
          type: 'input',
          label: "What's next?",
          field: 'nextStep',
          inputType: 'textarea',
          placeholder: 'One thing you want to do next...',
          optional: true,
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 1,
  },
  {
    key: 'community-invite-friend',
    name: 'Invite a Friend',
    description:
      'Players generate a personal invite link and send it to someone they know. Tracks viral growth.',
    category: 'community',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'GATHERING_RESOURCES',
      reward: 2,
      estimatedMinutes: 5,
      requiresAuth: true,
      generatesInvite: true,
    },
    copyTemplate: {
      title: 'Invite a Friend to {campaignName}',
      description:
        'Share this campaign with someone you know. Use your personal invite link or write a message.',
      successCondition: 'Invite sent to at least one person.',
      steps: [
        {
          type: 'input',
          label: 'Personal message (optional)',
          field: 'inviteMessage',
          inputType: 'textarea',
          placeholder: 'Add a personal note to your invite...',
          optional: true,
        },
        {
          type: 'choice',
          label: 'How will you send it?',
          field: 'inviteMethod',
          options: ['Text message', 'Email', 'Social media DM', 'In person'],
        },
      ],
    },
    narrativeHooks: null,
    sortOrder: 2,
  },
]

// ---------------------------------------------------------------------------
// Custom template — blank slate
// ---------------------------------------------------------------------------

const CUSTOM_TEMPLATES: QuestTemplateSeedData[] = [
  {
    key: 'custom-blank',
    name: 'Custom Quest',
    description:
      'Start from scratch. Define your own title, description, steps, and success condition.',
    category: 'custom',
    defaultSettings: {
      moveType: 'showUp',
      allyshipDomain: 'DIRECT_ACTION',
      reward: 1,
      estimatedMinutes: 15,
      requiresAuth: true,
    },
    copyTemplate: {
      title: '',
      description: '',
      successCondition: '',
      steps: [],
    },
    narrativeHooks: null,
    sortOrder: 0,
  },
]

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

export const ALL_QUEST_TEMPLATE_SEEDS: QuestTemplateSeedData[] = [
  ...ONBOARDING_TEMPLATES,
  ...FUNDRAISING_TEMPLATES,
  ...AWARENESS_TEMPLATES,
  ...DIRECT_ACTION_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
  ...CUSTOM_TEMPLATES,
]

/**
 * Categories available in the wizard UI, ordered for display.
 */
export const QUEST_TEMPLATE_CATEGORIES = [
  { key: 'onboarding', label: 'Onboarding', description: 'First-touch quests for new players' },
  { key: 'fundraising', label: 'Fundraising', description: 'Resource gathering & pledge quests' },
  { key: 'awareness', label: 'Awareness', description: 'Storytelling & amplification quests' },
  { key: 'direct_action', label: 'Direct Action', description: 'Concrete organizing & action quests' },
  { key: 'community', label: 'Community', description: 'Relationship building & gathering quests' },
  { key: 'custom', label: 'Custom', description: 'Build your own from scratch' },
] as const

export type QuestTemplateCategory = (typeof QUEST_TEMPLATE_CATEGORIES)[number]['key']
