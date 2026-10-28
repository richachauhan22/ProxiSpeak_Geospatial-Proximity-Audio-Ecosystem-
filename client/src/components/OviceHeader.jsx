import React, { useState } from 'react';

export default function OviceHeader({
  officeId = 'San Francisco HQ / 4F Design Lab',
  participantCount = 5,
  connectionStatus = 'Fast',
  onToggleMenu,
  onToggleParticipants,
  onToggleChat,
  onToggleCalendar,
  onToggleNotifications,
  onOpenHelp,
  onLeaveOffice,
  chatOpen = false,
  participantsOpen = false,
  hasUnread = false,
  onCopyLink,
  lightingMode = 'daylight',
  onLightingChange,
  onOpenWhiteboard,
  onOpenBroadcast,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2200);
    if (onCopyLink) onCopyLink();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="proxi-topbar floating-glassmorphic-nav" role="banner">
      <div className="topbar-left">
        {/* Workspace Dropdown Menu */}
        <div className="topbar-menu-wrapper">
          <button
            type="button"
            className={`topbar-icon-button menu-toggle-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle workspace navigation menu"
            title="Office Menu"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="0" y1="1" x2="18" y2="1" />
              <line x1="0" y1="7" x2="18" y2="7" />
              <line x1="0" y1="13" x2="18" y2="13" />
            </svg>
          </button>

          {menuOpen && (
            <div className="topbar-dropdown-menu glass-dropdown" onClick={() => setMenuOpen(false)}>
              <div className="dropdown-item-header">
                <div className="header-room-title">{officeId}</div>
                <div className="header-room-subtitle">Floor 4 · Spatial Workplace & Audio Hub</div>
              </div>
              <div className="dropdown-separator" />
              <button type="button" className="dropdown-menu-item" onClick={handleCopy}>
                <span className="item-icon">🔗</span>
                <span className="item-text">{copiedToast ? 'Copied Link!' : 'Copy Office Link'}</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onToggleMenu) onToggleMenu();
                }}
              >
                <span className="item-icon">⚙️</span>
                <span className="item-text">Audio & Workspace Settings</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onOpenHelp) onOpenHelp();
                }}
              >
                <span className="item-icon">⌨️</span>
                <span className="item-text">Keyboard & Movement Controls</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onToggleParticipants) onToggleParticipants();
                }}
              >
                <span className="item-icon">👥</span>
                <span className="item-text">Floor Teammates ({participantCount})</span>
              </button>
              <div className="dropdown-separator" />
              <button
                type="button"
                className="dropdown-menu-item item-danger"
                onClick={() => {
                  if (onLeaveOffice) onLeaveOffice();
                }}
              >
                <span className="item-icon">🚪</span>
                <span className="item-text">Leave Virtual Office</span>
              </button>
            </div>
          )}
        </div>

        <span className="topbar-divider" />

        {/* Clean ProxiSpeak Branding with Wave Icon */}
        <div className="proxi-brand" aria-label="ProxiSpeak">
          <div className="brand-logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
                stroke="#6366f1"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" fill="#10b981" />
              <path d="M9 12a3 3 0 0 1 6 0" stroke="#6366f1" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="brand-text">
            Proxi<span>Speak</span>
          </span>
        </div>

        <span className="topbar-divider" />

        {/* Room / Zone Breadcrumb with Quick Copy */}
        <div className="room-breadcrumb" onClick={handleCopy} title="Click to copy invite link">
          <span className="floor-badge">4F</span>
          <span className="room-path-label">{officeId}</span>
          <span className="copy-link-pill">{copiedToast ? 'Copied!' : 'Copy'}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Dynamic Lighting Shift Selector (Daylight / Sunset / Studio Evening) */}
        <div className="lighting-selector" title="Daylight & Ambient Light Shift">
          {[
            { id: 'daylight', icon: '☀️', label: 'Day' },
            { id: 'sunset', icon: '🌅', label: 'Sunset' },
            { id: 'studio', icon: '🌙', label: 'Studio' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              className={`lighting-pill ${lightingMode === m.id ? 'active' : ''}`}
              onClick={() => onLightingChange && onLightingChange(m.id)}
              title={`${m.label} Ambient Lighting`}
            >
              <span>{m.icon}</span>
            </button>
          ))}
        </div>

        <span className="topbar-divider" />

        {/* Interactive Whiteboard quick launcher */}
        {onOpenWhiteboard && (
          <button
            type="button"
            className="topbar-action-btn"
            onClick={onOpenWhiteboard}
            aria-label="Open Meeting Whiteboard"
            title="Open Collaborative Whiteboard"
          >
            <span>✏️</span>
            <span className="action-label">Whiteboard</span>
          </button>
        )}

        {/* Screen Broadcast quick launcher */}
        {onOpenBroadcast && (
          <button
            type="button"
            className="topbar-action-btn"
            onClick={onOpenBroadcast}
            aria-label="Broadcast Screen"
            title="Broadcast Screen to Presentation Zone"
          >
            <span>📡</span>
            <span className="action-label">Broadcast</span>
          </button>
        )}

        <span className="topbar-divider" />

        {/* Live WebRTC Mesh Latency Indicator */}
        <div className="connection-pill" title="Latency: <18ms (Optimal WebRTC Mesh)">
          <span className="live-ping-dot" />
          <span className="latency-text">&lt;18ms WebRTC Mesh</span>
          <svg className="signal-bars" width="14" height="11" viewBox="0 0 16 12" fill="none">
            <rect x="1" y="9" width="2" height="3" rx="0.5" fill="#10b981" />
            <rect x="5" y="6" width="2" height="6" rx="0.5" fill="#10b981" />
            <rect x="9" y="3" width="2" height="9" rx="0.5" fill="#10b981" />
            <rect x="13" y="0.5" width="2" height="11.5" rx="0.5" fill="#10b981" />
          </svg>
        </div>

        {/* Teammates Live Avatar Stack */}
        <div
          className="header-avatar-stack"
          onClick={onToggleParticipants}
          title={`View all ${participantCount} coworkers`}
        >
          <div className="tiny-avatar-circle t1">
            <img src="/avatar_mia.png" alt="Mia" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="tiny-avatar-circle t2">
            <img src="/avatar_alex.png" alt="Alex" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div className="tiny-avatar-circle t3">
            <img src="/avatar_david.png" alt="David" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <span className="stack-count-badge">+{Math.max(1, participantCount - 3)}</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="topbar-icon-button"
          onClick={onToggleNotifications}
          aria-label="Notifications"
          title="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {hasUnread && <span className="notification-dot pulse-beacon" />}
        </button>

        {/* Chat Drawer Toggle */}
        <button
          type="button"
          className={`topbar-icon-button ${chatOpen ? 'active' : ''}`}
          onClick={onToggleChat}
          aria-label="Chat messages"
          title="Office Chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

        <span className="topbar-divider" />

        {/* Prominent Soft-Red Leave Desk / Leave Office Button */}
        {onLeaveOffice && (
          <button
            type="button"
            className="leave-desk-btn"
            onClick={onLeaveOffice}
            aria-label="Leave office"
            title="Leave virtual desk"
          >
            <span>Leave Desk</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
