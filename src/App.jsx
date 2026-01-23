import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import AuthModal from './components/Auth/AuthModal';
import { modes, lifeEventModes, getQuestionsForMode, checkSafetyContent, crisisResources } from '../config/questions.js';

// Views: landing, how-it-works, resources, your-letters, interview, quick-interview, generating, letter, crisis
export default function App() {
  const [view, setView] = useState('landing');
  const [selectedMode, setSelectedMode] = useState('general');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [followUpOpen, setFollowUpOpen] = useState({});
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [letter, setLetter] = useState('');
  const [error, setError] = useState(null);
  const [hasLetter, setHasLetter] = useState(false);
  const [showAllPodcasts, setShowAllPodcasts] = useState(false);
  const [showAllYoutube, setShowAllYoutube] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [tone, setTone] = useState('warm');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut, isAuthenticated } = useAuth();
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [quickAnswers, setQuickAnswers] = useState({});
  const [quickIndex, setQuickIndex] = useState(0);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const modesRef = useRef(null);

  // Quick Letter questions with pre-written options
  const quickQuestions = [
    {
      id: 'quick-1',
      prompt: "How are you really feeling right now?",
      options: [
        "Overwhelmed — there's too much going on and I can't keep up",
        "Stuck — I know something needs to change but I don't know what",
        "Lost — I'm not sure who I am or what I want anymore",
        "Tired — I'm exhausted from trying so hard at everything"
      ]
    },
    {
      id: 'quick-2',
      prompt: "What's been weighing on you most?",
      options: [
        "A relationship that's not working the way I need it to",
        "Work or career that feels meaningless or draining",
        "A decision I've been avoiding making",
        "Feeling disconnected from myself or others"
      ]
    },
    {
      id: 'quick-3',
      prompt: "What do you think you need right now?",
      options: [
        "Permission to slow down and stop pushing so hard",
        "Clarity about what I actually want",
        "Courage to make a change I've been avoiding",
        "To feel seen and understood"
      ]
    },
    {
      id: 'quick-4',
      prompt: "What's something you've been avoiding?",
      options: [
        "A hard conversation I need to have",
        "Admitting that something isn't working",
        "Taking care of myself the way I should",
        "Making a decision that will disappoint someone"
      ]
    },
    {
      id: 'quick-5',
      prompt: "What would help you move forward?",
      options: [
        "Letting go of something that's no longer serving me",
        "Setting a boundary I've been afraid to set",
        "Being honest with myself about what I really want",
        "Taking one small step instead of trying to fix everything"
      ]
    }
  ];

  // Refs for speech recognition callbacks
  const answersRef = useRef(answers);
  const currentQuestionRef = useRef(null);

  // Keep refs updated
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        // Append to current answer
        const question = currentQuestionRef.current;
        if (question && event.results[event.results.length - 1].isFinal) {
          const currentAnswer = answersRef.current[question.id] || '';
          setAnswers(prev => ({ ...prev, [question.id]: currentAnswer + transcript + ' ' }));
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Tone options for letter generation
  const toneOptions = [
    {
      id: 'warm',
      name: 'Warm & Gentle',
      description: 'Compassionate and supportive',
      icon: '♡'
    },
    {
      id: 'direct',
      name: 'Clear & Direct',
      description: 'Honest and straightforward',
      icon: '◇'
    },
    {
      id: 'motivating',
      name: 'Motivating',
      description: 'Energizing and forward-looking',
      icon: '↗'
    }
  ];

  // Load questions when mode is selected
  useEffect(() => {
    if (selectedMode) {
      setQuestions(getQuestionsForMode(selectedMode));
    }
  }, [selectedMode]);

  // Auto-focus textarea when question changes
  useEffect(() => {
    if (view === 'interview' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, view]);

  // Check all answers for safety content
  const hasSafetyContent = () => {
    const allText = [
      ...Object.values(answers),
      ...Object.values(followUpAnswers)
    ].join(' ');
    return checkSafetyContent(allText);
  };

  // Handle starting the interview
  const startInterview = (mode) => {
    setSelectedMode(mode);
    setView('interview');
    setCurrentIndex(0);
    setAnswers({});
    setFollowUpOpen({});
    setFollowUpAnswers({});
  };

  // Start quick letter
  const startQuickLetter = () => {
    setIsQuickMode(true);
    setQuickIndex(0);
    setQuickAnswers({});
    setView('quick-interview');
  };

  // Scroll to modes section
  const scrollToModes = () => {
    modesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Handle follow-up answer change
  const handleFollowUpChange = (questionId, value) => {
    setFollowUpAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Toggle follow-up question
  const toggleFollowUp = (questionId) => {
    setFollowUpOpen(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Quick answer selection
  const selectQuickAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Navigate questions
  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      if (hasSafetyContent()) {
        setView('crisis');
      } else {
        generateLetter();
      }
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const skipQuestion = () => {
    goNext();
  };

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
  };

  // Generate the letter
  const generateLetter = async () => {
    setView('generating');
    setError(null);

    try {
      const qaPairs = questions.map((q, i) => {
        const answer = answers[q.id]?.trim() || '[skipped]';
        const followUpAnswer = followUpAnswers[q.id]?.trim();

        let text = `Q${i + 1}: ${q.prompt}\nA${i + 1}: ${answer}`;
        if (q.followUp && followUpOpen[q.id] && followUpAnswer) {
          text += `\n\nFollow-up: ${q.followUp}\nAnswer: ${followUpAnswer}`;
        }
        return text;
      }).join('\n\n---\n\n');

      const response = await fetch('/.netlify/functions/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          modeName: modes.find(m => m.id === selectedMode)?.name ||
                    lifeEventModes.find(m => m.id === selectedMode)?.name ||
                    'General Reflection',
          tone: tone,
          qaPairs
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate letter');
      }

      const data = await response.json();

      if (!data.letter) {
        throw new Error('No letter content received');
      }

      setLetter(data.letter);
      setHasLetter(true);
      setView('letter');
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Something went wrong: ${err.message}. Please try again.`);
      setView('interview');
      setCurrentIndex(questions.length - 1);
    }
  };

  // Generate quick letter
  const generateQuickLetter = async () => {
    setError(null);

    try {
      const qaPairs = quickQuestions.map((q, i) => {
        const answer = quickAnswers[q.id] || '[skipped]';
        return `Q${i + 1}: ${q.prompt}\nA${i + 1}: ${answer}`;
      }).join('\n\n---\n\n');

      const response = await fetch('/.netlify/functions/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'quick',
          modeName: 'Quick Reflection',
          tone: 'warm',
          qaPairs
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate letter');
      }

      const data = await response.json();

      if (!data.letter) {
        throw new Error('No letter content received');
      }

      setLetter(data.letter);
      setHasLetter(true);
      setIsQuickMode(false);
      setView('letter');
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Something went wrong: ${err.message}. Please try again.`);
      setView('quick-interview');
    }
  };

  // Copy letter to clipboard
  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(letter);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Download as text file
  const downloadLetter = () => {
    const blob = new Blob([letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'letter-to-you.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Save as PDF
  const saveToPdf = () => {
    window.print();
  };

  // Start over
  const startOver = () => {
    setView('landing');
    setSelectedMode('general');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setFollowUpOpen({});
    setFollowUpAnswers({});
    setError(null);
  };

  // Current question
  const currentQuestion = questions[currentIndex];

  // Keep currentQuestion ref updated for speech recognition
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  // Skip/quick response options for regular interview
  const skipOptions = [
    "I'm not sure yet",
    "I'd rather not say",
    "This doesn't apply to me",
    "I need to think about this more"
  ];

  // Letter type details for landing page
  const letterTypes = [
    {
      id: 'general',
      icon: '○',
      name: 'General Reflection',
      tagline: 'A broad exploration of where you are right now',
      description: 'For when you need to step back and take stock. This letter helps you see patterns across your whole life — what\'s working, what\'s not, and what might need attention.',
      bestFor: 'Feeling stuck, overwhelmed, or just needing clarity'
    },
    {
      id: 'relationships',
      icon: '∞',
      name: 'Relationships & Connection',
      tagline: 'Patterns in how you connect with others',
      description: 'Explores how you show up in relationships — what you give, what you need, what you tolerate. Helps surface dynamics you might not be seeing clearly.',
      bestFor: 'Relationship friction, loneliness, or recurring patterns with others'
    },
    {
      id: 'career',
      icon: '◈',
      name: 'Career & Meaning',
      tagline: 'Work, purpose, and what you\'re building',
      description: 'Digs into your relationship with work — not just the job, but the meaning (or lack of it). Where you\'re performing vs. where you\'re fulfilled.',
      bestFor: 'Career crossroads, burnout, or questioning your path'
    },
    {
      id: 'transition',
      icon: '⊕',
      name: 'Life Transitions',
      tagline: 'For when you\'re between chapters',
      description: 'For the in-between moments — ending something, starting something, or suspended in uncertainty. Helps you find footing when the ground is shifting.',
      bestFor: 'Major life changes, loss, new beginnings, or feeling unmoored'
    }
  ];

  // Resources data
  const resources = {
    tools: [
      { name: 'Calm', url: 'https://calm.com', desc: 'Meditation & sleep' },
      { name: 'Headspace', url: 'https://headspace.com', desc: 'Guided mindfulness' },
      { name: 'Woebot', url: 'https://woebot.io', desc: 'CBT chatbot' },
      { name: 'Daylio', url: 'https://daylio.net', desc: 'Mood tracking' },
      { name: 'Finch', url: 'https://finchcare.com', desc: 'Self-care pet app' },
      { name: 'Bearable', url: 'https://bearable.app', desc: 'Symptom & mood tracker' }
    ],
    podcasts: [
      { name: 'The Happiness Lab', host: 'Dr. Laurie Santos', desc: 'Science of happiness' },
      { name: 'On Being', host: 'Krista Tippett', desc: 'Deep conversations on meaning' },
      { name: 'Unlocking Us', host: 'Brené Brown', desc: 'Vulnerability & courage' },
      { name: 'Ten Percent Happier', host: 'Dan Harris', desc: 'Meditation for skeptics' },
      { name: 'The Ezra Klein Show', host: 'Ezra Klein', desc: 'Thoughtful long-form' },
      { name: 'Hidden Brain', host: 'Shankar Vedantam', desc: 'Psychology of behavior' },
      { name: 'Where Should We Begin?', host: 'Esther Perel', desc: 'Real therapy sessions' },
      { name: 'We Can Do Hard Things', host: 'Glennon Doyle', desc: 'Navigating hard stuff' }
    ],
    youtube: [
      { name: 'The School of Life', url: 'https://youtube.com/@theschooloflife', desc: 'Emotional intelligence' },
      { name: 'Therapy in a Nutshell', url: 'https://youtube.com/@TherapyinaNutshell', desc: 'Mental health education' },
      { name: 'HealthyGamerGG', url: 'https://youtube.com/@HealthyGamerGG', desc: 'Mental health for modern life' },
      { name: 'Psych2Go', url: 'https://youtube.com/@Psych2go', desc: 'Psychology explainers' },
      { name: 'Einzelgänger', url: 'https://youtube.com/@Einzelganger', desc: 'Philosophy for life' },
      { name: 'Academy of Ideas', url: 'https://youtube.com/@academyofideas', desc: 'Deep philosophical dives' }
    ],
    books: [
      { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', topic: 'Trauma & healing' },
      { title: 'Attached', author: 'Amir Levine', topic: 'Attachment styles' },
      { title: 'The Gifts of Imperfection', author: 'Brené Brown', topic: 'Self-acceptance' },
      { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', topic: 'Purpose through suffering' },
      { title: 'When Things Fall Apart', author: 'Pema Chödrön', topic: 'Buddhist wisdom for hard times' },
      { title: 'Atomic Habits', author: 'James Clear', topic: 'Small changes, big results' },
      { title: 'Set Boundaries, Find Peace', author: 'Nedra Glover Tawwab', topic: 'Healthy boundaries' },
      { title: 'Adult Children of Emotionally Immature Parents', author: 'Lindsay C. Gibson', topic: 'Family patterns' }
    ]
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="nav-brand" onClick={() => setView('landing')}>
            Letter to You
          </button>
          <div className="nav-links">
            <button
              className={`nav-link ${view === 'how-it-works' ? 'active' : ''}`}
              onClick={() => setView('how-it-works')}
            >
              How it works
            </button>
            <button
              className={`nav-link ${view === 'resources' ? 'active' : ''}`}
              onClick={() => setView('resources')}
            >
              Resources
            </button>
            <button
              className={`nav-link ${view === 'your-letters' ? 'active' : ''}`}
              onClick={() => setView('your-letters')}
            >
              Your letters
            </button>
            {isAuthenticated ? (
              <button className="nav-link" onClick={signOut}>
                Sign out
              </button>
            ) : (
              <button className="nav-link" onClick={() => setShowAuthModal(true)}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Landing - Now includes mode selection */}
      {view === 'landing' && (
        <div className="view landing">
          <div className="landing-hero">
            <h1 className="hero-title">Letter to You</h1>
            <p className="hero-subtitle">
              A guided reflection that ends with a letter — written to you, about you,
              based on your own words.
            </p>
          </div>

          {/* Main Reflection Types */}
          <section className="landing-section" ref={modesRef}>
            <h2 className="section-title">Choose a reflection</h2>
            <p className="section-intro">
              Each type asks different questions and produces a different kind of letter. Takes 10-15 minutes.
            </p>
            <div className="letter-types-grid">
              {letterTypes.map(type => (
                <button key={type.id} className="letter-type-card clickable" onClick={() => startInterview(type.id)}>
                  <div className="letter-type-header">
                    <span className="letter-type-icon">{type.icon}</span>
                    <span className="letter-type-name">{type.name}</span>
                  </div>
                  <p className="letter-type-tagline">{type.tagline}</p>
                  <p className="letter-type-description">{type.description}</p>
                  <p className="letter-type-best-for"><strong>Best for:</strong> {type.bestFor}</p>
                  <span className="letter-type-cta">Start this reflection →</span>
                </button>
              ))}
            </div>
          </section>

          {/* Life Event Modes */}
          <section className="landing-section alt">
            <h2 className="section-title">Or choose a life moment</h2>
            <p className="section-intro">
              Specific reflections for specific situations.
            </p>
            <div className="life-events-grid">
              {lifeEventModes.map(mode => (
                <button
                  key={mode.id}
                  className="life-event-card"
                  onClick={() => startInterview(mode.id)}
                >
                  <span className="life-event-icon">{mode.icon}</span>
                  <span className="life-event-name">{mode.name}</span>
                  <span className="life-event-desc">{mode.description}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Quick Letter Option */}
          <section className="landing-section">
            <div className="quick-letter-hero">
              <button className="quick-letter-card-large" onClick={startQuickLetter}>
                <span className="quick-letter-badge">⚡ 2 minutes</span>
                <span className="quick-letter-name">Short on time?</span>
                <span className="quick-letter-desc">
                  Try the Quick Letter — 5 questions with pre-written options.
                </span>
                <span className="quick-letter-cta">Start quick reflection →</span>
              </button>
            </div>
          </section>

          {/* What It Is / Isn't Section */}
          <section className="landing-section">
            <h2 className="section-title">What this is (and isn't)</h2>
            <div className="what-it-is-grid">
              <div className="what-box is">
                <h3>What it is</h3>
                <ul>
                  <li>A structured way to think through what you're feeling</li>
                  <li>Questions designed to surface what's under the surface</li>
                  <li>A letter that reflects your own words back to you</li>
                  <li>Private — nothing is stored or shared</li>
                  <li>Something you can return to over time</li>
                </ul>
              </div>
              <div className="what-box isnt">
                <h3>What it isn't</h3>
                <ul>
                  <li>Therapy or professional mental health support</li>
                  <li>A diagnosis or treatment recommendation</li>
                  <li>A replacement for talking to a real person</li>
                  <li>Advice about what you should do</li>
                  <li>Something for moments of crisis</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Email Signup Section */}
          <section className="landing-section alt">
            <div className="email-signup-box">
              <h2 className="email-signup-title">Stay in the loop</h2>
              <p className="email-signup-desc">
                Get notified about new reflection types, features, and occasional thoughts on self-understanding.
              </p>

              {emailSubmitted ? (
                <div className="email-success">
                  <span className="email-success-icon">✓</span>
                  <p>You're in. We'll be in touch.</p>
                </div>
              ) : (
                <form
                  action="https://app.us5.list-manage.com/subscribe/post?u=7e3a1f921fef3d8643e45311f&id=7877f5082d&f_id=005ecbe1f0"
                  method="post"
                  target="_blank"
                  className="email-form"
                  onSubmit={() => setEmailSubmitted(true)}
                >
                  <div className="email-input-group">
                    <input
                      type="email"
                      name="EMAIL"
                      placeholder="Your email"
                      required
                      className="email-input"
                    />
                    <button type="submit" className="btn primary email-btn">
                      Subscribe
                    </button>
                  </div>
                  {/* Bot protection */}
                  <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                    <input type="text" name="b_7e3a1f921fef3d8643e45311f_7877f5082d" tabIndex="-1" defaultValue="" />
                  </div>
                  <p className="email-note">No spam. Unsubscribe anytime.</p>
                </form>
              )}
            </div>
          </section>

          <footer className="landing-footer">
            <p>
              If you're in crisis, please reach out to a <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer">crisis helpline</a>.
              This tool is not equipped to help with emergencies.
            </p>
          </footer>
        </div>
      )}

      {/* How It Works */}
      {view === 'how-it-works' && (
        <div className="view static-page">
          <div className="static-content">
            <h1>How it works</h1>

            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Choose a focus</h3>
                  <p>Select from four reflection types: general, relationships, career, or life transitions. Each asks different questions tailored to that area.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Answer the questions</h3>
                  <p>You'll see 10 questions, one at a time. Write as much or as little as you want. Skip any that don't resonate. Some have optional "go deeper" follow-ups.</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Receive your letter</h3>
                  <p>Based on your responses, you'll get a 600-1,200 word letter that synthesizes what you shared. It ends with 2-4 concrete next steps drawn from your own words.</p>
                </div>
              </div>
            </div>

            <div className="info-cards">
              <div className="info-card">
                <div className="info-card-icon">🔒</div>
                <h3>Privacy first</h3>
                <p>Nothing stored. Nothing tracked. Your words stay yours — once you close the page, it's gone.</p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">💭</div>
                <h3>Real questions</h3>
                <p>Not therapy. Not a quiz. Just thoughtful prompts designed to help you think out loud.</p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">✉️</div>
                <h3>A mirror, not advice</h3>
                <p>Your letter reflects your words back — helping you see patterns and name what you're feeling.</p>
              </div>
            </div>

            <button className="btn primary" onClick={() => setView('landing')}>
              Begin your reflection
            </button>
          </div>
        </div>
      )}

      {/* Resources */}
      {view === 'resources' && (
        <div className="view static-page">
          <div className="static-content wide">
            <h1>Resources</h1>
            <p className="resources-intro">
              This tool is a starting point, not a destination. Here are some resources that might help you go deeper.
            </p>

            <section className="resource-section">
              <h2>Apps & Tools</h2>
              <div className="tools-grid">
                {resources.tools.map((tool, i) => (
                  <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer" className="tool-card">
                    <span className="tool-name">{tool.name}</span>
                    <span className="tool-desc">{tool.desc}</span>
                  </a>
                ))}
              </div>
            </section>

            <section className="resource-section">
              <h2>Podcasts</h2>
              <div className="content-grid">
                {(showAllPodcasts ? resources.podcasts : resources.podcasts.slice(0, 4)).map((pod, i) => (
                  <div key={i} className="content-card">
                    <span className="content-name">{pod.name}</span>
                    <span className="content-meta">{pod.host}</span>
                    <span className="content-desc">{pod.desc}</span>
                  </div>
                ))}
              </div>
              {resources.podcasts.length > 4 && (
                <button className="btn text show-more" onClick={() => setShowAllPodcasts(!showAllPodcasts)}>
                  {showAllPodcasts ? 'Show less' : `Show ${resources.podcasts.length - 4} more`}
                </button>
              )}
            </section>

            <section className="resource-section">
              <h2>YouTube Channels</h2>
              <div className="content-grid">
                {(showAllYoutube ? resources.youtube : resources.youtube.slice(0, 4)).map((yt, i) => (
                  <a key={i} href={yt.url} target="_blank" rel="noopener noreferrer" className="content-card link">
                    <span className="content-name">{yt.name}</span>
                    <span className="content-desc">{yt.desc}</span>
                  </a>
                ))}
              </div>
              {resources.youtube.length > 4 && (
                <button className="btn text show-more" onClick={() => setShowAllYoutube(!showAllYoutube)}>
                  {showAllYoutube ? 'Show less' : `Show ${resources.youtube.length - 4} more`}
                </button>
              )}
            </section>

            <section className="resource-section">
              <h2>Books</h2>
              <div className="content-grid">
                {(showAllBooks ? resources.books : resources.books.slice(0, 4)).map((book, i) => (
                  <div key={i} className="content-card">
                    <span className="content-name">{book.title}</span>
                    <span className="content-meta">{book.author}</span>
                    <span className="content-desc">{book.topic}</span>
                  </div>
                ))}
              </div>
              {resources.books.length > 4 && (
                <button className="btn text show-more" onClick={() => setShowAllBooks(!showAllBooks)}>
                  {showAllBooks ? 'Show less' : `Show ${resources.books.length - 4} more`}
                </button>
              )}
            </section>

            <button className="btn text back-btn" onClick={() => setView('landing')}>
              ← Back to home
            </button>
          </div>
        </div>
      )}

      {/* Your Letters */}
      {view === 'your-letters' && (
        <div className="view static-page">
          <div className="static-content">
            <h1>Your letters</h1>
            <div className="coming-soon-box">
              <span className="coming-soon-icon">📬</span>
              <h2>Coming Soon</h2>
              <p>
                We're building something special — a place to keep all your letters,
                track your journey over time, and even schedule letters to your future self.
              </p>
              <div className="coming-soon-features">
                <div className="feature-item">
                  <span className="feature-icon">📝</span>
                  <span>Save & organize all your letters</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📅</span>
                  <span>Schedule letters to your future self</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Track your reflections over time</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <span>Weekly check-ins & progress insights</span>
                </div>
              </div>
              <p className="coming-soon-note">
                For now, use the download or PDF options to save your letters locally.
              </p>
              <button className="btn primary" onClick={() => setView('landing')}>
                Start a New Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Interview */}
      {view === 'quick-interview' && (
        <div className="view quick-interview">
          <div className="quick-interview-container">
            <div className="quick-progress">
              <span>Question {quickIndex + 1} of {quickQuestions.length}</span>
              <div className="quick-progress-bar">
                <div
                  className="quick-progress-fill"
                  style={{ width: `${((quickIndex + 1) / quickQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <h2 className="quick-question">{quickQuestions[quickIndex].prompt}</h2>

            <div className="quick-options-list">
              {quickQuestions[quickIndex].options.map((option, i) => (
                <label key={i} className="quick-option">
                  <input
                    type="radio"
                    name={`quick-${quickIndex}`}
                    checked={quickAnswers[quickQuestions[quickIndex].id] === option}
                    onChange={() => setQuickAnswers(prev => ({
                      ...prev,
                      [quickQuestions[quickIndex].id]: option
                    }))}
                  />
                  <span className="quick-option-text">{option}</span>
                </label>
              ))}
            </div>

            <div className="quick-nav">
              <button
                className="btn secondary"
                onClick={() => setQuickIndex(prev => prev - 1)}
                disabled={quickIndex === 0}
              >
                ← Back
              </button>

              {quickIndex === quickQuestions.length - 1 ? (
                <button
                  className="btn primary"
                  onClick={() => {
                    // Generate quick letter
                    setView('generating');
                    generateQuickLetter();
                  }}
                  disabled={!quickAnswers[quickQuestions[quickIndex].id]}
                >
                  Generate letter
                </button>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => setQuickIndex(prev => prev + 1)}
                  disabled={!quickAnswers[quickQuestions[quickIndex].id]}
                >
                  Next →
                </button>
              )}
            </div>

            <button
              className="btn text back-btn"
              onClick={() => {
                setIsQuickMode(false);
                setView('landing');
              }}
            >
              ← Back to home
            </button>
          </div>
        </div>
      )}

      {/* Interview */}
      {view === 'interview' && currentQuestion && (
        <div className="view interview">
          <div className="interview-layout">
            {/* Question Overview Sidebar */}
            <aside className="question-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-title">Questions</span>
                <span className="sidebar-progress">{currentIndex + 1}/{questions.length}</span>
              </div>
              <div className="question-list">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    className={`question-list-item ${i === currentIndex ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
                    onClick={() => jumpToQuestion(i)}
                  >
                    <span className="question-num">{i + 1}</span>
                    <span className="question-preview">
                      {q.prompt.length > 50 ? q.prompt.substring(0, 50) + '...' : q.prompt}
                    </span>
                    {answers[q.id] && <span className="check-mark">✓</span>}
                  </button>
                ))}
              </div>
            </aside>

            <main className="question-main">
              <div className="question-container">
                <div className="section-label">{currentQuestion.sectionName}</div>

                <h2 className="question-prompt">{currentQuestion.prompt}</h2>

                <div className="answer-input-wrapper">
                  <textarea
                    ref={textareaRef}
                    className="answer-input"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Write as much or as little as you'd like..."
                    rows={6}
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      className={`mic-btn ${isListening ? 'listening' : ''}`}
                      onClick={toggleListening}
                      title={isListening ? 'Stop listening' : 'Click to speak'}
                    >
                      {isListening ? (
                        <span className="mic-icon recording">●</span>
                      ) : (
                        <span className="mic-icon">🎤</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Quick Answers */}
                <div className="quick-answers">
                  <span className="quick-label">Quick response:</span>
                  <div className="quick-options">
                    {skipOptions.map((answer, i) => (
                      <button
                        key={i}
                        className={`quick-btn ${answers[currentQuestion.id] === answer ? 'selected' : ''}`}
                        onClick={() => selectQuickAnswer(currentQuestion.id, answer)}
                      >
                        {answer}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Follow-up toggle */}
                {currentQuestion.followUp && (
                  <div className="followup-section">
                    <button
                      className={`followup-toggle ${followUpOpen[currentQuestion.id] ? 'open' : ''}`}
                      onClick={() => toggleFollowUp(currentQuestion.id)}
                    >
                      {followUpOpen[currentQuestion.id] ? '− Go deeper' : '+ Go deeper'}
                    </button>

                    {followUpOpen[currentQuestion.id] && (
                      <div className="followup-content">
                        <p className="followup-prompt">{currentQuestion.followUp}</p>
                        <textarea
                          className="answer-input followup"
                          value={followUpAnswers[currentQuestion.id] || ''}
                          onChange={(e) => handleFollowUpChange(currentQuestion.id, e.target.value)}
                          placeholder="Optional..."
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Tone Selector - only on last question */}
                {currentIndex === questions.length - 1 && (
                  <div className="tone-selector">
                    <p className="tone-label">One last thing — what tone feels right for you today?</p>
                    <div className="tone-options">
                      {toneOptions.map(option => (
                        <button
                          key={option.id}
                          className={`tone-btn ${tone === option.id ? 'selected' : ''}`}
                          onClick={() => setTone(option.id)}
                        >
                          <span className="tone-icon">{option.icon}</span>
                          <span className="tone-name">{option.name}</span>
                          <span className="tone-desc">{option.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="error-message">{error}</p>}

                <div className="question-nav">
                  <button
                    className="btn secondary"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </button>

                  <button className="btn text" onClick={skipQuestion}>
                    Skip
                  </button>

                  <button className="btn primary" onClick={goNext}>
                    {currentIndex === questions.length - 1 ? 'Generate letter' : 'Next →'}
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Generating */}
      {view === 'generating' && (
        <div className="view generating">
          <div className="generating-content">
            <div className="generating-animation">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <p className="generating-text">Writing your letter...</p>
            <p className="generating-subtext">This takes about 30 seconds.</p>
          </div>
        </div>
      )}

      {/* Letter */}
      {view === 'letter' && (
        <div className="view letter-view">
          <div className="letter-container">
            {/* Top action buttons */}
            <div className="letter-actions letter-actions-top">
              <button className="btn secondary" onClick={copyLetter}>
                Copy text
              </button>
              <button className="btn secondary" onClick={downloadLetter}>
                Download .txt
              </button>
              <button className="btn primary" onClick={saveToPdf}>
                Save as PDF
              </button>
            </div>

            <article className="letter">
              {/* Print header - only shows in PDF */}
              <div className="print-header">
                <div className="print-logo">Letter to You</div>
                <div className="print-date">{new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>

              <div className="letter-decorative-line"></div>

              <h1>A letter to you</h1>
              <p className="letter-from">From a friend who sees you</p>
              <div className="letter-body">
                {letter.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div className="letter-closing">
                <p className="closing-line">—</p>
                <p className="closing-text">Written with care, based on your words.</p>
              </div>

              {/* Print footer - only shows in PDF */}
              <div className="print-footer">
                <p>lettertoyou.app · A tool for self-reflection</p>
              </div>
            </article>

            <div className="letter-actions">
              <button className="btn secondary" onClick={copyLetter}>
                Copy text
              </button>
              <button className="btn secondary" onClick={downloadLetter}>
                Download .txt
              </button>
              <button className="btn primary" onClick={saveToPdf}>
                Save as PDF
              </button>
            </div>

            <p className="letter-note">
              Consider reading this again in a week. Things may land differently.
            </p>

            <button className="btn text start-over-btn" onClick={startOver}>
              Start a new reflection
            </button>
          </div>
        </div>
      )}

      {/* Crisis */}
      {view === 'crisis' && (
        <div className="view crisis">
          <div className="crisis-content">
            <h2>{crisisResources.title}</h2>
            <p className="crisis-message">{crisisResources.message}</p>

            <div className="crisis-resources">
              {crisisResources.resources.map((resource, i) => (
                <div key={i} className="crisis-resource">
                  <h3>{resource.name}</h3>
                  {resource.phone && <p className="crisis-phone">{resource.phone}</p>}
                  <p className="crisis-desc">{resource.description}</p>
                  {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="crisis-link">
                      Visit website →
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button className="btn text" onClick={startOver}>
              Return to start
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
