// src/components/CookieNotice/CookieNotice.jsx
import { useState, useEffect } from 'react';

const CookieNotice = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged
    const acknowledged = localStorage.getItem('bl_cookie_notice');
    if (!acknowledged) {
      // Small delay so it doesn't flash on page load
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bl_cookie_notice', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-notice">
      <div className="cookie-notice-content">
        <p>
          We use essential cookies to keep you signed in and process payments securely. 
          No tracking or advertising cookies. 
          <a href="/legal#privacy">Learn more</a>
        </p>
        <button className="cookie-accept-btn" onClick={handleAccept}>
          Got it
        </button>
      </div>
    </div>
  );
};

export default CookieNotice;
