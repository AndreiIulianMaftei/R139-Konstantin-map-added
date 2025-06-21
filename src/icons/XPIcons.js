// XP-Style Icons Implementation
// src/icons/XPIcons.js

import React from 'react';

// Base XP Icon component with classic styling
const XPIcon = ({ children, size = 16, className = '', style = {} }) => (
  <span 
    className={`xp-icon ${className}`}
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      fontSize: size,
      lineHeight: 1,
      ...style
    }}
  >
    {children}
  </span>
);

// Chat/Communication Icons
export const ChatIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    💬
  </XPIcon>
);

export const MessageIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    📧
  </XPIcon>
);

export const PhoneIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    📞
  </XPIcon>
);

// Map and Navigation Icons
export const MapIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🗺️
  </XPIcon>
);

export const CompassIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🧭
  </XPIcon>
);

export const LocationIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    📍
  </XPIcon>
);

export const RouteIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🛣️
  </XPIcon>
);

// Building and Places Icons
export const EmbassyIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🏛️
  </XPIcon>
);

export const BuildingIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🏢
  </XPIcon>
);

export const HospitalIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🏥
  </XPIcon>
);

export const SchoolIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🏫
  </XPIcon>
);

// Security and Warning Icons
export const WarningIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⚠️
  </XPIcon>
);

export const ShieldIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🛡️
  </XPIcon>
);

export const LockIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🔒
  </XPIcon>
);

export const AlertIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🚨
  </XPIcon>
);

// File and Document Icons
export const DocumentIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    📄
  </XPIcon>
);

export const FolderIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    📁
  </XPIcon>
);

export const SaveIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    💾
  </XPIcon>
);

export const PrintIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🖨️
  </XPIcon>
);

// System and Tool Icons
export const SettingsIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⚙️
  </XPIcon>
);

export const ToolsIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🔧
  </XPIcon>
);

export const SearchIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🔍
  </XPIcon>
);

export const RefreshIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ↻
  </XPIcon>
);

// Navigation and Control Icons
export const PlayIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ▶️
  </XPIcon>
);

export const PauseIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⏸️
  </XPIcon>
);

export const StopIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⏹️
  </XPIcon>
);

export const NextIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⏭️
  </XPIcon>
);

export const PrevIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ⏮️
  </XPIcon>
);

// Status and Information Icons
export const InfoIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ℹ️
  </XPIcon>
);

export const SuccessIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ✅
  </XPIcon>
);

export const ErrorIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ❌
  </XPIcon>
);

export const QuestionIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ❓
  </XPIcon>
);

// Weather and Environment Icons
export const SunIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ☀️
  </XPIcon>
);

export const CloudIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ☁️
  </XPIcon>
);

export const RainIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    🌧️
  </XPIcon>
);

export const SnowIcon = ({ size, className }) => (
  <XPIcon size={size} className={className}>
    ❄️
  </XPIcon>
);

// Custom SVG Icons with XP styling
export const LayersIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <polygon points="12,2 22,8.5 12,15 2,8.5" />
    <polyline points="2,17.5 12,24 22,17.5" />
    <polyline points="2,12 12,18.5 22,12" />
  </svg>
);

export const MagnifyingGlassIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export const MapPinIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const PlusIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const CloseIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const ArrowPathIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className={`xp-svg-icon ${className}`}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);

// Icon Factory for creating themed icons
export const createXPIcon = (content, options = {}) => {
  const { 
    backgroundColor = 'transparent',
    border = 'none',
    borderRadius = '2px',
    padding = '2px'
  } = options;

  return ({ size = 16, className = '' }) => (
    <span 
      className={`xp-custom-icon ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        backgroundColor,
        border,
        borderRadius,
        padding,
        fontSize: Math.floor(size * 0.7)
      }}
    >
      {content}
    </span>
  );
};

// Pre-made themed icons
export const XPFileIcon = createXPIcon('📄', {
  backgroundColor: '#ffffff',
  border: '1px solid #808080',
  borderRadius: '2px'
});

export const XPFolderIcon = createXPIcon('📁', {
  backgroundColor: '#ffffcc',
  border: '1px solid #cccc99',
  borderRadius: '2px'
});

export const XPExeIcon = createXPIcon('⚙️', {
  backgroundColor: '#e6e6ff',
  border: '1px solid #9999cc',
  borderRadius: '2px'
});

// Icon with loading state
export const LoadingIcon = ({ size = 16, className = '' }) => (
  <span 
    className={`xp-loading-icon ${className}`}
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      fontSize: size,
      animation: 'loadingSpin 1s linear infinite'
    }}
  >
    ⏳
  </span>
);

// Compound icon (icon + text)
export const IconWithText = ({ icon, text, size = 16, className = '' }) => (
  <span className={`xp-icon-with-text ${className}`}>
    <span style={{ marginRight: '4px' }}>
      {React.cloneElement(icon, { size })}
    </span>
    <span style={{ fontSize: size * 0.8 }}>{text}</span>
  </span>
);

// Usage examples:
/*
// Basic usage
<ChatIcon size={24} className="toolbar-icon" />

// With text
<IconWithText 
  icon={<SaveIcon />} 
  text="Save" 
  size={16} 
/>

// Custom themed icon
const MyCustomIcon = createXPIcon('🎯', {
  backgroundColor: '#ffeeee',
  border: '1px solid #ff9999'
});

// Loading state
<LoadingIcon size={20} />

// File type icons
<XPFileIcon size={32} />
<XPFolderIcon size={32} />
<XPExeIcon size={32} />
*/

// Export all icons as a collection
export const XPIcons = {
  // Communication
  ChatIcon,
  MessageIcon,
  PhoneIcon,
  
  // Map & Navigation
  MapIcon,
  CompassIcon,
  LocationIcon,
  RouteIcon,
  
  // Buildings
  EmbassyIcon,
  BuildingIcon,
  HospitalIcon,
  SchoolIcon,
  
  // Security
  WarningIcon,
  ShieldIcon,
  LockIcon,
  AlertIcon,
  
  // Files
  DocumentIcon,
  FolderIcon,
  SaveIcon,
  PrintIcon,
  
  // System
  SettingsIcon,
  ToolsIcon,
  SearchIcon,
  RefreshIcon,
  
  // Controls
  PlayIcon,
  PauseIcon,
  StopIcon,
  NextIcon,
  PrevIcon,
  
  // Status
  InfoIcon,
  SuccessIcon,
  ErrorIcon,
  QuestionIcon,
  
  // Weather
  SunIcon,
  CloudIcon,
  RainIcon,
  SnowIcon,
  
  // SVG Icons
  LayersIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlusIcon,
  CloseIcon,
  ArrowPathIcon,
  
  // Special
  LoadingIcon,
  IconWithText,
  
  // Themed
  XPFileIcon,
  XPFolderIcon,
  XPExeIcon
};

export default XPIcons;