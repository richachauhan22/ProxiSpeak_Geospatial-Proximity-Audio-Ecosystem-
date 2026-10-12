import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export default function FloorSelector({ currentFloor = 6, onFloorChange }) {
  const [floor, setFloor] = useState(currentFloor);

  const handleUp = () => {
    const next = Math.min(12, floor + 1);
    setFloor(next);
    sounds.playFloorChime();
    if (onFloorChange) onFloorChange(next);
  };

  const handleDown = () => {
    const next = Math.max(1, floor - 1);
    setFloor(next);
    sounds.playFloorChime();
    if (onFloorChange) onFloorChange(next);
  };

  return (
    <div className="floor-selector-widget" aria-label="Floor selection elevator">
      {/* 1. Up arrow button */}
      <button
        type="button"
        className="floor-arrow-btn up-btn"
        onClick={handleUp}
        aria-label="Floor up"
        title="Go up one floor"
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M5 1L9 7H1L5 1Z" fill="#ffffff" />
        </svg>
      </button>

      {/* 2. Primary Blue 6F Badge with building mini-badge */}
      <div className="floor-badge-container" title={`Currently on floor ${floor}F`}>
        <div className="floor-badge-circle">
          <span className="floor-text">{floor}F</span>
        </div>
        {/* White mini building/elevator badge at bottom-right */}
        <div className="floor-sub-badge" title="Elevator access">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2">
            <path d="M3 21h18M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
            <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
          </svg>
        </div>
      </div>

      {/* 3. Down arrow button */}
      <button
        type="button"
        className="floor-arrow-btn down-btn"
        onClick={handleDown}
        aria-label="Floor down"
        title="Go down one floor"
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M5 7L1 1H9L5 7Z" fill="#ffffff" />
        </svg>
      </button>
    </div>
  );
}
