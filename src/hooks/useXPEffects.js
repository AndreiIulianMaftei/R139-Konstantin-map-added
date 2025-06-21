// src/hooks/useXPEffects.js
import { useCallback, useEffect } from 'react';

export const useXPEffects = () => {
  const addButtonEffect = useCallback((element) => {
    if (!element) return;
    
    const handleMouseDown = () => {
      element.style.transform = 'translate(1px, 1px)';
    };
    
    const handleMouseUp = () => {
      element.style.transform = 'translate(0, 0)';
    };
    
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  return { addButtonEffect };
};