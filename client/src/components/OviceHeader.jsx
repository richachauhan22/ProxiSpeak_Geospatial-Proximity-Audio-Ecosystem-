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
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="ovice-topbar" role="banner">
      <div className="topbar-left">
        {/* 1. Hamburger menu button with dropdown */}
        <div className="topbar-menu-wrapper">
          <button
            type="button"
            className={`topbar-icon-button hamburger-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            title="Menu"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="0" y1="1" x2="18" y2="1" />
              <line x1="0" y1="7" x2="18" y2="7" />
              <line x1="0" y1="13" x2="18" y2="13" />
            </svg>
          </button>

          {menuOpen && (
            <div className="topbar-dropdown-menu" onClick={() => setMenuOpen(false)}>
              <div className="dropdown-item-header">
                <strong>{officeId}</strong>
                <span>Floor 6 · Main Floor</span>
              </div>
              <div className="dropdown-separator" />
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onToggleMenu) onToggleMenu();
                }}
              >
                <span>⚙️ Workspace Settings</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onOpenHelp) onOpenHelp();
                }}
              >
                <span>❓ Movement & Shortcuts</span>
              </button>
              <button
                type="button"
                className="dropdown-menu-item"
                onClick={() => {
                  if (onToggleParticipants) onToggleParticipants();
                }}
              >
                <span>👥 Teammates ({participantCount})</span>
              </button>
              <div className="dropdown-separator" />
              <button
                type="button"
                className="dropdown-menu-item item-danger"
                onClick={() => {
                  if (onLeaveOffice) onLeaveOffice();
                }}
              >
                <span>🚪 Leave Virtual Office</span>
              </button>
            </div>
          )}
        </div>

        <span className="topbar-divider" />

        {/* 2. ProxiSpeak / oVice logo */}
        <div className="ovice-brand" aria-label="ProxiSpeak">
          <svg className="ovice-logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3.2" fill="#18181b" />
            <path
              d="M16 10C16.8 11.2 16.8 12.8 16 14"
              stroke="#18181b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="ovice-logo-text">Proxi<span>Speak</span></span>
        </div>

        <span className="topbar-divider" />

        {/* 3. Room Heading / Space breadcrumb */}
        <div className="ovice-room-breadcrumb">
          <span className="room-name">{officeId}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* 4. Connection status badge */}
        <div className="connection-badge fast" title="Connection: Fast (Stable latency)">
          <span className="fast-label">{connectionStatus}</span>
          <svg className="signal-bars" width="16" height="12" viewBox="0 0 16 12" fill="none">
            <rect x="1" y="9" width="2" height="3" rx="0.5" fill="#4ade80" />
            <rect x="5" y="6" width="2" height="6" rx="0.5" fill="#4ade80" />
            <rect x="9" y="3" width="2" height="9" rx="0.5" fill="#4ade80" />
            <rect x="13" y="0.5" width="2" height="11.5" rx="0.5" fill="#4ade80" />
          </svg>
        </div>

        <span className="topbar-divider" />

        {/* 5. Notification bell */}
        <button
          type="button"
          className="topbar-icon-button"
          onClick={onToggleNotifications}
          aria-label="Notifications"
          title="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {hasUnread && <span className="notification-dot" />}
        </button>

        {/* 6. Members / Participants icon */}
        <button
          type="button"
          className={`topbar-icon-button ${participantsOpen ? 'active' : ''}`}
          onClick={onToggleParticipants}
          aria-label="Participants"
          title={`Participants (${participantCount})`}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>

        {/* 7. Calendar / Events */}
        <button
          type="button"
          className="topbar-icon-button"
          onClick={onToggleCalendar}
          aria-label="Calendar schedule"
          title="Calendar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* 8. Chat bubble */}
        <button
          type="button"
          className={`topbar-icon-button ${chatOpen ? 'active' : ''}`}
          onClick={onToggleChat}
          aria-label="Chat messages"
          title="Chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

        <span className="topbar-divider" />

        {/* 9. Direct Leave Office Button */}
        {onLeaveOffice && (
          <button
            type="button"
            className="topbar-leave-button"
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
