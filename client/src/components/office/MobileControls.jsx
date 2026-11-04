import React, { useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export function MobileControls({ onMove, step = 20, disabled = false }) {
  const intervalRef = useRef(null);

  const startMoving = (dx, dy) => {
    if (disabled || !onMove) return;
    onMove(dx, dy);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      onMove(dx, dy);
    }, 120);
  };

  const stopMoving = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  return (
    <div
      className="mobile-dpad-controller select-none"
      aria-label="Mobile avatar directional pad"
    >
      <div className="dpad-cross">
        {/* UP */}
        <button
          type="button"
          className="dpad-btn dpad-up"
          onMouseDown={() => startMoving(0, -step)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(0, -step); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          aria-label="Move Up"
        >
          <ArrowUp size={16} />
        </button>

        {/* LEFT */}
        <button
          type="button"
          className="dpad-btn dpad-left"
          onMouseDown={() => startMoving(-step, 0)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(-step, 0); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          aria-label="Move Left"
        >
          <ArrowLeft size={16} />
        </button>

        {/* CENTER PAD */}
        <div className="dpad-center-hub" />

        {/* RIGHT */}
        <button
          type="button"
          className="dpad-btn dpad-right"
          onMouseDown={() => startMoving(step, 0)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(step, 0); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          aria-label="Move Right"
        >
          <ArrowRight size={16} />
        </button>

        {/* DOWN */}
        <button
          type="button"
          className="dpad-btn dpad-down"
          onMouseDown={() => startMoving(0, step)}
          onMouseUp={stopMoving}
          onMouseLeave={stopMoving}
          onTouchStart={(e) => { e.preventDefault(); startMoving(0, step); }}
          onTouchEnd={(e) => { e.preventDefault(); stopMoving(); }}
          aria-label="Move Down"
        >
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  );
}

export default MobileControls;
