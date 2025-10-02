import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Categories from './pages/Categories';
import CategoryPosts from './pages/CategoryPosts';
import CategoryTimeline from './pages/CategoryTimeline';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import AuthCallback from './pages/AuthCallback';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import './App.css';
import './styles/enhanced-theme.css';
import './styles/responsive-enhanced.css';
import './styles/modern.css';
import './styles/timeline.css';
import './styles/pet-avatar.css';
import './styles/cookie-consent.css';
import './styles/responsive.css';
import './styles/dark-mode.css';
import './styles/animations.css';
import './styles/modern-responsive.css';
import './styles/botpress-custom.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    // Hide loading screen when React loads
    document.body.classList.add('loaded');
    
    // Load Botpress webchat bubble with proper sequencing
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.botpress.cloud/webchat/v3.3/inject.js';
    script1.async = true;
    
    script1.onload = () => {
      console.log('✅ Botpress inject loaded');
      
      // Only load config after inject is ready
      const script2 = document.createElement('script');
      script2.src = 'https://files.bpcontent.cloud/2025/10/01/08/20251001082958-80TU2NR9.js';
      
      script2.onload = () => {
        console.log('✅ Botpress config loaded');
        
        // Wait for Botpress to fully initialize
        setTimeout(() => {
          // Make Botpress globally accessible for the card click
          window.openBotpressChat = () => {
            console.log('🤖 Opening PawsBot chat...');
            
            // Look for Botpress iframe or container
            const iframe = document.querySelector('iframe[src*="botpress"]') || 
                          document.querySelector('iframe[id*="webchat"]') ||
                          document.querySelector('#bp-web-widget iframe');
            
            console.log('Botpress iframe:', iframe);
            
            // Look for any Botpress-related elements
            const bpContainer = document.querySelector('#bp-web-widget-container') ||
                               document.querySelector('[id*="botpress"]') ||
                               document.querySelector('[class*="botpress"]');
            
            console.log('Botpress container:', bpContainer);
            
            // Try to find button in shadow DOM or iframe
            if (bpContainer) {
              const shadowRoot = bpContainer.shadowRoot;
              if (shadowRoot) {
                const shadowButton = shadowRoot.querySelector('button');
                if (shadowButton) {
                  shadowButton.click();
                  console.log('✅ Clicked button in shadow DOM');
                  return;
                }
              }
              
              // Try clicking the container itself
              bpContainer.click();
              console.log('✅ Clicked Botpress container');
              return;
            }
            
            // Try clicking the iframe
            if (iframe) {
              iframe.click();
              console.log('✅ Clicked Botpress iframe');
              return;
            }
            
            // Last resort: use window.botpress API
            console.log('Trying window.botpress:', window.botpress);
            if (window.botpress && window.botpress.sendEvent) {
              window.botpress.sendEvent({ type: 'show' });
              console.log('✅ Opened via window.botpress');
            } else {
              console.error('❌ Could not find any way to open Botpress');
              console.log('Available window properties:', Object.keys(window).filter(k => k.toLowerCase().includes('bot')));
            }
          };
          
          console.log('✅ PawsBot ready to chat!');
        }, 2000);
      };
      
      script2.onerror = () => {
        console.error('❌ Failed to load Botpress config');
      };
      
      document.body.appendChild(script2);
    };
    
    script1.onerror = () => {
      console.error('❌ Failed to load Botpress inject');
    };
    
    document.body.appendChild(script1);
    
    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll('script[src*="botpress"]');
      scripts.forEach(script => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
      delete window.openBotpressChat;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/category/:categoryId" element={<CategoryPosts />} />
                  <Route path="/timeline/:category" element={<CategoryTimeline />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected routes */}
                  <Route path="/create-post" element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  } />
                  
                  {/* Redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#FFFFFF',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#FFFFFF',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;