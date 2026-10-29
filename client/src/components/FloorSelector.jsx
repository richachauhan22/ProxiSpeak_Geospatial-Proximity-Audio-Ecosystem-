import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { sounds } from '../services/soundEffects';

const FLOORS = [
  { num: 12, name: '12F Rooftop Garden & Lounge' },
  { num: 10, name: '10F Executive Boardroom' },
  { num: 8, name: '8F Product & Design Studio' },
  { num: 6, name: '6F Main Collaborative Floor' },
  { num: 4, name: '4F Silent Focus & Labs' },
  { num: 2, name: '2F Town Hall Auditorium' },
  { num: 1, name: '1F Welcome Reception' },
];

export default function FloorSelector({ currentFloor = 4, onFloorChange }) {
  const [floor, setFloor] = useState(currentFloor);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectFloor = (next) => {
    setFloor(next);
    sounds?.playFloorChime?.();
    if (onFloorChange) onFloorChange(next);
    setMenuOpen(false);
  };

  const handleUp = () => {
    const next = Math.min(12, floor + 2);
    selectFloor(next);
  };

  const handleDown = () => {
    const next = Math.max(1, floor - 2);
    selectFloor(next);
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 select-none">
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-2xl text-slate-100"
      >
        {/* Top Arrow (Up) */}
        <button
          type="button"
          onClick={handleUp}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          title="Floor Up (PageUp)"
          aria-label="Floor Up"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        {/* Current Floor Circular Badge (4F with active glow) */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="relative group focus:outline-none"
          title={`Current Floor: ${floor}F (Click to select floor)`}
          aria-label={`Current Floor: ${floor}F`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/60 group-hover:scale-105 group-hover:ring-cyan-400 transition-all">
            <span>{floor}F</span>
          </div>

          {/* Pulse beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 ring-1 ring-slate-900" />
          </span>
        </button>

        {/* Bottom Arrow (Down) */}
        <button
          type="button"
          onClick={handleDown}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          title="Floor Down (PageDown)"
          aria-label="Floor Down"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Floor Selection Popover */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 12, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            className="absolute left-full top-0 ml-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/70 p-2 shadow-2xl text-slate-200 z-50"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800 mb-1">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>Office Floor Directory</span>
            </div>
            <div className="space-y-0.5">
              {FLOORS.map((f) => (
                <button
                  key={f.num}
                  type="button"
                  onClick={() => selectFloor(f.num)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                    floor === f.num
                      ? 'bg-purple-600/25 text-purple-200 border border-purple-500/30 font-semibold'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{f.name}</span>
                  {floor === f.num && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
