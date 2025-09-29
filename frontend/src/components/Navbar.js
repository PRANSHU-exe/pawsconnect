import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem 0'
        }}>
          {/* Logo */}
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--primary)'
          }}>
            🐾 PawsConnect
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" className="btn btn-ghost">Home</Link>
            <Link to="/categories" className="btn btn-ghost">Categories</Link>
            
            {user ? (
              <>
                <Link to="/create-post" className="btn btn-ghost">Create Post</Link>
                <Link to="/pawsbot" className="btn btn-ghost">🤖 PawsBot</Link>
                <Link to={`/profile/${user.username}`} className="btn btn-ghost">Profile</Link>
                <button onClick={handleLogout} className="btn btn-outline">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="btn btn-ghost"
              title="Toggle theme"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;