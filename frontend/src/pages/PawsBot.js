import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/pawsbot-chat.css';

const PawsBot = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botpressLoading, setBotpressLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Predefined questions for quick access
  const quickQuestions = [
    {
      icon: '🍽️',
      title: 'Pet Nutrition & Feeding',
      question: 'What is the best diet for my dog? How often should I feed them?'
    },
    {
      icon: '🏥',
      title: 'Health & Wellness',
      question: 'What are the common signs of illness in pets that I should watch for?'
    },
    {
      icon: '🎓',
      title: 'Training & Behavior',
      question: 'How can I train my puppy to stop biting and follow basic commands?'
    },
    {
      icon: '🐕',
      title: 'Dog Care Tips',
      question: 'What are the essential grooming needs for dogs?'
    },
    {
      icon: '🐱',
      title: 'Cat Care Tips',
      question: 'Why is my cat not using the litter box and how can I fix it?'
    },
    {
      icon: '💉',
      title: 'Vaccinations & Vet Visits',
      question: 'What vaccinations does my pet need and how often should I visit the vet?'
    }
  ];

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login', { state: { from: '/pawsbot', message: 'Please log in to use PawsBot' } });
      return;
    }

    // Initial welcome message
    setMessages([{
      id: Date.now(),
      type: 'bot',
      content: `Hi ${user.username}! 👋 I'm PawsBot, your AI pet care assistant. Ask me anything about your furry friends!`,
      timestamp: new Date()
    }]);

    // Check if Botpress is already loaded
    if (window.botpress) {
      console.log('Botpress already loaded');
      return;
    }

    // Load Botpress v3.3 webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Botpress v3.3 script loaded');
      
      // Wait for botpress to be available
      const initBot = () => {
        if (window.botpress && window.botpress.init) {
          console.log('Initializing Botpress...');
          
          // Initialize Botpress with your configuration
          window.botpress.init({
            "botId": "a3eb89a4-cd2e-4e91-b65c-e6fe34dffe9b",
            "configuration": {
              "version": "v2",
              "composerPlaceholder": "Ask about your furry friends",
              "botName": "Pawsbot",
              "website": {},
              "email": {},
              "phone": {},
              "termsOfService": {},
              "privacyPolicy": {},
              "color": "#8B5CF6",
              "variant": "solid",
              "headerVariant": "glass",
              "themeMode": isDarkMode ? "dark" : "light",
              "fontFamily": "inter",
              "radius": 4,
              "feedbackEnabled": false,
              "footer": "",
              "soundEnabled": false,
              "embeddedChatId": "bp-embedded-webchat"
            },
            "clientId": "f540c4a7-c98e-44f5-bc83-752633f03bbf",
            "selector": "#webchat"
          });
          
          console.log('Botpress initialized successfully!');
          
          // Auto-open the chat when ready
          window.botpress.on("webchat:ready", () => {
            console.log('Botpress webchat ready!');
            setBotpressLoading(false);
            window.botpress.open();
          });
          
        } else {
          console.log('Waiting for window.botpress...');
          setTimeout(initBot, 100);
        }
      };
      
      setTimeout(initBot, 100);
    };

    script.onerror = () => {
      console.error('Failed to load Botpress script');
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="botpress"]');
      scripts.forEach(s => {
        if (document.body.contains(s)) {
          document.body.removeChild(s);
        }
      });
    };
  }, [user, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle quick question click
  const handleQuickQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  // Send message to Botpress
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to Botpress v3.3
      if (window.botpress && window.botpress.sendEvent) {
        console.log('Sending message to Botpress:', currentMessage);
        
        // Send the message using v3.3 API
        window.botpress.sendEvent({
          type: 'text',
          payload: { text: currentMessage }
        });

        // Show a response that the message was sent
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: 'I received your question! You can see my response in the chat widget below. 💬',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
        }, 500);
        
      } else {
        // Botpress not available yet
        console.warn('Botpress not available');
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'The chat widget is loading... Please wait a moment and try again, or use the widget below when it appears! 🤖',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Please use the Botpress chat widget below to chat with me!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="pawsbot-page">
      {/* Header */}
      <div className="pawsbot-header" style={{
        padding: '2rem 1.5rem',
        textAlign: 'center',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          🐾 PawsBot AI Assistant
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Your AI-powered pet care assistant - Ask me anything!
        </p>
      </div>

      {/* Quick Question Cards */}
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          💬 Try asking about:
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {quickQuestions.map((item, index) => (
            <div
              key={index}
              className="card"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid var(--border-color)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {item.question}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Botpress Widget Container - Full Width Embedded */}
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          💬 Chat with PawsBot
        </h2>
        {botpressLoading && (
          <div style={{
            width: '100%',
            height: '600px',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--card-bg)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>Loading PawsBot...</p>
            </div>
          </div>
        )}
        <div id="webchat" style={{ 
          width: '100%', 
          height: '600px',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          display: botpressLoading ? 'none' : 'block'
        }}></div>
      </div>
    </div>
  );
};

export default PawsBot;
