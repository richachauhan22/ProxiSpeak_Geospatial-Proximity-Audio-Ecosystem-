import React, { useState } from 'react';

export default function OviceHeader({
  officeId = 'oVice HQ / C-03',
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
    <header className="ovice-topbar modern-topbar" role="banner">
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
            <div className="topbar-dropdown-menu modern-dropdown" onClick={() => setMenuOpen(false)}>
              <div className="dropdown-item-header">
                <div className="header-room-title">{officeId}</div>
                <div className="header-room-subtitle">Floor 6 · Penthouse Executive Suite</div>
              </div>
              <div className="dropdown-separator" />
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={handleCopy}
              >
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

        {/* Brand Logo with Glow */}
        <div className="ovice-brand modern-brand" aria-label="ProxiSpeak">
          <div className="brand-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <span className="brand-text">
            Proxi<span>Speak</span>
          </span>
        </div>

        <span className="topbar-divider" />

        {/* Room / Office Space Breadcrumb with Quick Copy */}
        <div className="ovice-room-breadcrumb modern-breadcrumb" onClick={handleCopy} title="Click to copy invite link">
          <span className="floor-indicator">6F</span>
          <span className="room-name">{officeId}</span>
          <span className="copy-hint-pill">{copiedToast ? 'Copied!' : 'Copy'}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Connection status badge */}
        <div className="connection-badge fast modern-badge" title="Latency: 14ms (Optimal WebRTC mesh)">
          <span className="badge-ping-dot" />
          <span className="fast-label">{connectionStatus === 'connected' ? 'Fast (14ms)' : connectionStatus}</span>
          <svg className="signal-bars" width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="1" y="9" width="2.2" height="3" rx="0.6" fill="#10b981" />
            <rect x="5" y="6" width="2.2" height="6" rx="0.6" fill="#10b981" />
            <rect x="9" y="3" width="2.2" height="9" rx="0.6" fill="#10b981" />
            <rect x="13" y="0.5" width="2.2" height="11.5" rx="0.6" fill="#10b981" />
          </svg>
        </div>

        <span className="topbar-divider" />

        {/* Teammates Live Avatar Stack */}
        <div
          className="header-avatar-stack"
          onClick={onToggleParticipants}
          title={`View all ${participantCount} teammates`}
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

        {/* Participants Roster Button */}
        <button
          type="button"
          className={`topbar-icon-button ${participantsOpen ? 'active' : ''}`}
          onClick={onToggleParticipants}
          aria-label="Participants list"
          title={`Participants (${participantCount})`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="btn-count-pill">{participantCount}</span>
        </button>

        {/* Calendar / Schedule */}
        <button
          type="button"
          className="topbar-icon-button"
          onClick={onToggleCalendar}
          aria-label="Calendar schedule"
          title="Office Schedule"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
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

        {/* Fullscreen Toggle */}
        <button
          type="button"
          className="topbar-icon-button hide-on-mobile"
          onClick={handleFullscreen}
          aria-label="Toggle Fullscreen"
          title="Fullscreen"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>

        <span className="topbar-divider" />

        {/* Leave Office Button */}
        {onLeaveOffice && (
          <button
            type="button"
            className="topbar-leave-button modern-leave-btn"
            onClick={onLeaveOffice}
            aria-label="Leave office"
            title="Leave office"
          >
            <span>Leave</span>
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
