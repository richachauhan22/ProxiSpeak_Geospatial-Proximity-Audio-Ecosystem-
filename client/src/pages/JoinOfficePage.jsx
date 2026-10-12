const COLORS = ['#059669', '#4f46e5', '#dc2626', '#7c3aed', '#ea580c', '#0d9488'];

export default function JoinOfficePage({
  displayName,
  setDisplayName,
  avatarColor,
  setAvatarColor,
  officeId,
  setOfficeId,
  onSubmit,
  onBack,
  error,
  connectionStatus,
  loading,
}) {
  return (
    <div className="join-page">
      <header className="landing-nav join-nav">
        <button type="button" className="landing-brand brand-button" onClick={onBack} aria-label="Back to ProxiSpeak home">
          <span className="landing-brand-icon">P</span>
          <span>Proxi<span>Speak</span></span>
        </button>
        <span className={`join-status ${connectionStatus}`}><i />{connectionStatus}</span>
      </header>
      <main className="join-content">
        <button type="button" className="join-back" onClick={onBack}>← <span>Back to home</span></button>
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
            <div className="join-avatar-row">
              <div className="join-avatar-preview" style={{ background: avatarColor }}>{displayName.trim().slice(0, 1).toUpperCase() || '?'}</div>
              <div className="field-group color-field">
                <label>Avatar color</label>
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
              <span className="field-hint">Use the same office code as your teammates.</span>
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
