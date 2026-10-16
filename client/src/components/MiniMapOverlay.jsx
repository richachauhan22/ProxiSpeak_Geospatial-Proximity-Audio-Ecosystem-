import React from 'react';
import { OFFICE_DIMENSIONS } from '../office/OfficeMap';

export default function MiniMapOverlay({
  isOpen,
  onClose,
  localUser,
  participants = [],
  onTeleport,
}) {
  if (!isOpen) return null;

  const width = 240;
  const height = 149; // aspect ratio matching 1440 x 894

  const toMiniX = (worldX) => (worldX / OFFICE_DIMENSIONS.width) * width;
  const toMiniY = (worldY) => (worldY / OFFICE_DIMENSIONS.height) * height;

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const worldX = (clickX / width) * OFFICE_DIMENSIONS.width;
    const worldY = (clickY / height) * OFFICE_DIMENSIONS.height;
    if (onTeleport) {
      onTeleport(worldX, worldY);
    }
  };

  return (
    <div className="ovice-minimap-card" role="region" aria-label="Floor mini-map">
      <div className="minimap-header">
        <span>Floor 6 Radar</span>
        <button type="button" className="minimap-close" onClick={onClose} aria-label="Close mini-map">✕</button>
      </div>

      <div
        className="minimap-canvas-area"
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={handleMapClick}
        title="Click anywhere to walk there"
      >
        <img
          src="/office_map.png"
          alt="Floor plan"
          className="minimap-bg"
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* Remote participant dots */}
        {participants.map((p) => {
          if (localUser && p.id === localUser.id) return null;
          return (
            <span
              key={p.id}
              className="minimap-dot remote"
              style={{
                left: `${toMiniX(p.x)}px`,
                top: `${toMiniY(p.y)}px`,
                background: p.ringColor || p.avatarColor || '#8b5cf6',
              }}
              title={p.displayName}
            />
          );
        })}

        {/* Local user dot */}
        {localUser && (
          <span
            className="minimap-dot local-user"
            style={{
              left: `${toMiniX(localUser.x)}px`,
              top: `${toMiniY(localUser.y)}px`,
            }}
            title={`${localUser.displayName} (You)`}
          >
            <span className="minimap-pulse" />
          </span>
        )}
      </div>
      <div className="minimap-hint">Click floor to navigate</div>
    </div>
  );
}
