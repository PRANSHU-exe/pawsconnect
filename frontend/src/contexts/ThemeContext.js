import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userPreference, setUserPreference] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      setIsDarkMode(prefersDark);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Apply theme to document with smooth transition
    document.documentElement.style.transition = 'background-color 300ms ease, color 300ms ease';
    
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Enhanced theme object with all design tokens
  const theme = {
    colors: {
      primary: isDarkMode ? '#3B82F6' : '#2563EB',
      primaryHover: isDarkMode ? '#2563EB' : '#1D4ED8',
      secondary: isDarkMode ? '#6B7280' : '#4B5563',
      accent: isDarkMode ? '#F59E0B' : '#D97706',
      success: isDarkMode ? '#10B981' : '#059669',
      warning: isDarkMode ? '#F59E0B' : '#D97706',
      error: isDarkMode ? '#EF4444' : '#DC2626',
      
      background: isDarkMode ? '#0F172A' : '#FFFFFF',
      backgroundSecondary: isDarkMode ? '#1E293B' : '#F8FAFC',
      backgroundTertiary: isDarkMode ? '#334155' : '#E2E8F0',
      
      cardBackground: isDarkMode ? '#1E293B' : '#FFFFFF',
      cardBorder: isDarkMode ? '#334155' : '#E2E8F0',
      
      textPrimary: isDarkMode ? '#F1F5F9' : '#1E293B',
      textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
      textMuted: isDarkMode ? '#64748B' : '#94A3B8',
      
      chatUserBubble: isDarkMode ? '#3B82F6' : '#2563EB',
      chatBotBubble: isDarkMode ? '#374151' : '#F3F4F6',
    },
    
    shadows: {
      sm: isDarkMode ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    
    transitions: {
      fast: '150ms ease',
      normal: '300ms ease',
      slow: '500ms ease'
    }
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};