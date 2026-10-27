import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';
import { calculateSpatialVolume } from '../services/webrtcManager';

function AttenuationCurveGraph({ minDistance = 60, maxDistance = 280, model = 'linear', rolloffFactor = 1.0 }) {
  const width = 340;
  const height = 110;
  const padding = { top: 14, right: 14, bottom: 22, left: 36 };
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  const points = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * maxDistance;
    const vol = calculateSpatialVolume(d, { minDistance, maxDistance, attenuationModel: model, rolloffFactor });
    const x = padding.left + (d / maxDistance) * graphW;
    const y = padding.top + (1 - vol) * graphH;
    points.push({ x, y, d, vol });
  }

  const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
  const areaD = `${pathD} L ${(padding.left + graphW).toFixed(1)} ${(padding.top + graphH).toFixed(1)} L ${padding.left.toFixed(1)} ${(padding.top + graphH).toFixed(1)} Z`;

  const probeDist = Math.round(minDistance + (maxDistance - minDistance) * 0.42);
  const probeVol = calculateSpatialVolume(probeDist, { minDistance, maxDistance, attenuationModel: model, rolloffFactor });
  const probeX = padding.left + (probeDist / maxDistance) * graphW;
  const probeY = padding.top + (1 - probeVol) * graphH;

  return (
    <div className="attenuation-curve-card" style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid #e2e8f0', marginTop: '12px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#475569' }}>
        <span>📈 DYNAMIC ATTENUATION CURVE</span>
        <span style={{ color: '#2563eb' }}>{probeDist}px ➔ {Math.round(probeVol * 100)}% vol</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={padding.left} y1={padding.top} x2={padding.left + graphW} y2={padding.top} stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1={padding.left} y1={padding.top + graphH / 2} x2={padding.left + graphW} y2={padding.top + graphH / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1={padding.left} y1={padding.top + graphH} x2={padding.left + graphW} y2={padding.top + graphH} stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + graphH} stroke="#cbd5e1" strokeWidth="1.5" />

        {minDistance < maxDistance && (
          <line
            x1={padding.left + (minDistance / maxDistance) * graphW}
            y1={padding.top}
            x2={padding.left + (minDistance / maxDistance) * graphW}
            y2={padding.top + graphH}
            stroke="#10b981"
            strokeDasharray="2 2"
            strokeWidth="1.2"
          />
        )}

        <path d={areaD} fill="url(#curveGradient)" />
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={probeX} cy={probeY} r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

        <text x={padding.left - 4} y={padding.top + 4} fill="#64748b" fontSize="9" textAnchor="end">100%</text>
        <text x={padding.left - 4} y={padding.top + graphH / 2 + 3} fill="#64748b" fontSize="9" textAnchor="end">50%</text>
        <text x={padding.left - 4} y={padding.top + graphH + 3} fill="#64748b" fontSize="9" textAnchor="end">0%</text>

        <text x={padding.left} y={height - 6} fill="#64748b" fontSize="9" textAnchor="start">0px</text>
        {minDistance > 0 && minDistance < maxDistance && (
          <text x={padding.left + (minDistance / maxDistance) * graphW} y={height - 6} fill="#10b981" fontSize="9" textAnchor="middle">{minDistance}px</text>
        )}
        <text x={padding.left + graphW} y={height - 6} fill="#64748b" fontSize="9" textAnchor="end">{maxDistance}px</text>
      </svg>
    </div>
  );
}

export function CalendarModal({ isOpen, onClose, onJoinMeetingArea }) {
  if (!isOpen) return null;

  const events = [
    {
      id: 1,
      time: '10:00 - 10:30 AM',
      title: 'Weekly Office All-Hands',
      location: 'Main Stage · Zone C',
      attendees: '12 attending',
      isLive: true,
      x: 1068,
      y: 500,
    },
    {
      id: 2,
      time: '02:00 - 02:45 PM',
      title: 'Product & Spatial Audio Sync',
      location: 'Conference Pod C-03',
      attendees: '5 attending',
      isLive: false,
      x: 692,
      y: 498,
    },
    {
      id: 3,
      time: '04:30 - 05:00 PM',
      title: 'Engineering Demo & Standup',
      location: 'Open Workspace Cluster',
      attendees: '8 attending',
      isLive: false,
      x: 276,
      y: 164,
    },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">📅</span>
            <div>
              <h3>Office Calendar & Events</h3>
              <span className="modal-subtitle">Floor 6 scheduled gatherings</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="events-timeline">
            {events.map((ev) => (
              <div key={ev.id} className={`event-card-item ${ev.isLive ? 'is-live' : ''}`}>
                <div className="event-time-col">
                  <span className="event-time">{ev.time}</span>
                  {ev.isLive && <span className="live-pill">HAPPENING NOW</span>}
                </div>
                <div className="event-desc-col">
                  <strong>{ev.title}</strong>
                  <p className="event-loc">📍 {ev.location} • {ev.attendees}</p>
                </div>
                {onJoinMeetingArea && (
                  <button
                    type="button"
                    className="event-walk-btn"
                    onClick={() => {
                      onJoinMeetingArea(ev.x, ev.y);
                      onClose();
                    }}
                  >
                    Walk to Pod
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const notifs = [
    {
      id: 1,
      sender: 'David',
      text: 'invited you to join the design huddle at Desk Cluster 4.',
      time: '5m ago',
      unread: true,
      icon: '💬',
    },
    {
      id: 2,
      sender: 'System',
      text: 'Floor 6 WebRTC audio channel is optimal with 14ms latency.',
      time: '12m ago',
      unread: true,
      icon: '⚡',
    },
    {
      id: 3,
      sender: 'Alex',
      text: 'stepped into your spatial audio range.',
      time: '25m ago',
      unread: false,
      icon: '🎙️',
    },
    {
      id: 4,
      sender: 'ProxiSpeak HQ',
      text: 'ProxiSpeak 2.0 Spatial Engine updated successfully.',
      time: '1h ago',
      unread: false,
      icon: '✨',
    },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🔔</span>
            <div>
              <h3>Notifications</h3>
              <span className="modal-subtitle">Activity & workspace mentions</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body notifs-list">
          {notifs.map((n) => (
            <div key={n.id} className={`notification-card ${n.unread ? 'unread' : ''}`}>
              <span className="notif-type-icon">{n.icon}</span>
              <div className="notif-content">
                <p>
                  <strong>{n.sender}</strong> {n.text}
                </p>
                <span className="notif-timestamp">{n.time}</span>
              </div>
              {n.unread && <span className="notif-dot-beacon" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  onLeaveOffice,
  proximityDistance = 240,
  onProximityChange,
  spatialConfig = null,
  onSpatialConfigChange = null,
  audioLevel = 0,
  isMuted = false,
  permissionStatus = 'idle',
  onRequestMic,
}) {
  const [localDistance, setLocalDistance] = useState(spatialConfig?.maxDistance ?? proximityDistance);
  const [minDistance, setMinDistance] = useState(spatialConfig?.minDistance ?? 60);
  const [attenuationModel, setAttenuationModel] = useState(spatialConfig?.attenuationModel ?? 'linear');
  const [rolloffFactor, setRolloffFactor] = useState(spatialConfig?.rolloffFactor ?? 1.0);
  const [airDamping, setAirDamping] = useState(spatialConfig?.airDamping !== false);
  const [occlusionEnabled, setOcclusionEnabled] = useState(spatialConfig?.occlusionEnabled !== false);
  const [spatialAudioEnabled, setSpatialAudioEnabled] = useState(spatialConfig?.panEnabled !== false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('default');

  const emitConfigChange = (updates = {}) => {
    const nextConfig = {
      minDistance,
      maxDistance: localDistance,
      attenuationModel,
      rolloffFactor,
      airDamping,
      occlusionEnabled,
      panEnabled: spatialAudioEnabled,
      ...updates,
    };
    onSpatialConfigChange?.(nextConfig);
    if ('maxDistance' in updates) {
      onProximityChange?.(updates.maxDistance);
    }
  };

  React.useEffect(() => {
    if (isOpen && navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const mics = devices.filter((d) => d.kind === 'audioinput');
        if (mics.length > 0) {
          setAudioDevices(mics);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⚙️</span>
            <div>
              <h3>Workspace & Audio Settings</h3>
              <span className="modal-subtitle">Web Audio API dynamic attenuation & WebRTC configuration</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body settings-body">
          <div className="setting-group">
            <label>Microphone Device</label>
            <select
              className="setting-select"
              value={selectedDevice}
              onChange={(e) => {
                setSelectedDevice(e.target.value);
                if (onRequestMic) onRequestMic(e.target.value);
              }}
            >
              <option value="default">Default — System Microphone</option>
              {audioDevices.map((dev, idx) => (
                <option key={dev.deviceId || idx} value={dev.deviceId}>
                  {dev.label || `Microphone ${idx + 1}`}
                </option>
              ))}
            </select>

            {/* Live Mic Level Test Meter */}
            <div className="mic-test-meter-row" style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                <span>Input Level {permissionStatus === 'denied' ? '(Permission Blocked)' : isMuted ? '(Muted)' : ''}</span>
                <span>{permissionStatus === 'granted' ? 'Connected' : permissionStatus}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${isMuted ? 0 : Math.min(100, Math.round(audioLevel * 100))}%`,
                    height: '100%',
                    background: audioLevel > 0.6 ? '#ef4444' : '#10b981',
                    transition: 'width 0.08s ease-out',
                  }}
                />
              </div>
              {permissionStatus === 'denied' && onRequestMic && (
                <button
                  type="button"
                  onClick={() => onRequestMic()}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Allow Microphone Access
                </button>
              )}
            </div>
          </div>

          <div className="setting-group">
            <label>Camera Device</label>
            <select className="setting-select" defaultValue="default">
              <option value="default">HD Web Camera (1080p 60fps)</option>
              <option value="obs">OBS Virtual Camera</option>
            </select>
          </div>

          {/* Dynamic Attenuation Section */}
          <div className="setting-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>
                🎛️ DYNAMIC AUDIO ATTENUATION ENGINE
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                Web Audio API
              </span>
            </div>

            {/* Model Selection */}
            <div style={{ marginBottom: '10px' }}>
              <label htmlFor="attenuation-model-select" style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '4px' }}>
                Distance Falloff Algorithm
              </label>
              <select
                id="attenuation-model-select"
                className="setting-select"
                value={attenuationModel}
                onChange={(e) => {
                  const val = e.target.value;
                  setAttenuationModel(val);
                  emitConfigChange({ attenuationModel: val });
                }}
              >
                <option value="linear">Linear Drop-off (Uniform dB/px)</option>
                <option value="exponential">Exponential Drop-off (Perceptual dB Logarithmic)</option>
                <option value="inverse">Inverse Distance (Physical 1/r Wave)</option>
                <option value="smoothstep">Smoothstep S-Curve (Hermite Smooth)</option>
              </select>
            </div>

            {/* Full-volume core radius picker */}
            <div style={{ marginBottom: '12px' }}>
              <div className="slider-label-row">
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                  Full-Volume Core Radius (d_min)
                </span>
                <strong style={{ fontSize: '12px', color: '#10b981' }}>{minDistance} px</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                {[30, 60, 90, 120].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setMinDistance(r);
                      emitConfigChange({ minDistance: r });
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: minDistance === r ? '700' : '500',
                      borderRadius: '6px',
                      border: minDistance === r ? '1px solid #10b981' : '1px solid #cbd5e1',
                      background: minDistance === r ? '#ecfdf5' : '#ffffff',
                      color: minDistance === r ? '#065f46' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {r} px {r === 60 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Proximity Max Distance Slider */}
            <div>
              <div className="slider-label-row">
                <label htmlFor="proximity-falloff-slider">Spatial Proximity Audio Falloff</label>
                <strong>{localDistance} px radius</strong>
              </div>
              <input
                id="proximity-falloff-slider"
                type="range"
                min="100"
                max="400"
                value={localDistance}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLocalDistance(val);
                  onProximityChange?.(val);
                  emitConfigChange({ maxDistance: val });
                }}
                className="modern-range-slider"
              />
              <span className="setting-help" style={{ marginTop: '4px', display: 'block' }}>
                Controls the physical boundary in pixels where your avatar transitions smoothly to complete silence.
              </span>
            </div>

            {/* Real-time curve graph */}
            <AttenuationCurveGraph
              minDistance={minDistance}
              maxDistance={localDistance}
              model={attenuationModel}
              rolloffFactor={rolloffFactor}
            />
          </div>

          <div className="settings-toggle-grid">
            <div className="toggle-item">
              <div>
                <strong>3D Spatial Panning</strong>
                <p>Pan sound to left/right ear according to position</p>
              </div>
              <input
                type="checkbox"
                checked={spatialAudioEnabled}
                onChange={(e) => {
                  setSpatialAudioEnabled(e.target.checked);
                  emitConfigChange({ panEnabled: e.target.checked });
                }}
                className="modern-switch"
              />
            </div>

            <div className="toggle-item">
              <div>
                <strong>Acoustic Air Damping (Lowpass)</strong>
                <p>Rolls off high frequencies with distance for acoustic realism</p>
              </div>
              <input
                type="checkbox"
                checked={airDamping}
                onChange={(e) => {
                  setAirDamping(e.target.checked);
                  emitConfigChange({ airDamping: e.target.checked });
                }}
                className="modern-switch"
              />
            </div>

            <div className="toggle-item">
              <div>
                <strong>Obstacle & Wall Occlusion</strong>
                <p>Muffles audio when cubicles or partitions obstruct line of sight</p>
              </div>
              <input
                type="checkbox"
                checked={occlusionEnabled}
                onChange={(e) => {
                  setOcclusionEnabled(e.target.checked);
                  emitConfigChange({ occlusionEnabled: e.target.checked });
                }}
                className="modern-switch"
              />
            </div>

            <div className="toggle-item">
              <div>
                <strong>Interactive Chimes & Sounds</strong>
                <p>Play audio feedback when entering zones or reacting</p>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="modern-switch"
              />
            </div>
          </div>

          {onLeaveOffice && (
            <div className="modal-danger-section">
              <h4>Session Management</h4>
              <button
                type="button"
                className="leave-office-btn"
                onClick={() => {
                  onClose();
                  onLeaveOffice();
                }}
              >
                <span>🚪 Leave Virtual Office</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal help-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⌨️</span>
            <div>
              <h3>Movement & Shortcuts Guide</h3>
              <span className="modal-subtitle">Effortlessly navigate the ProxiSpeak ecosystem</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body help-grid">
          <div className="help-card">
            <div className="help-icon">🧭</div>
            <strong>WASD & Arrow Keys</strong>
            <p>Walk smoothly in 8 directions across desks, lounges, and conference rooms.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖱️</div>
            <strong>Click to Walk</strong>
            <p>Click anywhere on the floor map. Your avatar will pathfind directly to that spot.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🖐️</div>
            <strong>Drag to Pan Floor</strong>
            <p>Click and drag empty floor spaces to pan your view across the expansive 1440x894 canvas.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🎙️</div>
            <strong>Proximity Zone Audio</strong>
            <p>Walk within 260px of any speaking teammate to hear them loud and clear.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🗺️</div>
            <strong>Radar Mini-Map (M)</strong>
            <p>Toggle the radar mini-map to see the full floor overview and click to teleport.</p>
          </div>
          <div className="help-card">
            <div className="help-icon">🎯</div>
            <strong>Recenter Avatar</strong>
            <p>Click the target icon in the bottom dock to instantly snap the camera back to yourself.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuickToolsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tools = [
    { title: 'Interactive Whiteboard', desc: 'Collaborative sketching canvas for brainstorming', icon: '🎨' },
    { title: 'Sticky Notes Wall', desc: 'Pin thoughts, tasks and feedback to this floor', icon: '📝' },
    { title: 'Screen Broadcast Pod', desc: 'Share your screen with the entire floor', icon: '🖥️' },
    { title: 'Auditorium Megaphone', desc: 'Broadcast announcement audio to all rooms', icon: '📢' },
    { title: 'Quick Poll', desc: 'Launch a quick vote for teammates in your zone', icon: '📊' },
    { title: 'Coffee Break Timer', desc: 'Start a 10-minute focus or rest timer', icon: '☕' },
  ];

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">🛠️</span>
            <div>
              <h3>Workspace Tools & Widgets</h3>
              <span className="modal-subtitle">Add interactive collaboration tools to Floor 6</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="tools-grid">
            {tools.map((t, idx) => (
              <div
                key={idx}
                className="tool-card"
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
              >
                <span className="tool-icon">{t.icon}</span>
                <div className="tool-text">
                  <strong>{t.title}</strong>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaveConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose}>
      <div className="ovice-modal confirm-modal modern-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon-circle">🚪</div>
        <h3>Leave Virtual Office?</h3>
        <p>You will disconnect from the spatial audio mesh and step out of Floor 6. Your presence will be removed from teammates' screens.</p>
        <div className="confirm-buttons">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Stay in Office
          </button>
          <button type="button" className="danger-btn" onClick={onConfirm}>
            Leave Office
          </button>
        </div>
      </div>
    </div>
  );
}
