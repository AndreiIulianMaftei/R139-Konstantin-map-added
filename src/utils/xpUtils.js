// XP Utility Functions & Hooks
// src/utils/xpUtils.js

import { useState, useEffect, useCallback, useRef } from 'react';

// === Window Management Utilities ===

export const XPWindowManager = {
  windows: new Map(),
  nextZIndex: 1000,
  
  register: (id, windowRef) => {
    XPWindowManager.windows.set(id, {
      ref: windowRef,
      zIndex: XPWindowManager.nextZIndex++,
      minimized: false,
      maximized: false
    });
  },
  
  unregister: (id) => {
    XPWindowManager.windows.delete(id);
  },
  
  focus: (id) => {
    const window = XPWindowManager.windows.get(id);
    if (window) {
      window.zIndex = XPWindowManager.nextZIndex++;
      if (window.ref.current) {
        window.ref.current.style.zIndex = window.zIndex;
        window.ref.current.focus();
      }
    }
  },
  
  getTopWindow: () => {
    let topWindow = null;
    let maxZIndex = 0;
    
    XPWindowManager.windows.forEach((window, id) => {
      if (window.zIndex > maxZIndex && !window.minimized) {
        maxZIndex = window.zIndex;
        topWindow = id;
      }
    });
    
    return topWindow;
  },
  
  minimizeAll: () => {
    XPWindowManager.windows.forEach(window => {
      window.minimized = true;
      if (window.ref.current) {
        window.ref.current.style.display = 'none';
      }
    });
  },
  
  restoreAll: () => {
    XPWindowManager.windows.forEach(window => {
      window.minimized = false;
      if (window.ref.current) {
        window.ref.current.style.display = 'block';
      }
    });
  }
};

// === Event Utilities ===

export const XPEvents = {
  // Debounce function for performance
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },
  
  // Throttle function for performance
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Get mouse position relative to element
  getRelativeMousePosition: (event, element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  },
  
  // Check if click is outside element
  isClickOutside: (event, element) => {
    return element && !element.contains(event.target);
  },
  
  // Keyboard shortcut handler
  createShortcutHandler: (shortcuts) => {
    return (event) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');
      
      const handler = shortcuts[key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };
  }
};

// === XP-Style Animations ===

export const XPAnimations = {
  // Window slide in animation
  slideIn: (element, direction = 'up', duration = 300) => {
    if (!element) return;
    
    const keyframes = {
      up: [
        { transform: 'translateY(20px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      down: [
        { transform: 'translateY(-20px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      left: [
        { transform: 'translateX(20px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      right: [
        { transform: 'translateX(-20px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ]
    };
    
    return element.animate(keyframes[direction], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });
  },
  
  // Button press animation
  buttonPress: (element) => {
    if (!element) return;
    
    return element.animate([
      { transform: 'translate(0, 0)' },
      { transform: 'translate(1px, 1px)' },
      { transform: 'translate(0, 0)' }
    ], {
      duration: 100,
      easing: 'ease-out'
    });
  },
  
  // Pulse animation for alerts
  pulse: (element, color = '#ff0000') => {
    if (!element) return;
    
    return element.animate([
      { boxShadow: `0 0 0 0 ${color}40` },
      { boxShadow: `0 0 0 10px ${color}00` }
    ], {
      duration: 1000,
      iterations: 3,
      easing: 'ease-out'
    });
  }
};

// === XP Sound Manager ===

export const XPSoundManager = {
  sounds: new Map(),
  enabled: true,
  
  preload: (soundMap) => {
    Object.entries(soundMap).forEach(([name, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      XPSoundManager.sounds.set(name, audio);
    });
  },
  
  play: (soundName, volume = 1.0) => {
    if (!XPSoundManager.enabled) return;
    
    const sound = XPSoundManager.sounds.get(soundName);
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  },
  
  setEnabled: (enabled) => {
    XPSoundManager.enabled = enabled;
  },
  
  setVolume: (soundName, volume) => {
    const sound = XPSoundManager.sounds.get(soundName);
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }
};

// === Custom Hooks ===

// Hook for managing XP window state
export const useXPWindow = (initialState = {}) => {
  const [windowState, setWindowState] = useState({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    minimized: false,
    maximized: false,
    focused: false,
    ...initialState
  });
  
  const windowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const updatePosition = useCallback((x, y) => {
    setWindowState(prev => ({ ...prev, x, y }));
  }, []);
  
  const updateSize = useCallback((width, height) => {
    setWindowState(prev => ({ ...prev, width, height }));
  }, []);
  
  const minimize = useCallback(() => {
    setWindowState(prev => ({ ...prev, minimized: !prev.minimized }));
  }, []);
  
  const maximize = useCallback(() => {
    setWindowState(prev => {
      if (prev.maximized) {
        return { 
          ...prev, 
          maximized: false,
          x: initialState.x || 100,
          y: initialState.y || 100,
          width: initialState.width || 400,
          height: initialState.height || 300
        };
      } else {
        return {
          ...prev,
          maximized: true,
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 40
        };
      }
    });
  }, [initialState]);
  
  const focus = useCallback(() => {
    setWindowState(prev => ({ ...prev, focused: true }));
  }, []);
  
  const blur = useCallback(() => {
    setWindowState(prev => ({ ...prev, focused: false }));
  }, []);
  
  return {
    windowState,
    windowRef,
    isDragging,
    isResizing,
    dragOffset,
    setIsDragging,
    setIsResizing,
    setDragOffset,
    updatePosition,
    updateSize,
    minimize,
    maximize,
    focus,
    blur
  };
};

// Hook for XP-style drag and drop
export const useXPDragDrop = (options = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState(null);
  const [dropZones, setDropZones] = useState(new Map());
  
  const registerDropZone = useCallback((id, element, callbacks) => {
    setDropZones(prev => new Map(prev).set(id, { element, callbacks }));
  }, []);
  
  const unregisterDropZone = useCallback((id) => {
    setDropZones(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);
  
  const startDrag = useCallback((data, event) => {
    setIsDragging(true);
    setDragData(data);
    
    if (options.onDragStart) {
      options.onDragStart(data, event);
    }
  }, [options]);
  
  const endDrag = useCallback((event) => {
    // Check if dropped on a valid drop zone
    let dropped = false;
    
    dropZones.forEach((zone, id) => {
      if (zone.element && zone.element.contains(event.target)) {
        if (zone.callbacks.onDrop) {
          zone.callbacks.onDrop(dragData, event);
          dropped = true;
        }
      }
    });
    
    if (options.onDragEnd) {
      options.onDragEnd(dragData, dropped, event);
    }
    
    setIsDragging(false);
    setDragData(null);
  }, [dragData, dropZones, options]);
  
  return {
    isDragging,
    dragData,
    startDrag,
    endDrag,
    registerDropZone,
    unregisterDropZone
  };
};

// Hook for XP-style keyboard navigation
export const useXPKeyboardNav = (items, options = {}) => {
  const [selectedIndex, setSelectedIndex] = useState(options.initialIndex || -1);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef(null);
  
  const selectNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev < items.length - 1 ? prev + 1 : (options.wrap ? 0 : prev)
    );
  }, [items.length, options.wrap]);
  
  const selectPrevious = useCallback(() => {
    setSelectedIndex(prev => 
      prev > 0 ? prev - 1 : (options.wrap ? items.length - 1 : prev)
    );
  }, [items.length, options.wrap]);
  
  const selectFirst = useCallback(() => {
    setSelectedIndex(0);
  }, []);
  
  const selectLast = useCallback(() => {
    setSelectedIndex(items.length - 1);
  }, [items.length]);
  
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        selectPrevious();
        break;
      case 'Home':
        event.preventDefault();
        selectFirst();
        break;
      case 'End':
        event.preventDefault();
        selectLast();
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && options.onSelect) {
          options.onSelect(items[selectedIndex], selectedIndex);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        setSearchQuery('');
        if (options.onEscape) {
          options.onEscape();
        }
        break;
      default:
        // Type-to-search functionality
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey) {
          const newQuery = searchQuery + event.key.toLowerCase();
          setSearchQuery(newQuery);
          
          // Find matching item
          const matchIndex = items.findIndex(item => 
            item.toString().toLowerCase().startsWith(newQuery)
          );
          
          if (matchIndex >= 0) {
            setSelectedIndex(matchIndex);
          }
          
          // Clear search after delay
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = setTimeout(() => {
            setSearchQuery('');
          }, 1000);
        }
        break;
    }
  }, [items, selectedIndex, searchQuery, selectNext, selectPrevious, selectFirst, selectLast, options]);
  
  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    searchQuery
  };
};

// Hook for XP-style form validation
export const useXPFormValidation = (rules = {}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = useCallback((fieldName, value) => {
    const rule = rules[fieldName];
    if (!rule) return null;
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      return rule.messages?.required || 'This field is required';
    }
    
    if (rule.minLength && value.toString().length < rule.minLength) {
      return rule.messages?.minLength || `Minimum length is ${rule.minLength}`;
    }
    
    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return rule.messages?.maxLength || `Maximum length is ${rule.maxLength}`;
    }
    
    if (rule.pattern && !rule.pattern.test(value.toString())) {
      return rule.messages?.pattern || 'Invalid format';
    }
    
    if (rule.custom && typeof rule.custom === 'function') {
      return rule.custom(value, values);
    }
    
    return null;
  }, [rules, values]);
  
  const setValue = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    if (touched[fieldName]) {
      const error = validate(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  }, [touched, validate]);
  
  const setTouched = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validate(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, [values, validate]);
  
  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(rules).forEach(fieldName => {
      const error = validate(fieldName, values[fieldName]);
      newErrors[fieldName] = error;
      if (error) isValid = false;
    });
    
    setErrors(newErrors);
    setTouched(Object.keys(rules).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
    
    return isValid;
  }, [rules, values, validate]);
  
  const reset = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
  }, []);
  
  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validateAll,
    reset,
    isValid: Object.values(errors).every(error => !error)
  };
};

// Hook for XP-style local storage with fallback
export const useXPStorage = (key, defaultValue = null) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key]);
  
  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);
  
  return [value, setStoredValue, removeValue];
};

// Export all utilities
export const XPUtils = {
  XPWindowManager,
  XPEvents,
  XPAnimations,
  XPSoundManager,
  useXPWindow,
  useXPDragDrop,
  useXPKeyboardNav,
  useXPFormValidation,
  useXPStorage
};