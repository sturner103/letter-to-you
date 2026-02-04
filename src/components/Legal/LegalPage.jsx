// src/components/Legal/LegalPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LegalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL hash, default to 'about'
  const getTabFromHash = () => {
    const hash = location.hash.replace('#', '');
    return ['about', 'contact', 'privacy', 'terms'].includes(hash) ? hash : 'about';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromHash());

  useEffect(() => {
    setActiveTab(getTabFromHash());
  }, [location.hash]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/legal#${tab}`, { replace: true });
  };

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'terms', label: 'Terms' }
  ];

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`legal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="legal-content">
          {activeTab === 'about' && <AboutContent />}
          {activeTab === 'contact' && <ContactContent />}
          {activeTab === 'privacy' && <PrivacyContent />}
          {activeTab === 'terms' && <TermsContent />}
        </div>
      </div>
    </div>
  );
};

const AboutContent = () => (
  <div className="legal-section">
    <h1>About Letter to You</h1>
    
    <h2>Meet Barry</h2>
    <p>
      Hi, I'm Barry. I built this because I kept writing letters to myself — and it actually helped.
    </p>
    <p>
      It started a few years ago during a rough patch. I'd sit down, answer some questions I'd 
      jotted down, and then write myself a letter as if I were a thoughtful friend looking in 
      from the outside. Sometimes the letter was gentle and reassuring. Sometimes it was a 
      kick up the backside. Sometimes it was just... clear, in a way my swirling thoughts weren't.
    </p>
    <p>
      I experimented with different voices. What would a wise mentor say? A straight-talking 
      best mate? A compassionate coach? Each perspective helped me see things differently. 
      The letters became something I looked forward to — not as a daily habit, but as a tool 
      I'd reach for during life's bigger moments.
    </p>
    <p>
      Eventually I thought: what if everyone could do this? What if the questions were 
      thoughtfully crafted, and the letter-writing part was handled by AI that actually 
      understood what you were going through?
    </p>
    <p>
      So I built Letter to You. And now I'm sharing it with you.
    </p>

    <h2>Why Letters?</h2>
    <p>
      There's something different about a letter. It's not a chat that scrolls away. It's not 
      advice from a stranger. It's your own thoughts, organised and reflected back with care. 
      You can read it today, tuck it away, and read it again in six months when you need it.
    </p>
    <p>
      The best part? It's built from your words. You do the reflecting. The letter just helps 
      you hear yourself more clearly.
    </p>

    <h2>The Philosophy</h2>
    <p>
      <strong>Letters, not chats.</strong> Chats disappear. Letters stick around. They have weight.
    </p>
    <p>
      <strong>Moments, not habits.</strong> This isn't another app trying to own your morning 
      routine. It's here when you need it — during transitions, crossroads, or those 
      Tuesday afternoons when something just feels off.
    </p>
    <p>
      <strong>Your words, reflected back.</strong> No generic advice. No platitudes. Just you, 
      talking to yourself, with a little help organising the conversation.
    </p>

    <h2>Based in New Zealand</h2>
    <p>
      Letter to You is built in Aotearoa, New Zealand. If you ever want to say hi, 
      I'd genuinely love to hear from you.
    </p>
    <p>
      — Barry
    </p>
  </div>
);

const ContactContent = () => (
  <div className="legal-section">
    <h1>Get in Touch</h1>
    <p>
      I'm a real person and I read every email. Seriously.
    </p>
    
    <h2>Say Hello</h2>
    <p>
      Got a question? Want to share how a letter helped you? Just want to chat about 
      self-reflection tools? I'd love to hear from you.
    </p>
    <p>
      Email: <a href="mailto:barry@barryletter.com">barry@barryletter.com</a>
    </p>
    
    <h2>Need Help?</h2>
    <p>
      Something not working? Payment issue? Can't find a letter? Let me know and I'll 
      sort it out.
    </p>
    <p>
      Email: <a href="mailto:support@barryletter.com">support@barryletter.com</a>
    </p>
    <p>I aim to respond within 24 hours, usually faster.</p>
    
    <h2>Ideas & Feedback</h2>
    <p>
      This is a living project. If you've got ideas for new reflection types, features 
      you'd love to see, or feedback on your experience — I'm all ears. Some of the best 
      improvements have come from users like you.
    </p>
    
    <h2>Where I'm Based</h2>
    <p>
      Christchurch, New Zealand. Beautiful place. Good coffee. Occasionally earthquakes. 
      If you're ever in town, the kettle's on.
    </p>
  </div>
);

const PrivacyContent = () => (
  <div className="legal-section">
    <h1>Privacy Policy</h1>
    <p className="legal-date">Last updated: February 2025</p>
    
    <p>
      Letter to You ("we", "us", "our") is committed to protecting your privacy. This policy 
      explains how we collect, use, and protect your personal information.
    </p>

    <h2>Information We Collect</h2>
    <p><strong>Account Information:</strong> When you create an account, we collect your email 
    address and, if you sign in with Google, your name and profile information provided by Google.</p>
    <p><strong>Reflection Responses:</strong> When you complete a guided reflection, we collect 
    the answers you provide to our interview questions. This content is personal and we treat 
    it with the highest level of care.</p>
    <p><strong>Generated Letters:</strong> We store the letters generated from your reflections 
    so you can access them in your account.</p>
    <p><strong>Payment Information:</strong> Payments are processed by Stripe. We do not store 
    your credit card details. Stripe's privacy policy governs their handling of payment data.</p>
    <p><strong>Technical Data:</strong> We collect standard technical information including 
    IP address, browser type, and device information to ensure our service functions properly.</p>

    <h2>How We Use Your Information</h2>
    <p>We use your information to:</p>
    <p>• Provide and improve our letter generation service</p>
    <p>• Store and display your saved letters</p>
    <p>• Process payments</p>
    <p>• Communicate with you about your account</p>
    <p>• Detect and prevent fraud or abuse</p>

    <h2>AI Processing</h2>
    <p>Your reflection responses are processed by AI (Claude, developed by Anthropic) to 
    generate your personalised letters. Your data is sent to Anthropic's API for processing. 
    Anthropic does not use your data to train their models. See Anthropic's privacy policy 
    for more details on their data handling practices.</p>

    <h2>Data Storage & Security</h2>
    <p>Your data is stored securely using Supabase (database) and Netlify (hosting). We use 
    industry-standard encryption for data in transit (HTTPS) and at rest. Access to your 
    personal data is restricted to essential personnel only.</p>

    <h2>Cookies</h2>
    <p>We use essential cookies for:</p>
    <p>• Authentication (keeping you logged in)</p>
    <p>• Session management during payment processing</p>
    <p>We do not use advertising or tracking cookies.</p>

    <h2>Data Retention</h2>
    <p>We retain your account information and saved letters for as long as your account is 
    active. You can delete your account and all associated data at any time by contacting us.</p>

    <h2>Your Rights</h2>
    <p>You have the right to:</p>
    <p>• Access your personal data</p>
    <p>• Correct inaccurate data</p>
    <p>• Delete your account and data</p>
    <p>• Export your letters</p>
    <p>To exercise these rights, contact us at <a href="mailto:privacy@barryletter.com">privacy@barryletter.com</a>.</p>

    <h2>Children's Privacy</h2>
    <p>Letter to You is not intended for users under 16 years of age. We do not knowingly 
    collect information from children under 16.</p>

    <h2>International Users</h2>
    <p>Our service is operated from New Zealand. If you are accessing from outside New Zealand, 
    your information will be transferred to and processed in New Zealand and other countries 
    where our service providers operate.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update this policy from time to time. We will notify you of significant changes 
    by email or through our service.</p>

    <h2>Contact</h2>
    <p>For privacy-related enquiries: <a href="mailto:privacy@barryletter.com">privacy@barryletter.com</a></p>
  </div>
);

const TermsContent = () => (
  <div className="legal-section">
    <h1>Terms of Service</h1>
    <p className="legal-date">Last updated: February 2025</p>
    
    <p>
      By using Letter to You ("the Service"), you agree to these Terms of Service. Please 
      read them carefully.
    </p>

    <h2>1. The Service</h2>
    <p>Letter to You provides guided self-reflection interviews and AI-generated personalised 
    letters. The Service is designed as a tool for self-exploration and is not a substitute 
    for professional mental health care, therapy, or medical advice.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 16 years old to use this Service. By using the Service, you 
    represent that you meet this age requirement.</p>

    <h2>3. Your Account</h2>
    <p>You are responsible for maintaining the security of your account credentials. You are 
    responsible for all activity that occurs under your account. Notify us immediately if 
    you suspect unauthorised access.</p>

    <h2>4. Payments & Refunds</h2>
    <p>Letter purchases are priced in New Zealand Dollars (NZD). Payment is required before 
    accessing paid reflection modes. Due to the immediate delivery of digital content (your 
    generated letter), refunds are generally not provided once a letter has been generated. 
    If you experience technical issues that prevent letter delivery, contact us for assistance.</p>

    <h2>5. Your Content</h2>
    <p>You retain ownership of the responses you provide during reflections and the letters 
    generated from them. By using the Service, you grant us permission to process your 
    content to provide the Service, including sending it to our AI provider for letter 
    generation. We do not use your content for any other purpose, including marketing or 
    training AI models.</p>

    <h2>6. Acceptable Use</h2>
    <p>You agree not to:</p>
    <p>• Use the Service to generate harmful, illegal, or abusive content</p>
    <p>• Attempt to manipulate the AI to produce inappropriate content</p>
    <p>• Share account credentials with others</p>
    <p>• Resell or redistribute generated letters commercially</p>
    <p>• Attempt to reverse-engineer or abuse the Service</p>

    <h2>7. Safety & Crisis Content</h2>
    <p>If your responses indicate you may be in crisis or at risk of harm, our system may 
    redirect you to crisis support resources. The Service is not equipped to provide emergency 
    support. If you are in immediate danger, please contact emergency services in your country.</p>

    <h2>8. AI-Generated Content</h2>
    <p>Letters are generated by AI and may occasionally contain errors, inconsistencies, or 
    content that doesn't fully reflect your intent. The letters are meant as a reflective 
    tool, not as factual statements or professional advice. We do not guarantee the accuracy 
    or suitability of AI-generated content.</p>

    <h2>9. Intellectual Property</h2>
    <p>The Service, including its design, branding, and underlying technology, is owned by 
    us. You may not copy, modify, or distribute any part of the Service without permission.</p>

    <h2>10. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, Letter to You and its operators shall not be 
    liable for any indirect, incidental, special, or consequential damages arising from your 
    use of the Service. Our total liability shall not exceed the amount you paid for the 
    Service in the 12 months preceding the claim.</p>

    <h2>11. Disclaimer of Warranties</h2>
    <p>The Service is provided "as is" without warranties of any kind, either express or 
    implied. We do not warrant that the Service will be uninterrupted, error-free, or 
    suitable for any particular purpose.</p>

    <h2>12. Changes to Terms</h2>
    <p>We may update these Terms from time to time. Continued use of the Service after 
    changes constitutes acceptance of the new Terms. We will notify users of significant 
    changes.</p>

    <h2>13. Termination</h2>
    <p>We may suspend or terminate your account if you violate these Terms. You may close 
    your account at any time by contacting us.</p>

    <h2>14. Governing Law</h2>
    <p>These Terms are governed by the laws of New Zealand. Any disputes shall be resolved 
    in the courts of New Zealand.</p>

    <h2>15. Contact</h2>
    <p>Questions about these Terms? Contact us at <a href="mailto:legal@barryletter.com">legal@barryletter.com</a></p>
  </div>
);

export default LegalPage;
