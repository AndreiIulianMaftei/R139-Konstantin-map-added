// src/components/MapInterface.js
import React, { useState } from 'react';
import { XPWindow } from './common/XPWindow';
import { XPButton } from './common/XPButton';
import { XPTabs } from './common/XPTabs';
import { XPDropdown } from './common/XPDropdown';
import { useXPDialog } from '../hooks/useXPDialog';
import MapContainer from './MapContainer';
import ActionToolbar from './ActionToolbar';
import ChatPanel from './ChatPanel';
import LayersPanel from './map/LayersPanel';

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
    {/* Temporarily commented out until MenuDropdown is created
      <div className="xp-menubar">
      <MenuDropdown title="File" items={[...]} />
      <MenuDropdown title="View" items={[...]} />
      <MenuDropdown title="Tools" items={[...]} />
      </div>
    */}

    <div style={{ padding: '20px' }}>
      <h3>Map Interface Content</h3>
      <button onClick={onSettingsClick}>Settings</button>
      <button onClick={onExportClick}>Export</button>
        
      {/* Your other content here */}
      <MapContainer />
      <ActionToolbar />
      <ChatPanel />
      <LayersPanel />
      </div>
    </>
  );

}
export default MapInterface;