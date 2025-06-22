// src/components/ActionToolbar.js
import React from 'react';
import { XPButton } from './common/XPButton';

const ActionToolbar = ({ onLayersToggle, onChatToggle }) => {
  return (
    <div className="xp-toolbar">
      <XPButton onClick={onLayersToggle}>
        🗂️ Layers
      </XPButton>
      <XPButton onClick={onChatToggle}>
        💬 Chat
      </XPButton>
      
      <div className="toolbar-separator"></div>
      
      <XPButton onClick={() => console.log('Add marker')}>
        📍 Add Marker
      </XPButton>
      <XPButton onClick={() => console.log('Measure')}>
        📏 Measure
      </XPButton>
      <XPButton onClick={() => console.log('Search')}>
        🔍 Search
      </XPButton>
      
      <div className="toolbar-separator"></div>
      
      <XPButton onClick={() => console.log('Refresh')}>
        ↻ Refresh
      </XPButton>
      <XPButton onClick={() => console.log('Center map')}>
        🎯 Center
      </XPButton>
    </div>
  );
};

export default ActionToolbar;