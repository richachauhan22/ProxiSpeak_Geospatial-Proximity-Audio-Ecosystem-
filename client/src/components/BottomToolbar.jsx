import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Crosshair,
  Minus,
  Plus,
  Maximize,
  Minimize,
  Smile,
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export default function BottomToolbar({
  localUser = { displayName: 'Mia', status: 'Available' },
  zoomLevel = 100,
  onZoomChange,
  onRecenter,
  onToggleMute,
  onToggleVideo,
  isMuted = false,
  isVideoOn = true,
  isSpeaking = false,
  audioLevel = 0,
  permissionStatus = 'idle',
  onReaction,
  onOpenSettings,
  onOpenAddMenu,
  onToggleMiniMap,
  onLeaveOffice,
  onOpenHelp,
  miniMapOpen = false,
  spatialPreset = 'linear',
  onSpatialPresetChange,
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioFalloff, setAudioFalloff] = useState(() => {
    if (spatialPreset === 'exponential' || spatialPreset === 'exp') return 'Exp';
    if (spatialPreset === 'studio') return 'Studio';
    return 'Linear';
  });

  // Dynamic decibel meter simulation based on audioLevel / speaking state
  const [displayDb, setDisplayDb] = useState('-42 dB');

  useEffect(() => {
    if (isMuted) {
      setDisplayDb('Muted');
      return;
    }
    if (isSpeaking || audioLevel > 0.05) {
      const db = Math.round(-38 + (audioLevel || 0.4) * 32);
      setDisplayDb(`${db} dB`);
    } else {
      const idleOffset = Math.floor(Math.sin(Date.now() / 800) * 2);
      setDisplayDb(`${-42 + idleOffset} dB`);
    }
  }, [audioLevel, isSpeaking, isMuted]);

  const emojis = ['❤️', '👍', '👏', '🎉', '🔥', '🚀', '☕', '😄'];

  const handleEmojiClick = (emoji) => {
    sounds?.playReactionPop?.();
    if (onReaction) onReaction(emoji);
    setReactionsOpen(false);
  };

  const handleZoomOut = () => {
    sounds?.playClick?.();
    if (onZoomChange) onZoomChange(Math.max(50, zoomLevel - 10));
  };

  const handleZoomIn = () => {
    sounds?.playClick?.();
    if (onZoomChange) onZoomChange(Math.min(160, zoomLevel + 10));
  };

  const handleRecenter = () => {
    sounds?.playClick?.();
    if (onRecenter) onRecenter();
  };

  const handleFullscreenToggle = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    } catch (_) {}
  };

  const handleFalloffSelect = (mode) => {
    sounds?.playClick?.();
    setAudioFalloff(mode);
    const mapped = mode.toLowerCase();
    if (onSpatialPresetChange) {
      onSpatialPresetChange(mapped === 'exp' ? 'exponential' : mapped);
    }
  };

  const toggleScreenShare = () => {
    sounds?.playButtonClick?.();
    setIsScreenSharing((prev) => !prev);
  };

  return (
    <div
      role="toolbar"
      aria-label="Virtual office audio and navigation controls"
      className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* =========================================================================
            CLUSTER 1: USER PROFILE CARD (LEFT)
            ========================================================================= */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-100 shadow-2xl hover:border-slate-600 transition-all"
        >
          {/* Avatar Bubble with Initial 'M' and Green Active Indicator Dot */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-emerald-400/50">
              {localUser.displayName ? localUser.displayName.charAt(0).toUpperCase() : 'M'}
            </div>
            {/* Green active dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-sm" />
          </div>

          {/* User Name & Status Subtitle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-100 leading-tight">
                {localUser.displayName || 'Mia'}
              </span>
              <span className="text-[10px] font-medium text-slate-400 font-mono">(You)</span>
            </div>
            <span className="text-xs font-medium text-emerald-400 leading-tight">
              {localUser.status || 'Available'}
            </span>
          </div>

          {/* Vertical separator */}
          <div className="h-6 w-px bg-slate-700/60 mx-0.5" />

          {/* Dynamic Decibel Meter / Waveform Visualizer */}
          <div
            title={isSpeaking ? 'Speaking' : 'Voice meter'}
            className={`voice-meter-indicator flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-800/80 border border-slate-700/50 ${
              isSpeaking ? 'speaking ring-1 ring-emerald-500/40' : ''
            }`}
          >
            {/* 4-bar dynamic waveform */}
            <div className="flex items-end gap-0.5 h-3.5 w-5">
              {[0.4, 0.8, 0.6, 0.9, 0.5].map((baseH, idx) => {
                const isLive = isSpeaking && !isMuted;
                const dynamicScale = isLive ? Math.max(0.2, (audioLevel || 0.6) * baseH) : (isMuted ? 0.15 : 0.25);
                return (
                  <span
                    key={idx}
                    className={`w-0.5 rounded-full transition-all duration-100 ${
                      isLive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : isMuted ? 'bg-slate-600' : 'bg-slate-500'
                    }`}
                    style={{ height: `${Math.min(100, Math.max(20, dynamicScale * 100))}%` }}
                  />
                );
              })}
            </div>

            {/* Readout */}
            <span className="text-[11px] font-mono font-semibold text-slate-300 min-w-[42px] text-right">
              {displayDb}
            </span>
          </div>
        </motion.div>

        {/* =========================================================================
            CLUSTER 2: MAIN AV CONTROLS (CENTER)
            ========================================================================= */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-100 shadow-2xl"
        >
          {/* Mic Toggle Button */}
          <button
            type="button"
            onClick={() => {
              sounds?.playButtonClick?.();
              onToggleMute?.();
            }}
            className={`mic-button flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              permissionStatus === 'denied'
                ? 'permission-denied bg-red-950/60 text-red-300 border border-red-500/50'
                : isMuted
                ? 'muted bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-md shadow-emerald-500/10'
            }`}
            title={
              permissionStatus === 'denied'
                ? 'Microphone blocked, click to retry'
                : isMuted
                ? 'Unmute microphone (Space/M)'
                : 'Mute microphone (Space/M)'
            }
            aria-label={
              permissionStatus === 'denied'
                ? 'Microphone blocked, click to retry'
                : isMuted
                ? 'Unmute microphone'
                : 'Mute microphone'
            }
          >
            {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{permissionStatus === 'denied' ? 'Mic Blocked' : isMuted ? 'Unmute' : 'Mic'}</span>
          </button>

          {/* Camera Toggle Button */}
          <button
            type="button"
            onClick={() => {
              sounds?.playButtonClick?.();
              onToggleVideo?.();
            }}
            className={`camera-button flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              !isVideoOn
                ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750 hover:text-slate-200'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-md shadow-cyan-500/10'
            }`}
            title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
            aria-label={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {!isVideoOn ? <VideoOff className="w-4 h-4 text-slate-400" /> : <Video className="w-4 h-4 text-cyan-400" />}
            <span>Cam</span>
          </button>

          {/* Screen Share Toggle Button */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`share-button flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              isScreenSharing
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-500/10'
                : 'bg-slate-800/90 text-slate-300 border border-slate-700/60 hover:bg-slate-750 hover:text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
            aria-label="Share Screen"
          >
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>Share</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700/60 mx-1" />

          {/* Audio Falloff Segmented Switch (Linear, Exp, Studio) */}
          <div
            className="flex items-center p-0.5 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs font-medium"
            title="Spatial Audio Falloff Curve"
          >
            {['Linear', 'Exp', 'Studio'].map((mode) => {
              const active = audioFalloff.toLowerCase() === mode.toLowerCase();
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleFalloffSelect(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

          {/* Emoji Reaction Picker Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactionsOpen((prev) => !prev)}
              className="reactions-trigger-btn p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-amber-300 active:scale-95 transition-all"
              title="Send Reaction Emoji"
              aria-label="Reactions"
            >
              <Smile className="w-4 h-4 text-amber-400" />
            </button>

            {/* Floating Reaction Tray */}
            <AnimatePresence>
              {reactionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-2xl flex items-center gap-1.5 z-50 whitespace-nowrap"
                >
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="w-8 h-8 rounded-xl hover:bg-slate-800 flex items-center justify-center text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* =========================================================================
            CLUSTER 3: VIEWPORT & ZOOM CONTROLS (RIGHT)
            ========================================================================= */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-100 shadow-2xl"
        >
          {/* Recenter Button (Crosshair Icon) */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-transparent hover:border-slate-700/50 active:scale-95 transition-all"
            title="Recenter camera to your desk (R)"
            aria-label="Recenter camera"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

          {/* Zoom Out Button (−) */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/50 active:scale-95 transition-all"
            title="Zoom out (−)"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Dynamic Zoom Readout 100% */}
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(100)}
            className="px-2 py-0.5 rounded-lg text-xs font-mono font-semibold text-slate-200 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Reset Zoom to 100%"
            aria-label="100%"
          >
            {zoomLevel}%
          </button>

          {/* Zoom In Button (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/50 active:scale-95 transition-all"
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={handleFullscreenToggle}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700/50 active:scale-95 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </motion.div>

      </div>
    </div>
  );
}
