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
  isSpeaking = false,
  audioLevel = 0,
  permissionStatus = 'idle',
  onReaction,
  onOpenSettings,
  onOpenAddMenu,
  onToggleMiniMap,
  onLeaveOffice,
  onOpenHelp,
  miniMapOpen = false,
  spatialPreset = 'linear',
  onSpatialPresetChange,
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userStatus, setUserStatus] = useState('Available');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const emojis = ['❤️', '👍', '👏', '🎉', '🔥', '🚀', '☕', '😄'];

  const STATUS_LIST = [
    { label: 'Available', dot: 'available', emoji: '🟢' },
    { label: 'Deep Work', dot: 'deepwork', emoji: '🧠' },
    { label: 'In a Huddle', dot: 'huddle', emoji: '🎙️' },
    { label: 'In focus', dot: 'focus', emoji: '🟣' },
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

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Real-time decibel conversion from audioLevel [0..1]
  const currentDb = isMuted ? -60 : Math.round(-48 + audioLevel * 48);

  return (
    <div className="proxi-bottom-dock glassmorphic-dock" role="toolbar" aria-label="Office controls">
      {/* ================= LEFT CAPSULE: Micro User Card & Status Picker ================= */}
      <div className="dock-capsule capsule-profile">
        <div
          className="micro-user-card"
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

          {/* Real-time decibel meter gauge & animated speaking waves */}
          <div className="mic-db-gauge" title={isMuted ? 'Muted' : `Mic Input: ${currentDb} dB`}>
            <div className={`mini-voice-wave ${isSpeaking ? 'speaking' : ''}`} title={isSpeaking ? 'Speaking' : 'Listening'}>
              <span className="bar b1" style={isSpeaking ? { height: `${Math.max(6, Math.min(18, 6 + audioLevel * 20))}px` } : {}} />
              <span className="bar b2" style={isSpeaking ? { height: `${Math.max(10, Math.min(22, 10 + audioLevel * 24))}px` } : {}} />
              <span className="bar b3" style={isSpeaking ? { height: `${Math.max(6, Math.min(18, 6 + audioLevel * 20))}px` } : {}} />
            </div>
            <span className="db-readout">{isMuted ? 'Muted' : `${currentDb} dB`}</span>
          </div>
        </div>

        {profileMenuOpen && (
          <div className="profile-status-dropdown glass-dropdown" onClick={(e) => e.stopPropagation()}>
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
              <span>Shortcuts & Movement</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= CENTER CAPSULE: Hardware Quick Toggles & Spatial Preset ================= */}
      <div className="dock-capsule capsule-hardware">
        {/* Microphone Toggle Button */}
        <button
          type="button"
          className={`dock-btn mic-btn ${isMuted ? 'muted' : 'active'} ${permissionStatus === 'denied' ? 'permission-denied' : ''}`}
          onClick={onToggleMute}
          aria-label={
            permissionStatus === 'denied'
              ? 'Microphone blocked (Click to allow)'
              : isMuted
                ? 'Unmute microphone'
                : 'Mute microphone'
          }
          title={
            permissionStatus === 'denied'
              ? 'Microphone blocked by browser. Click to retry permission.'
              : isMuted
                ? 'Unmute microphone (Space)'
                : 'Mute microphone (Space)'
          }
        >
          {permissionStatus === 'denied' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
              <path d="M5 10v2a7 7 0 0 0 12 5" />
              <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
          <span className="btn-label">{isMuted ? 'Muted' : 'Mic'}</span>
        </button>

        {/* Camera Toggle Button */}
        <button
          type="button"
          className={`dock-btn camera-btn ${isVideoOn ? 'active' : 'muted'}`}
          onClick={onToggleVideo}
          aria-label={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {isVideoOn ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="m22 8-6 4 6 4V8Z" />
              <path d="M2 10v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
              <path d="M7 6h7a2 2 0 0 1 2 2v2" />
            </svg>
          )}
          <span className="btn-label">{isVideoOn ? 'Cam' : 'Off'}</span>
        </button>

        {/* Screen Share Toggle */}
        <button
          type="button"
          className={`dock-btn screen-btn ${isScreenSharing ? 'active-share' : ''}`}
          onClick={handleScreenShareToggle}
          aria-label="Share screen"
          title="Share screen with nearby peers"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="btn-label">{isScreenSharing ? 'Sharing' : 'Share'}</span>
        </button>

        {/* Spatial Sound Preset Pills (Linear / Exponential / Studio Room) */}
        <div className="spatial-preset-selector" title="Spatial Sound Attenuation Algorithm">
          <span className="preset-caption">Sound:</span>
          {['linear', 'exponential', 'studio'].map((p) => (
            <button
              key={p}
              type="button"
              className={`preset-pill ${spatialPreset === p ? 'active' : ''}`}
              onClick={() => {
                if (onSpatialPresetChange) onSpatialPresetChange(p);
                sounds.playClick();
              }}
            >
              {p === 'linear' ? 'Linear' : p === 'exponential' ? 'Exp' : 'Studio'}
            </button>
          ))}
        </div>

        {/* Emoji Reaction Drawer Trigger */}
        <div className="dock-reactions-wrap">
          <button
            type="button"
            className="dock-btn reaction-btn"
            onClick={() => setReactionsOpen((prev) => !prev)}
            aria-label="Reactions"
            title="Floating emoji reactions"
          >
            <span style={{ fontSize: '16px' }}>😊</span>
          </button>

          {reactionsOpen && (
            <div className="reaction-popover glass-dropdown">
              {emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  className="reaction-em-btn"
                  onClick={() => handleEmojiClick(em)}
                  aria-label={em}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT CAPSULE: Map Viewport Controls & Radar ================= */}
      <div className="dock-capsule capsule-viewport">
        {/* Mini-map Toggle */}
        <button
          type="button"
          className={`dock-btn ${miniMapOpen ? 'active' : ''}`}
          onClick={onToggleMiniMap}
          aria-label="Mini-map radar"
          title="Toggle floor radar mini-map (M)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="3" x2="12" y2="7" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="3" y1="12" x2="7" y2="12" />
            <line x1="17" y1="12" x2="21" y2="12" />
          </svg>
        </button>

        {/* Snap to Me / Recenter */}
        <button
          type="button"
          className="dock-btn"
          onClick={onRecenter}
          aria-label="Recenter on your avatar"
          title="Recenter camera on your avatar (R)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 12h4m10 0h4M12 3v4m0 10v4" />
          </svg>
        </button>

        {/* Smooth Zoom Controls */}
        <div className="zoom-controller-group">
          <button
            type="button"
            className="zoom-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="zoom-reset-btn"
            onClick={handleZoomReset}
            aria-label="Reset zoom to 100%"
            title="Reset to 100%"
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="dock-btn hide-on-mobile"
          onClick={handleFullscreen}
          aria-label="Toggle Fullscreen"
          title="Fullscreen (F)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
