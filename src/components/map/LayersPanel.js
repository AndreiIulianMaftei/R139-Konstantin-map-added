import React, { useState } from 'react';
import { CloseIcon } from '../icons/CloseIcon';

const LayersPanel = ({ isOpen, onClose, onToggleLayer, layers = [] }) => {
  const [expandedGroups, setExpandedGroups] = useState({
    base: true,
    overlay: true,
    security: false
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Group layers by category
  const layerGroups = {
    base: layers.filter(layer => ['satellite', 'street', 'terrain'].includes(layer.id)),
    overlay: layers.filter(layer => ['embassies', 'poi', 'traffic', 'weather'].includes(layer.id)),
    security: layers.filter(layer => ['danger-zones', 'secure-zones', 'restricted'].includes(layer.id))
  };

  if (!isOpen) return null;

  return (
    <div className="layers-panel">
      {/* Title Bar */}
      <div className="xp-titlebar">
        <div className="title">
          🗂️ Map Layers
        </div>
        <button className="control-btn" onClick={onClose} title="Close Layers Panel">
          <CloseIcon />
        </button>
      </div>

      {/* Layers Content */}
      <div className="layers-content">
        {/* Base Layers Group */}
        <LayerGroup
          title="Base Layers"
          groupId="base"
          isExpanded={expandedGroups.base}
          onToggle={() => toggleGroup('base')}
          layers={layerGroups.base}
          onToggleLayer={onToggleLayer}
          allowMultiple={false}
        />

        {/* Overlay Layers Group */}
        <LayerGroup
          title="Overlay Layers"
          groupId="overlay"
          isExpanded={expandedGroups.overlay}
          onToggle={() => toggleGroup('overlay')}
          layers={layerGroups.overlay}
          onToggleLayer={onToggleLayer}
          allowMultiple={true}
        />

        {/* Security Layers Group */}
        <LayerGroup
          title="Security Layers"
          groupId="security"
          isExpanded={expandedGroups.security}
          onToggle={() => toggleGroup('security')}
          layers={layerGroups.security}
          onToggleLayer={onToggleLayer}
          allowMultiple={true}
          securityGroup={true}
        />
      </div>

      {/* Layer Controls Footer */}
      <div className="layers-footer">
        <button className="xp-button" onClick={() => console.log('Add layer')}>
          Add Layer...
        </button>
        <button className="xp-button" onClick={() => console.log('Layer properties')}>
          Properties
        </button>
      </div>
    </div>
  );
};

// Layer Group Component
const LayerGroup = ({ 
  title, 
  groupId, 
  isExpanded, 
  onToggle, 
  layers, 
  onToggleLayer, 
  allowMultiple = true,
  securityGroup = false 
}) => {
  return (
    <div className="layer-group">
      <div 
        className="layer-group-header"
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          padding: '2px 6px',
          background: securityGroup ? 'linear-gradient(180deg, #ffe6e6 0%, #ffcccc 100%)' : 'var(--xp-gray)',
          border: '1px outset var(--xp-gray)',
          fontWeight: 'bold',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '8px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        {securityGroup && '🔒'} {title}
      </div>
      
      {isExpanded && (
        <div className="layer-group-content">
          {layers.map(layer => (
            <LayerItem
              key={layer.id}
              layer={layer}
              onToggle={() => onToggleLayer(layer.id)}
              inputType={allowMultiple ? 'checkbox' : 'radio'}
              groupName={allowMultiple ? undefined : groupId}
            />
          ))}
          
          {layers.length === 0 && (
            <div style={{ 
              padding: '8px', 
              fontStyle: 'italic', 
              color: 'var(--xp-dark-gray)',
              fontSize: '10px'
            }}>
              No layers in this group
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual Layer Item Component
const LayerItem = ({ layer, onToggle, inputType = 'checkbox', groupName }) => {
  const getLayerIcon = (layerId) => {
    const icons = {
      'satellite': '🛰️',
      'street': '🗺️',
      'terrain': '🏔️',
      'embassies': '🏛️',
      'poi': '📍',
      'traffic': '🚦',
      'weather': '🌤️',
      'danger-zones': '⚠️',
      'secure-zones': '🛡️',
      'restricted': '🚫'
    };
    return icons[layerId] || '📄';
  };

  return (
    <div 
      className="layer-item"
      style={{
        padding: '2px 6px 2px 16px',
        borderBottom: '1px solid #d0d0d0',
        display: 'flex',
        alignItems: 'center',
        cursor: layer.locked ? 'not-allowed' : 'pointer',
        opacity: layer.locked ? 0.6 : 1,
        backgroundColor: layer.visible ? '#f0f8ff' : 'transparent'
      }}
      onClick={layer.locked ? undefined : onToggle}
    >
      <input
        type={inputType}
        name={groupName}
        checked={layer.visible}
        onChange={layer.locked ? undefined : onToggle}
        disabled={layer.locked}
        style={{
          marginRight: '6px',
          width: '13px',
          height: '13px'
        }}
        onClick={(e) => e.stopPropagation()}
      />
      
      <span style={{ marginRight: '6px', fontSize: '12px' }}>
        {getLayerIcon(layer.id)}
      </span>
      
      <span style={{ 
        flex: 1, 
        fontSize: '11px',
        textDecoration: layer.locked ? 'none' : undefined
      }}>
        {layer.name}
        {layer.locked && (
          <span style={{ marginLeft: '4px', fontSize: '10px', color: 'var(--xp-dark-gray)' }}>
            (locked)
          </span>
        )}
      </span>

      {/* Layer opacity slider for visible layers */}
      {layer.visible && !layer.locked && (
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="100"
          style={{
            width: '40px',
            height: '12px',
            marginLeft: '8px'
          }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => console.log(`Layer ${layer.id} opacity: ${e.target.value}%`)}
          title="Layer Opacity"
        />
      )}
    </div>
  );
};

export default LayersPanel;

// CSS styles that should be added to your index.css
const layersPanelCSS = `
/* Layers Panel Styles */
.layers-panel {
  position: fixed;
  top: 100px;
  left: 20px;
  width: 240px;
  background: var(--xp-window-bg);
  border: 2px outset var(--xp-gray);
  box-shadow: var(--xp-shadow);
  z-index: 1000;
  font-family: var(--xp-font);
  font-size: var(--xp-font-size);
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.layers-content {
  flex: 1;
  overflow-y: auto;
  border-top: 1px solid var(--xp-dark-gray);
  border-bottom: 1px solid var(--xp-dark-gray);
}

.layers-content::-webkit-scrollbar {
  width: 16px;
}

.layers-content::-webkit-scrollbar-track {
  background: var(--xp-gray);
  border: var(--xp-border-inset);
}

.layers-content::-webkit-scrollbar-thumb {
  background: var(--xp-button-gradient);
  border: var(--xp-border-outset);
}

.layer-group {
  border-bottom: 1px solid var(--xp-dark-gray);
}

.layer-group:last-child {
  border-bottom: none;
}

.layer-group-header:hover {
  background: linear-gradient(180deg, #f0f0f0 0%, #e8e8e8 100%) !important;
}

.layer-group-content {
  background: var(--xp-white);
  border-left: 1px solid var(--xp-dark-gray);
  border-right: 1px solid var(--xp-dark-gray);
}

.layer-item:hover {
  background: #e8f4fd !important;
}

.layer-item:last-child {
  border-bottom: none;
}

.layers-footer {
  padding: var(--xp-padding-medium);
  background: var(--xp-window-bg);
  border-top: 1px solid var(--xp-white);
  display: flex;
  gap: var(--xp-margin-medium);
}

.layers-footer .xp-button {
  flex: 1;
  min-width: 0;
  font-size: 10px;
  height: 20px;
  padding: var(--xp-padding-small) var(--xp-padding-small);
}

/* Custom range slider styles for XP */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: var(--xp-gray);
  border: 1px inset var(--xp-gray);
  height: 12px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--xp-button-gradient);
  border: 1px outset var(--xp-gray);
  cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb:hover {
  background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
}

/* Responsive design for layers panel */
@media (max-width: 768px) {
  .layers-panel {
    width: 200px;
    left: 10px;
    max-height: calc(100vh - 100px);
  }
  
  .layer-item {
    padding: 1px 4px 1px 12px;
  }
  
  .layers-footer .xp-button {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .layers-panel {
    width: calc(100vw - 20px);
    left: 10px;
    right: 10px;
  }
}
`;