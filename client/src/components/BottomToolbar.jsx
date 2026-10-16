import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export default function BottomToolbar({
  localUser,
  zoomLevel = 100,
  onZoomChange,
  onRecenter,
  onToggleMute,
  onToggleVideo,
  isMuted = false,
  isVideoOn = true,
  onReaction,
  onOpenSettings,
  onOpenAddMenu,
  onToggleMiniMap,
  onLeaveOffice,
  onOpenHelp,
  miniMapOpen = false,
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Available');

  const emojis = ['❤️', '👍', '👏', '🎉', '🔥', '😄'];

  const handleEmojiClick = (emoji) => {
    sounds.playReactionPop();
    if (onReaction) onReaction(emoji);
    setReactionsOpen(false);
  };

  const handleZoomOut = () => {
    sounds.playClick();
    if (onZoomChange) onZoomChange(Math.max(60, zoomLevel - 10));
  };

  const handleZoomIn = () => {
    sounds.playClick();
    if (onZoomChange) onZoomChange(Math.min(150, zoomLevel + 10));
  };

  return (
    <div className="ovice-bottom-controls" role="toolbar" aria-label="Office controls">
      {/* ================= LEFT PILL: Profile & Communication ================= */}
      <div className="toolbar-pill pill-communication">
        {/* User Presence & Avatar */}
        <div
          className="pill-user-profile"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          title="Change status"
        >
          <div className="user-avatar-wrap">
            <img
              src={localUser?.photoUrl || '/avatar_mia.png'}
              alt={localUser?.displayName || 'Mia'}
              className="user-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="user-avatar-fallback">
              {localUser?.displayName?.slice(0, 1).toUpperCase() || 'M'}
            </span>
            <span className={`user-status-dot ${userStatus.toLowerCase()}`} />
          </div>

          <div className="user-meta">
            <span className="user-name">{localUser?.displayName || 'Mia'}</span>
            <span className="user-status-label">{userStatus}</span>
          </div>
        </div>

        {profileMenuOpen && (
          <div className="profile-status-dropdown">
            <div className="dropdown-header">Presence Status</div>
            {['Available', 'Busy', 'In focus', 'Away'].map((st) => (
              <button
                key={st}
                type="button"
                className={`status-opt ${userStatus === st ? 'active' : ''}`}
                onClick={() => {
                  setUserStatus(st);
                  setProfileMenuOpen(false);
                }}
              >
                <span className={`status-bullet ${st.toLowerCase()}`} />
                <span>{st}</span>
              </button>
            ))}
            <div className="dropdown-separator" />
            <button
              type="button"
              className="status-opt opt-action"
              onClick={() => {
                setProfileMenuOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
            >
              <span>⚙️ Audio & Settings</span>
            </button>
            <button
              type="button"
              className="status-opt opt-action"
              onClick={() => {
                setProfileMenuOpen(false);
                if (onOpenHelp) onOpenHelp();
              }}
            >
              <span>❓ Movement Help</span>
            </button>
            {onLeaveOffice && (
              <button
                type="button"
                className="status-opt opt-leave"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLeaveOffice();
                }}
              >
                <span>🚪 Leave Office</span>
              </button>
            )}
          </div>
        )}

        <span className="pill-divider" />

        {/* Microphone Toggle Button */}
        <button
          type="button"
          className={`pill-btn mic-btn ${isMuted ? 'muted' : 'active'}`}
          onClick={() => {
            sounds.playClick();
            if (onToggleMute) onToggleMute();
          }}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Video Camera Toggle Button (Rounded blue active box as in screenshot!) */}
        <button
          type="button"
          className={`pill-btn video-btn ${isVideoOn ? 'camera-active' : ''}`}
          onClick={() => {
            sounds.playClick();
            if (onToggleVideo) onToggleVideo();
          }}
          aria-label={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          title={isVideoOn ? 'Camera on' : 'Camera off'}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="pill-btn settings-btn"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Emoji Reaction Button */}
        <div className="reaction-trigger-wrap">
          <button
            type="button"
            className="pill-btn reaction-btn"
            onClick={() => setReactionsOpen((prev) => !prev)}
            aria-label="Reactions"
            title="Emoji reaction"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {reactionsOpen && (
            <div className="reactions-float-picker">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="reaction-emoji-btn"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Plus / Add Tool Button */}
        <button
          type="button"
          className="pill-btn add-btn"
          onClick={onOpenAddMenu}
          aria-label="More tools"
          title="More tools"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ================= RIGHT PILL: Map & Zoom Controls ================= */}
      <div className="toolbar-pill pill-map-zoom">
        {/* Map toggle */}
        <button
          type="button"
          className={`pill-btn map-btn ${miniMapOpen ? 'active' : ''}`}
          onClick={onToggleMiniMap}
          aria-label="Mini-map"
          title="Toggle mini-map"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>

        {/* Recenter Target ◇ */}
        <button
          type="button"
          className="pill-btn target-btn"
          onClick={() => {
            sounds.playClick();
            if (onRecenter) onRecenter();
          }}
          aria-label="Recenter on your avatar"
          title="Recenter view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 12 12 22 2 12 12 2" />
            <circle cx="12" cy="12" r="2" fill="#475569" />
          </svg>
        </button>

        {/* Zoom Out - */}
        <button
          type="button"
          className="pill-btn zoom-btn zoom-out"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Zoom Percentage */}
        <span className="zoom-percentage-text">{zoomLevel}%</span>

        {/* Zoom In + */}
        <button
          type="button"
          className="pill-btn zoom-btn zoom-in"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
