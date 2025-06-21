// src/hooks/useXPWindow.js
import { useState, useCallback } from 'react';

export const useXPWindow = () => {
  const [windows, setWindows] = useState([]);
  const [activeWindowId, setActiveWindowId] = useState(null);

  const openWindow = useCallback((config) => {
    const newWindow = {
      id: Date.now(),
      zIndex: 1000 + windows.length,
      ...config
    };
    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    return newWindow.id;
  }, [windows.length]);

  const closeWindow = useCallback((windowId) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    setActiveWindowId(prev => prev === windowId ? null : prev);
  }, []);

  const focusWindow = useCallback((windowId) => {
    setActiveWindowId(windowId);
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: Math.max(...prev.map(win => win.zIndex)) + 1 }
        : w
    ));
  }, []);

  const minimizeWindow = useCallback((windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, minimized: !w.minimized } : w
    ));
  }, []);

  return {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow
  };
};

// src/hooks/useXPSounds.js
import { useCallback, useRef } from 'react';

export const useXPSounds = () => {
  const soundsRef = useRef({
    click: null,
    open: null,
    close: null,
    error: null
  });

  const initSounds = useCallback(() => {
    if (soundsRef.current.click) return; // Already initialized
    
    soundsRef.current = {
      click: new Audio('/sounds/click.wav'),
      open: new Audio('/sounds/window-open.wav'),
      close: new Audio('/sounds/window-close.wav'),
      error: new Audio('/sounds/error.wav')
    };
  }, []);

  const playSound = useCallback((soundName) => {
    initSounds();
    const sound = soundsRef.current[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay restrictions
      });
    }
  }, [initSounds]);

  return { playSound };
};

// src/hooks/useXPKeyboard.js
import { useEffect } from 'react';

export const useXPKeyboard = (shortcuts = {}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};