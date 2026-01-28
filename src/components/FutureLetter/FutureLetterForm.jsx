// src/components/FutureLetter/FutureLetterForm.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export const FutureLetterForm = ({ letterContent, questions, mode, tone, onComplete }) => {
  const { user } = useAuth();
  const [deliveryOption, setDeliveryOption] = useState('1-week');
  const [customDate, setCustomDate] = useState('');
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Calculate delivery date based on option
  const getDeliveryDate = () => {
    const now = new Date();
    
    switch (deliveryOption) {
      case '1-week':
        return new Date(now.setDate(now.getDate() + 7));
      case '1-month':
        return new Date(now.setMonth(now.getMonth() + 1));
      case '3-months':
        return new Date(now.setMonth(now.getMonth() + 3));
      case '6-months':
        return new Date(now.setMonth(now.getMonth() + 6));
      case '1-year':
        return new Date(now.setFullYear(now.getFullYear() + 1));
      case 'custom':
        return customDate ? new Date(customDate) : null;
      default:
        return new Date(now.setDate(now.getDate() + 7));
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get minimum date for custom picker (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleScheduleLetter = async () => {
    if (!user) {
      setError('Please sign in to schedule a future letter');
      return;
    }

    const deliveryDate = getDeliveryDate();
    if (!deliveryDate) {
      setError('Please select a delivery date');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Save the letter
      const { data: letter, error: letterError } = await supabase
        .from('letters')
        .insert({
          user_id: user.id,
          mode: mode,
          tone: tone,
          questions: questions,
          letter_content: letterContent,
          word_count: letterContent.split(/\s+/).length,
          is_future_letter: true,
          delivery_date: deliveryDate.toISOString(),
          delivery_status: 'scheduled'
        })
        .select()
        .single();

      if (letterError) throw letterError;

      // Create scheduled email entry
      const { error: emailError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: user.id,
          letter_id: letter.id,
          scheduled_for: deliveryDate.toISOString(),
          status: 'pending'
        });

      if (emailError) throw emailError;

      setSaved(true);
      if (onComplete) onComplete(letter);

    } catch (err) {
      console.error('Error scheduling letter:', err);
      setError(err.message || 'Failed to schedule letter. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="future-letter-success">
        <div className="success-icon">📬</div>
        <h3>Letter Scheduled!</h3>
        <p>
          Your letter to your future self will be delivered on{' '}
          <strong>{formatDate(getDeliveryDate())}</strong>
        </p>
        <p className="success-note">
          We'll send it to <strong>{user?.email}</strong>
        </p>
        <button 
          className="btn-secondary"
          onClick={() => {
            setSaved(false);
            if (onComplete) onComplete();
          }}
        >
          Write Another Letter
        </button>
      </div>
    );
  }

  return (
    <div className="future-letter-form">
      <div className="future-letter-header">
        <h3>📮 Send to Your Future Self</h3>
        <p>Schedule this letter to be delivered to your email in the future.</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="delivery-options">
        <label className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value="1-week"
            checked={deliveryOption === '1-week'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">1 Week</span>
            <span className="option-date">{formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</span>
          </span>
        </label>

        <label className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value="1-month"
            checked={deliveryOption === '1-month'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">1 Month</span>
            <span className="option-date">{formatDate(new Date(new Date().setMonth(new Date().getMonth() + 1)))}</span>
          </span>
        </label>

        <label className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value="3-months"
            checked={deliveryOption === '3-months'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">3 Months</span>
            <span className="option-date">{formatDate(new Date(new Date().setMonth(new Date().getMonth() + 3)))}</span>
          </span>
        </label>

        <label className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value="6-months"
            checked={deliveryOption === '6-months'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">6 Months</span>
            <span className="option-date">{formatDate(new Date(new Date().setMonth(new Date().getMonth() + 6)))}</span>
          </span>
        </label>

        <label className="delivery-option">
          <input
            type="radio"
            name="delivery"
            value="1-year"
            checked={deliveryOption === '1-year'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">1 Year</span>
            <span className="option-date">{formatDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}</span>
          </span>
        </label>

        <label className="delivery-option custom">
          <input
            type="radio"
            name="delivery"
            value="custom"
            checked={deliveryOption === 'custom'}
            onChange={(e) => setDeliveryOption(e.target.value)}
          />
          <span className="option-content">
            <span className="option-label">Custom Date</span>
            {deliveryOption === 'custom' && (
              <input
                type="date"
                className="custom-date-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={getMinDate()}
              />
            )}
          </span>
        </label>
      </div>

      <div className="future-letter-preview">
        <h4>Letter Preview</h4>
        <div className="preview-content">
          {letterContent.substring(0, 300)}...
        </div>
      </div>

      <div className="future-letter-actions">
        <button
          className="btn-primary"
          onClick={handleScheduleLetter}
          disabled={loading || (deliveryOption === 'custom' && !customDate)}
        >
          {loading ? 'Scheduling...' : `Schedule for ${formatDate(getDeliveryDate())}`}
        </button>
      </div>
    </div>
  );
};

export default FutureLetterForm;
