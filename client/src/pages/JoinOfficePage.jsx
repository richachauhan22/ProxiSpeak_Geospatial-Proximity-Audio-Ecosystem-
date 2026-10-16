import React from 'react';

const COLORS = ['#2563eb', '#059669', '#4f46e5', '#dc2626', '#7c3aed', '#ea580c', '#0d9488'];

const AVATAR_PRESETS = [
  { id: 'initials', label: 'Initial', url: '' },
  { id: 'mia', label: 'Mia', url: '/avatar_mia.png' },
  { id: 'alex', label: 'Alex', url: '/avatar_alex.png' },
  { id: 'david', label: 'David', url: '/avatar_david.png' },
  { id: 'marcus', label: 'Marcus', url: '/avatar_marcus.png' },
  { id: 'oliver', label: 'Oliver', url: '/avatar_oliver.png' },
  { id: 'custom', label: 'Guest', url: '/avatar_1.png' },
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
  const handleQuickFill = () => {
    setDisplayName('Mitesh');
    setAvatarColor('#2563eb');
    setAvatarUrl('/avatar_mia.png');
    setOfficeId('oVice HQ / C-03');
  };

  return (
    <div className="join-page">
      <header className="landing-nav join-nav">
        <button type="button" className="landing-brand brand-button" onClick={onBack} aria-label="Back to ProxiSpeak home">
          <span className="landing-brand-icon">P</span>
          <span>Proxi<span>Speak</span></span>
        </button>
        <div className="join-nav-right">
          <span className={`join-status ${connectionStatus}`}><i />{connectionStatus}</span>
        </div>
      </header>
      <main className="join-content">
        <div className="join-top-actions">
          <button type="button" className="join-back" onClick={onBack}>← <span>Back to home</span></button>
          <button type="button" className="join-quick-fill-btn" onClick={handleQuickFill}>⚡ Fill sample profile</button>
        </div>
        <section className="join-card">
          <span className="join-card-icon">✳</span>
          <p className="eyebrow">YOUR TEAM IS WAITING</p>
          <h1>Step into your office.</h1>
          <p className="join-lede">Choose how you’ll show up, then join your shared workspace.</p>
          <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
            <div className="field-group">
              <label htmlFor="display-name">Your name</label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={24}
                placeholder="e.g. Alex Morgan"
                autoComplete="name"
                required
              />
              <span className="field-hint">This is how teammates will see you (2–24 characters).</span>
            </div>

            {/* Avatar Style & Face Selection */}
            <div className="join-avatar-selection-block">
              <label className="field-sublabel">Choose Avatar Face</label>
              <div className="avatar-preset-picker">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = (preset.url === '' && !avatarUrl) || (preset.url && avatarUrl === preset.url);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-avatar-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{ borderColor: isSelected ? avatarColor : 'transparent' }}
                      title={preset.label}
                    >
                      {preset.url ? (
                        <img src={preset.url} alt={preset.label} className="preset-img" />
                      ) : (
                        <span className="preset-letter" style={{ background: avatarColor }}>
                          {displayName.trim().slice(0, 1).toUpperCase() || 'A'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="join-avatar-row">
              <div className="join-avatar-preview" style={{ borderColor: avatarColor, background: avatarColor }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="preview-face-img" onError={() => setAvatarUrl('')} />
                ) : (
                  <span>{displayName.trim().slice(0, 1).toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="field-group color-field">
                <label>Avatar color ring</label>
                <div className="color-options">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={color === avatarColor ? 'swatch active' : 'swatch'}
                      style={{ background: color }}
                      aria-label={`Select avatar color ${color}`}
                      aria-pressed={color === avatarColor}
                      onClick={() => setAvatarColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="office-id">Office name or code</label>
              <input
                id="office-id"
                type="text"
                value={officeId}
                onChange={(event) => setOfficeId(event.target.value)}
                maxLength={48}
                placeholder="e.g. design-team"
                required
              />
              <span className="field-hint">Use the same office code as your teammates (default: oVice HQ / C-03).</span>
            </div>

            {error ? <p className="error-message" role="alert">{error}</p> : null}

            <button type="submit" className="primary-button join-submit" disabled={loading}>
              {loading ? <><span className="button-spinner" /> Connecting to office…</> : <>Join Office <span aria-hidden="true">→</span></>}
            </button>
            <p className="join-footnote">Your workspace opens after the server confirms your connection.</p>
          </form>
        </section>
      </main>
    </div>
  );
}
