import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'default' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  const sizeClasses = {
    small: 'w-10 h-10',
    default: 'w-12 h-12', 
    large: 'w-14 h-14'
  };

  const iconSizes = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-2xl'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${sizeClasses[size]} ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      data-tooltip={isDarkMode ? 'Light mode' : 'Dark mode'}
    >
      <div className="relative overflow-hidden w-full h-full flex items-center justify-center">
        {/* Sun icon */}
        <i 
          className={`fas fa-sun ${iconSizes[size]} absolute transition-all duration-300 ${
            isDarkMode 
              ? 'opacity-0 rotate-90 scale-50' 
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        
        {/* Moon icon */}
        <i 
          className={`fas fa-moon ${iconSizes[size]} absolute transition-all duration-300 ${
            isDarkMode 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
      
      {/* Background animation circle */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
          isDarkMode 
            ? 'bg-gradient-to-br from-blue-600 to-purple-700 scale-0'
            : 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-100'
        }`} 
        style={{ zIndex: -1 }}
      />
    </button>
  );
};

export default ThemeToggle;