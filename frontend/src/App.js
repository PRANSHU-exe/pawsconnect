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
import PawsBot from './pages/PawsBot';
import AuthCallback from './pages/AuthCallback';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Styles
import './App.css';
import './styles/modern.css';
import './styles/timeline.css';
import './styles/pet-avatar.css';
import './styles/cookie-consent.css';
import './styles/responsive.css';
import './styles/dark-mode.css';
import './styles/animations.css';

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
                  <Route path="/pawsbot" element={
                    <ProtectedRoute>
                      <PawsBot />
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