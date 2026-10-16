import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export function CalendarModal({ isOpen, onClose, onJoinMeetingArea }) {
  if (!isOpen) return null;

  const events = [
    {
      id: 1,
      time: '10:00 - 10:30 AM',
      title: 'Weekly Office All-Hands',
      location: 'Main Stage · Zone C',
      attendees: '12 attending',
      isLive: true,
      x: 1068,
      y: 500,
    },
    {
      id: 2,
      time: '02:00 - 02:45 PM',
      title: 'Product & Spatial Audio Sync',
      location: 'Conference Pod C-03',
      attendees: '5 attending',
      isLive: false,
      x: 692,
      y: 498,
    },
    {
      id: 3,
      time: '04:30 - 05:00 PM',
      title: 'Engineering Demo & Standup',
      location: 'Open Workspace Cluster',
      attendees: '8 attending',
      isLive: false,
      x: 276,
      y: 164,
    },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📅</span>
            <div>
              <h3>Office Calendar & Events</h3>
              <span className="modal-subtitle">Floor 6 scheduled gatherings</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="events-timeline">
            {events.map((ev) => (
              <div key={ev.id} className={`event-card-item ${ev.isLive ? 'is-live' : ''}`}>
                <div className="event-time-col">
                  <span className="event-time">{ev.time}</span>
                  {ev.isLive && <span className="live-pill">HAPPENING NOW</span>}
                </div>
                <div className="event-desc-col">
                  <strong>{ev.title}</strong>
                  <p className="event-loc">📍 {ev.location} • {ev.attendees}</p>
                </div>
                {onJoinMeetingArea && (
                  <button
                    type="button"
                    className="event-walk-btn"
                    onClick={() => {
                      onJoinMeetingArea(ev.x, ev.y);
                      onClose();
                    }}
                  >
                    Walk to Pod
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const notifs = [
    {
      id: 1,
      sender: 'David',
      text: 'invited you to join the design huddle at Desk Cluster 4.',
      time: '5m ago',
      unread: true,
      icon: '💬',
    },
    {
      id: 2,
      sender: 'System',
      text: 'Floor 6 WebRTC audio channel is optimal with 14ms latency.',
      time: '12m ago',
      unread: true,
      icon: '⚡',
    },
    {
      id: 3,
      sender: 'Alex',
      text: 'stepped into your spatial audio range.',
      time: '25m ago',
      unread: false,
      icon: '🎙️',
    },
    {
      id: 4,
      sender: 'ProxiSpeak HQ',
      text: 'ProxiSpeak 2.0 Spatial Engine updated successfully.',
      time: '1h ago',
      unread: false,
      icon: '✨',
    },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🔔</span>
            <div>
              <h3>Notifications</h3>
              <span className="modal-subtitle">Activity & workspace mentions</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body notifs-list">
          {notifs.map((n) => (
            <div key={n.id} className={`notification-card ${n.unread ? 'unread' : ''}`}>
              <span className="notif-type-icon">{n.icon}</span>
              <div className="notif-content">
                <p>
                  <strong>{n.sender}</strong> {n.text}
                </p>
                <span className="notif-timestamp">{n.time}</span>
              </div>
              {n.unread && <span className="notif-dot-beacon" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, onLeaveOffice }) {
  const [proximityDistance, setProximityDistance] = useState(240);
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⚙️</span>
            <div>
              <h3>Workspace & Audio Settings</h3>
              <span className="modal-subtitle">Configure devices and spatial parameters</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body settings-body">
          <div className="setting-group">
            <label>Microphone Device</label>
            <select className="setting-select" defaultValue="default">
              <option value="default">Default — High Definition Audio Device</option>
              <option value="headset">External Headset Microphone (Pro Studio)</option>
              <option value="airpods">Bluetooth Audio Input</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Camera Device</label>
            <select className="setting-select" defaultValue="default">
              <option value="default">HD Web Camera (1080p 60fps)</option>
              <option value="obs">OBS Virtual Camera</option>
            </select>
          </div>

          <div className="setting-group">
            <div className="slider-label-row">
              <label>Spatial Proximity Audio Falloff</label>
              <strong>{proximityDistance} px radius</strong>
            </div>
            <input
              type="range"
              min="100"
              max="400"
              value={proximityDistance}
              onChange={(e) => setProximityDistance(Number(e.target.value))}
              className="modern-range-slider"
            />
            <span className="setting-help">
              Controls the physical radius in pixels where your avatar begins hearing nearby conversations.
            </span>
          </div>

          <div className="settings-toggle-grid">
            <div className="toggle-item">
              <div>
                <strong>3D Spatial Panning</strong>
                <p>Pan sound to left/right ear according to position</p>
              </div>
              <input
                type="checkbox"
                checked={spatialAudioEnabled}
                onChange={(e) => setSpatialAudioEnabled(e.target.checked)}
                className="modern-switch"
              />
            </div>

            <div className="toggle-item">
              <div>
                <strong>Interactive Chimes & Sounds</strong>
                <p>Play audio feedback when entering zones or reacting</p>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="modern-switch"
              />
            </div>
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
                <span>🚪 Leave Virtual Office</span>
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
      <div className="ovice-modal help-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⌨️</span>
            <div>
              <h3>Movement & Shortcuts Guide</h3>
              <span className="modal-subtitle">Effortlessly navigate the ProxiSpeak ecosystem</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body help-grid">
          <div className="help-card">
            <div className="help-icon">🧭</div>
            <strong>WASD & Arrow Keys</strong>
            <p>Walk smoothly in 8 directions across desks, lounges, and conference rooms.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖱️</div>
            <strong>Click to Walk</strong>
            <p>Click anywhere on the floor map. Your avatar will pathfind directly to that spot.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖐️</div>
            <strong>Drag to Pan Floor</strong>
            <p>Click and drag empty floor spaces to pan your view across the expansive 1440x894 canvas.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🎙️</div>
            <strong>Proximity Zone Audio</strong>
            <p>Walk within 260px of any speaking teammate to hear them loud and clear.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🗺️</div>
            <strong>Radar Mini-Map (M)</strong>
            <p>Toggle the radar mini-map to see the full floor overview and click to teleport.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🎯</div>
            <strong>Recenter Avatar</strong>
            <p>Click the target icon in the bottom dock to instantly snap the camera back to yourself.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickToolsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tools = [
    { title: 'Interactive Whiteboard', desc: 'Collaborative sketching canvas for brainstorming', icon: '🎨' },
    { title: 'Sticky Notes Wall', desc: 'Pin thoughts, tasks and feedback to this floor', icon: '📝' },
    { title: 'Screen Broadcast Pod', desc: 'Share your screen with the entire floor', icon: '🖥️' },
    { title: 'Auditorium Megaphone', desc: 'Broadcast announcement audio to all rooms', icon: '📢' },
    { title: 'Quick Poll', desc: 'Launch a quick vote for teammates in your zone', icon: '📊' },
    { title: 'Coffee Break Timer', desc: 'Start a 10-minute focus or rest timer', icon: '☕' },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🛠️</span>
            <div>
              <h3>Workspace Tools & Widgets</h3>
              <span className="modal-subtitle">Add interactive collaboration tools to Floor 6</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="tools-grid">
            {tools.map((t, idx) => (
              <div
                key={idx}
                className="tool-card"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
              >
                <span className="tool-icon">{t.icon}</span>
                <div className="tool-text">
                  <strong>{t.title}</strong>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaveConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal confirm-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-circle">🚪</div>
        <h3>Leave Virtual Office?</h3>
        <p>You will disconnect from the spatial audio mesh and step out of Floor 6. Your presence will be removed from teammates' screens.</p>
        <div className="confirm-buttons">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Stay in Office
          </button>
          <button type="button" className="danger-btn" onClick={onConfirm}>
            Leave Office
          </button>
        </div>
      </div>
    </div>
  );
}
