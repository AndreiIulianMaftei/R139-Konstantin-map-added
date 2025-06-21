// src/components/common/XPButton.js
import React from 'react';
import clsx from 'clsx';

export const XPButton = ({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'medium',
  pressed = false,
  disabled = false,
  icon,
  className,
  ...props 
}) => {
  const buttonClass = clsx(
    'xp-button',
    {
      'xp-button-primary': variant === 'primary',
      'xp-button-danger': variant === 'danger',
      'xp-button-small': size === 'small',
      'xp-button-large': size === 'large',
      'pressed': pressed,
    },
    className
  );

  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
};

// src/components/common/XPWindow.js
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from '../../icons/CloseIcon';

export const XPWindow = ({ 
  title, 
  children, 
  onClose, 
  width = 400, 
  height = 300,
  x = 100,
  y = 100,
  icon,
  resizable = false,
  maximizable = false,
  minimizable = false,
  className
}) => {
  const [position, setPosition] = useState({ x, y });
  const [size, setSize] = useState({ width, height });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls')) return;
    
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition({ x, y });
      setSize({ width, height });
    } else {
      setPosition({ x: 0, y: 0 });
      setSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - 40 
      });
    }
    setIsMaximized(!isMaximized);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: Math.max(0, e.clientY - dragOffset.y)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, isMaximized]);

  return (
    <div 
      ref={windowRef}
      className={clsx('xp-window', className, {
        'maximized': isMaximized,
        'dragging': isDragging
      })}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 1000
      }}
    >
      <div 
        className="xp-titlebar"
        onMouseDown={handleMouseDown}
        onDoubleClick={maximizable ? handleMaximize : undefined}
      >
        <div className="title">
          {icon && <span className="title-icon">{icon}</span>}
          {title}
        </div>
        <div className="window-controls">
          {minimizable && (
            <button className="control-btn minimize-btn" title="Minimize">
              −
            </button>
          )}
          {maximizable && (
            <button 
              className="control-btn maximize-btn" 
              onClick={handleMaximize}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? '⧉' : '□'}
            </button>
          )}
          <button className="control-btn close-btn" onClick={onClose} title="Close">
            <CloseIcon />
          </button>
        </div>
      </div>
      
      <div className="xp-window-content">
        {children}
      </div>

      {resizable && !isMaximized && (
        <div 
          className="resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        />
      )}
    </div>
  );
};

// src/components/common/XPDialog.js
import React from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';

export const XPDialog = ({
  title,
  message,
  type = 'info', // info, warning, error, question
  buttons = ['OK'],
  onButton,
  onClose,
  icon
}) => {
  const getDialogIcon = (type) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'question': return '❓';
      default: return icon || 'ℹ️';
    }
  };

  return (
    <div className="xp-dialog-overlay">
      <XPWindow
        title={title}
        onClose={onClose}
        width={350}
        height={150}
        x={window.innerWidth / 2 - 175}
        y={window.innerHeight / 2 - 75}
        icon="💬"
        className="xp-dialog"
      >
        <div className="dialog-content">
          <div className="dialog-body">
            <div className="dialog-icon">
              {getDialogIcon(type)}
            </div>
            <div className="dialog-message">
              {message}
            </div>
          </div>
          <div className="dialog-buttons">
            {buttons.map((button, index) => (
              <XPButton
                key={index}
                variant={index === 0 ? 'primary' : 'default'}
                onClick={() => onButton && onButton(button, index)}
              >
                {button}
              </XPButton>
            ))}
          </div>
        </div>
      </XPWindow>
    </div>
  );
};

// src/components/common/XPDropdown.js
import React, { useState, useRef, useEffect } from 'react';

export const XPDropdown = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0) {
            onChange(options[selectedIndex].value);
            setIsOpen(false);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, options, onChange]);

  return (
    <div className={`xp-dropdown ${className || ''}`} ref={dropdownRef}>
      {label && <label className="dropdown-label">{label}</label>}
      
      <div 
        className={`dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="dropdown-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`dropdown-option ${index === selectedIndex ? 'highlighted' : ''} ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// src/components/common/XPProgressBar.js
import React from 'react';

export const XPProgressBar = ({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  className,
  size = 'medium'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`xp-progress-container ${size} ${className || ''}`}>
      {label && (
        <div className="progress-label">
          {label}
          {showPercentage && ` (${Math.round(percentage)}%)`}
        </div>
      )}
      <div className="xp-progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
        <div className="progress-shine" />
      </div>
    </div>
  );
};

// src/components/common/XPTabs.js
import React, { useState } from 'react';

export const XPTabs = ({
  tabs = [],
  activeTab,
  onTabChange,
  className
}) => {
  const [activeIndex, setActiveIndex] = useState(
    activeTab ? tabs.findIndex(tab => tab.id === activeTab) : 0
  );

  const handleTabClick = (index, tab) => {
    setActiveIndex(index);
    if (onTabChange) {
      onTabChange(tab.id, index);
    }
  };

  return (
    <div className={`xp-tabs ${className || ''}`}>
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab-button ${index === activeIndex ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => !tab.disabled && handleTabClick(index, tab)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tabs-content">
        {tabs[activeIndex] && tabs[activeIndex].content}
      </div>
    </div>
  );
};

// src/components/common/XPTooltip.js
import React, { useState, useRef } from 'react';

export const XPTooltip = ({
  children,
  content,
  position = 'top',
  delay = 500,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div 
      className="xp-tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      ref={tooltipRef}
    >
      {children}
      {isVisible && content && (
        <div className={`xp-tooltip ${position} ${className || ''}`}>
          <div className="tooltip-content">
            {content}
          </div>
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

// src/hooks/useXPDialog.js
import React, { createContext, useContext, useState } from 'react';
import { XPDialog } from '../components/common/XPDialog';

const DialogContext = createContext();

export const XPDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);

  const showDialog = (config) => {
    return new Promise((resolve) => {
      setDialog({
        ...config,
        onButton: (button, index) => {
          setDialog(null);
          resolve({ button, index });
        },
        onClose: () => {
          setDialog(null);
          resolve({ button: null, index: -1 });
        }
      });
    });
  };

  const hideDialog = () => {
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      {dialog && <XPDialog {...dialog} />}
    </DialogContext.Provider>
  );
};

export const useXPDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useXPDialog must be used within XPDialogProvider');
  }
  return context;
};

// Usage example:
/*
const MyComponent = () => {
  const { showDialog } = useXPDialog();

  const handleSave = async () => {
    const result = await showDialog({
      title: 'Save Changes',
      message: 'Do you want to save your changes before closing?',
      type: 'question',
      buttons: ['Save', 'Don\'t Save', 'Cancel']
    });

    if (result.button === 'Save') {
      // Save logic
    } else if (result.button === 'Don\'t Save') {
      // Don't save logic
    }
    // Cancel - do nothing
  };

  return (
    <XPButton onClick={handleSave}>
      Save Project
    </XPButton>
  );
};
*/