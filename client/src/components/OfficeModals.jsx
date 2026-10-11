import React from 'react';

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
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }) {
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
            <label>Proximity Distance</label>
            <input type="range" min="100" max="400" defaultValue="240" className="setting-slider" />
            <span className="setting-help">Adjust how close you need to be to hear conversations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
