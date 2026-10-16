import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

const FLOORS = [
  { num: 12, name: 'Rooftop Garden & Lounge' },
  { num: 10, name: 'Executive Boardroom' },
  { num: 8, name: 'Product & Design Studio' },
  { num: 6, name: 'Main Collaborative Floor' },
  { num: 4, name: 'Silent Focus Library' },
  { num: 2, name: 'Town Hall Auditorium' },
  { num: 1, name: 'Welcome Reception & Cafe' },
];

export default function FloorSelector({ currentFloor = 6, onFloorChange }) {
  const [floor, setFloor] = useState(currentFloor);
  const [floorListOpen, setFloorListOpen] = useState(false);

  const selectFloor = (next) => {
    setFloor(next);
    sounds.playFloorChime();
    if (onFloorChange) onFloorChange(next);
    setFloorListOpen(false);
  };

  const handleUp = () => {
    const next = Math.min(12, floor + 1);
    selectFloor(next);
  };

  const handleDown = () => {
    const next = Math.max(1, floor - 1);
    selectFloor(next);
  };

  return (
    <div className="floor-selector-widget modern-floor-selector" aria-label="Floor selection elevator">
      {/* 1. Up arrow button */}
      <button
        type="button"
        className="floor-arrow-btn up-btn"
        onClick={handleUp}
        aria-label="Floor up"
        title="Go up one floor (PageUp)"
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M6 1L11 9H1L6 1Z" fill="currentColor" />
        </svg>
      </button>

      {/* 2. Interactive Floor Badge */}
      <div
        className="floor-badge-container modern-badge-container"
        onClick={() => setFloorListOpen((v) => !v)}
        title={`Floor ${floor}F (Click to change floor)`}
        role="button"
        tabIndex={0}
      >
        <div className="floor-badge-circle">
          <span className="floor-text">{floor}F</span>
        </div>
        <div className="floor-sub-badge" title="Elevator floors">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
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
        title="Go down one floor (PageDown)"
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M6 9L1 1H11L6 9Z" fill="currentColor" />
        </svg>
      </button>

      {/* Floor Directory Flyout Menu */}
      {floorListOpen && (
        <div className="floor-directory-popover glass-panel" onClick={(e) => e.stopPropagation()}>
          <div className="directory-header">
            <span className="directory-title">Building Floors</span>
            <button
              type="button"
              className="directory-close"
              onClick={() => setFloorListOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="directory-list">
            {FLOORS.map((f) => (
              <button
                key={f.num}
                type="button"
                className={`directory-item ${floor === f.num ? 'active' : ''}`}
                onClick={() => selectFloor(f.num)}
              >
                <span className="item-floor-num">{f.num}F</span>
                <span className="item-floor-name">{f.name}</span>
                {floor === f.num && <span className="item-active-beacon" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
