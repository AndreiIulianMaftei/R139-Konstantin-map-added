// src/components/DesktopIcons.js
import React from 'react';
import { XPTooltip } from './common/XPTooltip';

const DesktopIcons = ({ onOpenWindow }) => {
  const icons = [
    {
      id: 'my-computer',
      icon: '🖥️',
      label: 'My Computer',
      action: () => onOpenWindow({
        type: 'computer',
        title: 'My Computer',
        width: 500,
        height: 400
      })
    },
    {
      id: 'recycle-bin',
      icon: '🗑️',
      label: 'Recycle Bin',
      action: () => onOpenWindow({
        type: 'recycle',
        title: 'Recycle Bin',
        width: 400,
        height: 300
      })
    },
    {
      id: 'map-settings',
      icon: '⚙️',
      label: 'Map Settings',
      action: () => onOpenWindow({
        type: 'settings',
        title: 'Map Settings',
        width: 450,
        height: 350
      })
    }
  ];

  return (
    <div className="desktop-icons">
      {icons.map(icon => (
        <XPTooltip key={icon.id} content={icon.label}>
          <div 
            className="desktop-icon"
            onDoubleClick={icon.action}
          >
            <div className="icon-image">{icon.icon}</div>
            <div className="icon-label">{icon.label}</div>
          </div>
        </XPTooltip>
      ))}
    </div>
  );
};

export default DesktopIcons;