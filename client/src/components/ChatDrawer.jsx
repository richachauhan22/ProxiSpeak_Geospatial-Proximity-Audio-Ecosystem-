import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../services/soundEffects';

export default function ChatDrawer({ isOpen, onClose, officeId, localUser }) {
  const [activeTab, setActiveTab] = useState('all');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Alex',
      avatarUrl: '/avatar_alex.png',
      time: '09:02',
      text: 'Good morning! Working on the spatial audio mesh today in Cluster C.',
      reactions: ['👋 2', '🔥 1'],
    },
    {
      id: 2,
      sender: 'Marcus',
      avatarUrl: '/avatar_marcus.png',
      time: '09:04',
      text: 'Sounds great Alex, David and I are reviewing the high-DPI canvas layouts here.',
      reactions: ['👍 3'],
    },
    {
      id: 3,
      sender: 'David',
      avatarUrl: '/avatar_david.png',
      time: '09:05',
      text: 'Feel free to stop by desk 4 if anyone wants to chime in or review together.',
      reactions: ['☕ 1'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const currentSender = localUser?.displayName || 'You';

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playClick();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: currentSender,
        avatarUrl: localUser?.photoUrl || '/avatar_mia.png',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: inputText.trim(),
        isMe: true,
        reactions: [],
      },
    ]);
    setInputText('');
  };

  const addReaction = (msgId, emoji) => {
    sounds.playReactionPop();
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const existing = m.reactions || [];
        return {
          ...m,
          reactions: [...existing, `${emoji} 1`],
        };
      })
    );
  };

  return (
    <aside className="ovice-drawer chat-drawer open modern-drawer glass-panel" aria-label="Office chat">
      <div className="drawer-header modern-drawer-header">
        <div className="drawer-title">
          <div className="drawer-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div>
            <h2>Office Chat</h2>
            <span className="drawer-subtitle">{officeId}</span>
          </div>
        </div>
        <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      {/* Tabs */}
      <div className="chat-tab-bar">
        <button
          type="button"
          className={`chat-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>Floor Chat</span>
          <span className="tab-badge">{messages.length}</span>
        </button>
        <button
          type="button"
          className={`chat-tab-btn ${activeTab === 'whisper' ? 'active' : ''}`}
          onClick={() => setActiveTab('whisper')}
        >
          <span>Nearby Zone</span>
        </button>
      </div>

      <div className="drawer-content chat-messages modern-chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`chat-message-row ${m.isMe ? 'outgoing' : 'incoming'}`}>
            {!m.isMe && (
              <div className="msg-avatar-thumb">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.sender} />
                ) : (
                  <span>{m.sender.slice(0, 1)}</span>
                )}
              </div>
            )}
            <div className="msg-bubble-wrap">
              <div className="chat-bubble-meta">
                <span className="chat-sender">{m.sender}</span>
                <span className="chat-time">{m.time}</span>
              </div>
              <div className="chat-bubble-text">{m.text}</div>

              {/* Reactions row */}
              <div className="msg-reactions-row">
                {(m.reactions || []).map((rx, idx) => (
                  <span key={idx} className="rx-pill">{rx}</span>
                ))}
                <button
                  type="button"
                  className="quick-react-btn"
                  onClick={() => addReaction(m.id, '❤️')}
                  title="React with love"
                >
                  +❤️
                </button>
                <button
                  type="button"
                  className="quick-react-btn"
                  onClick={() => addReaction(m.id, '👍')}
                  title="React with thumbs up"
                >
                  +👍
                </button>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form className="chat-input-row modern-chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${officeId} as ${currentSender}…`}
          aria-label="Message input"
          className="chat-field"
        />
        <button type="submit" className="chat-send-btn modern-send-btn" aria-label="Send message" disabled={!inputText.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </aside>
  );
}
