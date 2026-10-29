import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Sun,
  Sunset,
  Moon,
  PenTool,
  Radio,
  Signal,
  Bell,
  Settings,
  LogOut,
  Users,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

export default function OviceHeader({
  officeId = 'oVice HQ / C-03',
  participantCount = 5,
  connectionStatus = '<18ms WebRTC Mesh',
  onToggleParticipants,
  onToggleChat,
  onToggleCalendar,
  onToggleNotifications,
  onOpenSettings,
  onOpenHelp,
  onLeaveOffice,
  chatOpen = false,
  participantsOpen = false,
  hasUnread = false,
  onCopyLink,
  lightingMode = 'daylight',
  onLightingChange,
  onOpenWhiteboard,
  onOpenBroadcast,
  participants = [],
}) {
  const [copied, setCopied] = useState(false);
  const [showUserTooltip, setShowUserTooltip] = useState(false);

  const handleCopy = (e) => {
    e?.stopPropagation();
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    } catch (_) {}
    setCopied(true);
    sounds?.playClick?.();
    if (onCopyLink) onCopyLink();
    setTimeout(() => setCopied(false), 2200);
  };

  const activeAvatars = [
    { id: 'u-1', name: 'Mia', initial: 'M', bg: 'bg-emerald-500', photo: '/avatar_mia.png' },
    { id: 'u-2', name: 'Oliver', initial: 'O', bg: 'bg-rose-500', photo: '/avatar_oliver.png' },
    { id: 'u-3', name: 'Alex', initial: 'A', bg: 'bg-purple-500', photo: '/avatar_alex.png' },
    { id: 'u-4', name: 'Marcus', initial: 'M', bg: 'bg-blue-500', photo: '/avatar_marcus.png' },
  ];

  return (
    <header className="fixed top-3 left-0 right-0 z-40 max-w-7xl mx-auto px-3 sm:px-6 pointer-events-none">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-100 shadow-2xl"
      >
        {/* Left Section: Logo, Divider & Room Tag */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              ProxiSpeak
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-700/70" />

          {/* Room Tag with Purple Badge, Room name, and Copy button */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700/50 transition-colors">
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              4F
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">{officeId}</span>
            <span className="font-semibold text-slate-200 sm:hidden">HQ / C-03</span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-700/60 active:scale-95 transition-all"
              title="Copy office link"
              aria-label="Copy office link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Center Section: Ambience Switcher & Action Pills */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Segmented Ambience Pill */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-800/90 border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => {
                sounds?.playClick?.();
                onLightingChange?.('daylight');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                lightingMode === 'daylight'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
              title="Daylight mode (Clear architectural lighting)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Day</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds?.playClick?.();
                onLightingChange?.('sunset');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                lightingMode === 'sunset'
                  ? 'bg-orange-500/20 text-orange-300 shadow-sm border border-orange-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
              title="Sunset golden hour ambience"
            >
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
              <span>Sunset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds?.playClick?.();
                onLightingChange?.('night');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                lightingMode === 'night'
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
              title="Night studio ambience"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Night</span>
            </button>
          </div>

          {/* Action Pills: Whiteboard & Broadcast */}
          <button
            type="button"
            onClick={() => {
              sounds?.playButtonClick?.();
              onOpenWhiteboard?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
            title="Open Collaborative Whiteboard"
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
            <span>Whiteboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds?.playButtonClick?.();
              onOpenBroadcast?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 border border-slate-700/60 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
            title="Broadcast Audio & Screen to All Rooms"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Broadcast</span>
          </button>
        </div>

        {/* Right Section: WebRTC badge, Avatar stack, Bell, Cog, Leave Desk */}
        <div className="flex items-center gap-2.5">
          {/* WebRTC Connection Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono tracking-tight shadow-sm"
            title="Peer-to-Peer WebRTC Audio Mesh Active"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Signal className="w-3 h-3 text-emerald-400 hidden sm:inline" />
            <span className="font-medium hidden sm:inline">{connectionStatus}</span>
            <span className="font-medium sm:hidden">&lt;18ms</span>
          </div>

          {/* Active Users Avatar Stack with +2 Count Badge */}
          <div
            className="relative flex items-center cursor-pointer"
            onClick={onToggleParticipants}
            onMouseEnter={() => setShowUserTooltip(true)}
            onMouseLeave={() => setShowUserTooltip(false)}
            title="View participants"
          >
            <div className="flex -space-x-2 overflow-hidden items-center p-0.5">
              {activeAvatars.slice(0, 3).map((u, i) => (
                <div
                  key={u.id}
                  className={`inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 overflow-hidden shadow-sm ${u.bg} flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {u.initial}
                </div>
              ))}
              <div className="inline-flex h-6 w-6 rounded-full ring-2 ring-slate-900 bg-slate-800 text-slate-300 items-center justify-center text-[10px] font-bold">
                +{Math.max(2, participantCount - 3)}
              </div>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
              {showUserTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-8 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap shadow-xl z-50 pointer-events-none"
                >
                  {participantCount} Active Colleagues on Floor
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 active:scale-95 transition-all"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
            )}
          </button>

          {/* Settings Cog */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 active:scale-95 transition-all"
            aria-label="Audio & Video Settings"
            title="Audio & Video Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Distinct Red-Bordered Leave Desk Button */}
          <button
            type="button"
            onClick={onLeaveOffice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 border border-red-500/40 text-xs font-semibold shadow-lg shadow-red-950/20 active:scale-95 transition-all"
            title="Leave desk and return to lobby"
          >
            <span className="hidden sm:inline">Leave Desk</span>
            <span className="sm:hidden">Leave</span>
            <span className="text-[11px] font-mono opacity-80">[→]</span>
          </button>
        </div>
      </motion.div>
    </header>
  );
}
