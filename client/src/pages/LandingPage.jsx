const FEATURES = [
  {
    number: '01',
    title: 'Move around together',
    copy: 'Explore a shared office map and see teammates represented in the spaces around you.',
    color: 'indigo',
  },
  {
    number: '02',
    title: 'Know who is nearby',
    copy: 'A live participant view makes it easy to tell who is sharing your virtual workspace.',
    color: 'teal',
  },
  {
    number: '03',
    title: 'Spatial proximity audio',
    copy: 'Conversations fade in and connect naturally as you walk toward teammates and step into their active discussion zone.',
    color: 'emerald',
  },
];

export default function LandingPage({ onEnter, onExplore, onDirectOffice }) {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="/" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="landing-brand-icon">P</span>
          <span>Proxi<span>Speak</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <button type="button" className="landing-nav-cta" onClick={onEnter}>Enter office <span aria-hidden="true">↗</span></button>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-kicker"><i /> YOUR TEAM, IN THE SAME SPACE</span>
            <h1>Work together,<br /><span>naturally.</span></h1>
            <p>Step into a shared virtual office. Find your team, move through the space, and make collaboration feel human and spontaneous.</p>
            <div className="landing-hero-actions">
              <button type="button" className="landing-primary" onClick={onEnter}>Enter Virtual Office <span aria-hidden="true">→</span></button>
              {onDirectOffice && (
                <button type="button" className="landing-direct-btn" onClick={onDirectOffice}>
                  Instant Demo Tour 🏢
                </button>
              )}
              <button type="button" className="landing-secondary" onClick={onExplore}>Explore features <span aria-hidden="true">↓</span></button>
            </div>
            <div className="landing-live-note"><span className="live-dot" /> Live office presence <span className="note-divider" /> No downloads needed</div>
          </div>
          <div className="landing-preview" aria-label="Illustration of a virtual office workspace">
            <div className="preview-topline"><span className="preview-dots"><i /><i /><i /></span><span>team-space / open office</span><span className="preview-online"><i /> LIVE</span></div>
            <div className="preview-floor">
              <span className="preview-desk desk-a"><i /><b /></span>
              <span className="preview-desk desk-b"><i /><b /></span>
              <span className="preview-desk desk-c"><i /><b /></span>
              <span className="preview-desk desk-d"><i /><b /></span>
              <span className="preview-partition partition-a" />
              <span className="preview-partition partition-b" />
              <span className="preview-person person-a"><i>J</i><b>Jordan</b></span>
              <span className="preview-person person-b"><i>M</i><b>Morgan</b></span>
              <span className="preview-person person-c"><i>A</i><b>You</b></span>
              <div className="preview-presence"><span><i /> 3 teammates online</span><span>⌘ K</span></div>
            </div>
          </div>
        </section>

        <section className="feature-section" id="features">
          <div className="section-heading">
            <span className="landing-kicker">A BETTER WAY TO BE REMOTE</span>
            <h2>Work feels better when you’re <span>in the room.</span></h2>
            <p>ProxiSpeak brings your people into one shared space, wherever work happens.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article className={`feature-card ${feature.color}`} key={feature.number}>
                <span className="feature-number">{feature.number}</span>
                <div className="feature-icon" aria-hidden="true">{feature.number === '01' ? '↗' : feature.number === '02' ? '◎' : '◖'}</div>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div>
            <span className="landing-kicker">SIMPLE BY DESIGN</span>
            <h2>From link to <span>team-space.</span></h2>
          </div>
          <div className="how-steps">
            <article><span>1</span><div><h3>Choose your space</h3><p>Enter an office name to meet your team in its shared workspace.</p></div></article>
            <article><span>2</span><div><h3>Make yourself at home</h3><p>Pick a name and avatar color, then join the live office.</p></div></article>
            <article><span>3</span><div><h3>Find your people</h3><p>Move around the map and see teammates arrive in real time.</p></div></article>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><a className="landing-brand" href="#"><span className="landing-brand-icon">P</span><span>Proxi<span>Speak</span></span></a><span>Shared space. Better work.</span><span>Live presence preview</span></footer>
    </div>
  );
}
