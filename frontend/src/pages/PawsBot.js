import React, { useState } from 'react';
import { Link } from 'react-router-dom';


// Enhanced fallback AI response generator
const generateFallbackResponse = (userMessage, error) => {
  const message = userMessage.toLowerCase();
  
  // Check if it's an authentication error
  if (error.message.includes('No authentication token') || error.message.includes('401')) {
    return "🔐 I notice you're not logged in! Please log in to your PawsConnect account to chat with me. I need to verify you're a member of our pet-loving community! 😊";
  }
  
  // Check if it's a server connection error
  if (error.message.includes('fetch') || error.message.includes('500') || error.message.includes('connect')) {
    return "🔧 I'm having trouble connecting to my AI brain right now. The backend server might be taking a quick nap! Please try again in a moment, or check if you're connected to the internet. 🌐";
  }

  // Keyword-based responses for common pet questions
  if (message.includes('feed') || message.includes('food') || message.includes('eat')) {
    return `🍽️ Great question about feeding! While I'm temporarily offline, here's some general advice:\n\n• **Dogs**: Adult dogs typically eat 2-3 meals per day\n• **Cats**: Can eat 2-4 smaller meals per day\n• **Fresh water** should always be available\n• **Avoid** chocolate, onions, grapes, and xylitol\n\n⚠️ For specific dietary needs, always consult your veterinarian!`;
  }
  
  if (message.includes('bark') || message.includes('noise') || message.includes('loud')) {
    return `🐕 Barking issues are common! Here are some quick tips:\n\n• **Identify triggers** (doorbell, other dogs, etc.)\n• **Don't yell** - it can make it worse\n• **Redirect attention** with toys or training\n• **Exercise** can reduce excessive barking\n• **Positive reinforcement** when quiet\n\n🎯 Consider professional dog training for persistent issues!`;
  }
  
  if (message.includes('sick') || message.includes('ill') || message.includes('symptom') || message.includes('health')) {
    return `🏥 **IMPORTANT**: For any health concerns, please contact your veterinarian immediately!\n\nCommon signs that need vet attention:\n• Loss of appetite for 24+ hours\n• Vomiting or diarrhea\n• Lethargy or unusual behavior\n• Difficulty breathing\n• Excessive panting\n\n📞 **Emergency?** Contact your emergency vet clinic right away!`;
  }
  
  if (message.includes('train') || message.includes('behavior') || message.includes('discipline')) {
    return `🎓 Training tips while I'm offline:\n\n• **Positive reinforcement** works best\n• **Consistency** is key - everyone in the house should use same commands\n• **Short sessions** (5-10 minutes) multiple times daily\n• **Patience** - every pet learns at their own pace\n• **High-value treats** for motivation\n\n🏆 Remember: Never punish, always reward good behavior!`;
  }
  
  if (message.includes('cat') && (message.includes('litter') || message.includes('box'))) {
    return `📦 Litter box issues? Here's what to check:\n\n• **Cleanliness** - scoop daily, change weekly\n• **Location** - quiet, accessible area\n• **Type of litter** - cats can be picky\n• **Box size** - should be 1.5x cat's length\n• **Number** - one per cat, plus one extra\n\n🐱 Sudden changes in litter habits = vet visit needed!`;
  }
  
  if (message.includes('puppy') || message.includes('kitten') || message.includes('young')) {
    return `🐶🐱 Young pets are special! Quick reminders:\n\n• **Frequent meals** - 3-4x daily until 6 months\n• **Vaccinations** - follow vet schedule\n• **Socialization** - expose to new experiences safely\n• **Sleep** - puppies/kittens sleep 18-20 hours/day\n• **Teething** - provide appropriate chew toys\n\n💉 First vet visit should be within days of adoption!`;
  }
  
  // Default response for unrecognized questions
  return `🤖 I'm temporarily experiencing technical difficulties, but I don't want to leave you hanging! \n\n💡 **In the meantime:**\n• Browse our community posts for similar questions\n• Check out our pet care categories\n• Consider posting your question to get help from other pet parents\n\n🔄 Please try chatting with me again in a few minutes - I should be back online soon! Your pet's wellbeing is important to me. 🐾`;
};

const PawsBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "🐾 Hi there! I'm PawsBot, your AI assistant for pet care questions. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Try to connect to backend PawsBot API
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://localhost:5000/api/chat/pawsbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data && data.data.response) {
        const botMessage = {
          id: messages.length + 2,
          type: 'bot',
          content: data.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'API request failed');
      }
    } catch (error) {
      console.error('Error sending message to PawsBot:', error);
      
      // Enhanced fallback AI responses based on keywords
      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: generateFallbackResponse(inputMessage, error),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          🤖 PawsBot AI Assistant
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Ask me anything about pet care, health, behavior, and more!
        </p>
      </div>

      {/* Chat Container */}
      <div className="card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {messages.map(message => (
            <div key={message.id} style={{ 
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                backgroundColor: message.type === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                color: message.type === 'user' ? 'white' : 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                border: message.type === 'bot' ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  opacity: 0.7, 
                  marginTop: '0.25rem',
                  textAlign: 'right'
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                  PawsBot is thinking...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about your pet..."
            className="form-input"
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || !inputMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Quick Questions</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            "How often should I feed my cat?",
            "My dog won't stop barking",
            "What are signs of illness in pets?",
            "How to train a puppy?"
          ].map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="btn btn-outline"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/" className="btn btn-ghost">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default PawsBot;