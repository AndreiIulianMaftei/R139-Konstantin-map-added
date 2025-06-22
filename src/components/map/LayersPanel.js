import React, { useState } from 'react';
import { CloseIcon } from '../../icons/XPIcons';

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