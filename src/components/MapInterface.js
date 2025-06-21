// src/components/MapInterface.js
import React, { useState } from 'react';
import { XPWindow } from './common/XPWindow';
import { XPButton } from './common/XPButton';
import { XPTabs } from './common/XPTabs';
import { XPDropdown } from './common/XPDropdown';
import { useXPDialog } from './common/XPDialog';
import MapContainer from './MapContainer';
import ActionToolbar from './ActionToolbar';
import ChatPanel from './ChatPanel';
import LayersPanel from './LayersPanel';

const MapInterface = () => {
  const [activeWindows, setActiveWindows] = useState([]);
  const [mapSettings, setMapSettings] = useState({
    theme: 'satellite',
    zoom: 100,
    showGrid: false,
    showCompass: true
  });
  const { showDialog } = useXPDialog();

  const openWindow = (windowConfig) => {
    const newWindow = {
      id: Date.now(),
      ...windowConfig
    };
    setActiveWindows(prev => [...prev, newWindow]);
  };

  const closeWindow = (windowId) => {
    setActiveWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const handleSettingsClick = () => {
    openWindow({
      type: 'settings',
      title: 'Map Settings',
      width: 400,
      height: 300,
      x: 200,
      y: 150
    });
  };

  const handleExportClick = async () => {
    const result = await showDialog({
      title: 'Export Map',
      message: 'Choose export format:',
      type: 'question',
      buttons: ['PNG Image', 'PDF Document', 'Cancel']
    });

    if (result.button === 'PNG Image') {
      console.log('Exporting as PNG...');
    } else if (result.button === 'PDF Document') {
      console.log('Exporting as PDF...');
    }
  };

  return (
    <div className="map-interface">
      {/* Desktop Background */}
      <div className="xp-desktop">
        
        {/* Main Map Window */}
        <XPWindow
          title="Embassy Map System"
          icon="🗺️"
          width={window.innerWidth - 40}
          height={window.innerHeight - 80}
          x={20}
          y={20}
          maximizable
          minimizable
          resizable
          onClose={() => window.close()}
        >
          <MapInterfaceContent 
            mapSettings={mapSettings}
            onSettingsClick={handleSettingsClick}
            onExportClick={handleExportClick}
          />
        </XPWindow>

        {/* Dynamic Windows */}
        {activeWindows.map(window => (
          <DynamicWindow
            key={window.id}
            window={window}
            onClose={() => closeWindow(window.id)}
            mapSettings={mapSettings}
            onSettingsChange={setMapSettings}
          />
        ))}

        {/* Desktop Icons */}
        <DesktopIcons onOpenWindow={openWindow} />
      </div>
    </div>
  );
};

// Main interface content
const MapInterfaceContent = ({ mapSettings, onSettingsClick, onExportClick }) => {
  const [isChatOpen, setChatOpen] = useState(false);
  const [isLayersOpen, setLayersOpen] = useState(false);

  return (
    <>
      {/* Menu Bar */}
      <div className="xp-menubar">
        <MenuDropdown title="File" items={[
          { label: 'New Map', action: 'new', icon: '📄' },
          { label: 'Open Map...', action: 'open', icon: '📂' },
          { label: 'Save Map', action: 'save', icon: '💾' },
          { label: '-' },
          { label: 'Export...', action: 'export', icon: '📤' },
          { label: 'Print...', action: 'print', icon: '🖨️' },
          { label: '-' },
          { label: 'Exit', action: 'exit' }
        ]} onAction={(action) => {
          if (action === 'export') onExportClick();
        }} />
        
        <MenuDropdown title="View" items={[
          { label: 'Zoom In', action: 'zoom-in', shortcut: 'Ctrl++' },
          { label: 'Zoom Out', action: 'zoom-out', shortcut: 'Ctrl+-' },
          { label: 'Fit to Window', action: 'fit' },
          { label: '-' },
          { label: 'Show Grid', action: 'grid', checked: mapSettings.showGrid },
          { label: 'Show Compass', action: 'compass', checked: mapSettings.showCompass }
        ]} />
        
        <MenuDropdown title="Tools" items={[
          { label: 'Settings...', action: 'settings' }
        ]} onAction={(action) => {
          if (action === 'settings') onSettingsClick();
        }} />
      </div>

      {/* Toolbar */}
      <ActionToolbar 
        onToggleChat={() => setChatOpen(!isChatOpen)}
        onToggleLayers={() => setLayersOpen(!isLayersOpen)}
      />

      {/* Map Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer settings={mapSettings} />
        
        {isChatOpen && (
          <ChatPanel 
            isOpen={isChatOpen}
            onClose={() => setChatOpen(false)}
          />
        )}
        
        {isLayersOpen && (
          <LayersPanel
            isOpen={isLayersOpen}
            onClose={() => setLayersOpen(false)}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="xp-status-bar">
        <div>Ready</div>
        <div>Zoom: {mapSettings.zoom}%</div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    </>
  );
};