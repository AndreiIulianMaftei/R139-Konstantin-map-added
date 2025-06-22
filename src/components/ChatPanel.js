// src/components/ChatPanel.js
import React, { useState } from 'react';
import { CloseIcon } from '../icons/XPIcons';

const ChatPanel = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'System',
      text: 'Chat interface initialized.',
      time: '12:34 PM',
      type: 'system'
    },
    {
      id: 2,
      sender: 'User',
      text: 'Map interface ready for operations.',
      time: '12:35 PM',
      type: 'user'
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'User',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'user'
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <span>🔒 Secure Communications</span>
        <button className="control-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      
      <div className="chat-body">
        {messages.map((msg) => (
          <div key={msg.id} style={{
            padding: '8px',
            borderBottom: '1px solid #d0d0d0',
            backgroundColor: msg.type === 'system' ? '#f0f8ff' : 'transparent'
          }}>
            <div style={{ fontWeight: 'bold', color: msg.type === 'system' ? '#0054e3' : '#000' }}>
              {msg.sender}:
            </div>
            <div style={{ marginTop: '2px' }}>
              {msg.text}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: 'var(--xp-dark-gray)', 
              marginTop: '4px' 
            }}>
              {msg.time}
            </div>
          </div>
        ))}
      </div>
      
      <div className="chat-footer">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className="xp-button primary" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;