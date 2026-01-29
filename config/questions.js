// Letter to You - Question Bank
// Based on the reflective interview spec

export const modes = [
  { id: 'general', name: 'General Reflection', icon: '◎', description: 'A broad exploration of where you are right now' },
  { id: 'relationships', name: 'Relationship & Connection', icon: '∞', description: 'Patterns in how you connect with others' },
  { id: 'career', name: 'Career & Meaning', icon: '◈', description: 'Work, purpose, and what you\'re building' },
  { id: 'transition', name: 'Transition / Crossroads', icon: '⊕', description: 'When you\'re between chapters' },
  { id: 'original', name: 'The Original', icon: '✦', description: 'The deep questions that started it all' }
];

// Life Event Templates - specific situations
export const lifeEventModes = [
  { id: 'breakup', name: 'After a Breakup', icon: '◇', description: 'Processing the end of a relationship' },
  { id: 'newbeginning', name: 'New Beginning', icon: '↗', description: 'Starting a new job, city, or chapter' },
  { id: 'grief', name: 'Processing Grief', icon: '○', description: 'Honoring loss and finding your way forward' },
  { id: 'newparent', name: 'New Parent', icon: '✧', description: 'Navigating the identity shift of parenthood' },
  { id: 'careercrossroads', name: 'Career Crossroads', icon: '⊗', description: 'Figuring out your next professional move' },
  { id: 'milestone', name: 'Milestone Birthday', icon: '◐', description: 'Reflecting on a new decade of life' }
];

// Life Event specific questions
export const lifeEventQuestions = {
  breakup: [
    {
      id: 'breakup-1',
      section: 'processing',
      sectionName: 'Processing',
      prompt: "How are you really doing right now—not the version you tell others?",
      type: 'long_text'
    },
    {
      id: 'breakup-2',
      section: 'reflection',
      sectionName: 'Looking Back',
      prompt: "What did this relationship teach you about yourself?",
      type: 'long_text'
    },
    {
      id: 'breakup-3',
      section: 'identity',
      sectionName: 'Identity',
      prompt: "What parts of yourself did you lose or put aside in this relationship?",
      type: 'long_text'
    },
    {
      id: 'breakup-4',
      section: 'healing',
      sectionName: 'Healing',
      prompt: "What do you need to forgive—in them, or in yourself?",
      type: 'long_text'
    },
    {
      id: 'breakup-5',
      section: 'forward',
      sectionName: 'Moving Forward',
      prompt: "What do you want your next relationship (with yourself or someone else) to look like?",
      type: 'long_text'
    },
    {
      id: 'breakup-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What would you tell yourself six months from now, looking back at this moment?",
      type: 'long_text'
    }
  ],
  
  newbeginning: [
    {
      id: 'newbeginning-1',
      section: 'present',
      sectionName: 'Right Now',
      prompt: "What's the mix of excitement and fear you're feeling about this change?",
      type: 'long_text'
    },
    {
      id: 'newbeginning-2',
      section: 'leaving',
      sectionName: 'What You\'re Leaving',
      prompt: "What are you grateful to leave behind? What will you miss?",
      type: 'long_text'
    },
    {
      id: 'newbeginning-3',
      section: 'hopes',
      sectionName: 'Hopes',
      prompt: "In your most optimistic vision, what does this new chapter look like?",
      type: 'long_text'
    },
    {
      id: 'newbeginning-4',
      section: 'fears',
      sectionName: 'Fears',
      prompt: "What's the thing you're most afraid won't work out?",
      type: 'long_text'
    },
    {
      id: 'newbeginning-5',
      section: 'identity',
      sectionName: 'Identity',
      prompt: "Who do you want to become in this new chapter?",
      type: 'long_text'
    },
    {
      id: 'newbeginning-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What permission do you need to give yourself right now?",
      type: 'long_text'
    }
  ],
  
  grief: [
    {
      id: 'grief-1',
      section: 'honoring',
      sectionName: 'Honoring',
      prompt: "Tell me about what or who you've lost. What do you want me to know about them?",
      type: 'long_text'
    },
    {
      id: 'grief-2',
      section: 'feeling',
      sectionName: 'Feeling',
      prompt: "How is the grief showing up in your daily life right now?",
      type: 'long_text'
    },
    {
      id: 'grief-3',
      section: 'unsaid',
      sectionName: 'Unsaid',
      prompt: "What do you wish you could say to them, or about them, that you haven't?",
      type: 'long_text'
    },
    {
      id: 'grief-4',
      section: 'carrying',
      sectionName: 'Carrying Forward',
      prompt: "What part of them or what they meant to you do you want to carry forward?",
      type: 'long_text'
    },
    {
      id: 'grief-5',
      section: 'support',
      sectionName: 'Support',
      prompt: "What kind of support do you need right now that you're not getting?",
      type: 'long_text'
    },
    {
      id: 'grief-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What would it mean to honor your grief while still moving forward?",
      type: 'long_text'
    }
  ],
  
  newparent: [
    {
      id: 'newparent-1',
      section: 'real',
      sectionName: 'The Real Version',
      prompt: "How is parenthood different from what you expected—honestly?",
      type: 'long_text'
    },
    {
      id: 'newparent-2',
      section: 'identity',
      sectionName: 'Identity',
      prompt: "What parts of your old self do you miss? What new parts are emerging?",
      type: 'long_text'
    },
    {
      id: 'newparent-3',
      section: 'overwhelm',
      sectionName: 'The Hard Parts',
      prompt: "What's the thing you're not supposed to say out loud about being a parent?",
      type: 'long_text'
    },
    {
      id: 'newparent-4',
      section: 'joy',
      sectionName: 'The Joy',
      prompt: "What moment recently made you feel like you're doing okay at this?",
      type: 'long_text'
    },
    {
      id: 'newparent-5',
      section: 'values',
      sectionName: 'Values',
      prompt: "What kind of parent do you want to be? What matters most to you?",
      type: 'long_text'
    },
    {
      id: 'newparent-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What do you need to hear right now that no one is telling you?",
      type: 'long_text'
    }
  ],
  
  careercrossroads: [
    {
      id: 'career-1',
      section: 'stuck',
      sectionName: 'Where You Are',
      prompt: "What's not working about your current work situation?",
      type: 'long_text'
    },
    {
      id: 'career-2',
      section: 'want',
      sectionName: 'What You Want',
      prompt: "If money and judgment weren't factors, what would you actually want to do?",
      type: 'long_text'
    },
    {
      id: 'career-3',
      section: 'fear',
      sectionName: 'Fears',
      prompt: "What's the fear that's keeping you from making a change?",
      type: 'long_text'
    },
    {
      id: 'career-4',
      section: 'patterns',
      sectionName: 'Patterns',
      prompt: "Have you been here before? What patterns do you notice in your career decisions?",
      type: 'long_text'
    },
    {
      id: 'career-5',
      section: 'values',
      sectionName: 'Values',
      prompt: "What does meaningful work actually look like for you?",
      type: 'long_text'
    },
    {
      id: 'career-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What's one small step you could take in the next week toward clarity?",
      type: 'long_text'
    }
  ],
  
  milestone: [
    {
      id: 'milestone-1',
      section: 'reflection',
      sectionName: 'Looking Back',
      prompt: "As you look at the decade behind you, what are you most proud of?",
      type: 'long_text'
    },
    {
      id: 'milestone-2',
      section: 'lessons',
      sectionName: 'Lessons',
      prompt: "What's the most important thing you learned about yourself in your " + "last decade?",
      type: 'long_text'
    },
    {
      id: 'milestone-3',
      section: 'regrets',
      sectionName: 'Regrets',
      prompt: "Is there anything you wish you'd done differently? What would you tell your younger self?",
      type: 'long_text'
    },
    {
      id: 'milestone-4',
      section: 'present',
      sectionName: 'Right Now',
      prompt: "How do you feel about where you are in life right now—really?",
      type: 'long_text'
    },
    {
      id: 'milestone-5',
      section: 'future',
      sectionName: 'Looking Forward',
      prompt: "What do you want the next decade to be about?",
      type: 'long_text'
    },
    {
      id: 'milestone-6',
      section: 'closing',
      sectionName: 'Closing',
      prompt: "What intention or word do you want to carry into this new chapter?",
      type: 'long_text'
    }
  ],

  original: [
    {
      id: 'original-1',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "When in your life have you felt most at peace — not just happy, but deeply, quietly content — and what were the smallest details of that moment that stick with you?",
      type: 'long_text'
    },
    {
      id: 'original-2',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "If your unconscious mind could speak to you in plain language — like a voice in a quiet room — what do you think it's been trying to say to you lately that you haven't quite heard?",
      type: 'long_text'
    },
    {
      id: 'original-3',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "When do you notice yourself performing — subtly or overtly — rather than simply being? What do you think you're trying to prove in those moments, and to whom?",
      type: 'long_text'
    },
    {
      id: 'original-4',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "What's a pattern — in love, work, or friendship — that you keep repeating, even though you know it doesn't serve you? And what fear might be hiding underneath that repetition?",
      type: 'long_text'
    },
    {
      id: 'original-5',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "When do you most feel like the child version of yourself — not in a nostalgic way, but in the raw, unprotected, instinctive way — and what emotion usually surfaces in that state?",
      type: 'long_text'
    },
    {
      id: 'original-6',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "If someone truly saw all of you — the light, the dark, the contradictions, the things you hide — what do you secretly hope they'd say to you in response?",
      type: 'long_text'
    },
    {
      id: 'original-7',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "When you imagine a future where you feel fully at home — in your own skin, in your relationships, in your choices — what are three things that don't exist in that version of your life anymore?",
      type: 'long_text'
    },
    {
      id: 'original-8',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "What truth about yourself do you suspect is there, just beneath the surface, but you haven't quite been ready to say out loud yet?",
      type: 'long_text'
    },
    {
      id: 'original-9',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "If your heart could write a letter to your mind, what would it say — in just one sentence?",
      type: 'long_text'
    },
    {
      id: 'original-10',
      section: 'depth',
      sectionName: 'Deep Reflection',
      prompt: "What part of yourself are you most afraid someone else might truly understand — and why would that kind of understanding feel dangerous?",
      type: 'long_text'
    }
  ]
};

export const questions = [
  // === A) ORIENTATION (2) ===
  {
    id: 'orientation-1',
    section: 'orientation',
    sectionName: 'Orientation',
    prompt: "What brings you here right now? Not the polished version—the real reason.",
    type: 'long_text',
    followUp: "If you said the honest sentence you don't usually say out loud, what would it be?",
    tags: ['identity', 'meaning'],
    intensity: 3,
    core: true
  },
  {
    id: 'orientation-2',
    section: 'orientation',
    sectionName: 'Orientation',
    prompt: "What would you most want to be different in 6 months—internally, not externally?",
    type: 'long_text',
    tags: ['meaning', 'values'],
    intensity: 2,
    core: true
  },

  // === B) VALUES + IDENTITY (3) ===
  {
    id: 'values-1',
    section: 'values',
    sectionName: 'Values & Identity',
    prompt: "When do you feel most like yourself lately? Be specific.",
    type: 'long_text',
    followUp: "What is present in those moments that's missing elsewhere?",
    tags: ['identity', 'values', 'energy'],
    intensity: 2,
    core: true
  },
  {
    id: 'values-2',
    section: 'values',
    sectionName: 'Values & Identity',
    prompt: "What are you doing that looks 'fine' from the outside but feels wrong on the inside?",
    type: 'long_text',
    tags: ['identity', 'values'],
    intensity: 3,
    core: true
  },
  {
    id: 'values-3',
    section: 'values',
    sectionName: 'Values & Identity',
    prompt: "If someone who loves you were being brutally honest, what would they say you've been avoiding?",
    type: 'long_text',
    followUp: "What do you fear would happen if you stopped avoiding it?",
    tags: ['fear', 'identity'],
    intensity: 4,
    core: true
  },

  // === C) ENERGY + EMOTIONAL LOAD (3) ===
  {
    id: 'energy-1',
    section: 'energy',
    sectionName: 'Energy & Load',
    prompt: "What is quietly draining you right now?",
    type: 'long_text',
    tags: ['energy', 'fear'],
    intensity: 2,
    core: true
  },
  {
    id: 'energy-2',
    section: 'energy',
    sectionName: 'Energy & Load',
    prompt: "What are you carrying that you haven't fully admitted is heavy?",
    type: 'long_text',
    followUp: "If that weight could speak, what would it ask of you?",
    tags: ['energy', 'grief'],
    intensity: 4,
    core: true
  },
  {
    id: 'energy-3',
    section: 'energy',
    sectionName: 'Energy & Load',
    prompt: "Where is your life asking for fewer obligations and more truth?",
    type: 'long_text',
    tags: ['energy', 'values'],
    intensity: 3,
    core: false,
    useIf: { mode: ['general', 'transition'] }
  },

  // === D) RELATIONSHIPS + CONNECTION (4) ===
  {
    id: 'relationships-1',
    section: 'relationships',
    sectionName: 'Relationships & Connection',
    prompt: "Who do you feel most yourself around—and why?",
    type: 'long_text',
    tags: ['relationships', 'identity'],
    intensity: 2,
    core: false,
    useIf: { mode: ['general', 'relationships'] }
  },
  {
    id: 'relationships-2',
    section: 'relationships',
    sectionName: 'Relationships & Connection',
    prompt: "What relationship dynamic are you tolerating that you wouldn't advise someone else to tolerate?",
    type: 'long_text',
    tags: ['relationships', 'values'],
    intensity: 4,
    core: false,
    useIf: { mode: ['general', 'relationships'] }
  },
  {
    id: 'relationships-3',
    section: 'relationships',
    sectionName: 'Relationships & Connection',
    prompt: "What do you need more of from others that you rarely ask for?",
    type: 'long_text',
    followUp: "What stops you—pride, fear, habit, or something else?",
    tags: ['relationships', 'fear'],
    intensity: 3,
    core: false,
    useIf: { mode: ['general', 'relationships'] }
  },
  {
    id: 'relationships-4',
    section: 'relationships',
    sectionName: 'Relationships & Connection',
    prompt: "What conversation are you postponing?",
    type: 'long_text',
    followUp: "If you had to say the first 2 sentences, what are they?",
    tags: ['relationships', 'fear'],
    intensity: 4,
    core: false,
    useIf: { mode: ['general', 'relationships', 'transition'] }
  },

  // === E) WORK + MEANING (3) ===
  {
    id: 'work-1',
    section: 'work',
    sectionName: 'Work & Meaning',
    prompt: "Where are you over-performing to earn safety or approval?",
    type: 'long_text',
    tags: ['work', 'fear', 'identity'],
    intensity: 3,
    core: false,
    useIf: { mode: ['general', 'career'] }
  },
  {
    id: 'work-2',
    section: 'work',
    sectionName: 'Work & Meaning',
    prompt: "What part of your work (paid or unpaid) feels meaningful—and what feels like a costume?",
    type: 'long_text',
    tags: ['work', 'meaning', 'identity'],
    intensity: 3,
    core: false,
    useIf: { mode: ['general', 'career'] }
  },
  {
    id: 'work-3',
    section: 'work',
    sectionName: 'Work & Meaning',
    prompt: "If you knew you could not fail socially, what change would you make?",
    type: 'long_text',
    tags: ['work', 'fear', 'meaning'],
    intensity: 3,
    core: false,
    useIf: { mode: ['general', 'career', 'transition'] }
  },

  // === F) PATTERN + CHOICE (3) ===
  {
    id: 'pattern-1',
    section: 'pattern',
    sectionName: 'Patterns & Choices',
    prompt: "Name a pattern you keep repeating that you're tired of.",
    type: 'long_text',
    followUp: "What does that pattern protect you from feeling?",
    tags: ['identity', 'fear'],
    intensity: 4,
    core: true
  },
  {
    id: 'pattern-2',
    section: 'pattern',
    sectionName: 'Patterns & Choices',
    prompt: "What do you already know you should do—but haven't done?",
    type: 'long_text',
    tags: ['meaning', 'fear'],
    intensity: 3,
    core: true
  },
  {
    id: 'pattern-3',
    section: 'pattern',
    sectionName: 'Patterns & Choices',
    prompt: "What is one small act of self-respect you could do in the next 72 hours?",
    type: 'long_text',
    tags: ['values', 'meaning'],
    intensity: 2,
    core: true
  },

  // === CLOSING ===
  {
    id: 'closing',
    section: 'closing',
    sectionName: 'Closing',
    prompt: "Anything else you want me to know before I write the letter?",
    type: 'long_text',
    tags: [],
    intensity: 1,
    core: true
  }
];

// Get questions for a specific mode (max 10)
export function getQuestionsForMode(mode) {
  // Check if it's a life event mode
  if (lifeEventQuestions[mode]) {
    return lifeEventQuestions[mode];
  }
  
  // Otherwise use the general questions
  const filtered = questions.filter(q => {
    // Always include core questions
    if (q.core) return true;
    // Include if no mode restriction
    if (!q.useIf?.mode) return true;
    // Include if mode matches
    return q.useIf.mode.includes(mode);
  });
  
  // Cap at 10 questions
  return filtered.slice(0, 10);
}

// Safety keywords to check for crisis content
export const safetyKeywords = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'cutting myself', 'hurt myself',
  'don\'t want to live', 'better off dead', 'no reason to live'
];

export function checkSafetyContent(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return safetyKeywords.some(keyword => lower.includes(keyword));
}

// Crisis resources
export const crisisResources = {
  title: "You deserve real support right now",
  message: "What you're going through sounds really difficult. This tool isn't equipped to help with what you're describing, but there are people who can.",
  resources: [
    { name: 'Find a Helpline (International)', url: 'https://findahelpline.com/', description: 'Find crisis support in your country' },
    { name: 'US: National Suicide Prevention Lifeline', phone: '988', description: 'Call or text 988' },
    { name: 'US: Crisis Text Line', phone: 'Text HOME to 741741', description: 'Free 24/7 support' },
    { name: 'NZ: Need to Talk?', phone: '1737', description: 'Free call or text, anytime' },
    { name: 'UK: Samaritans', phone: '116 123', description: 'Free to call, 24 hours' },
    { name: 'AU: Lifeline', phone: '13 11 14', description: '24 hour crisis support' }
  ]
};
