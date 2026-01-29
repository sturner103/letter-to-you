import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { supabase } from './lib/supabase.js';
import AuthModal from './components/Auth/AuthModal';
import { modes, lifeEventModes, getQuestionsForMode, checkSafetyContent, crisisResources } from '../config/questions.js';

/* ============================================================================
   APP.JSX - MAIN APPLICATION FILE
   ============================================================================
   
   FILE STRUCTURE (use Ctrl+F to jump to sections):
   
   [STATE]        - All useState declarations (~line 40)
   [DATA]         - Static data: quickQuestions, toneOptions, letterTypes (~line 115)
   [EFFECTS]      - All useEffect hooks (~line 295)
   [HANDLERS]     - Event handlers and functions (~line 385)
   [RENDER]       - JSX return statement (~line 1125)
   
   VIEWS (inside [RENDER]):
   [VIEW:NAVBAR]       - Navigation bar
   [VIEW:LANDING]      - Home page with letter types
   [VIEW:HOW-IT-WORKS] - Static info page
   [VIEW:QUICK]        - Quick letter interview (free)
   [VIEW:INTERVIEW]    - Main paid interview
   [VIEW:LETTER]       - Letter display with toolbar
   [VIEW:YOUR-LETTERS] - Saved letters list
   [VIEW:CRISIS]       - Crisis resources page
   
   MODALS (inside [RENDER]):
   [MODAL:EMAIL]       - Email letter modal
   [MODAL:ANSWERS]     - View answers modal
   [MODAL:REWRITE]     - Rewrite tone modal
   [MODAL:COMPARISON]  - Letter comparison modal
   [MODAL:PAYMENT]     - Payment gate modal
   [MODAL:AUTH]        - Authentication modal
   
   ============================================================================ */

// Helper to check if error is an abort error (can be safely ignored)
const isAbortError = (error) => {
  return error?.name === 'AbortError' || 
         error?.message?.includes('aborted') ||
         error?.code === 'ABORT_ERR';
};

// Routes: /, /how-it-works, /your-letters, /write/:mode, /letter, /crisis
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  /* --------------------------------------------------------------------------
     [STATE] - All useState declarations
     -------------------------------------------------------------------------- */
  
  // Derive current "view" from URL path
  const getViewFromPath = () => {
    const path = location.pathname;
    if (path === '/') return 'landing';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/your-letters') return 'your-letters';
    if (path === '/write/quick') return 'quick-interview';
    if (path.startsWith('/write/')) return 'interview';
    if (path === '/letter') return 'letter';
    if (path === '/crisis') return 'crisis';
    return 'landing'; // Default fallback
  };
  
  const view = getViewFromPath();
  const urlMode = location.pathname.startsWith('/write/') 
    ? location.pathname.replace('/write/', '') 
    : null;
  
  const [selectedMode, setSelectedMode] = useState(urlMode || 'general');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [followUpOpen, setFollowUpOpen] = useState({});
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [letter, setLetter] = useState('');
  const [error, setError] = useState(null);
  const [hasLetter, setHasLetter] = useState(false);
  const [tone, setTone] = useState('youdecide');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [rewriteTone, setRewriteTone] = useState(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, signOut: supabaseSignOut, isAuthenticated, loading: authLoading } = useAuth();

  // Handle sign out with proper state reset
  const handleSignOut = async () => {
    console.log('Sign out clicked');
    try {
      await supabaseSignOut();
      console.log('Sign out completed');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      navigate('/');
      setSavedLetters([]);
      setLetter('');
      setHasLetter(false);
      setLetterSaveStatus(null);
      // Reset payment state
      setCurrentPurchase(null);
      setPaymentVerified(false);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [quickAnswers, setQuickAnswers] = useState({});
  const [quickIndex, setQuickIndex] = useState(0);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const modesRef = useRef(null);

  // Saved letters state
  const [savedLetters, setSavedLetters] = useState([]);
  const [lettersLoading, setLettersLoading] = useState(false);
  const [letterSaveStatus, setLetterSaveStatus] = useState(null);
  const [letterSort, setLetterSort] = useState('newest');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // ========================================
  // PAYMENT STATE - NEW
  // ========================================
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  /* --------------------------------------------------------------------------
     [DATA] - Static data constants
     -------------------------------------------------------------------------- */

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
      id: 'youdecide',
      name: 'You Decide',
      description: 'Based on what I shared',
      icon: '✧'
    },
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

  // Letter type details for landing page (moved up for payment modal access)
  const letterTypes = [
    {
      id: 'general',
      icon: '◎',
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
    },
    {
      id: 'original',
      icon: '✦',
      name: 'The Original',
      tagline: 'The deep questions that started it all',
      description: 'Ten profound questions designed to surface what\'s been hiding beneath the surface. This is the reflection that launched Letter to You — raw, searching, and deeply personal.',
      bestFor: 'When you\'re ready to go deep and meet yourself honestly'
    }
  ];

  /* --------------------------------------------------------------------------
     [EFFECTS] - All useEffect hooks
     -------------------------------------------------------------------------- */

  // Load questions when mode is selected
  useEffect(() => {
    if (selectedMode) {
      setQuestions(getQuestionsForMode(selectedMode));
    }
  }, [selectedMode]);

  // Sync selectedMode with URL when navigating directly to /write/:mode
  useEffect(() => {
    if (urlMode && urlMode !== selectedMode && urlMode !== 'quick') {
      setSelectedMode(urlMode);
      setCurrentIndex(0);
      setAnswers({});
      setFollowUpOpen({});
      setFollowUpAnswers({});
    }
  }, [urlMode]);

  // ========================================
  // PAYMENT VERIFICATION ON PAGE LOAD - NEW
  // ========================================
  useEffect(() => {
    // Wait for auth to finish loading before checking payment
    if (authLoading) return;
    
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId && user) {
      verifyPaymentReturn(sessionId);
    } else if (paymentStatus === 'cancelled') {
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, user, authLoading]);

  // Verify payment when returning from Stripe
  const verifyPaymentReturn = async (sessionId) => {
    setPaymentLoading(true);
    try {
      const response = await fetch(`/.netlify/functions/verify-purchase?userId=${user.id}&sessionId=${sessionId}`);
      const data = await response.json();

      if (data.valid) {
        setCurrentPurchase(data.purchase);
        setPaymentVerified(true);
        navigate(location.pathname, { replace: true });
        console.log('Payment verified, questions unlocked');
      } else {
        setError('Payment verification failed. Please contact support if you were charged.');
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Failed to verify payment. Please try again or contact support.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Protect interview route - redirect if not paid
  useEffect(() => {
    if (view === 'interview' && urlMode && urlMode !== 'quick' && user && !paymentVerified && !paymentLoading) {
      const searchParams = new URLSearchParams(location.search);
      const hasSessionId = searchParams.has('session_id');
      
      if (!hasSessionId) {
        setPaymentMode(urlMode);
        setShowPaymentGate(true);
        navigate('/', { replace: true });
      }
    }
  }, [view, urlMode, user, paymentVerified, paymentLoading]);

  // Auto-focus textarea when question changes
  useEffect(() => {
    if (view === 'interview' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, view]);

  /* --------------------------------------------------------------------------
     [HANDLERS] - Event handlers and functions
     -------------------------------------------------------------------------- */

  // Check all answers for safety content
  const hasSafetyContent = () => {
    const allText = [
      ...Object.values(answers),
      ...Object.values(followUpAnswers)
    ].join(' ');
    return checkSafetyContent(allText);
  };

  // ========================================
  // MODIFIED: Handle starting the interview - now with payment gate
  // ========================================
  const startInterview = (mode) => {
    // If not authenticated, show auth modal first
    if (!isAuthenticated) {
      setPaymentMode(mode);
      setShowAuthModal(true);
      return;
    }

    // If already have a verified purchase for this mode, go straight to questions
    if (paymentVerified && currentPurchase?.letterMode === mode) {
      setSelectedMode(mode);
      setCurrentIndex(0);
      setAnswers({});
      setFollowUpOpen({});
      setFollowUpAnswers({});
      navigate(`/write/${mode}`);
      return;
    }

    // Otherwise, show payment gate
    setPaymentMode(mode);
    setShowPaymentGate(true);
  };

  // ========================================
  // NEW: Initiate Stripe checkout
  // ========================================
  const initiatePayment = async () => {
    if (!user || !paymentMode) return;

    setPaymentLoading(true);
    setError(null);

    try {
      const modeInfo = letterTypes.find(t => t.id === paymentMode) ||
                       lifeEventModes.find(m => m.id === paymentMode);
      const modeName = modeInfo?.name || paymentMode;

      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mode: paymentMode,
          modeName: modeName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(`Payment failed: ${err.message}`);
      setPaymentLoading(false);
    }
  };

  // Close payment gate
  const closePaymentGate = () => {
    setShowPaymentGate(false);
    setPaymentMode(null);
    setError(null);
  };

  // Start quick letter (free - no payment required)
  const startQuickLetter = () => {
    setIsQuickMode(true);
    setQuickIndex(0);
    setQuickAnswers({});
    navigate('/write/quick');
  };

  // Scroll to modes section (and navigate to landing if needed)
  const scrollToModes = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        modesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      modesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
        navigate('/crisis');
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

  // ========================================
  // MODIFIED: Generate the letter - now marks purchase as used
  // ========================================
  const generateLetter = async () => {
    setIsGenerating(true);
    setError(null);
    setLetterSaveStatus(null);

    try {
      const questionsData = questions.map((q, i) => {
        const answer = answers[q.id]?.trim() || '[skipped]';
        const followUpAnswer = followUpAnswers[q.id]?.trim();
        return {
          question: q.prompt,
          answer: answer,
          followUp: q.followUp && followUpOpen[q.id] && followUpAnswer ? {
            question: q.followUp,
            answer: followUpAnswer
          } : null
        };
      });

      const qaPairs = questions.map((q, i) => {
        const answer = answers[q.id]?.trim() || '[skipped]';
        const followUpAnswer = followUpAnswers[q.id]?.trim();

        let text = `Q${i + 1}: ${q.prompt}\nA${i + 1}: ${answer}`;
        if (q.followUp && followUpOpen[q.id] && followUpAnswer) {
          text += `\n\nFollow-up: ${q.followUp}\nAnswer: ${followUpAnswer}`;
        }
        return text;
      }).join('\n\n---\n\n');

      const modeName = modes.find(m => m.id === selectedMode)?.name ||
                       lifeEventModes.find(m => m.id === selectedMode)?.name ||
                       'General Reflection';

      const response = await fetch('/.netlify/functions/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          modeName: modeName,
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
      setIsGenerating(false);
      navigate('/letter');
      
      window.scrollTo(0, 0);

      // Auto-save letter for authenticated users
      if (user) {
        const savedLetter = await saveLetter(data.letter, selectedMode, tone, questionsData);
        
        // Mark the purchase as used
        if (currentPurchase?.id) {
          try {
            await fetch('/.netlify/functions/mark-purchase-used', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                purchaseId: currentPurchase.id,
                letterId: savedLetter?.id,
                userId: user.id
              })
            });
            // Reset purchase state
            setCurrentPurchase(null);
            setPaymentVerified(false);
          } catch (err) {
            console.error('Failed to mark purchase as used:', err);
            // Don't block the user - letter was generated successfully
          }
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Something went wrong: ${err.message}. Please try again.`);
      setIsGenerating(false);
      setCurrentIndex(questions.length - 1);
    }
  };

  // Generate quick letter (free - no purchase tracking)
  const generateQuickLetter = async () => {
    setIsGenerating(true);
    setError(null);
    setLetterSaveStatus(null);

    try {
      const questionsData = quickQuestions.map((q) => ({
        question: q.prompt,
        answer: quickAnswers[q.id] || '[skipped]',
        followUp: null
      }));

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
      setIsGenerating(false);
      navigate('/letter');
      
      window.scrollTo(0, 0);

      if (user) {
        await saveLetter(data.letter, 'quick', 'warm', questionsData);
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(`Something went wrong: ${err.message}. Please try again.`);
      setIsGenerating(false);
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

  // Print letter
  const printLetter = () => {
    window.print();
  };

  // Email letter to self
  const emailLetter = async () => {
    if (!emailAddress) return;
    
    setEmailSending(true);
    try {
      const response = await fetch('/.netlify/functions/email-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress,
          letter: letter,
          mode: selectedMode
        })
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      
      setEmailSent(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSent(false);
        setEmailAddress('');
      }, 2000);
    } catch (err) {
      console.error('Email failed:', err);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  // Share letter (copy link)
  const shareLetter = async () => {
    const shareUrl = window.location.origin + '/letter';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  // Get formatted answers for display
  const getFormattedAnswers = () => {
    return questions.map((q, i) => ({
      question: q.prompt,
      answer: answers[q.id] || '[skipped]',
      followUp: q.followUp && followUpOpen[q.id] ? {
        question: q.followUp,
        answer: followUpAnswers[q.id] || ''
      } : null
    }));
  };

  // Rewrite letter in different tone
  const rewriteLetter = async (newTone) => {
    setIsRewriting(true);
    setShowRewriteModal(false);
    setIsGenerating(true);

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

      const modeName = modes.find(m => m.id === selectedMode)?.name ||
                       lifeEventModes.find(m => m.id === selectedMode)?.name ||
                       'General Reflection';

      const response = await fetch('/.netlify/functions/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          modeName: modeName,
          tone: newTone,
          qaPairs
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite letter');
      }

      const data = await response.json();
      setLetter(data.letter);
      setTone(newTone);
      setIsGenerating(false);
      navigate('/letter');
      window.scrollTo(0, 0);

      if (user) {
        const questionsData = questions.map((q) => ({
          question: q.prompt,
          answer: answers[q.id] || '[skipped]',
          followUp: q.followUp && followUpOpen[q.id] ? {
            question: q.followUp,
            answer: followUpAnswers[q.id] || ''
          } : null
        }));
        await saveLetter(data.letter, selectedMode, newTone, questionsData);
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      setError('Failed to rewrite letter. Please try again.');
      setIsGenerating(false);
    } finally {
      setIsRewriting(false);
    }
  };

  // Start over
  const startOver = () => {
    navigate('/');
    setSelectedMode('general');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setFollowUpOpen({});
    setFollowUpAnswers({});
    setError(null);
    setLetterSaveStatus(null);
  };

  // Save letter to database (for authenticated users)
  const saveLetter = async (letterContent, mode, toneUsed, questionsData, retryCount = 0) => {
    if (!user) return null;
    
    setLetterSaveStatus('saving');
    
    try {
      const { data, error } = await supabase
        .from('letters')
        .insert({
          user_id: user.id,
          mode: mode,
          tone: toneUsed,
          questions: questionsData,
          letter_content: letterContent,
          word_count: letterContent.split(/\s+/).length,
          delivery_status: 'immediate'
        })
        .select()
        .single();

      if (error) throw error;
      
      setLetterSaveStatus('saved');
      
      const cacheKey = `letters_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      const cachedLetters = cached ? JSON.parse(cached) : [];
      localStorage.setItem(cacheKey, JSON.stringify([data, ...cachedLetters]));
      
      return data;
    } catch (err) {
      if (isAbortError(err) && retryCount < 1) {
        console.log('Save aborted, retrying...');
        await new Promise(r => setTimeout(r, 500));
        return saveLetter(letterContent, mode, toneUsed, questionsData, retryCount + 1);
      }
      
      if (!isAbortError(err)) {
        console.error('Error saving letter:', err);
      }
      setLetterSaveStatus('error');
      return null;
    }
  };

  // Fetch user's saved letters with localStorage caching
  const fetchSavedLetters = async () => {
    if (!user) return;
    
    setLettersLoading(true);
    
    const cacheKey = `letters_${user.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedLetters = JSON.parse(cached);
        setSavedLetters(cachedLetters);
        setLettersLoading(false);
      } catch (e) {
        console.error('Error parsing cached letters:', e);
      }
    }
    
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSavedLetters(data || []);
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('Error fetching letters:', err);
      }
    } finally {
      setLettersLoading(false);
    }
  };

  // Delete a saved letter
  const deleteLetter = async (letterId) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('letters')
        .delete()
        .eq('id', letterId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const updatedLetters = savedLetters.filter(l => l.id !== letterId);
      setSavedLetters(updatedLetters);
      localStorage.setItem(`letters_${user.id}`, JSON.stringify(updatedLetters));
    } catch (err) {
      console.error('Error deleting letter:', err);
    }
  };

  // Load a saved letter into view
  const viewSavedLetter = (savedLetter) => {
    setLetter(savedLetter.letter_content);
    setSelectedMode(savedLetter.mode);
    setTone(savedLetter.tone || 'warm');
    setHasLetter(true);
    setLetterSaveStatus('saved');
    navigate('/letter');
    window.scrollTo(0, 0);
  };

  // Load cached letters immediately when visiting Your Letters
  useEffect(() => {
    if (location.pathname === '/your-letters') {
      const cachedKeys = Object.keys(localStorage).filter(k => k.startsWith('letters_'));
      if (cachedKeys.length > 0 && savedLetters.length === 0) {
        try {
          const cached = localStorage.getItem(cachedKeys[0]);
          if (cached) {
            setSavedLetters(JSON.parse(cached));
          }
        } catch (e) {
          console.error('Error loading cached letters:', e);
        }
      }
    }
  }, [location.pathname]);

  // Fetch letters when user logs in or when viewing Your Letters
  useEffect(() => {
    if (location.pathname === '/your-letters') {
      if (authLoading) {
        setLettersLoading(true);
        return;
      }
      
      if (user) {
        fetchSavedLetters();
      } else {
        setLettersLoading(false);
        setSavedLetters([]);
        const cachedKeys = Object.keys(localStorage).filter(k => k.startsWith('letters_'));
        cachedKeys.forEach(k => localStorage.removeItem(k));
      }
    }
  }, [user, location.pathname, authLoading]);

  // Reset compare selection when leaving the page
  useEffect(() => {
    if (location.pathname !== '/your-letters') {
      setSelectedForCompare([]);
      setCompareMode(false);
    }
  }, [location.pathname]);

  // Toggle letter selection for comparison
  const toggleLetterSelection = (letterId) => {
    setSelectedForCompare(prev => {
      if (prev.includes(letterId)) {
        return prev.filter(id => id !== letterId);
      } else if (prev.length < 2) {
        return [...prev, letterId];
      }
      return prev;
    });
  };

  // Get sorted letters
  const getSortedLetters = () => {
    const letters = [...savedLetters];
    switch (letterSort) {
      case 'oldest':
        return letters.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'mode':
        return letters.sort((a, b) => (a.mode || '').localeCompare(b.mode || ''));
      case 'tone':
        return letters.sort((a, b) => (a.tone || '').localeCompare(b.tone || ''));
      case 'newest':
      default:
        return letters.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  };

  // Compare two letters
  const compareLetters = async () => {
    if (selectedForCompare.length !== 2) return;
    
    const letter1 = savedLetters.find(l => l.id === selectedForCompare[0]);
    const letter2 = savedLetters.find(l => l.id === selectedForCompare[1]);
    
    if (!letter1 || !letter2) return;
    
    setComparisonLoading(true);
    setShowComparison(true);
    setComparisonResult(null);
    
    try {
      const response = await fetch('/.netlify/functions/compare-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter1: {
            content: letter1.letter_content,
            mode: letter1.mode,
            date: letter1.created_at
          },
          letter2: {
            content: letter2.letter_content,
            mode: letter2.mode,
            date: letter2.created_at
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to compare letters');
      }
      
      const data = await response.json();
      setComparisonResult(data.comparison);
    } catch (err) {
      console.error('Comparison error:', err);
      setComparisonResult('Unable to generate comparison. Please try again.');
    } finally {
      setComparisonLoading(false);
    }
  };

  // Close comparison view
  const closeComparison = () => {
    setShowComparison(false);
    setComparisonResult(null);
    setSelectedForCompare([]);
    setCompareMode(false);
  };

  // Cancel compare mode
  const cancelCompareMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  // Get compare button state
  const getCompareButtonState = () => {
    if (!compareMode) return 'inactive';
    if (selectedForCompare.length === 2) return 'ready';
    return 'active';
  };

  // Get a snippet from letter content
  const getLetterSnippet = (content, maxLength = 120) => {
    if (!content) return '';
    let text = content.replace(/^Dear me,?\s*/i, '').trim();
    if (text.length <= maxLength) return `"${text}"`;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return `"${truncated.substring(0, lastSpace)}..."`;
  };

  // Current question
  const currentQuestion = questions[currentIndex];

  // Keep currentQuestion ref updated for speech recognition
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  /* --------------------------------------------------------------------------
     [RENDER] - JSX return statement
     -------------------------------------------------------------------------- */

  return (
    <div className="app">
      {/* [VIEW:NAVBAR] ---------------------------------------------------- */}
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="nav-brand" onClick={() => navigate('/')}>
            Letter to You
          </button>
          <div className="nav-links">
            <button
              className="nav-link write-letter-link"
              onClick={scrollToModes}
            >
              Write your letter
            </button>
            <button
              className={`nav-link ${location.pathname === '/how-it-works' ? 'active' : ''}`}
              onClick={() => navigate('/how-it-works')}
            >
              How it works
            </button>
            <button
              className={`nav-link ${location.pathname === '/your-letters' ? 'active' : ''}`}
              onClick={() => navigate('/your-letters')}
            >
              Your letters
            </button>
            {isAuthenticated ? (
              <button className="nav-link" onClick={handleSignOut}>
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

      {/* [VIEW:LANDING] --------------------------------------------------- */}
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
                  <li>Private — your letters are stored securely and visible only to you</li>
                  <li>Something you can return to over time</li>
                </ul>
              </div>
              <div className="what-box isnt">
                <h3>What it isn't</h3>
                <ul>
                  <li>Therapy or professional mental health support</li>
                  <li>A diagnosis or treatment recommendation</li>
                  <li>A replacement for talking to a real person</li>
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

      {/* [VIEW:HOW-IT-WORKS] ----------------------------------------------- */}
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
                <div className="info-card-icon">◐</div>
                <h3>Private by design</h3>
                <p>Your letters are stored securely in your account and visible only to you. We don't share, sell, or train on your data.</p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">◇</div>
                <h3>Real questions</h3>
                <p>Not therapy. Not a quiz. Just thoughtful prompts designed to help you think out loud.</p>
              </div>

              <div className="info-card">
                <div className="info-card-icon">⊙</div>
                <h3>A mirror, not advice</h3>
                <p>Your letter reflects your words back — helping you see patterns and name what you're feeling.</p>
              </div>
            </div>

            <button className="btn primary" onClick={scrollToModes}>
              Begin your reflection
            </button>
          </div>
        </div>
      )}

      {/* [VIEW:QUICK] - Quick Letter Interview (Free) ---------------------- */}
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
                  onClick={generateQuickLetter}
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
                navigate('/');
              }}
            >
              ← Back to home
            </button>
          </div>
        </div>
      )}

      {/* [VIEW:INTERVIEW] - Main Paid Interview ----------------------------- */}
      {view === 'interview' && currentQuestion && (
        <div className="view interview">
          <div className="interview-layout">
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

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="generating-overlay">
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

      {/* [VIEW:LETTER] - Letter Display with Toolbar ------------------------ */}
      {view === 'letter' && (
        <div className="view letter-view">
          <div className="letter-container">
            <div className="letter-toolbar">
              <button className="toolbar-btn" onClick={() => setShowRewriteModal(true)}>
                <span className="toolbar-icon">◇</span>
                <span className="toolbar-text">Change Tone</span>
              </button>
              <button className="toolbar-btn" onClick={() => setShowEmailModal(true)}>
                <span className="toolbar-icon">▷</span>
                <span className="toolbar-text">Email</span>
              </button>
              <button className="toolbar-btn" onClick={shareLetter}>
                <span className="toolbar-icon">{shareCopied ? '✓' : '◎'}</span>
                <span className="toolbar-text">{shareCopied ? 'Copied!' : 'Share'}</span>
              </button>
              <button className="toolbar-btn" onClick={copyLetter}>
                <span className="toolbar-icon">⊡</span>
                <span className="toolbar-text">Copy</span>
              </button>
              <button className="toolbar-btn" onClick={printLetter}>
                <span className="toolbar-icon">⊞</span>
                <span className="toolbar-text">Print</span>
              </button>
              <button className="toolbar-btn toolbar-btn-primary" onClick={saveToPdf}>
                <span className="toolbar-icon">↓</span>
                <span className="toolbar-text">PDF</span>
              </button>
            </div>

            <article className="letter">
              <div className="print-header">
                <div className="print-logo">Letter to You</div>
                <div className="print-date">{new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>

              <div className="letter-decorative-line"></div>

              <h1>A letter to you, from you</h1>
              <div className="letter-body">
                {letter.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div className="letter-closing">
                <p className="closing-signoff">Sincerely,</p>
                <p className="closing-me">me</p>
              </div>

              <div className="letter-disclaimer">
                <p>This letter is a self-reflection tool — not therapy, professional advice, or a substitute for talking to a real person.</p>
              </div>

              <div className="print-footer">
                <p>barryletter.com · A tool for self-reflection</p>
              </div>
            </article>

            {user && letterSaveStatus && (
              <p className={`letter-save-status ${letterSaveStatus}`}>
                {letterSaveStatus === 'saving' && '💾 Saving to your account...'}
                {letterSaveStatus === 'saved' && '✓ Saved to your account'}
                {letterSaveStatus === 'error' && '⚠ Could not save - try again later'}
              </p>
            )}

            {!user && !authLoading && (
              <div className="save-prompt">
                <p>Want to save this letter and access it later?</p>
                <button className="btn secondary" onClick={() => setShowAuthModal(true)}>
                  Sign in to save
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* [VIEW:YOUR-LETTERS] - Saved Letters List --------------------------- */}
      {view === 'your-letters' && (
        <div className="view your-letters-view">
          <div className="your-letters-container">
            <h1>Your Letters</h1>
            <p className="your-letters-subtitle">Click any letter to read, print, or share it</p>
            
            {authLoading || lettersLoading ? (
              <div className="letters-loading">
                <p>Loading your letters...</p>
              </div>
            ) : !user ? (
              <div className="letters-signin-prompt">
                <p>Sign in to save and access your letters.</p>
                <button className="btn primary" onClick={() => setShowAuthModal(true)}>
                  Sign in
                </button>
              </div>
            ) : savedLetters.length === 0 ? (
              <div className="letters-empty-simple">
                <p>No letters yet</p>
                <p className="empty-subtext">Your letters will appear here after you write them.</p>
                <button className="btn primary" onClick={scrollToModes}>
                  Write your first letter
                </button>
              </div>
            ) : (
              <>
                <div className="letters-controls-row">
                  <button 
                    className={`compare-mode-btn ${getCompareButtonState()}`}
                    onClick={() => {
                      if (getCompareButtonState() === 'ready') {
                        compareLetters();
                      } else if (getCompareButtonState() === 'inactive') {
                        setCompareMode(true);
                      }
                    }}
                  >
                    Compare Letters <span className="beta-badge">Beta</span>
                  </button>
                  <div className="letters-controls-right">
                    <span className="letters-count">{savedLetters.length} letter{savedLetters.length !== 1 ? 's' : ''}</span>
                    <select 
                      className="letters-sort-select"
                      value={letterSort}
                      onChange={(e) => setLetterSort(e.target.value)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="mode">By type</option>
                      <option value="tone">By tone</option>
                    </select>
                  </div>
                </div>

                {compareMode && (
                  <div className="compare-hint-bar">
                    <span>
                      {selectedForCompare.length === 0 && 'Select 2 letters to compare how you\'ve changed'}
                      {selectedForCompare.length === 1 && 'Select one more letter to compare'}
                      {selectedForCompare.length === 2 && '2 letters selected — click Compare to see what\'s changed'}
                    </span>
                    <button className="cancel-compare-btn" onClick={cancelCompareMode}>
                      Cancel
                    </button>
                  </div>
                )}

                <div className="letters-card-list">
                  {getSortedLetters().map((savedLetter) => {
                    const modeInfo = modes.find(m => m.id === savedLetter.mode) ||
                                     lifeEventModes.find(m => m.id === savedLetter.mode) ||
                                     { name: savedLetter.mode === 'quick' ? 'Quick Reflection' : 'Reflection', icon: '◎' };
                    const date = new Date(savedLetter.created_at);
                    const isSelected = selectedForCompare.includes(savedLetter.id);
                    const toneLabel = savedLetter.tone ? 
                      savedLetter.tone.charAt(0).toUpperCase() + savedLetter.tone.slice(1) : 
                      'Warm';
                    
                    return (
                      <div 
                        key={savedLetter.id} 
                        className={`letter-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (compareMode) {
                            toggleLetterSelection(savedLetter.id);
                          } else {
                            viewSavedLetter(savedLetter);
                          }
                        }}
                      >
                        <div className="letter-card-main">
                          <div className="letter-card-tone">Tone: <span>{toneLabel}</span></div>
                          <div className="letter-card-header">
                            {compareMode && (
                              <input
                                type="checkbox"
                                className="letter-card-checkbox"
                                checked={isSelected}
                                onChange={() => toggleLetterSelection(savedLetter.id)}
                                disabled={!isSelected && selectedForCompare.length >= 2}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <div className="letter-card-info">
                              <div className="letter-card-mode">
                                <span className="letter-card-icon">{modeInfo.icon || '◎'}</span>
                                {modeInfo.name}
                              </div>
                              <div className="letter-card-date">
                                {date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <p className={`letter-card-snippet ${compareMode ? 'with-checkbox' : ''}`}>
                            {getLetterSnippet(savedLetter.letter_content)}
                          </p>
                        </div>
                        <span className="letter-card-arrow">→</span>
                      </div>
                    );
                  })}
                </div>

                <div className="letters-footer">
                  <button className="btn secondary" onClick={scrollToModes}>
                    Write a new letter
                  </button>
                </div>
              </>
            )}
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content email-modal">
            <button className="modal-close" onClick={() => { setShowEmailModal(false); setEmailSent(false); }}>×</button>
            <h2>Email Your Letter</h2>
            {emailSent ? (
              <div className="email-success">
                <span className="email-success-icon">✓</span>
                <p>Letter sent! Check your inbox.</p>
              </div>
            ) : (
              <>
                <p className="email-intro">We'll send this letter to your inbox so you can read it again whenever you need to.</p>
                <div className="email-form">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="email-input"
                  />
                  <button 
                    className="btn primary" 
                    onClick={emailLetter}
                    disabled={!emailAddress || emailSending}
                  >
                    {emailSending ? 'Sending...' : 'Send Letter'}
                  </button>
                </div>
              </>
            )}
            <div className="modal-actions">
              <button className="btn text" onClick={() => { setShowEmailModal(false); setEmailSent(false); }}>
                {emailSent ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answers Modal */}
      {showAnswersModal && (
        <div className="modal-overlay">
          <div className="modal-content answers-modal">
            <button className="modal-close" onClick={() => setShowAnswersModal(false)}>×</button>
            <h2>Your Answers</h2>
            <div className="answers-list">
              {getFormattedAnswers().map((item, i) => (
                <div key={i} className="answer-item">
                  <p className="answer-question">{item.question}</p>
                  <p className="answer-text">{item.answer}</p>
                  {item.followUp && (
                    <div className="answer-followup">
                      <p className="answer-question">{item.followUp.question}</p>
                      <p className="answer-text">{item.followUp.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowAnswersModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewrite Modal */}
      {showRewriteModal && (
        <div className="modal-overlay">
          <div className="modal-content rewrite-modal">
            <button className="modal-close" onClick={() => setShowRewriteModal(false)}>×</button>
            <h2>Rewrite in a Different Voice</h2>
            <p className="rewrite-intro">Choose a new tone for your letter. We'll regenerate it using your same answers.</p>
            <div className="rewrite-tone-options">
              {toneOptions.filter(t => t.id !== 'youdecide').map(option => (
                <button
                  key={option.id}
                  className={`rewrite-tone-btn ${tone === option.id ? 'current' : ''}`}
                  onClick={() => rewriteLetter(option.id)}
                  disabled={tone === option.id}
                >
                  <span className="tone-icon">{option.icon}</span>
                  <span className="tone-name">{option.name}</span>
                  <span className="tone-desc">{option.description}</span>
                  {tone === option.id && <span className="current-badge">Current</span>}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn text" onClick={() => setShowRewriteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <div className="comparison-overlay">
          <div className="comparison-modal">
            <button className="comparison-close" onClick={closeComparison}>×</button>
            <h2>What Has Changed</h2>
            
            {comparisonLoading ? (
              <div className="comparison-loading">
                <p>Analyzing your letters...</p>
                <p className="loading-note">This may take a moment</p>
              </div>
            ) : comparisonResult ? (
              <div className="comparison-content">
                {comparisonResult.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            
            <div className="comparison-actions">
              <button className="btn secondary" onClick={closeComparison}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          PAYMENT GATE MODAL - NEW
          ======================================== */}
      {showPaymentGate && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <button className="modal-close" onClick={closePaymentGate}>×</button>
            
            {paymentLoading ? (
              <div className="payment-loading">
                <div className="loading-spinner"></div>
                <p>Connecting to checkout...</p>
              </div>
            ) : (
              <>
                <div className="payment-header">
                  <span className="payment-icon">
                    {letterTypes.find(t => t.id === paymentMode)?.icon || 
                     lifeEventModes.find(m => m.id === paymentMode)?.icon || '◎'}
                  </span>
                  <h2>
                    {letterTypes.find(t => t.id === paymentMode)?.name || 
                     lifeEventModes.find(m => m.id === paymentMode)?.name || 'Letter'}
                  </h2>
                </div>

                <div className="payment-details">
                  <p className="payment-description">
                    You're about to begin a guided reflection that will generate a personalized letter 
                    based on your responses.
                  </p>
                  
                  <div className="payment-includes">
                    <h4>What you'll get:</h4>
                    <ul>
                      <li>✓ 8-10 thoughtful reflection questions</li>
                      <li>✓ A 600-1,200 word personalized letter</li>
                      <li>✓ Concrete next steps based on your answers</li>
                      <li>✓ Letter saved to your account forever</li>
                    </ul>
                  </div>

                  <div className="payment-price">
                    <span className="price-amount">$12</span>
                    <span className="price-currency">NZD</span>
                  </div>
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="payment-actions">
                  <button className="btn primary payment-btn" onClick={initiatePayment}>
                    Continue to payment →
                  </button>
                  <button className="btn text" onClick={closePaymentGate}>
                    Maybe later
                  </button>
                </div>

                <p className="payment-note">
                  Secure payment via Stripe. Your answers are saved if you leave partway through.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          // If user was trying to access a paid mode, show payment gate after auth
          if (paymentMode && isAuthenticated) {
            setShowPaymentGate(true);
          }
        }} 
      />
    </div>
  );
}
