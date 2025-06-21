import React from 'react';
import { CloseIcon } from '../icons/CloseIcon';

const XPWindow = ({ 
  title, 
  children, 
  onClose, 
  width = 300, 
  height = 400,
  x = 100,
  y = 100,
  icon
}) => {
  return (
    <div 
      className="xp-window"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width,
        height,
        zIndex: 1000
      }}
    >
      <div className="xp-titlebar">
        <div className="title">
          {icon && <span style={{ marginRight: '6px' }}>{icon}</span>}
          {title}
        </div>
        <button className="control-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="xp-window-content">
        {children}
      </div>
    </div>
  );
};

export default XPWindow;