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

  const width = 260;
  const height = 161; // aspect ratio matching 1440 x 894

  const toMiniX = (worldX) => (worldX / OFFICE_DIMENSIONS.width) * width;
  const toMiniY = (worldY) => (worldY / OFFICE_DIMENSIONS.height) * height;

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const worldX = Math.round((clickX / width) * OFFICE_DIMENSIONS.width);
    const worldY = Math.round((clickY / height) * OFFICE_DIMENSIONS.height);
    if (onTeleport) {
      onTeleport(worldX, worldY);
    }
  };

  return (
    <div className="ovice-minimap-card modern-minimap glass-panel" role="region" aria-label="Floor radar mini-map">
      <div className="minimap-header">
        <div className="minimap-title-group">
          <span className="radar-live-beacon" />
          <span className="radar-title">Floor 6 Radar</span>
        </div>
        <button type="button" className="minimap-close" onClick={onClose} aria-label="Close radar">✕</button>
      </div>

      <div
        className="minimap-canvas-area"
        style={{ width: `${width}px`, height: `${height}px` }}
        onClick={handleMapClick}
        title="Click anywhere to walk directly there"
      >
        {/* Floor plan base */}
        <img
          src="/office_map.png"
          alt="Floor plan"
          className="minimap-bg"
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* Radar grid and sweep animation */}
        <div className="radar-grid-overlay" />
        <div className="radar-sweep-beam" />

        {/* Remote participant pins */}
        {participants.map((p) => {
          if (localUser && p.id === localUser.id) return null;
          return (
            <div
              key={p.id}
              className="minimap-dot remote"
              style={{
                left: `${toMiniX(p.x)}px`,
                top: `${toMiniY(p.y)}px`,
                background: p.ringColor || p.avatarColor || '#8b5cf6',
              }}
              title={`${p.displayName} (${p.status || 'Active'})`}
            >
              <span className="dot-tooltip">{p.displayName}</span>
            </div>
          );
        })}

        {/* Local user pin with aura */}
        {localUser && (
          <div
            className="minimap-dot local-user"
            style={{
              left: `${toMiniX(localUser.x)}px`,
              top: `${toMiniY(localUser.y)}px`,
            }}
            title={`${localUser.displayName} (You)`}
          >
            <span className="minimap-pulse" />
            <span className="dot-tooltip you">You</span>
          </div>
        )}
      </div>

      <div className="minimap-hint">
        <span>📍 Click floor plan to navigate instantly</span>
      </div>
    </div>
  );
}
