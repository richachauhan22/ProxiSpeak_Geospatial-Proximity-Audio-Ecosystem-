import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export function CalendarModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upcoming Office Events</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="event-item">
            <span className="event-time">10:00 - 10:30 AM</span>
            <div className="event-desc">
              <strong>Weekly All-Hands</strong>
              <p>Main Stage · Zone C</p>
            </div>
          </div>
          <div className="event-item">
            <span className="event-time">02:00 - 02:45 PM</span>
            <div className="event-desc">
              <strong>Product Design Sync</strong>
              <p>Conference Room C-03</p>
            </div>
          </div>
          <div className="event-item">
            <span className="event-time">04:30 - 05:00 PM</span>
            <div className="event-desc">
              <strong>ProxiSpeak Team Standup</strong>
              <p>Open Workspace Cluster</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Notifications</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="notification-row">
            <span className="notif-bullet" />
            <p><strong>David</strong> invited you to join the design huddle at Desk 5.</p>
          </div>
          <div className="notification-row">
            <span className="notif-bullet" />
            <p>Room <strong>C-03</strong> audio channel is optimal with 12ms latency.</p>
          </div>
          <div className="notification-row">
            <span className="notif-bullet" />
            <p>Welcome to <strong>ProxiSpeak</strong>! Walk near teammates to begin spatial audio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, onLeaveOffice }) {
  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Audio & Workspace Settings</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="setting-group">
            <label>Microphone Device</label>
            <select className="setting-select" defaultValue="default">
              <option value="default">Default - High Definition Audio</option>
              <option value="headset">External Headset Mic</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Camera Device</label>
            <select className="setting-select" defaultValue="default">
              <option value="default">HD Web Camera (1080p)</option>
              <option value="obs">Virtual Camera</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Proximity Distance Range</label>
            <input type="range" min="100" max="400" defaultValue="240" className="setting-slider" />
            <span className="setting-help">Adjust how close avatars need to be to activate spatial audio.</span>
          </div>

          {onLeaveOffice && (
            <div className="modal-danger-section">
              <h4>Session Management</h4>
              <button
                type="button"
                className="leave-office-btn"
                onClick={() => {
                  onClose();
                  onLeaveOffice();
                }}
              >
                🚪 Leave Virtual Office
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>How to Navigate ProxiSpeak</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body help-grid">
          <div className="help-card">
            <div className="help-icon">⌨️</div>
            <strong>Keyboard Movement</strong>
            <p>Use <strong>WASD</strong> or <strong>Arrow keys</strong> to walk your avatar smoothly in 8 directions.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖱️</div>
            <strong>Click to Walk</strong>
            <p>Click anywhere on the floor to send your avatar directly to that spot.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖐️</div>
            <strong>Pan the Office</strong>
            <p>Click and drag anywhere on empty floor space to explore different zones.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🔍</div>
            <strong>Zoom & Recenter</strong>
            <p>Use <strong>+ / -</strong> buttons or scroll wheel to zoom. Click <strong>◇</strong> to snap back to your avatar.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🎧</div>
            <strong>Proximity Audio</strong>
            <p>Walk within range of teammates to connect audio channels and hear each other.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">💬</div>
            <strong>Chat & Reactions</strong>
            <p>Send text messages in the drawer or tap emojis to pop reactions above your head.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickToolsModal({ isOpen, onClose }) {
  const [screenSharing, setScreenSharing] = useState(false);
  const [noteText, setNoteText] = useState('Meeting Agenda:\n1. Sprint progress\n2. Spatial audio architecture\n3. Demo walkthrough');
  const [activeTab, setActiveTab] = useState('notes');

  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal quick-tools-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Workspace Tools</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="quick-tools-tabs">
          <button
            type="button"
            className={activeTab === 'notes' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('notes')}
          >
            📝 Shared Notes
          </button>
          <button
            type="button"
            className={activeTab === 'screen' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('screen')}
          >
            🖥️ Screen Share
          </button>
          <button
            type="button"
            className={activeTab === 'broadcast' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('broadcast')}
          >
            📢 Announcement
          </button>
        </div>
        <div className="modal-body">
          {activeTab === 'notes' && (
            <div className="notes-container">
              <label>Shared Desk Scratchpad:</label>
              <textarea
                className="shared-notes-area"
                rows={6}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type office notes here..."
              />
              <span className="setting-help">Notes are shared in real-time with people in your zone.</span>
            </div>
          )}
          {activeTab === 'screen' && (
            <div className="screen-share-container">
              <div className={`screen-preview-box ${screenSharing ? 'live' : ''}`}>
                {screenSharing ? (
                  <div className="screen-live-content">
                    <span className="live-pill">🔴 SHARING DESKTOP (PROXISPEAK HQ)</span>
                    <p>Participants in your audio proximity can now see your screen stream.</p>
                  </div>
                ) : (
                  <div className="screen-idle-content">
                    <span>🖥️</span>
                    <p>Share your window, tab, or entire display with teammates.</p>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={`screen-toggle-btn ${screenSharing ? 'active' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setScreenSharing((s) => !s);
                }}
              >
                {screenSharing ? 'Stop Screen Sharing' : 'Start Screen Sharing'}
              </button>
            </div>
          )}
          {activeTab === 'broadcast' && (
            <div className="broadcast-container">
              <p>Send an audible chime and announcement to everyone currently on Floor 6.</p>
              <button
                type="button"
                className="broadcast-btn"
                onClick={() => {
                  sounds.playFloorChime();
                  alert('Floor chime broadcasted to all active participants!');
                }}
              >
                🔔 Ring Office Bell
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LeaveConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal leave-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Leave Virtual Office?</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to exit the virtual workspace? Your avatar will leave the floor and disconnect from teammates.</p>
          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Stay in Office
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Exit to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
