import React from 'react';

export default function ParticipantsDrawer({ isOpen, onClose, participants = [], localUser }) {
  if (!isOpen) return null;

  const allMembers = localUser
    ? [localUser, ...participants.filter((p) => p.id !== localUser.id)]
    : participants;

  return (
    <aside className="ovice-drawer participants-drawer open" aria-label="Office participants">
      <div className="drawer-header">
        <div className="drawer-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <h2>Members ({allMembers.length})</h2>
        </div>
        <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close members">✕</button>
      </div>

      <div className="drawer-content">
        <div className="members-subheading">ONLINE NOW</div>
        <ul className="members-list">
          {allMembers.map((member) => {
            const isLocal = member.id === localUser?.id;
            return (
              <li key={member.id} className={`member-item ${isLocal ? 'me' : ''}`}>
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
                  <span className="member-name">
                    {member.displayName} {isLocal && <span className="you-badge">(You)</span>}
                  </span>
                  <span className="member-status">{member.status || (member.isMuted ? 'Muted' : 'Speaking')}</span>
                </div>
                {member.isSpeaking && <span className="speaking-wave"><span></span><span></span><span></span></span>}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
