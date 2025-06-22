// src/components/MapContainer.js
import React from 'react';

const MapContainer = () => {
  return (
    <div className="map-container">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--xp-dark-gray)',
        fontSize: '14px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <div>Map will be displayed here</div>
        <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
          Click to add markers • Right-click for options
        </div>
      </div>
    </div>
  );
};

export default MapContainer;