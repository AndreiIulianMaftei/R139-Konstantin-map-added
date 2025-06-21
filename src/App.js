// src/App.js
import React from 'react';
import { XPDialogProvider } from './components/common/XPDialog';
import MapInterface from './components/MapInterface';
import './styles/index.css';
import './styles/xp-components.css';

function App() {
  return (
    <XPDialogProvider>
      <div className="xp-application">
        <MapInterface />
      </div>
    </XPDialogProvider>
  );
}

export default App;