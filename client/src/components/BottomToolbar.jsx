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
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const emojis = ['❤️', '👍', '👏', '🎉', '🔥', '🚀', '☕', '😄'];

  const STATUS_LIST = [
    { label: 'Available', dot: 'available', emoji: '🟢' },
    { label: 'In focus', dot: 'focus', emoji: '🟣' },
    { label: 'Busy', dot: 'busy', emoji: '🔴' },
    { label: 'Coffee break', dot: 'coffee', emoji: '☕' },
    { label: 'Away', dot: 'away', emoji: '🟡' },
  ];

  const handleEmojiClick = (emoji) => {
    sounds.playReactionPop();
    if (onReaction) onReaction(emoji);
    setReactionsOpen(false);
  };

  const handleZoomOut = () => {
    sounds.playClick();
    if (onZoomChange) onZoomChange(Math.max(50, zoomLevel - 10));
  };

  const handleZoomIn = () => {
    sounds.playClick();
    if (onZoomChange) onZoomChange(Math.min(160, zoomLevel + 10));
  };

  const handleZoomReset = () => {
    sounds.playClick();
    if (onZoomChange) onZoomChange(100);
  };

  const handleScreenShareToggle = () => {
    sounds.playClick();
    setIsScreenSharing((prev) => !prev);
  };

  const handleSoundboardChime = () => {
    sounds.playProximityChime();
  };

  return (
    <div className="ovice-bottom-controls modern-bottom-dock" role="toolbar" aria-label="Office controls">
      {/* ================= LEFT PILL: Profile & Communication ================= */}
      <div className="toolbar-pill pill-communication glass-dock-pill">
        {/* User Presence & Avatar */}
        <div
          className="pill-user-profile modern-profile-trigger"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          title="Change presence status"
        >
          <div className="user-avatar-wrap">
            <img
              src={localUser?.photoUrl || '/avatar_mia.png'}
              alt={localUser?.displayName || 'Mia'}
              className="user-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="user-avatar-fallback" style={{ background: localUser?.avatarColor || '#2563eb' }}>
              {localUser?.displayName?.slice(0, 1).toUpperCase() || 'M'}
            </span>
            <span className={`user-status-dot ${userStatus.toLowerCase().replace(/\s+/g, '-')}`} />
          </div>

          <div className="user-meta">
            <span className="user-name">{localUser?.displayName || 'Mia'}</span>
            <span className="user-status-label">{userStatus}</span>
          </div>

          {/* Mini audio activity indicator */}
          {!isMuted && (
            <div className="mini-voice-wave" title="Speaking">
              <span className="bar b1" />
              <span className="bar b2" />
              <span className="bar b3" />
            </div>
          )}
        </div>

        {profileMenuOpen && (
          <div className="profile-status-dropdown modern-status-menu" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-header">Presence Status</div>
            {STATUS_LIST.map((st) => (
              <button
                key={st.label}
                type="button"
                className={`status-opt ${userStatus === st.label ? 'active' : ''}`}
                onClick={() => {
                  setUserStatus(st.label);
                  setProfileMenuOpen(false);
                }}
              >
                <span className="status-opt-emoji">{st.emoji}</span>
                <span className="status-opt-label">{st.label}</span>
                {userStatus === st.label && <span className="status-opt-check">✓</span>}
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
              <span className="opt-icon">⚙️</span>
              <span>Audio & Video Settings</span>
            </button>
            <button
              type="button"
              className="status-opt opt-action"
              onClick={() => {
                setProfileMenuOpen(false);
                if (onOpenHelp) onOpenHelp();
              }}
            >
              <span className="opt-icon">⌨️</span>
              <span>Shortcuts & Movement Help</span>
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
                <span className="opt-icon">🚪</span>
                <span>Leave Office</span>
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
          title={isMuted ? 'Unmute microphone (Space)' : 'Mute microphone (Space)'}
        >
          {isMuted ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Video Camera Toggle Button */}
        <button
          type="button"
          className={`pill-btn video-btn ${isVideoOn ? 'active camera-active' : 'off'}`}
          onClick={() => {
            sounds.playClick();
            if (onToggleVideo) onToggleVideo();
          }}
          aria-label={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          title={isVideoOn ? 'Camera on' : 'Camera off'}
        >
          {isVideoOn ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M21 15.5V7a2 2 0 0 0-2-2H7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
        </button>

        {/* Screen Share Button */}
        <button
          type="button"
          className={`pill-btn screen-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={handleScreenShareToggle}
          aria-label={isScreenSharing ? 'Stop presenting' : 'Share screen'}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>

        {/* Emoji Reactions Trigger */}
        <div className="reaction-trigger-wrap">
          <button
            type="button"
            className={`pill-btn reaction-btn ${reactionsOpen ? 'active' : ''}`}
            onClick={() => setReactionsOpen((prev) => !prev)}
            aria-label="Reactions"
            title="Send emoji reaction"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </button>

          {reactionsOpen && (
            <div className="reactions-float-picker modern-reactions-bar">
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

        {/* Soundboard Chime Trigger */}
        <button
          type="button"
          className="pill-btn sound-chime-btn"
          onClick={handleSoundboardChime}
          aria-label="Sound chime"
          title="Play chime bell"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </button>

        {/* Workspace Tools (+) Button */}
        <button
          type="button"
          className="pill-btn add-btn"
          onClick={onOpenAddMenu}
          aria-label="Office tools"
          title="Office tools"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ================= RIGHT PILL: Map & Zoom Controls ================= */}
      <div className="toolbar-pill pill-map-zoom glass-dock-pill">
        {/* Radar Mini-map toggle */}
        <button
          type="button"
          className={`pill-btn map-btn ${miniMapOpen ? 'active' : ''}`}
          onClick={onToggleMiniMap}
          aria-label="Mini-map radar"
          title="Toggle floor radar mini-map (M)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" />
            <line x1="16" y1="6" x2="16" y2="22" />
          </svg>
        </button>

        {/* Recenter Target */}
        <button
          type="button"
          className="pill-btn target-btn"
          onClick={() => {
            sounds.playClick();
            if (onRecenter) onRecenter();
          }}
          aria-label="Recenter on your avatar"
          title="Recenter view on your avatar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </button>

        <span className="pill-divider" />

        {/* Zoom Out - */}
        <button
          type="button"
          className="pill-btn zoom-btn zoom-out"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Zoom Percentage (Click to reset 100%) */}
        <button
          type="button"
          className="zoom-percentage-btn"
          onClick={handleZoomReset}
          title="Click to reset zoom to 100%"
        >
          {zoomLevel}%
        </button>

        {/* Zoom In + */}
        <button
          type="button"
          className="pill-btn zoom-btn zoom-in"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Movement Help (?) */}
        <button
          type="button"
          className="pill-btn help-btn"
          onClick={onOpenHelp}
          aria-label="Shortcuts"
          title="Movement & Shortcuts guide"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}
