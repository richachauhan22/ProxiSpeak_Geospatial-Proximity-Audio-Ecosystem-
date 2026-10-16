import React, { useState } from 'react';

const COLORS = [
  { hex: '#2563eb', label: 'Electric Blue' },
  { hex: '#7c3aed', label: 'Royal Violet' },
  { hex: '#059669', label: 'Emerald Green' },
  { hex: '#dc2626', label: 'Coral Rose' },
  { hex: '#ea580c', label: 'Vibrant Amber' },
  { hex: '#0891b2', label: 'Teal Cyan' },
  { hex: '#d946ef', label: 'Neon Fuchsia' },
];

const AVATAR_PRESETS = [
  { id: 'mia', label: 'Mia', url: '/avatar_mia.png', role: 'Team Lead' },
  { id: 'alex', label: 'Alex', url: '/avatar_alex.png', role: 'Staff Eng' },
  { id: 'david', label: 'David', url: '/avatar_david.png', role: 'Product' },
  { id: 'marcus', label: 'Marcus', url: '/avatar_marcus.png', role: 'Design' },
  { id: 'oliver', label: 'Oliver', url: '/avatar_oliver.png', role: 'Frontend' },
  { id: 'guest', label: 'Guest', url: '/avatar_1.png', role: 'Visitor' },
  { id: 'initials', label: 'Initials', url: '', role: 'Custom' },
];

const OFFICE_PRESETS = [
  'oVice HQ / C-03',
  'Design Studio / Floor 6',
  'Engineering Cluster A',
  'All-Hands Lounge',
];

export default function JoinOfficePage({
  displayName,
  setDisplayName,
  avatarColor,
  setAvatarColor,
  avatarUrl = '/avatar_mia.png',
  setAvatarUrl = () => {},
  officeId,
  setOfficeId,
  onSubmit,
  onBack,
  error,
  connectionStatus,
  loading,
}) {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);

  const handleQuickFill = () => {
    setDisplayName('Mitesh');
    setAvatarColor('#2563eb');
    setAvatarUrl('/avatar_mia.png');
    setOfficeId('oVice HQ / C-03');
  };

  const handleRandomize = () => {
    const randomPreset = AVATAR_PRESETS[Math.floor(Math.random() * (AVATAR_PRESETS.length - 1))];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setAvatarUrl(randomPreset.url);
    setAvatarColor(randomColor.hex);
  };

  const initialLetter = displayName.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <div className="join-page modern-join-page">
      {/* Ambient background glows */}
      <div className="join-ambient-glow glow-left" style={{ background: avatarColor }} />
      <div className="join-ambient-glow glow-right" />

      {/* Modern Top Header */}
      <header className="landing-nav join-nav glass-nav">
        <button
          type="button"
          className="landing-brand brand-button"
          onClick={onBack}
          aria-label="Back to ProxiSpeak home"
        >
          <div className="brand-logo-glow mini">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3.2" fill="currentColor" />
            </svg>
          </div>
          <span className="brand-title">
            Proxi<span>Speak</span>
          </span>
        </button>

        <div className="join-nav-right">
          <div className={`connection-pill ${connectionStatus}`}>
            <span className="connection-beacon" />
            <span className="connection-text">{connectionStatus === 'connected' ? 'Mesh Network Ready' : connectionStatus}</span>
          </div>
        </div>
      </header>

      <main className="join-content modern-join-layout">
        <div className="join-top-actions">
          <button type="button" className="join-back modern-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Overview</span>
          </button>

          <div className="quick-action-group">
            <button type="button" className="join-quick-fill-btn pill-btn" onClick={handleQuickFill} title="Quick fill defaults">
              <span>⚡ Sample Profile</span>
            </button>
            <button type="button" className="join-random-btn pill-btn" onClick={handleRandomize} title="Randomize look">
              <span>🎲 Shuffle Look</span>
            </button>
          </div>
        </div>

        <div className="join-grid-container">
          {/* ================= LEFT COLUMN: LIVE PERSONA PREVIEW ================= */}
          <aside className="join-preview-column glass-panel">
            <div className="preview-card-header">
              <span className="preview-card-eyebrow">LIVE AVATAR CARD</span>
              <span className="preview-live-badge">PREVIEW</span>
            </div>

            <div className="avatar-showcase-box">
              {/* Animated glowing proximity halo */}
              <div
                className="showcase-aura-halo"
                style={{
                  boxShadow: `0 0 50px 10px ${avatarColor}40`,
                  borderColor: `${avatarColor}60`,
                }}
              />

              <div
                className="showcase-avatar-circle"
                style={{
                  borderColor: avatarColor,
                  boxShadow: `0 8px 30px ${avatarColor}50`,
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || 'Avatar'}
                    className="showcase-img"
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  <span className="showcase-letter" style={{ background: avatarColor }}>
                    {initialLetter}
                  </span>
                )}

                {/* Voice arc ring preview */}
                <div className="showcase-voice-arc" />
              </div>

              {/* Status pill badge on avatar */}
              <div className="showcase-status-badge">
                <span className="status-dot green" />
                <span>{micActive ? 'Mic Active' : 'Mic Muted'}</span>
              </div>
            </div>

            <div className="showcase-user-details">
              <h3 className="showcase-name">{displayName.trim() || 'Your Name'}</h3>
              <p className="showcase-room">
                <span className="room-icon">📍</span>
                <span>{officeId.trim() || 'Floor 6 · Main Floor'}</span>
              </p>
            </div>

            {/* Audio & Camera pre-join check preview */}
            <div className="device-precheck-box">
              <span className="precheck-label">DEVICE QUICK CHECK</span>
              <div className="precheck-toggles">
                <button
                  type="button"
                  className={`device-btn ${micActive ? 'active' : 'muted'}`}
                  onClick={() => setMicActive((v) => !v)}
                  title="Toggle microphone test"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                  </svg>
                  <span>{micActive ? 'Mic Ready' : 'Mic Off'}</span>
                </button>

                <button
                  type="button"
                  className={`device-btn ${cameraActive ? 'active' : 'muted'}`}
                  onClick={() => setCameraActive((v) => !v)}
                  title="Toggle camera test"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span>{cameraActive ? 'Camera Ready' : 'Camera Off'}</span>
                </button>
              </div>

              {/* Simulated Audio Wave Meter */}
              {micActive && (
                <div className="mic-meter-bar">
                  <span className="meter-label">Input Level:</span>
                  <div className="meter-waves">
                    <span className="wave-bar w1" />
                    <span className="wave-bar w2" />
                    <span className="wave-bar w3" />
                    <span className="wave-bar w4" />
                    <span className="wave-bar w5" />
                    <span className="wave-bar w6" />
                  </div>
                </div>
              )}
            </div>

            <div className="spatial-hint-pill">
              <span>🔊 Spatial Audio enables automatically upon walking near teammates</span>
            </div>
          </aside>

          {/* ================= RIGHT COLUMN: CUSTOMIZATION FORM ================= */}
          <section className="join-card glass-panel modern-join-card">
            <div className="card-heading-group">
              <span className="eyebrow gradient-tag">TEAM WORKSPACE PORTAL</span>
              <h1 className="join-title">Step into your office.</h1>
              <p className="join-lede">Customize how teammates see and hear you in the virtual room.</p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
              className="join-form"
            >
              {/* Display Name Input */}
              <div className="field-group modern-field">
                <div className="label-row">
                  <label htmlFor="display-name">Your name</label>
                  <span className="char-count">{displayName.length}/24</span>
                </div>
                <div className="input-wrap">
                  <input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={24}
                    placeholder="e.g. Mia or Alex Chen"
                    autoComplete="name"
                    required
                    className="modern-input"
                  />
                  <span className="input-icon">👤</span>
                </div>
                <span className="field-hint">This name floats above your avatar on the office floor.</span>
              </div>

              {/* Avatar Preset Faces */}
              <div className="field-group modern-field">
                <label className="field-sublabel">Avatar Appearance</label>
                <div className="avatar-preset-grid">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected =
                      (preset.url === '' && !avatarUrl) || (preset.url && avatarUrl === preset.url);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`preset-card-btn ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setAvatarUrl(preset.url)}
                        style={{
                          borderColor: isSelected ? avatarColor : 'transparent',
                          boxShadow: isSelected ? `0 0 16px ${avatarColor}40` : 'none',
                        }}
                        title={`${preset.label} (${preset.role})`}
                      >
                        <div className="preset-thumb">
                          {preset.url ? (
                            <img src={preset.url} alt={preset.label} className="preset-img" />
                          ) : (
                            <span className="preset-letter" style={{ background: avatarColor }}>
                              {initialLetter}
                            </span>
                          )}
                        </div>
                        <span className="preset-name">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Aura Ring Colors */}
              <div className="field-group modern-field">
                <div className="label-row">
                  <label>Aura Proximity Color</label>
                  <span className="selected-color-label">
                    {COLORS.find((c) => c.hex === avatarColor)?.label || 'Custom'}
                  </span>
                </div>
                <div className="color-swatches-row">
                  {COLORS.map((color) => {
                    const isSelected = color.hex === avatarColor;
                    return (
                      <button
                        key={color.hex}
                        type="button"
                        className={`color-swatch-circle ${isSelected ? 'active' : ''}`}
                        style={{
                          background: color.hex,
                          boxShadow: isSelected ? `0 0 14px ${color.hex}` : 'none',
                        }}
                        aria-label={`Select avatar color ${color.label}`}
                        aria-pressed={isSelected}
                        onClick={() => setAvatarColor(color.hex)}
                      >
                        {isSelected && <span className="swatch-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Office Room Selection */}
              <div className="field-group modern-field">
                <label htmlFor="office-id">Office Room or Space Code</label>
                <div className="input-wrap">
                  <input
                    id="office-id"
                    type="text"
                    value={officeId}
                    onChange={(event) => setOfficeId(event.target.value)}
                    maxLength={48}
                    placeholder="e.g. oVice HQ / C-03"
                    required
                    className="modern-input"
                  />
                  <span className="input-icon">🏢</span>
                </div>

                {/* Popular Office Chips */}
                <div className="office-chip-list">
                  {OFFICE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`office-chip ${officeId === preset ? 'active' : ''}`}
                      onClick={() => setOfficeId(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error ? (
                <div className="error-banner" role="alert">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Submit Button */}
              <button
                type="submit"
                className="primary-button join-submit modern-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    <span>Connecting to Virtual Office…</span>
                  </>
                ) : (
                  <>
                    <span>Join Office</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <div className="join-footer-security">
                <span className="security-lock">🔒</span>
                <span>Encrypted WebRTC spatial audio channel · No download required</span>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
