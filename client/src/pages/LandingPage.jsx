import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

const FEATURES = [
  {
    number: '01',
    title: 'Spatial Proximity Audio',
    copy: 'Voices naturally fade in as you walk toward colleagues and fade out as you walk away, just like a real office.',
    icon: '🎙️',
    tag: '360° Audio',
    color: 'indigo',
  },
  {
    number: '02',
    title: 'Fluid 2D Canvas Navigation',
    copy: 'Glide effortlessly across customizable high-DPI office maps using 8-direction WASD controls or intuitive click-to-walk.',
    icon: '🧭',
    tag: '60 FPS',
    color: 'blue',
  },
  {
    number: '03',
    title: 'Multi-Zone Workspaces',
    copy: 'Transition smoothly between private focus pods, team collaboration clusters, and open-floor auditorium stages.',
    icon: '🏢',
    tag: 'Multi-Floor',
    color: 'teal',
  },
  {
    number: '04',
    title: 'Instant Live Presence',
    copy: 'See who is at their desk, who is in discussion, and who is on a quick break with real-time status and radar overlays.',
    icon: '⚡',
    tag: 'Real-time',
    color: 'emerald',
  },
];

const METRICS = [
  { value: '< 18ms', label: 'Positional Latency', desc: 'Real-time Socket.io engine' },
  { value: '360°', label: 'Spatial Proximity', desc: 'Geometric distance falloff' },
  { value: '12 Floors', label: 'Multi-Floor HQ', desc: 'Customizable office layouts' },
  { value: '100%', label: 'Browser Native', desc: 'No downloads or plugins needed' },
];

export default function LandingPage({ onEnter, onExplore, onDirectOffice }) {
  const [demoDistance, setDemoDistance] = useState(140);
  const [activeTab, setActiveTab] = useState('overview');

  const handleTestChime = () => {
    sounds.playProximityChime();
  };

  const volumePercent = Math.max(0, Math.min(100, Math.round((1 - demoDistance / 300) * 100)));

  return (
    <div className="landing-page modern-landing">
      {/* Ambient background blur orbs */}
      <div className="landing-ambient-orb orb-1" aria-hidden="true" />
      <div className="landing-ambient-orb orb-2" aria-hidden="true" />
      <div className="landing-ambient-orb orb-3" aria-hidden="true" />

      {/* Modern Frosted Header */}
      <header className="landing-nav glass-nav">
        <a
          className="landing-brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <div className="brand-logo-glow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
          <span className="brand-version-badge">v2.0</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#audio-demo">Spatial Audio</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <div className="nav-actions">
          {onDirectOffice && (
            <button
              type="button"
              className="nav-secondary-btn"
              onClick={onDirectOffice}
              title="Instant 1-click preview without setup"
            >
              <span>Instant Demo</span>
            </button>
          )}
          <button type="button" className="landing-nav-cta pulse-glow" onClick={onEnter}>
            <span>Enter Office</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {/* ================= HERO SECTION ================= */}
        <section className="landing-hero modern-hero">
          <div className="landing-hero-copy">
            <div className="hero-badge">
              <span className="badge-pulse-dot" />
              <span className="badge-text">Next-Gen Spatial Collaboration</span>
              <span className="badge-arrow">→</span>
            </div>

            <h1 className="hero-headline">
              Work together,<br />
              <span className="gradient-text">naturally.</span>
            </h1>

            <p className="hero-subheading">
              Step into an immersive virtual workspace where physical distance maps to spatial audio.
              Walk over to teammates to strike up spontaneous conversations, huddle around whiteboard desks,
              and make remote work feel truly alive.
            </p>

            <div className="landing-hero-actions">
              <button type="button" className="landing-primary primary-glow-btn" onClick={onEnter}>
                <span>Enter Virtual Office</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              {onDirectOffice && (
                <button type="button" className="landing-direct-btn modern-glass-btn" onClick={onDirectOffice}>
                  <span className="btn-icon">⚡</span>
                  <span>Instant Tour (1-Click)</span>
                </button>
              )}

              <button type="button" className="landing-secondary text-btn" onClick={onExplore}>
                <span>Explore Features</span>
                <span className="down-arrow">↓</span>
              </button>
            </div>

            {/* Live Trust Badges */}
            <div className="landing-live-note">
              <div className="live-status-pill">
                <span className="live-dot ping-animation" />
                <span>Live Office Signaling</span>
              </div>
              <span className="note-divider">•</span>
              <span>Ultra-low Latency</span>
              <span className="note-divider">•</span>
              <span>Zero Downloads Required</span>
            </div>
          </div>

          {/* Interactive Hero Floor Preview */}
          <div className="landing-preview modern-preview-card" aria-label="Interactive preview of virtual office workspace">
            <div className="preview-topline glass-bar">
              <div className="preview-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="preview-space-pill">
                <span className="pulse-icon">●</span>
                <span>oVice HQ / Floor 6 · Executive Penthouse</span>
              </div>
              <div className="preview-online-tag">
                <span className="online-beacon" />
                <span>5 ONLINE</span>
              </div>
            </div>

            <div className="preview-floor modern-floor-canvas">
              {/* Floor grid accents */}
              <div className="floor-grid-pattern" />

              {/* Spatial audio zone wave */}
              <div className="preview-audio-bubble wave-1" />
              <div className="preview-audio-bubble wave-2" />

              {/* Office furniture clusters */}
              <div className="preview-furniture desk-cluster-1">
                <span className="furniture-label">Team Cluster C</span>
              </div>
              <div className="preview-furniture desk-cluster-2">
                <span className="furniture-label">Lounge Pod</span>
              </div>

              {/* Interactive Teammates */}
              <div className="preview-person person-a" title="Jordan (Design Lead)">
                <div className="person-avatar" style={{ background: '#4f46e5' }}>
                  <img src="/avatar_mia.png" alt="Jordan" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="fallback-initial">J</span>
                </div>
                <div className="person-info-tag">
                  <span className="person-name">Jordan</span>
                  <span className="speaking-wave-mini">
                    <i /><i /><i />
                  </span>
                </div>
              </div>

              <div className="preview-person person-b" title="Morgan (Product)">
                <div className="person-avatar" style={{ background: '#059669' }}>
                  <img src="/avatar_alex.png" alt="Morgan" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="fallback-initial">M</span>
                </div>
                <div className="person-info-tag">
                  <span className="person-name">Morgan</span>
                  <span className="status-indicator">In discussion</span>
                </div>
              </div>

              <div className="preview-person person-c is-you" title="You (Local Avatar)">
                <div className="person-avatar user-glow" style={{ background: '#2563eb' }}>
                  <img src="/avatar_mia.png" alt="You" onError={(e) => { e.target.style.display = 'none'; }} />
                  <span className="fallback-initial">Y</span>
                </div>
                <div className="proximity-aura-ring" />
                <div className="person-info-tag you-tag">
                  <span className="person-name">You</span>
                  <span className="proximity-indicator">Proximity Active 🔊</span>
                </div>
              </div>

              {/* Bottom preview banner */}
              <div className="preview-presence glass-dock">
                <div className="dock-left">
                  <span className="active-team-indicator">
                    <span className="team-avatar-stack">
                      <span className="tiny-avatar a1">J</span>
                      <span className="tiny-avatar a2">M</span>
                      <span className="tiny-avatar a3">D</span>
                    </span>
                    <span>3 teammates in your audio zone</span>
                  </span>
                </div>
                <div className="dock-right">
                  <span className="key-hint"><kbd>WASD</kbd> or Click to Walk</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= METRICS STATS BAR ================= */}
        <section className="metrics-strip">
          <div className="metrics-container">
            {METRICS.map((m, idx) => (
              <div key={idx} className="metric-box">
                <span className="metric-val">{m.value}</span>
                <span className="metric-lbl">{m.label}</span>
                <span className="metric-desc">{m.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ================= INTERACTIVE SPATIAL AUDIO SANDBOX ================= */}
        <section className="audio-demo-section" id="audio-demo">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">INTERACTIVE SIMULATION</span>
              <h2>Experience <span>Spatial Proximity Audio</span></h2>
              <p>Drag the distance slider below to hear how audio clarity and volume naturally scale as you approach teammates.</p>
            </div>

            <div className="audio-sandbox-card glass-panel">
              <div className="sandbox-visual">
                <div className="speaker-avatar-node target-node">
                  <div className="avatar-circle">
                    <img src="/avatar_alex.png" alt="Alex" onError={(e) => { e.target.style.display = 'none'; }} />
                    <span>A</span>
                  </div>
                  <span className="node-name">Alex (Talking)</span>
                  <div
                    className="sound-radius-bubble"
                    style={{
                      transform: `scale(${1 + (100 - volumePercent) / 120})`,
                      opacity: Math.max(0.15, volumePercent / 100),
                    }}
                  />
                </div>

                <div
                  className="connection-beam"
                  style={{
                    width: `${Math.min(260, demoDistance * 0.9)}px`,
                    opacity: volumePercent > 10 ? 1 : 0.2,
                  }}
                >
                  <span className="distance-badge">{demoDistance}px ({volumePercent}% volume)</span>
                </div>

                <div className="speaker-avatar-node your-node">
                  <div className="avatar-circle you-circle">
                    <img src="/avatar_mia.png" alt="You" onError={(e) => { e.target.style.display = 'none'; }} />
                    <span>You</span>
                  </div>
                  <span className="node-name">You (Listening)</span>
                </div>
              </div>

              <div className="sandbox-controls">
                <div className="slider-group">
                  <div className="slider-header">
                    <span>Avatar Proximity Distance</span>
                    <strong>{demoDistance} px • {volumePercent > 20 ? 'Active Discussion' : 'Out of Earshot'}</strong>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    value={demoDistance}
                    onChange={(e) => setDemoDistance(Number(e.target.value))}
                    className="modern-range-slider"
                  />
                  <div className="slider-labels">
                    <span>Whisper Close (100% Vol)</span>
                    <span>Conversation Edge</span>
                    <span>Silent Background (0%)</span>
                  </div>
                </div>

                <div className="sandbox-actions">
                  <button type="button" className="test-sound-btn" onClick={handleTestChime}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                    <span>Play Audio Chime Test</span>
                  </button>
                  <button type="button" className="enter-office-quick" onClick={onEnter}>
                    <span>Join with this profile →</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES GRID ================= */}
        <section className="feature-section" id="features">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">BUILT FOR MODERN TEAMS</span>
              <h2>Everything you need for <span>spontaneous collaboration.</span></h2>
              <p>Break down the isolation of video calls with a persistent spatial headquarters for your distributed team.</p>
            </div>

            <div className="feature-grid modern-grid">
              {FEATURES.map((feature) => (
                <article className={`feature-card modern-card ${feature.color}`} key={feature.number}>
                  <div className="card-top">
                    <span className="feature-icon-badge">{feature.icon}</span>
                    <span className="feature-pill-tag">{feature.tag}</span>
                  </div>
                  <span className="feature-number">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                  <div className="card-hover-border" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="how-section" id="how-it-works">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">EFFORTLESS ONBOARDING</span>
              <h2>From zero to <span>collaborating in 30 seconds.</span></h2>
              <p>No software to install, no accounts to verify. Just share a link with your team.</p>
            </div>

            <div className="how-steps modern-steps-flow">
              <article className="step-card">
                <div className="step-number-glow">01</div>
                <div className="step-body">
                  <h3>Choose Your Space</h3>
                  <p>Pick a pre-configured team office or enter an existing room code to meet colleagues right on Floor 6.</p>
                </div>
              </article>

              <div className="step-connector-arrow">→</div>

              <article className="step-card">
                <div className="step-number-glow">02</div>
                <div className="step-body">
                  <h3>Personalize Your Avatar</h3>
                  <p>Pick an avatar face and custom glowing aura ring so colleagues instantly recognize you across the floor.</p>
                </div>
              </article>

              <div className="step-connector-arrow">→</div>

              <article className="step-card">
                <div className="step-number-glow">03</div>
                <div className="step-body">
                  <h3>Walk, Talk & Connect</h3>
                  <p>Glide with WASD or click-to-walk. Spatial audio connects naturally when you step into conversation zones.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ================= FINAL CTA CALLOUT ================= */}
        <section className="landing-cta-banner">
          <div className="cta-banner-content glass-banner">
            <span className="cta-kicker">READY TO MEET YOUR TEAM?</span>
            <h2>Step into your shared office today.</h2>
            <p>Join hundreds of high-performing remote and hybrid engineering teams already using ProxiSpeak.</p>
            <div className="cta-buttons">
              <button type="button" className="landing-primary primary-glow-btn" onClick={onEnter}>
                <span>Launch Office Now</span>
                <span aria-hidden="true">→</span>
              </button>
              {onDirectOffice && (
                <button type="button" className="landing-direct-btn modern-glass-btn" onClick={onDirectOffice}>
                  <span>Instant 1-Click Tour</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="landing-footer modern-footer">
        <div className="footer-container">
          <div className="footer-left">
            <a className="landing-brand" href="#">
              <span className="brand-logo-glow mini">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </span>
              <span>Proxi<span>Speak</span></span>
            </a>
            <p className="footer-tagline">Spatial audio & collaborative virtual offices for high-velocity teams.</p>
          </div>

          <div className="footer-center">
            <span className="status-badge-footer">
              <span className="beacon-green" />
              <span>All Systems Operational · WebRTC Mesh Active</span>
            </span>
          </div>

          <div className="footer-right">
            <span>© {new Date().getFullYear()} ProxiSpeak Ecosystem. Built with React & Socket.io</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
