// Letter to You - Question Bank
// Based on the reflective interview spec

export const modes = [
  { id: 'general', name: 'General Reflection', icon: '◯', description: 'A broad exploration of where you are right now' },
  { id: 'relationships', name: 'Relationship & Connection', icon: '∞', description: 'Patterns in how you connect with others' },
  { id: 'career', name: 'Career & Meaning', icon: '◈', description: 'Work, purpose, and what you\'re building' },
  { id: 'transition', name: 'Transition / Crossroads', icon: '⊕', description: 'When you\'re between chapters' }
];

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
