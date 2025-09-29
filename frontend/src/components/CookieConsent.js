import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookie, faCheck, faTimes, faCog, faShield, faEye, faHeart } from '@fortawesome/free-solid-svg-icons';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    personalization: true
  });

  // Check if consent has been given
  useEffect(() => {
    const consent = Cookies.get('pawsconnect-cookie-consent');
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const savedPrefs = JSON.parse(consent);
        setPreferences(savedPrefs);
        initializeTracking(savedPrefs);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
  }, []);

  // Initialize tracking based on preferences
  const initializeTracking = (prefs) => {
    // Essential cookies (always enabled)
    // These are necessary for basic functionality

    // Analytics
    if (prefs.analytics) {
      // Initialize analytics (Google Analytics, etc.)
      console.log('Analytics initialized');
      // Example: gtag('config', 'GA_MEASUREMENT_ID');
    }

    // Marketing
    if (prefs.marketing) {
      // Initialize marketing cookies (Facebook Pixel, etc.)
      console.log('Marketing cookies initialized');
    }

    // Personalization
    if (prefs.personalization) {
      // Save user preferences for personalized experience
      console.log('Personalization enabled');
      // Example: Save theme preference, language, etc.
      saveUserPreferences();
    }
  };

  // Save user preferences to localStorage
  const saveUserPreferences = () => {
    const userPrefs = {
      theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
      language: 'en',
      notifications: true,
      autoplay: false,
      reducedMotion: false
    };
    
    localStorage.setItem('pawsconnect-user-prefs', JSON.stringify(userPrefs));
  };

  // Handle accept all cookies
  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      personalization: true,
      timestamp: new Date().toISOString()
    };

    Cookies.set('pawsconnect-cookie-consent', JSON.stringify(allAccepted), { 
      expires: 365, // 1 year
      secure: true,
      sameSite: 'strict'
    });

    setPreferences(allAccepted);
    initializeTracking(allAccepted);
    setIsVisible(false);

    // Show success message
    showConsentMessage('All cookies accepted! Your experience will be fully personalized.');
  };

  // Handle reject non-essential cookies
  const handleRejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      timestamp: new Date().toISOString()
    };

    Cookies.set('pawsconnect-cookie-consent', JSON.stringify(essentialOnly), { 
      expires: 365,
      secure: true,
      sameSite: 'strict'
    });

    setPreferences(essentialOnly);
    initializeTracking(essentialOnly);
    setIsVisible(false);

    showConsentMessage('Only essential cookies will be used.');
  };

  // Handle custom preferences
  const handleSavePreferences = () => {
    const customPrefs = {
      ...preferences,
      timestamp: new Date().toISOString()
    };

    Cookies.set('pawsconnect-cookie-consent', JSON.stringify(customPrefs), { 
      expires: 365,
      secure: true,
      sameSite: 'strict'
    });

    initializeTracking(customPrefs);
    setIsVisible(false);
    setShowDetails(false);

    showConsentMessage('Your cookie preferences have been saved!');
  };

  // Show consent message
  const showConsentMessage = (message) => {
    // Create temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'cookie-toast';
    toast.innerHTML = `
      <div class="cookie-toast-content">
        <div class="cookie-toast-icon">🍪</div>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  // Handle preference change
  const handlePreferenceChange = (type) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Reset cookies (for testing)
  const resetCookies = () => {
    Cookies.remove('pawsconnect-cookie-consent');
    localStorage.removeItem('pawsconnect-user-prefs');
    setIsVisible(true);
    setShowDetails(false);
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      personalization: true
    });
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      <div className="cookie-consent-overlay" />
      <div className="cookie-consent-banner">
        <div className="cookie-content">
          {!showDetails ? (
            // Main consent banner
            <div className="cookie-main">
              <div className="cookie-header">
                <div className="cookie-icon">
                  <FontAwesomeIcon icon={faCookie} />
                </div>
                <h3>We Care About Your Privacy! 🐾</h3>
              </div>
              
              <div className="cookie-body">
                <p>
                  At PawsConnect, we use cookies to make your experience pawsome! 
                  Essential cookies keep things working, while others help us understand 
                  how you use our platform to make it even better for pet lovers like you.
                </p>
                
                <div className="cookie-features">
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faShield} />
                    <span>Secure & Private</span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faHeart} />
                    <span>Better Pet Care Tips</span>
                  </div>
                  <div className="feature-item">
                    <FontAwesomeIcon icon={faEye} />
                    <span>Personalized Content</span>
                  </div>
                </div>
              </div>

              <div className="cookie-actions">
                <button 
                  className="btn-accept-all"
                  onClick={handleAcceptAll}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Accept All Cookies
                </button>
                
                <button 
                  className="btn-essential-only"
                  onClick={handleRejectNonEssential}
                >
                  <FontAwesomeIcon icon={faShield} />
                  Essential Only
                </button>
                
                <button 
                  className="btn-customize"
                  onClick={() => setShowDetails(true)}
                >
                  <FontAwesomeIcon icon={faCog} />
                  Customize
                </button>
              </div>
            </div>
          ) : (
            // Detailed preferences
            <div className="cookie-details">
              <div className="cookie-header">
                <div className="cookie-icon">
                  <FontAwesomeIcon icon={faCog} />
                </div>
                <h3>Cookie Preferences</h3>
                <button 
                  className="close-details"
                  onClick={() => setShowDetails(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="cookie-body">
                <p className="details-intro">
                  Choose which types of cookies you're comfortable with. 
                  You can change these settings anytime in your account preferences.
                </p>

                <div className="preference-groups">
                  {/* Essential Cookies */}
                  <div className="preference-group">
                    <div className="preference-header">
                      <div className="preference-info">
                        <h4>
                          <FontAwesomeIcon icon={faShield} />
                          Essential Cookies
                        </h4>
                        <p>Required for basic functionality like login and security.</p>
                      </div>
                      <div className="preference-toggle">
                        <input 
                          type="checkbox" 
                          id="essential" 
                          checked={preferences.essential}
                          disabled={true}
                        />
                        <label htmlFor="essential" className="toggle-label disabled">
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="always-on">Always On</span>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="preference-group">
                    <div className="preference-header">
                      <div className="preference-info">
                        <h4>
                          <FontAwesomeIcon icon={faEye} />
                          Analytics Cookies
                        </h4>
                        <p>Help us understand how you use PawsConnect to improve our service.</p>
                      </div>
                      <div className="preference-toggle">
                        <input 
                          type="checkbox" 
                          id="analytics" 
                          checked={preferences.analytics}
                          onChange={() => handlePreferenceChange('analytics')}
                        />
                        <label htmlFor="analytics" className="toggle-label">
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="preference-group">
                    <div className="preference-header">
                      <div className="preference-info">
                        <h4>
                          <FontAwesomeIcon icon={faHeart} />
                          Marketing Cookies
                        </h4>
                        <p>Used to show you relevant ads and measure campaign effectiveness.</p>
                      </div>
                      <div className="preference-toggle">
                        <input 
                          type="checkbox" 
                          id="marketing" 
                          checked={preferences.marketing}
                          onChange={() => handlePreferenceChange('marketing')}
                        />
                        <label htmlFor="marketing" className="toggle-label">
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Personalization Cookies */}
                  <div className="preference-group">
                    <div className="preference-header">
                      <div className="preference-info">
                        <h4>
                          <FontAwesomeIcon icon={faCookie} />
                          Personalization Cookies
                        </h4>
                        <p>Remember your preferences for a customized experience.</p>
                      </div>
                      <div className="preference-toggle">
                        <input 
                          type="checkbox" 
                          id="personalization" 
                          checked={preferences.personalization}
                          onChange={() => handlePreferenceChange('personalization')}
                        />
                        <label htmlFor="personalization" className="toggle-label">
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cookie-actions">
                <button 
                  className="btn-save-prefs"
                  onClick={handleSavePreferences}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Save Preferences
                </button>
                
                <button 
                  className="btn-accept-all"
                  onClick={handleAcceptAll}
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="cookie-footer">
          <p>
            By using PawsConnect, you agree to our{' '}
            <a href="/privacy" className="privacy-link">Privacy Policy</a>{' '}
            and{' '}
            <a href="/terms" className="privacy-link">Terms of Service</a>.
            {process.env.NODE_ENV === 'development' && (
              <button className="reset-cookies" onClick={resetCookies}>
                Reset Cookies (Dev)
              </button>
            )}
          </p>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;