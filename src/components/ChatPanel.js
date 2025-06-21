import React, { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';
import { CloseIcon } from '../icons/XPIcons.js';

const ChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'system', 
      text: '🚨 Israel Emergency Safety Bot initialized. Ask about safety locations, emergency procedures, or current threats.', 
      timestamp: new Date().toLocaleTimeString() 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.response,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        text: `❌ Connection error: ${error.message}. Make sure the API server is running on http://localhost:8000`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageClass = (type) => {
    switch (type) {
      case 'user': return 'message-user';
      case 'bot': return 'message-bot';
      case 'system': return 'message-system';
      case 'error': return 'message-error';
      default: return '';
    }
  };

  return (
    <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <h3>🚨 Emergency Safety Chat</h3>
        <button className="close-chat-btn" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <div className="chat-body">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${getMessageClass(message.type)}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">{message.timestamp}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message message-bot">
              <div className="message-content">
                <div className="message-text loading">🤖 Analyzing emergency query...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="chat-footer">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about safety locations, emergencies..." 
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;