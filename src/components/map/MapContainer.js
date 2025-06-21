import React, { useEffect, useRef, useState } from 'react';
import { XPWindow } from './common/XPWindow';
import { XPButton } from './common/XPButton';

const MapContainer = ({ 
  geemapHtml, 
  showDangerZones = false, 
  zoom = 100, 
  center = { lat: 40.7128, lng: -74.0060 } 
}) => {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(zoom);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [geemapHtml]);

  useEffect(() => {
    setZoomLevel(zoom);
  }, [zoom]);

  const handleMapClick = (event) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Close context menu if open
    setContextMenu(null);

    // Add click effect
    const clickEffect = document.createElement('div');
    clickEffect.className = 'map-click-effect';
    clickEffect.style.left = x + 'px';
    clickEffect.style.top = y + 'px';
    mapRef.current.appendChild(clickEffect);

    setTimeout(() => {
      if (clickEffect.parentNode) {
        clickEffect.parentNode.removeChild(clickEffect);
      }
    }, 600);

    console.log(`Map clicked at: ${x}, ${y}`);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    const rect = mapRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      mapX: x,
      mapY: y
    });
  };

  const addMarker = (x, y, type = 'default') => {
    const newMarker = {
      id: Date.now(),
      x,
      y,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setMapMarkers(prev => [...prev, newMarker]);
    setContextMenu(null);
  };

  const removeMarker = (markerId) => {
    setMapMarkers(prev => prev.filter(marker => marker.id !== markerId));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
  };

  return (
    <div className="map-container">
      {/* Map Loading Screen */}
      {isLoading && (
        <div className="map-loading">
          <div className="xp-panel loading-panel">
            <div className="loading-content">
              <div className="loading-icon">🗺️</div>
              <div className="loading-text">Loading Map Data...</div>
              <div className="loading-bar">
                <div className="loading-progress"></div>
              </div>
              <div className="loading-subtext">Initializing satellite imagery</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Area */}
      <div 
        ref={mapRef}
        className="map-area"
        onClick={handleMapClick}
        onContextMenu={handleContextMenu}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Geemap Content */}
        <div 
          className="geemap-content"
          dangerouslySetInnerHTML={{ __html: geemapHtml }}
        />

        {/* Danger Zones Overlay */}
        {showDangerZones && (
          <div className="danger-zones-overlay">
            <DangerZone 
              x={150} 
              y={100} 
              radius={50} 
              level="high"
              label="Embassy District"
            />
            <DangerZone 
              x={300} 
              y={200} 
              radius={30} 
              level="medium"
              label="Market Area"
            />
            <DangerZone 
              x={450} 
              y={150} 
              radius={25} 
              level="low"
              label="Tourist Zone"
            />
          </div>
        )}

        {/* Map Markers */}
        {mapMarkers.map(marker => (
          <MapMarker
            key={marker.id}
            marker={marker}
            onRemove={() => removeMarker(marker.id)}
          />
        ))}

        {/* Map Grid (optional) */}
        <div className="map-grid" />
      </div>

      {/* Map Controls */}
      <div className="map-controls">
        <div className="zoom-controls">
          <XPButton 
            size="small" 
            onClick={handleZoomIn}
            title="Zoom In"
            disabled={zoomLevel >= 400}
          >
            +
          </XPButton>
          <div className="zoom-display">
            {zoomLevel}%
          </div>
          <XPButton 
            size="small" 
            onClick={handleZoomOut}
            title="Zoom Out"
            disabled={zoomLevel <= 25}
          >
            −
          </XPButton>
        </div>

        <div className="coordinate-display">
          <div className="coordinate-panel">
            Lat: {center.lat.toFixed(4)}°
          </div>
          <div className="coordinate-panel">
            Lng: {center.lng.toFixed(4)}°
          </div>
        </div>
      </div>

      {/* Navigation Compass */}
      <div className="map-compass">
        <div className="compass-rose">
          <div className="compass-needle">N</div>
        </div>
      </div>

      {/* Scale Bar */}
      <div className="map-scale">
        <div className="scale-bar">
          <div className="scale-segment"></div>
          <div className="scale-segment"></div>
          <div className="scale-segment"></div>
          <div className="scale-segment"></div>
        </div>
        <div className="scale-label">
          {Math.round(10000 / (zoomLevel / 100))}m
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddMarker={(type) => addMarker(contextMenu.mapX, contextMenu.mapY, type)}
          onMeasure={() => console.log('Start measuring')}
          onExport={() => console.log('Export view')}
        />
      )}
    </div>
  );
};

// Danger Zone Component
const DangerZone = ({ x, y, radius, level, label }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const getZoneColor = (level) => {
    switch (level) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffff00';
      default: return '#ff4444';
    }
  };

  const getZoneIcon = (level) => {
    switch (level) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '⚡';
      default: return '⚠️';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="danger-zone"
      style={{
        position: 'absolute',
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: '50%',
        border: `2px dashed ${getZoneColor(level)}`,
        backgroundColor: `${getZoneColor(level)}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        animation: 'dangerPulse 2s infinite'
      }}
      onClick={() => setIsVisible(false)}
      title={`${label} - ${level.toUpperCase()} risk area`}
    >
      <div className="danger-zone-content">
        <div className="danger-icon">{getZoneIcon(level)}</div>
        <div className="danger-label">{label}</div>
      </div>
    </div>
  );
};

// Map Marker Component
const MapMarker = ({ marker, onRemove }) => {
  const [showInfo, setShowInfo] = useState(false);

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'embassy': return '🏛️';
      case 'danger': return '⚠️';
      case 'safe': return '🛡️';
      case 'poi': return '📍';
      default: return '📌';
    }
  };

  return (
    <div
      className="map-marker"
      style={{
        position: 'absolute',
        left: marker.x - 12,
        top: marker.y - 24,
        cursor: 'pointer',
        zIndex: 100
      }}
      onClick={() => setShowInfo(!showInfo)}
    >
      <div className="marker-icon">
        {getMarkerIcon(marker.type)}
      </div>
      
      {showInfo && (
        <div className="marker-popup">
          <div className="popup-content">
            <div className="popup-header">
              <span>Marker Info</span>
              <button 
                className="popup-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="popup-body">
              <div>Type: {marker.type}</div>
              <div>Position: {marker.x}, {marker.y}</div>
              <div>Added: {marker.timestamp}</div>
            </div>
            <div className="popup-footer">
              <XPButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Remove
              </XPButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Context Menu Component
const MapContextMenu = ({ x, y, onClose, onAddMarker, onMeasure, onExport }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="map-context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-content">
        <div className="context-menu-header">Map Actions</div>
        
        <div className="context-menu-group">
          <div className="context-menu-item" onClick={() => onAddMarker('default')}>
            📌 Add Marker
          </div>
          <div className="context-menu-item" onClick={() => onAddMarker('embassy')}>
            🏛️ Add Embassy
          </div>
          <div className="context-menu-item" onClick={() => onAddMarker('danger')}>
            ⚠️ Mark Danger Zone
          </div>
        </div>
        
        <div className="context-menu-separator" />
        
        <div className="context-menu-group">
          <div className="context-menu-item" onClick={onMeasure}>
            📏 Measure Distance
          </div>
          <div className="context-menu-item" onClick={onExport}>
            💾 Export View
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;