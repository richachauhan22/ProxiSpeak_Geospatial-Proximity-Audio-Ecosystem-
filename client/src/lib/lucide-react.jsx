import React from 'react';

function createLucideIcon(name, paths) {
  const Icon = React.forwardRef(({
    color = 'currentColor',
    size = 20,
    strokeWidth = 2,
    className = '',
    style = {},
    children,
    ...rest
  }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`lucide lucide-${name.toLowerCase()} ${className}`}
        style={style}
        {...rest}
      >
        {paths.map(([tag, attrs], idx) => {
          const Tag = tag;
          return <Tag key={idx} {...attrs} />;
        })}
        {children}
      </svg>
    );
  });
  Icon.displayName = name;
  return Icon;
}

export const Mic = createLucideIcon('Mic', [
  ['path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' }],
  ['path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }],
  ['line', { x1: '12', x2: '12', y1: '19', y2: '22' }],
]);

export const MicOff = createLucideIcon('MicOff', [
  ['line', { x1: '2', x2: '22', y1: '2', y2: '22' }],
  ['path', { d: 'M18.89 13.23A7.12 7.12 0 0 0 19 12v-2' }],
  ['path', { d: 'M5 10v2a7 7 0 0 0 12 5' }],
  ['path', { d: 'M15 9.34V5a3 3 0 0 0-5.68-1.33' }],
  ['path', { d: 'M9 9v3a3 3 0 0 0 5.12 2.12' }],
  ['line', { x1: '12', x2: '12', y1: '19', y2: '22' }],
]);

export const Video = createLucideIcon('Video', [
  ['path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11' }],
  ['rect', { x: '2', y: '6', width: '14', height: '12', rx: '2' }],
]);

export const VideoOff = createLucideIcon('VideoOff', [
  ['line', { x1: '2', x2: '22', y1: '2', y2: '22' }],
  ['path', { d: 'M10.66 6H14a2 2 0 0 1 2 2v2.5l5.22-3.48a.5.5 0 0 1 .78.42v8.12' }],
  ['path', { d: 'M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2' }],
]);

export const Share2 = createLucideIcon('Share2', [
  ['circle', { cx: '18', cy: '5', r: '3' }],
  ['circle', { cx: '6', cy: '12', r: '3' }],
  ['circle', { cx: '18', cy: '19', r: '3' }],
  ['line', { x1: '8.59', x2: '15.42', y1: '13.51', y2: '17.49' }],
  ['line', { x1: '15.41', x2: '8.59', y1: '6.51', y2: '10.49' }],
]);

export const ScreenShare = createLucideIcon('ScreenShare', [
  ['path', { d: 'M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3' }],
  ['path', { d: 'M8 21h8' }],
  ['path', { d: 'M12 17v4' }],
  ['path', { d: 'm17 8 5-5' }],
  ['path', { d: 'M17 3h5v5' }],
]);

export const Copy = createLucideIcon('Copy', [
  ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
  ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }],
]);

export const Check = createLucideIcon('Check', [
  ['polyline', { points: '20 6 9 17 4 12' }],
]);

export const Sun = createLucideIcon('Sun', [
  ['circle', { cx: '12', cy: '12', r: '4' }],
  ['path', { d: 'M12 2v2' }],
  ['path', { d: 'M12 20v2' }],
  ['path', { d: 'm4.93 4.93 1.41 1.41' }],
  ['path', { d: 'm17.66 17.66 1.41 1.41' }],
  ['path', { d: 'M2 12h2' }],
  ['path', { d: 'M20 12h2' }],
  ['path', { d: 'm6.34 17.66-1.41 1.41' }],
  ['path', { d: 'm19.07 4.93-1.41 1.41' }],
]);

export const Sunset = createLucideIcon('Sunset', [
  ['path', { d: 'M12 10V2' }],
  ['path', { d: 'm4.93 4.93 1.41 1.41' }],
  ['path', { d: 'M2 10h2' }],
  ['path', { d: 'M20 10h2' }],
  ['path', { d: 'm19.07 4.93-1.41 1.41' }],
  ['path', { d: 'M22 22H2' }],
  ['path', { d: 'm16 6-4 4-4-4' }],
  ['path', { d: 'M16 18a4 4 0 0 0-8 0' }],
]);

export const Moon = createLucideIcon('Moon', [
  ['path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }],
]);

export const PenTool = createLucideIcon('PenTool', [
  ['path', { d: 'm12 19 7-7 3 3-7 7-3-3z' }],
  ['path', { d: 'm18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' }],
  ['path', { d: 'm2 2 7.586 7.586' }],
  ['circle', { cx: '11', cy: '11', r: '2' }],
]);

export const Radio = createLucideIcon('Radio', [
  ['path', { d: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9' }],
  ['path', { d: 'M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5' }],
  ['circle', { cx: '12', cy: '12', r: '2' }],
  ['path', { d: 'M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5' }],
  ['path', { d: 'M19.1 4.9C23 8.8 23 15.1 19.1 19' }],
]);

export const Signal = createLucideIcon('Signal', [
  ['path', { d: 'M2 20h.01' }],
  ['path', { d: 'M7 20v-4' }],
  ['path', { d: 'M12 20v-8' }],
  ['path', { d: 'M17 20V4' }],
  ['path', { d: 'M22 20v-16' }],
]);

export const Bell = createLucideIcon('Bell', [
  ['path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }],
  ['path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }],
]);

export const Settings = createLucideIcon('Settings', [
  ['path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }],
  ['circle', { cx: '12', cy: '12', r: '3' }],
]);

export const LogOut = createLucideIcon('LogOut', [
  ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }],
  ['polyline', { points: '16 17 21 12 16 7' }],
  ['line', { x1: '21', x2: '9', y1: '12', y2: '12' }],
]);

export const ChevronUp = createLucideIcon('ChevronUp', [
  ['path', { d: 'm18 15-6-6-6 6' }],
]);

export const ChevronDown = createLucideIcon('ChevronDown', [
  ['path', { d: 'm6 9 6 6 6-6' }],
]);

export const ChevronRight = createLucideIcon('ChevronRight', [
  ['path', { d: 'm9 18 6-6-6-6' }],
]);

export const Crosshair = createLucideIcon('Crosshair', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['line', { x1: '22', x2: '18', y1: '12', y2: '12' }],
  ['line', { x1: '6', x2: '2', y1: '12', y2: '12' }],
  ['line', { x1: '12', x2: '12', y1: '6', y2: '2' }],
  ['line', { x1: '12', x2: '12', y1: '22', y2: '18' }],
]);

export const Minus = createLucideIcon('Minus', [
  ['path', { d: 'M5 12h14' }],
]);

export const Plus = createLucideIcon('Plus', [
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'M12 5v14' }],
]);

export const Maximize = createLucideIcon('Maximize', [
  ['path', { d: 'M8 3H5a2 2 0 0 0-2 2v3' }],
  ['path', { d: 'M21 8V5a2 2 0 0 0-2-2h-3' }],
  ['path', { d: 'M3 16v3a2 2 0 0 0 2 2h3' }],
  ['path', { d: 'M16 21h3a2 2 0 0 0 2-2v-3' }],
]);

export const Minimize = createLucideIcon('Minimize', [
  ['path', { d: 'M8 3v3a2 2 0 0 1-2 2H3' }],
  ['path', { d: 'M21 8h-3a2 2 0 0 1-2-2V3' }],
  ['path', { d: 'M3 16h3a2 2 0 0 1 2 2v3' }],
  ['path', { d: 'M16 21v-3a2 2 0 0 1 2-2h3' }],
]);

export const Volume2 = createLucideIcon('Volume2', [
  ['polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }],
  ['path', { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }],
  ['path', { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' }],
]);

export const VolumeX = createLucideIcon('VolumeX', [
  ['polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }],
  ['line', { x1: '22', x2: '16', y1: '9', y2: '15' }],
  ['line', { x1: '16', x2: '22', y1: '9', y2: '15' }],
]);

export const Smile = createLucideIcon('Smile', [
  ['circle', { cx: '12', cy: '12', r: '10' }],
  ['path', { d: 'M8 14s1.5 2 4 2 4-2 4-2' }],
  ['line', { x1: '9', x2: '9.01', y1: '9', y2: '9' }],
  ['line', { x1: '15', x2: '15.01', y1: '9', y2: '9' }],
]);

export const Users = createLucideIcon('Users', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }],
  ['circle', { cx: '9', cy: '7', r: '4' }],
  ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }],
  ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }],
]);

export const MessageSquare = createLucideIcon('MessageSquare', [
  ['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }],
]);

export const Sparkles = createLucideIcon('Sparkles', [
  ['path', { d: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z' }],
]);

export const Activity = createLucideIcon('Activity', [
  ['path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' }],
]);

export const Layers = createLucideIcon('Layers', [
  ['polygon', { points: '12 2 2 7 12 12 22 7 12 2' }],
  ['polyline', { points: '2 17 12 22 22 17' }],
  ['polyline', { points: '2 12 12 17 22 12' }],
]);

export const ExternalLink = createLucideIcon('ExternalLink', [
  ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }],
  ['polyline', { points: '15 3 21 3 21 9' }],
  ['line', { x1: '10', x2: '21', y1: '14', y2: '3' }],
]);

export default {
  Mic, MicOff, Video, VideoOff, Share2, ScreenShare, Copy, Check,
  Sun, Sunset, Moon, PenTool, Radio, Signal, Bell, Settings,
  LogOut, ChevronUp, ChevronDown, ChevronRight, Crosshair, Minus,
  Plus, Maximize, Minimize, Volume2, VolumeX, Smile, Users,
  MessageSquare, Sparkles, Activity, Layers, ExternalLink
};
