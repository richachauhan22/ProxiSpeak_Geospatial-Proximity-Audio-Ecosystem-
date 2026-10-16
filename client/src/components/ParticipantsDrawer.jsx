import React, { useState } from 'react';

export default function ParticipantsDrawer({
  isOpen,
  onClose,
  participants = [],
  localUser,
  onTeleportToUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allMembers = localUser
    ? [localUser, ...participants.filter((p) => p.id !== localUser.id)]
    : participants;

  const filteredMembers = allMembers.filter((m) =>
    (m.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isNearby = (member) => {
    if (!localUser || member.id === localUser.id) return false;
    const dx = member.x - localUser.x;
    const dy = member.y - localUser.y;
    return Math.hypot(dx, dy) < 260;
  };

  const nearbyMembers = filteredMembers.filter((m) => isNearby(m));
  const otherMembers = filteredMembers.filter((m) => !isNearby(m));

  return (
    <aside className="ovice-drawer participants-drawer open modern-drawer glass-panel" aria-label="Office participants">
      <div className="drawer-header modern-drawer-header">
        <div className="drawer-title">
          <div className="drawer-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2>Members</h2>
            <span className="drawer-subtitle">{allMembers.length} active on Floor 6</span>
          </div>
        </div>
        <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close members">✕</button>
      </div>

      {/* Search Input */}
      <div className="drawer-search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter teammates…"
          className="search-input"
        />
        {searchQuery && (
          <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      <div className="drawer-content modern-participants-body">
        {/* Proximity Group */}
        {nearbyMembers.length > 0 && (
          <div className="participants-group">
            <div className="group-heading">
              <span className="group-pulse-dot" />
              <span>NEARBY (IN AUDIO ZONE) · {nearbyMembers.length}</span>
            </div>
            <ul className="members-list">
              {nearbyMembers.map((member) => (
                <MemberCard key={member.id} member={member} isLocal={false} onTeleport={onTeleportToUser} />
              ))}
            </ul>
          </div>
        )}

        {/* Other Members Group */}
        <div className="participants-group">
          <div className="group-heading">
            <span>OTHER DESKS & PODS · {otherMembers.length}</span>
          </div>
          <ul className="members-list">
            {otherMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isLocal={member.id === localUser?.id}
                onTeleport={onTeleportToUser}
              />
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

function MemberCard({ member, isLocal, onTeleport }) {
  return (
    <li className={`member-item modern-member-item ${isLocal ? 'me' : ''}`}>
      <div className="member-avatar-wrap">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.displayName} className="member-photo" />
        ) : (
          <span className="member-avatar-initial" style={{ background: member.ringColor || '#2563eb' }}>
            {member.displayName?.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={`member-presence-dot ${member.isMuted ? 'muted' : 'online'}`} />
      </div>

      <div className="member-info">
        <div className="member-name-row">
          <span className="member-name">{member.displayName}</span>
          {isLocal && <span className="you-badge">You</span>}
        </div>
        <span className="member-status">
          {member.status || (member.isMuted ? 'Mic Muted' : 'Speaking')}
        </span>
      </div>

      <div className="member-actions">
        {member.isSpeaking && (
          <div className="speaking-wave mini" title="Speaking">
            <span /><span /><span />
          </div>
        )}
        {!isLocal && onTeleport && (
          <button
            type="button"
            className="walk-to-btn"
            onClick={() => onTeleport(member.x, member.y)}
            title={`Walk over to ${member.displayName}`}
          >
            Walk to
          </button>
        )}
      </div>
    </li>
  );
}
