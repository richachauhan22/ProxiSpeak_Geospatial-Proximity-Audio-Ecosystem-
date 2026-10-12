import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export default function ChatDrawer({ isOpen, onClose, officeId }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Alex', time: '09:02', text: 'Hey everyone, working on the Q3 roadmap today in zone C!' },
    { id: 2, sender: 'Marcus', time: '09:04', text: 'Sounds great Alex, David and I are reviewing the design mocks here.' },
    { id: 3, sender: 'David', time: '09:05', text: 'Feel free to stop by desk 4 if anyone wants to chime in.' },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playClick();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Mia',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: inputText.trim(),
        isMe: true,
      },
    ]);
    setInputText('');
  };

  return (
    <aside className="ovice-drawer chat-drawer open" aria-label="Chat messages">
      <div className="drawer-header">
        <div className="drawer-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <h2>Office Chat</h2>
        </div>
        <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      <div className="drawer-content chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble-row ${m.isMe ? 'outgoing' : 'incoming'}`}>
            <div className="chat-bubble-meta">
              <span className="chat-sender">{m.sender}</span>
              <span className="chat-time">{m.time}</span>
            </div>
            <div className="chat-bubble-text">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message to the office…"
          aria-label="Message input"
        />
        <button type="submit" className="chat-send-btn" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
