// src/components/Checkin/WeeklyCheckin.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const WeeklyCheckin = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [error, setError] = useState('');
  
  const [checkin, setCheckin] = useState({
    moodRating: 5,
    energyLevel: 5,
    wins: '',
    challenges: '',
    gratitude: '',
    focusNextWeek: ''
  });

  const [aiReflection, setAiReflection] = useState('');

  // Check if user already completed this week's check-in
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;

      const now = new Date();
      const weekNumber = getISOWeek(now);
      const year = now.getFullYear();

      const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('week_number', weekNumber)
        .single();

      if (data) {
        setAlreadyCompleted(true);
      }
    };

    checkExisting();
  }, [user]);

  // Get ISO week number
  const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const updateCheckin = (field, value) => {
    setCheckin(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Please sign in to save your check-in');
      return;
    }

    setLoading(true);
    setError('');

    const now = new Date();

    try {
      // Generate AI reflection
      setGenerating(true);
      const reflection = await generateAIReflection(checkin);
      setAiReflection(reflection);
      setGenerating(false);

      // Save to database
      const { error: saveError } = await supabase
        .from('checkins')
        .insert({
          user_id: user.id,
          mood_rating: checkin.moodRating,
          energy_level: checkin.energyLevel,
          wins: checkin.wins,
          challenges: checkin.challenges,
          gratitude: checkin.gratitude,
          focus_next_week: checkin.focusNextWeek,
          ai_reflection: reflection,
          week_number: getISOWeek(now),
          year: now.getFullYear()
        });

      if (saveError) throw saveError;

      setSubmitted(true);
      if (onComplete) onComplete();

    } catch (err) {
      console.error('Error saving check-in:', err);
      setError(err.message || 'Failed to save check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAIReflection = async (data) => {
    try {
      const response = await fetch('/.netlify/functions/generate-checkin-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to generate reflection');

      const result = await response.json();
      return result.reflection;
    } catch (err) {
      console.error('AI reflection error:', err);
      return ''; // Continue without AI reflection if it fails
    }
  };

  // Mood/Energy slider component
  const RatingSlider = ({ label, value, onChange, lowLabel, highLabel }) => (
    <div className="rating-slider">
      <label>{label}</label>
      <div className="slider-container">
        <span className="slider-label low">{lowLabel}</span>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="slider"
        />
        <span className="slider-label high">{highLabel}</span>
      </div>
      <div className="slider-value">{value}/10</div>
    </div>
  );

  if (alreadyCompleted) {
    return (
      <div className="checkin-completed">
        <div className="completed-icon">✅</div>
        <h3>Check-in Complete!</h3>
        <p>You've already completed your check-in for this week.</p>
        <p className="next-checkin">Your next check-in will be available on Sunday.</p>
        <button 
          className="btn-secondary"
          onClick={() => window.location.href = '/history'}
        >
          View Past Check-ins
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="checkin-success">
        <div className="success-icon">🎉</div>
        <h3>Week Captured!</h3>
        
        {aiReflection && (
          <div className="ai-reflection">
            <h4>Your Weekly Reflection</h4>
            <p>{aiReflection}</p>
          </div>
        )}

        <div className="checkin-summary">
          <div className="summary-item">
            <span className="label">Mood</span>
            <span className="value">{checkin.moodRating}/10</span>
          </div>
          <div className="summary-item">
            <span className="label">Energy</span>
            <span className="value">{checkin.energyLevel}/10</span>
          </div>
        </div>

        <button 
          className="btn-primary"
          onClick={() => window.location.href = '/history'}
        >
          View Your Progress
        </button>
      </div>
    );
  }

  return (
    <div className="weekly-checkin">
      <div className="checkin-header">
        <h2>Weekly Check-in</h2>
        <p>Take a few minutes to reflect on your week.</p>
        <div className="progress-dots">
          {[1, 2, 3, 4].map(s => (
            <span 
              key={s} 
              className={`dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Step 1: Mood & Energy */}
      {step === 1 && (
        <div className="checkin-step">
          <h3>How are you feeling?</h3>
          
          <RatingSlider
            label="Overall mood this week"
            value={checkin.moodRating}
            onChange={(v) => updateCheckin('moodRating', v)}
            lowLabel="😔 Low"
            highLabel="😊 Great"
          />

          <RatingSlider
            label="Energy level"
            value={checkin.energyLevel}
            onChange={(v) => updateCheckin('energyLevel', v)}
            lowLabel="🔋 Drained"
            highLabel="⚡ Energized"
          />

          <button className="btn-primary" onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Wins */}
      {step === 2 && (
        <div className="checkin-step">
          <h3>What went well this week?</h3>
          <p className="step-hint">Celebrate your wins, big or small.</p>
          
          <textarea
            value={checkin.wins}
            onChange={(e) => updateCheckin('wins', e.target.value)}
            placeholder="I finished a project I'd been putting off... Had a great conversation with... Made time for..."
            rows={5}
          />

          <div className="step-nav">
            <button className="btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="btn-primary" onClick={() => setStep(3)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Challenges & Gratitude */}
      {step === 3 && (
        <div className="checkin-step">
          <h3>What was challenging?</h3>
          <p className="step-hint">Acknowledge the hard parts without judgment.</p>
          
          <textarea
            value={checkin.challenges}
            onChange={(e) => updateCheckin('challenges', e.target.value)}
            placeholder="I struggled with... It was hard when... I felt frustrated about..."
            rows={4}
          />

          <h3>What are you grateful for?</h3>
          <p className="step-hint">Even small things count.</p>
          
          <textarea
            value={checkin.gratitude}
            onChange={(e) => updateCheckin('gratitude', e.target.value)}
            placeholder="I'm grateful for... I appreciated when... I'm thankful that..."
            rows={4}
          />

          <div className="step-nav">
            <button className="btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button className="btn-primary" onClick={() => setStep(4)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Focus for Next Week */}
      {step === 4 && (
        <div className="checkin-step">
          <h3>What's your focus for next week?</h3>
          <p className="step-hint">Set an intention, not a to-do list.</p>
          
          <textarea
            value={checkin.focusNextWeek}
            onChange={(e) => updateCheckin('focusNextWeek', e.target.value)}
            placeholder="Next week, I want to prioritize... I'm going to focus on... My intention is..."
            rows={4}
          />

          <div className="step-nav">
            <button className="btn-secondary" onClick={() => setStep(3)}>
              Back
            </button>
            <button 
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (generating ? 'Creating reflection...' : 'Saving...') : 'Complete Check-in'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyCheckin;
