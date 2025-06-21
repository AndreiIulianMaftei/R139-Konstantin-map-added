import React, { useState } from 'react';
import './ActionToolbar.css';
import { GearIcon } from './icons/GearIcon.js';
import { SyncIcon } from './icons/SyncIcon.js';
import { ChatIcon } from './icons/ChatIcon.js';
import { CloseIcon } from './icons/CloseIcon.js';

const ActionToolbar = ({ onToggleChat, onToggleDangerZones, dangerZonesVisible }) => {
  const [isExpanded, setExpanded] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [showMapOptions, setShowMapOptions] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };
  
  const toggleToolbar = () => {
    if (isExpanded) {
        setShowMapOptions(false);
    }
    setExpanded(!isExpanded);
  }

  return (
    <div className="toolbar-container">
      {/* Map Options Dropdown */}
      <div className={`map-options-menu ${showMapOptions ? 'visible' : ''}`}>
          <button className="map-option-button" onClick={onToggleDangerZones}>
              <span>{dangerZonesVisible ? 'Hide' : 'Show'} Zones</span>
          </button>
          <button className="map-option-button">
              <span>Satellite</span>
          </button>
           <button className="map-option-button">
              <span>Street</span>
          </button>
      </div>

      <div className={`action-toolbar ${isExpanded ? 'expanded' : ''}`}>
        {/* Main toggle button */}
        <button className="fab" onClick={toggleToolbar}>
            {isExpanded ? <CloseIcon /> : <GearIcon />}
        </button>

        {/* Expanded actions */}
        <div className="toolbar-actions">
          <button className="toolbar-button" onClick={() => setShowMapOptions(!showMapOptions)}>
            <GearIcon />
          </button>
          <button className={`toolbar-button ${isRefreshing ? 'spinning' : ''}`} onClick={handleRefresh}>
            <SyncIcon />
          </button>
          <button className="toolbar-button" onClick={onToggleChat}>
            <ChatIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionToolbar;