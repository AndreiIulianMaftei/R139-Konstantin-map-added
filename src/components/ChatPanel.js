import React from 'react';
import './ChatPanel.css';
import { CloseIcon } from './icons/CloseIcon.js';

const ChatPanel = ({ isOpen, onClose }) => {
  return (
    <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h3>Secure Communications</h3>
        <button className="close-chat-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="chat-body">
        <p>Chat interface goes here.</p>
        <p>Messages will be listed in this area.</p>
      </div>
      <div className="chat-footer">
          <input type="text" placeholder="Type a message..." />
          <button>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;