// Complete XP Implementation Example
// src/components/CompleteXPMapInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { XPWindow } from './common/XPWindow';
import { XPButton } from './common/XPButton';
import { XPDialog, useXPDialog } from './common/XPDialog';
import { XPContextMenu } from './advanced/XPContextMenu';
import { XPTreeView } from './advanced/XPTreeView';
import { XPListView } from './advanced/XPListView';
import { XPSplitter } from './advanced/XPSplitter';
import { XPIcons } from './icons/XPIcons';
import { XPUtils } from '../utils/xpUtils';

const CompleteXPMapInterface = () => {
  // Window management
  const [windows, setWindows] = useState([]);
  const { showDialog } = useXPDialog();
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  
  // Map state
  const [mapData, setMapData] = useState({
    zoom: 100,
    center: { lat: 40.7128, lng: -74.0060 },
    layers: [
      { id: 'satellite', name: 'Satellite', visible: true, locked: true },
      { id: 'embassies', name: 'Embassies', visible: true },
      { id: 'danger-zones', name: 'Danger Zones', visible: false }
    ],
    markers: []
  });
  
  // Initialize XP sounds
  useEffect(() => {
    XPUtils.XPSoundManager.preload({
      click: '/sounds/click.wav',
      open: '/sounds/window-open.wav',
      close: '/sounds/window-close.wav',
      error: '/sounds/error.wav'
    });
  }, []);
  
  // Window operations
  const openWindow = (config) => {
    const newWindow = {
      id: Date.now(),
      zIndex: 1000 + windows.length,
      ...config
    };
    setWindows(prev => [...prev, newWindow]);
    XPUtils.XPSoundManager.play('open');
    return newWindow.id;
  };
  
  const closeWindow = (windowId) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
    XPUtils.XPSoundManager.play('close');
  };
  
  const focusWindow = (windowId) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: Math.max(...prev.map(win => win.zIndex)) + 1 }
        : w
    ));
  };
  
  // Menu handlers
  const handleMenuAction = async (action) => {
    XPUtils.XPSoundManager.play('click');
    
    switch (action) {
      case 'file-new':
        const result = await showDialog({
          title: 'New Map Project',
          message: 'Are you sure you want to create a new map? Unsaved changes will be lost.',
          type: 'question',
          buttons: ['Create New', 'Cancel']
        });
        if (result.button === 'Create New') {
          setMapData({
            zoom: 100,
            center: { lat: 40.7128, lng: -74.0060 },
            layers: mapData.layers.map(l => ({ ...l, visible: l.locked })),
            markers: []
          });
        }
        break;
        
      case 'file-save':
        // Simulate save operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        await showDialog({
          title: 'Save Complete',
          message: 'Map project has been saved successfully.',
          type: 'info',
          buttons: ['OK']
        });
        break;
        
      case 'tools-settings':
        openWindow({
          type: 'settings',
          title: 'Map Settings',
          width: 500,
          height: 400,
          x: 200,
          y: 150,
          icon: <XPIcons.SettingsIcon />
        });
        break;
        
      case 'help-about':
        openWindow({
          type: 'about',
          title: 'About Embassy Map',
          width: 400,
          height: 300,
          x: 250,
          y: 200,
          icon: <XPIcons.InfoIcon />
        });
        break;
        
      default:
        console.log(`Menu action: ${action}`);
    }
  };
  
  // Context menu handlers
  const handleMapContextMenu = (event) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const mapX = event.clientX - rect.left;
    const mapY = event.clientY - rect.top;
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'Add Marker',
          icon: <XPIcons.LocationIcon />,
          action: () => addMarker(mapX, mapY, 'default')
        },
        {
          label: 'Add Embassy',
          icon: <XPIcons.EmbassyIcon />,
          action: () => addMarker(mapX, mapY, 'embassy')
        },
        { type: 'separator' },
        {
          label: 'Measure Distance',
          icon: <XPIcons.ToolsIcon />,
          action: () => console.log('Measure tool activated')
        },
        {
          label: 'Properties',
          icon: <XPIcons.SettingsIcon />,
          action: () => openWindow({
            type: 'properties',
            title: 'Map Properties',
            width: 350,
            height: 250
          })
        }
      ]
    });
  };
  
  const addMarker = (x, y, type) => {
    const newMarker = {
      id: Date.now(),
      x,
      y,
      type,
      label: `${type} ${mapData.markers.length + 1}`,
      timestamp: new Date().toISOString()
    };
    setMapData(prev => ({
      ...prev,
      markers: [...prev.markers, newMarker]
    }));
    setContextMenu(null);
  };
  
  // Layer management
  const toggleLayer = (layerId) => {
    setMapData(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId && !layer.locked
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    }));
  };
  
  return (
    <div className="xp-desktop">
      {/* Main Map Interface */}
      <XPWindow
        title="Embassy Map System - Main Interface"
        icon={<XPIcons.MapIcon />}
        width={window.innerWidth - 40}
        height={window.innerHeight - 80}
        x={20}
        y={20}
        maximizable
        minimizable
        resizable
        onClose={() => window.close()}
      >
        <MainInterfaceContent
          mapData={mapData}
          onMapContextMenu={handleMapContextMenu}
          onMenuAction={handleMenuAction}
          onToggleLayer={toggleLayer}
          onOpenWindow={openWindow}
        />
      </XPWindow>
      
      {/* Dynamic Windows */}
      {windows.map(window => (
        <DynamicWindow
          key={window.id}
          window={window}
          onClose={() => closeWindow(window.id)}
          onFocus={() => focusWindow(window.id)}
          mapData={mapData}
          onMapDataChange={setMapData}
        />
      ))}
      
      {/* Context Menu */}
      {contextMenu && (
        <XPContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
          onSelect={(item) => {
            item.action && item.action();
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};

// Main interface content with menu, toolbar, and splitter layout
const MainInterfaceContent = ({ 
  mapData, 
  onMapContextMenu, 
  onMenuAction, 
  onToggleLayer,
  onOpenWindow 
}) => {
  return (
    <>
      {/* Menu Bar */}
      <div className="xp-menubar">
        <MenuDropdown 
          title="File" 
          onAction={onMenuAction}
          items={[
            { label: 'New Map Project', action: 'file-new', shortcut: 'Ctrl+N' },
            { label: 'Open Project...', action: 'file-open', shortcut: 'Ctrl+O' },
            { label: 'Save Project', action: 'file-save', shortcut: 'Ctrl+S' },
            { type: 'separator' },
            { label: 'Export Map...', action: 'file-export' },
            { label: 'Print...', action: 'file-print', shortcut: 'Ctrl+P' },
            { type: 'separator' },
            { label: 'Exit', action: 'file-exit' }
          ]}
        />
        <MenuDropdown 
          title="Edit" 
          onAction={onMenuAction}
          items={[
            { label: 'Undo', action: 'edit-undo', shortcut: 'Ctrl+Z' },
            { label: 'Redo', action: 'edit-redo', shortcut: 'Ctrl+Y' },
            { type: 'separator' },
            { label: 'Select All', action: 'edit-select-all', shortcut: 'Ctrl+A' },
            { label: 'Clear Selection', action: 'edit-clear' }
          ]}
        />
        <MenuDropdown 
          title="View" 
          onAction={onMenuAction}
          items={[
            { label: 'Zoom In', action: 'view-zoom-in', shortcut: '+' },
            { label: 'Zoom Out', action: 'view-zoom-out', shortcut: '-' },
            { label: 'Fit to Window', action: 'view-fit', shortcut: 'Ctrl+0' },
            { type: 'separator' },
            { label: 'Full Screen', action: 'view-fullscreen', shortcut: 'F11' }
          ]}
        />
        <MenuDropdown 
          title="Tools" 
          onAction={onMenuAction}
          items={[
            { label: 'Add Marker', action: 'tools-marker' },
            { label: 'Measure Distance', action: 'tools-measure' },
            { label: 'Search Location', action: 'tools-search' },
            { type: 'separator' },
            { label: 'Settings...', action: 'tools-settings' }
          ]}
        />
        <MenuDropdown 
          title="Help" 
          onAction={onMenuAction}
          items={[
            { label: 'User Guide', action: 'help-guide' },
            { label: 'Keyboard Shortcuts', action: 'help-shortcuts' },
            { type: 'separator' },
            { label: 'About Embassy Map...', action: 'help-about' }
          ]}
        />
      </div>
      
      {/* Toolbar */}
      <div className="xp-toolbar">
        <XPButton icon={<XPIcons.DocumentIcon />}>New</XPButton>
        <XPButton icon={<XPIcons.FolderIcon />}>Open</XPButton>
        <XPButton icon={<XPIcons.SaveIcon />}>Save</XPButton>
        <div className="toolbar-separator" />
        <XPButton icon={<XPIcons.PlusIcon />}>Add Marker</XPButton>
        <XPButton icon={<XPIcons.ToolsIcon />}>Measure</XPButton>
        <XPButton icon={<XPIcons.SearchIcon />}>Search</XPButton>
        <div className="toolbar-separator" />
        <XPButton 
          icon={<XPIcons.LayersIcon />}
          onClick={() => onOpenWindow({
            type: 'layers',
            title: 'Layer Manager',
            width: 300,
            height: 400,
            x: 50,
            y: 100
          })}
        >
          Layers
        </XPButton>
        <XPButton 
          icon={<XPIcons.ChatIcon />}
          onClick={() => onOpenWindow({
            type: 'chat',
            title: 'Communications',
            width: 350,
            height: 450,
            x: window.innerWidth - 400,
            y: 100
          })}
        >
          Chat
        </XPButton>
      </div>
      
      {/* Main Content Area with Splitter */}
      <div style={{ flex: 1 }}>
        <XPSplitter defaultSizes={[20, 80]} minSizes={[15, 50]}>
          {/* Left Panel - Navigation Tree */}
          <div className="xp-panel">
            <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid var(--xp-dark-gray)' }}>
              Map Navigation
            </div>
            <XPTreeView
              data={[
                {
                  id: 'maps',
                  label: 'Map Projects',
                  icon: '🗺️',
                  children: [
                    { id: 'current', label: 'Current Project', icon: '📄' },
                    { id: 'recent', label: 'Recent Projects', icon: '📁' }
                  ]
                },
                {
                  id: 'bookmarks',
                  label: 'Bookmarks',
                  icon: '🔖',
                  children: [
                    { id: 'embassy1', label: 'US Embassy', icon: '🏛️' },
                    { id: 'embassy2', label: 'UK Embassy', icon: '🏛️' }
                  ]
                },
                {
                  id: 'tools',
                  label: 'Tools',
                  icon: '🔧',
                  children: [
                    { id: 'measure', label: 'Measure Tool', icon: '📏' },
                    { id: 'search', label: 'Search Tool', icon: '🔍' }
                  ]
                }
              ]}
              onSelect={(item) => console.log('Selected:', item)}
            />
          </div>
          
          {/* Right Panel - Map and Properties */}
          <XPSplitter direction="vertical" defaultSizes={[75, 25]}>
            {/* Map Area */}
            <div 
              className="map-container"
              onContextMenu={onMapContextMenu}
              style={{
                background: 'linear-gradient(135deg, #f0f8ff 0%, #cce7ff 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px inset var(--xp-gray)'
              }}
            >
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Embassy Map Interface</div>
                <div style={{ fontSize: '12px', marginTop: '10px' }}>
                  Right-click to add markers • Zoom: {mapData.zoom}%
                </div>
                <div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
                  Active layers: {mapData.layers.filter(l => l.visible).length}
                </div>
              </div>
              
              {/* Map Controls */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <XPButton size="small">+</XPButton>
                <XPButton size="small">−</XPButton>
              </div>
            </div>
            
            {/* Properties Panel */}
            <div className="xp-panel">
              <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid var(--xp-dark-gray)' }}>
                Map Properties
              </div>
              <div style={{ padding: '8px', fontSize: '11px' }}>
                <div><strong>Zoom:</strong> {mapData.zoom}%</div>
                <div><strong>Center:</strong> {mapData.center.lat.toFixed(4)}, {mapData.center.lng.toFixed(4)}</div>
                <div><strong>Markers:</strong> {mapData.markers.length}</div>
                <div><strong>Active Layers:</strong> {mapData.layers.filter(l => l.visible).length}</div>
              </div>
            </div>
          </XPSplitter>
        </XPSplitter>
      </div>
      
      {/* Status Bar */}
      <div className="xp-status-bar">
        <div>Ready</div>
        <div>Coordinates: {mapData.center.lat.toFixed(4)}°, {mapData.center.lng.toFixed(4)}°</div>
        <div>Zoom: {mapData.zoom}%</div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    </>
  );
};

// Dynamic window component for different window types
const DynamicWindow = ({ window, onClose, onFocus, mapData, onMapDataChange }) => {
  const renderContent = () => {
    switch (window.type) {
      case 'settings':
        return <SettingsWindow mapData={mapData} onMapDataChange={onMapDataChange} />;
      case 'layers':
        return <LayersWindow mapData={mapData} onMapDataChange={onMapDataChange} />;
      case 'chat':
        return <ChatWindow />;
      case 'about':
        return <AboutWindow />;
      case 'properties':
        return <PropertiesWindow />;
      default:
        return <div style={{ padding: '20px' }}>Unknown window type: {window.type}</div>;
    }
  };
  
  return (
    <XPWindow
      title={window.title}
      icon={window.icon}
      width={window.width}
      height={window.height}
      x={window.x}
      y={window.y}
      onClose={onClose}
      onFocus={onFocus}
      style={{ zIndex: window.zIndex }}
    >
      {renderContent()}
    </XPWindow>
  );
};

// Settings window content
const SettingsWindow = ({ mapData, onMapDataChange }) => {
  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '12px' }}>Map Settings</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Default Zoom Level:</label>
        <input
          type="range"
          min="25"
          max="400"
          value={mapData.zoom}
          onChange={(e) => onMapDataChange(prev => ({ ...prev, zoom: parseInt(e.target.value) }))}
          style={{ width: '100%', marginTop: '4px' }}
        />
        <div style={{ fontSize: '10px', color: '#666' }}>{mapData.zoom}%</div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Map Theme:</label>
        <select style={{ width: '100%', marginTop: '4px' }} className="xp-input">
          <option>Satellite</option>
          <option>Street Map</option>
          <option>Terrain</option>
          <option>Hybrid</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label>
          <input type="checkbox" style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '11px' }}>Show grid lines</span>
        </label>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label>
          <input type="checkbox" style={{ marginRight: '6px' }} />
          <span style={{ fontSize: '11px' }}>Enable sound effects</span>
        </label>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <XPButton variant="primary">Apply</XPButton>
        <XPButton style={{ marginLeft: '8px' }}>Cancel</XPButton>
      </div>
    </div>
  );
};

// Layers window content
const LayersWindow = ({ mapData, onMapDataChange }) => {
  const toggleLayer = (layerId) => {
    onMapDataChange(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId && !layer.locked
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    }));
  };
  
  return (
    <div>
      <div style={{ padding: '8px', fontWeight: 'bold', borderBottom: '1px solid var(--xp-dark-gray)' }}>
        Available Layers
      </div>
      {mapData.layers.map(layer => (
        <div
          key={layer.id}
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            cursor: layer.locked ? 'not-allowed' : 'pointer',
            opacity: layer.locked ? 0.6 : 1
          }}
          onClick={() => !layer.locked && toggleLayer(layer.id)}
        >
          <input
            type="checkbox"
            checked={layer.visible}
            disabled={layer.locked}
            style={{ marginRight: '8px' }}
            readOnly
          />
          <span style={{ fontSize: '11px' }}>
            {layer.name}
            {layer.locked && ' (locked)'}
          </span>
        </div>
      ))}
    </div>
  );
};

// Simple chat window
const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: 'Secure communications initialized.', time: '14:30' },
    { id: 2, user: 'Agent', text: 'Embassy perimeter secure.', time: '14:31' }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  const sendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: 'You',
        text: inputValue,
        time: new Date().toLocaleTimeString().slice(0, 5)
      }]);
      setInputValue('');
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ 
        flex: 1, 
        padding: '8px', 
        overflow: 'auto',
        background: 'white',
        border: '2px inset var(--xp-gray)',
        margin: '8px'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '8px', fontSize: '11px' }}>
            <strong>{msg.user}</strong> <span style={{ color: '#666' }}>({msg.time})</span>
            <div>{msg.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px', display: 'flex', gap: '4px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type message..."
          style={{ flex: 1 }}
          className="xp-input"
        />
        <XPButton onClick={sendMessage}>Send</XPButton>
      </div>
    </div>
  );
};

// About window
const AboutWindow = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🗺️</div>
    <h2 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Embassy Map System</h2>
    <div style={{ fontSize: '11px', color: '#666', marginBottom: '20px' }}>
      Version 1.0.0 (Windows XP Style)
    </div>
    <div style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '20px' }}>
      A comprehensive mapping solution for embassy operations and security management.
      Built with React and styled with authentic Windows XP aesthetics.
    </div>
    <XPButton variant="primary">OK</XPButton>
  </div>
);

// Properties window
const PropertiesWindow = () => (
  <div style={{ padding: '12px' }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '12px' }}>Map Properties</h3>
    <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
      <div><strong>Map Type:</strong> Satellite Imagery</div>
      <div><strong>Projection:</strong> Web Mercator</div>
      <div><strong>Coordinate System:</strong> WGS84</div>
      <div><strong>Resolution:</strong> High (1m/pixel)</div>
      <div><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</div>
    </div>
  </div>
);

// Menu dropdown component
const MenuDropdown = ({ title, items, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div style={{ position: 'relative' }}>
      <div 
        className="menu-item"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {title}
      </div>
      
      {isOpen && (
        <div 
          className="dropdown-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'var(--xp-window-bg)',
            border: '2px outset var(--xp-gray)',
            boxShadow: 'var(--xp-shadow)',
            minWidth: '180px',
            zIndex: 1000
          }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {items.map((item, index) => (
            item.type === 'separator' ? (
              <div key={index} style={{ height: '1px', background: 'var(--xp-dark-gray)', margin: '2px 4px' }} />
            ) : (
              <div
                key={index}
                style={{
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
                onClick={() => {
                  onAction(item.action);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--xp-selected-gradient)';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--xp-black)';
                }}
              >
                <span>{item.label}</span>
                {item.shortcut && <span style={{ fontSize: '10px', color: '#666' }}>{item.shortcut}</span>}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default CompleteXPMapInterface;