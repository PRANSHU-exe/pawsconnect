import React from 'react';

const Icon = ({
  name,
  size = 'md',
  className = '',
  color,
  animate = false,
  onClick,
  style = {},
  ...props
}) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };

  const animations = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping',
    heartbeat: 'animate-heartbeat',
    wiggle: 'animate-wiggle'
  };

  const baseClasses = `fas fa-${name} ${sizes[size]}`;
  const animationClass = animate && animations[animate] ? animations[animate] : '';
  const colorStyle = color ? { color } : {};
  const combinedStyle = { ...colorStyle, ...style };
  
  const classes = `${baseClasses} ${animationClass} ${className} ${
    onClick ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''
  }`.trim();

  return (
    <i
      className={classes}
      onClick={onClick}
      style={combinedStyle}
      {...props}
    />
  );
};

// Specialized icon components for common use cases
export const LikeIcon = ({ liked, count, onToggle, className = '' }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-2 post-action-btn ${liked ? 'liked' : ''} ${className}`}
  >
    <Icon
      name={liked ? 'heart' : 'heart'}
      className={`transition-colors duration-200 ${
        liked ? 'text-red-500' : 'text-gray-500'
      }`}
      animate={liked ? 'heartbeat' : false}
    />
    {count && <span className="text-sm">{count}</span>}
  </button>
);

export const CommentIcon = ({ count, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 post-action-btn ${className}`}
  >
    <Icon name="comment" className="hover:text-blue-500" />
    {count && <span className="text-sm">{count}</span>}
  </button>
);

export const ShareIcon = ({ onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`post-action-btn ${className}`}
  >
    <Icon name="share" className="hover:text-green-500" />
  </button>
);

export const SaveIcon = ({ saved, onToggle, className = '' }) => (
  <button
    onClick={onToggle}
    className={`post-action-btn ${saved ? 'active' : ''} ${className}`}
  >
    <Icon
      name={saved ? 'bookmark' : 'bookmark'}
      className={`transition-colors duration-200 ${
        saved ? 'text-yellow-500' : 'text-gray-500'
      }`}
    />
  </button>
);

export const MoreIcon = ({ onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`post-action-btn ${className}`}
  >
    <Icon name="ellipsis-h" className="hover:text-gray-700" />
  </button>
);

export const NotificationIcon = ({ count, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`relative ${className}`}
  >
    <Icon name="bell" className="hover:text-primary-500" />
    {count > 0 && (
      <span className="badge">
        {count > 99 ? '99+' : count}
      </span>
    )}
  </button>
);

export const MessageIcon = ({ unread, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`relative ${className}`}
  >
    <Icon name="envelope" className="hover:text-primary-500" />
    {unread && (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
    )}
  </button>
);

export const SearchIcon = ({ onClick, className = '' }) => (
  <Icon
    name="search"
    onClick={onClick}
    className={`hover:text-primary-500 cursor-pointer ${className}`}
  />
);

export const FilterIcon = ({ active, onClick, className = '' }) => (
  <Icon
    name="filter"
    onClick={onClick}
    className={`cursor-pointer transition-colors duration-200 ${
      active ? 'text-primary-500' : 'hover:text-primary-500'
    } ${className}`}
  />
);

export const SortIcon = ({ direction, onClick, className = '' }) => (
  <Icon
    name={direction === 'asc' ? 'sort-up' : direction === 'desc' ? 'sort-down' : 'sort'}
    onClick={onClick}
    className={`cursor-pointer hover:text-primary-500 ${className}`}
  />
);

export const MenuIcon = ({ isOpen, onClick, className = '' }) => (
  <Icon
    name={isOpen ? 'times' : 'bars'}
    onClick={onClick}
    className={`cursor-pointer hover:text-primary-500 transition-transform duration-200 ${
      isOpen ? 'rotate-90' : ''
    } ${className}`}
  />
);

export const ChevronIcon = ({ direction = 'right', onClick, className = '' }) => {
  const directions = {
    up: 'chevron-up',
    down: 'chevron-down',
    left: 'chevron-left',
    right: 'chevron-right'
  };
  
  return (
    <Icon
      name={directions[direction]}
      onClick={onClick}
      className={`cursor-pointer hover:text-primary-500 ${className}`}
    />
  );
};

export const LoadingIcon = ({ className = '' }) => (
  <Icon
    name="spinner"
    animate="spin"
    className={`text-primary-500 ${className}`}
  />
);

export const CheckIcon = ({ className = '' }) => (
  <Icon
    name="check"
    className={`text-green-500 ${className}`}
  />
);

export const ErrorIcon = ({ className = '' }) => (
  <Icon
    name="exclamation-triangle"
    className={`text-red-500 ${className}`}
  />
);

export const InfoIcon = ({ className = '' }) => (
  <Icon
    name="info-circle"
    className={`text-blue-500 ${className}`}
  />
);

export const WarningIcon = ({ className = '' }) => (
  <Icon
    name="exclamation-circle"
    className={`text-yellow-500 ${className}`}
  />
);

export default Icon;