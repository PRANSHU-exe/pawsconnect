import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="modern-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="logo-icon">🐾</span>
          <span className="logo-text">PawsConnect</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-menu desktop-menu">
          <Link 
            to="/" 
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/categories" 
            className={`nav-item ${isActive('/categories') ? 'active' : ''}`}
          >
            Categories
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/create-post" 
                className={`nav-item ${isActive('/create-post') ? 'active' : ''}`}
              >
                <span className="nav-icon">✏️</span>
                Create
              </Link>
              <Link 
                to={`/profile/${user.username}`} 
                className={`nav-item ${isActive(`/profile/${user.username}`) ? 'active' : ''}`}
              >
                <span className="nav-icon">👤</span>
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-item">
                Login
              </Link>
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <span className="theme-icon">
              {isDarkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </span>
          </button>

          {!user ? (
            <Link to="/register" className="btn-cta">
              Sign Up
            </Link>
          ) : (
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <Link 
            to="/" 
            className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="mobile-nav-icon">🏠</span>
            Home
          </Link>
          <Link 
            to="/categories" 
            className={`mobile-nav-item ${isActive('/categories') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="mobile-nav-icon">📁</span>
            Categories
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/create-post" 
                className={`mobile-nav-item ${isActive('/create-post') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="mobile-nav-icon">✏️</span>
                Create Post
              </Link>
              <Link 
                to={`/profile/${user.username}`} 
                className={`mobile-nav-item ${isActive(`/profile/${user.username}`) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="mobile-nav-icon">👤</span>
                Profile
              </Link>
            </>
          ) : (
            <Link 
              to="/login" 
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              <span className="mobile-nav-icon">🔐</span>
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={closeMobileMenu}
        />
      )}
    </nav>
  );
};

export default Navbar;