import React from 'react';

export function Avatar({
  src,
  name = 'User',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  color = '#2563eb',
  status = null, // 'online' | 'busy' | 'away' | 'offline'
  isSpeaking = false,
  className = '',
}) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const px = sizeMap[size] || 40;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        isSpeaking ? 'avatar-speaking-pulse' : ''
      } ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: color || '#2563eb',
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span
          className="font-semibold text-white tracking-wide"
          style={{ fontSize: Math.max(10, Math.floor(px * 0.4)) }}
        >
          {initials}
        </span>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 status-dot status-dot-${status}`}
          style={{
            width: Math.max(8, Math.floor(px * 0.28)),
            height: Math.max(8, Math.floor(px * 0.28)),
          }}
          title={status}
        />
      )}
    </div>
  );
}

export function StatusBadge({ status = 'online', label = null, className = '' }) {
  const labelMap = {
    online: 'Online',
    busy: 'In Meeting',
    away: 'Away',
    offline: 'Offline',
    speaking: 'Speaking',
  };

  const display = label || labelMap[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium status-pill status-pill-${status} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full status-dot-${status}`} />
      <span>{display}</span>
    </span>
  );
}

export default Avatar;
