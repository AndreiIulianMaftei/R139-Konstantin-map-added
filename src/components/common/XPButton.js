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