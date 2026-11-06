import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sounds } from '../services/soundEffects';
import {
  Volume2,
  Compass,
  Users,
  Radio,
  Building,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Check,
  X,
  Play,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    number: '01',
    title: '360° Spatial Audio',
    copy: 'Hear colleagues as they approach. Sound volume and stereo balance automatically adjust based on physical pixel distance.',
    icon: Volume2,
    tag: '360° Attenuation',
    color: 'indigo',
  },
  {
    number: '02',
    title: '60 FPS Canvas Navigation',
    copy: 'Glide avatars smoothly across customizable high-DPI office maps using intuitive WASD keys or click-to-walk navigation.',
    icon: Compass,
    tag: '60 FPS Canvas',
    color: 'blue',
  },
  {
    number: '03',
    title: 'Frictionless Collaboration',
    copy: 'Meet teammates without creating formal meeting links or scheduling calendar invites. Walk up and start talking naturally.',
    icon: Users,
    tag: 'Zero Friction',
    color: 'teal',
  },
  {
    number: '04',
    title: 'Smart Proximity Detection',
    copy: 'Identifies nearby colleagues within a 100px proximity radius and dynamically groups participants into ad-hoc spatial audio clusters.',
    icon: Radio,
    tag: 'O(1) Spatial Grid',
    color: 'emerald',
  },
  {
    number: '05',
    title: 'Acoustic Partitioning',
    copy: 'Work in a shared digital environment with sound-blocking partitions, private focus booths, and glass meeting rooms with raycast muffling.',
    icon: Building,
    tag: 'Sound Occlusion',
    color: 'purple',
  },
  {
    number: '06',
    title: 'Secure P2P WebRTC',
    copy: 'Direct WebRTC peer-to-peer audio encrypted in transit. Clear microphone permission management and hardware telemetry privacy.',
    icon: ShieldCheck,
    tag: 'End-to-End P2P',
    color: 'amber',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Your Space',
    desc: 'Enter your team digital campus with one click. Select an office floor or join an existing meeting code instantly.',
  },
  {
    step: '02',
    title: 'Personalize Your Avatar',
    desc: 'Pick your custom avatar portrait, choose your glowing aura ring color, and set your status badge.',
  },
  {
    step: '03',
    title: 'Walk, Talk & Connect',
    desc: 'Glide with WASD or click-to-walk. When you step into a colleague’s 100px proximity circle, you automatically connect.',
  },
  {
    step: '04',
    title: 'Natural Conversations',
    desc: 'No Zoom links, no waiting rooms. Experience spatial binaural volume that fades in and out just like walking in a real room.',
  },
];

const COMPARISON = [
  { feature: 'Spontaneous hallway bump-ins', proxispeak: true, zoom: false, gather: true },
  { feature: 'Proximity-based 360° spatial panning', proxispeak: true, zoom: false, gather: 'Basic' },
  { feature: 'Acoustic wall & obstacle occlusion', proxispeak: true, zoom: false, gather: false },
  { feature: 'Hardware-accelerated 60 FPS Canvas', proxispeak: true, zoom: false, gather: true },
  { feature: 'Zero installation (100% browser WebRTC)', proxispeak: true, zoom: 'Partial', gather: true },
  { feature: 'O(1) Spatial grid mesh scalability', proxispeak: true, zoom: false, gather: false },
];

const FAQS = [
  {
    q: 'How does proximity spatial audio work?',
    a: 'ProxiSpeak continuously tracks avatar coordinates on an HTML5 Canvas. As you walk closer to another colleague, the browser Web Audio API dynamically recalculates distance attenuation, lowpass frequency absorption, and stereo channel panning in real time.',
  },
  {
    q: 'Do I need to install any software or browser extensions?',
    a: 'No. ProxiSpeak is 100% web native. It runs on any modern browser using WebRTC, Web Audio API, and HTML5 Canvas with zero downloads or browser plugins required.',
  },
  {
    q: 'What happens when two people stand behind an office wall or partition?',
    a: 'ProxiSpeak features real-time obstacle raycasting. If a sound-blocking cubicle partition or glass boardroom wall intersects the line of sight between two avatars, audio is automatically attenuated (-12dB) with acoustic muffling applied.',
  },
  {
    q: 'Can ProxiSpeak scale to large teams and companies?',
    a: 'Yes. Our architecture utilizes an O(1) Spatial Hash Grid and Redis Pub/Sub signaling cluster with WebRTC mesh degree capping (up to 8 prioritized simultaneous active speakers) to prevent client CPU and bandwidth saturation.',
  },
];

export default function LandingPage({ onEnter, onExplore, onDirectOffice }) {
  const navigate = useNavigate();
  const [demoDistance, setDemoDistance] = useState(120);
  const [openFaq, setOpenFaq] = useState(0);

  const handleEnterOffice = () => {
    if (onEnter) {
      onEnter();
    } else {
      navigate('/join');
    }
  };

  const handleTestChime = () => {
    sounds.playProximityChime();
  };

  const volumePercent = Math.max(0, Math.min(100, Math.round((1 - demoDistance / 260) * 100)));

  return (
    <div className="landing-page modern-landing">
      {/* Ambient background glow orbs */}
      <div className="landing-ambient-orb orb-1" aria-hidden="true" />
      <div className="landing-ambient-orb orb-2" aria-hidden="true" />
      <div className="landing-ambient-orb orb-3" aria-hidden="true" />

      {/* Sticky Glassmorphism Header */}
      <header className="landing-nav glass-nav">
        <a
          className="landing-brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
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
          <a href="#comparison">Comparison</a>
          <a href="#faq">FAQ</a>
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

          <button
            type="button"
            className="nav-secondary-btn"
            onClick={() => navigate('/login')}
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            className="landing-nav-cta pulse-glow"
            onClick={handleEnterOffice}
            aria-label="Enter Virtual Office"
          >
            <span>Enter Office</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main>
        {/* ================= HERO SECTION ================= */}
        <section id="home" className="landing-hero modern-hero">
          <div className="landing-hero-copy">
            <div className="hero-badge">
              <span className="badge-pulse-dot" />
              <span className="badge-text">Next-Gen Spatial Collaboration</span>
              <span className="badge-arrow">→</span>
            </div>

            <h1 className="hero-headline">
              Your Virtual Office.<br />
              <span className="gradient-text">Real Conversations.</span>
              <span className="sr-only">Work together, naturally.</span>
            </h1>

            <p className="hero-subheading">
              Experience a new way to collaborate. Walk through your virtual workspace, meet colleagues naturally, and communicate through intelligent proximity-based spatial audio.
            </p>

            <div className="landing-hero-actions">
              <button
                type="button"
                className="landing-primary primary-glow-btn"
                onClick={handleEnterOffice}
                aria-label="Enter Virtual Office"
              >
                <span>Enter Your Office</span>
                <ArrowRight size={16} />
              </button>

              {onDirectOffice ? (
                <button
                  type="button"
                  className="landing-direct-btn modern-glass-btn"
                  onClick={onDirectOffice}
                >
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Instant 1-Click Tour</span>
                </button>
              ) : (
                <a
                  href="#features"
                  className="landing-secondary text-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    if (onExplore) onExplore();
                  }}
                >
                  <span>Explore Features</span>
                  <ChevronDown size={16} />
                </a>
              )}
            </div>

            <div className="landing-live-note">
              <span className="live-status-pill">
                <span className="live-dot ping-animation" />
                <span>48 Teammates Active Now</span>
              </span>
              <span className="note-divider">·</span>
              <span>WebRTC Mesh P2P</span>
            </div>
          </div>

          {/* Interactive Hero Visual Showcase */}
          <div className="landing-hero-visual">
            <div className="modern-preview-card">
              <div className="preview-topline glass-bar">
                <div className="preview-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="preview-space-pill">
                  <span className="pulse-icon">●</span>
                  <span>proxispeak.app/office/HQ-C03</span>
                </div>
                <div className="preview-online-tag">
                  <span className="online-beacon" /> LIVE CANVAS
                </div>
              </div>

              {/* Simulated Virtual Office Canvas */}
              <div className="modern-floor-canvas">
                <div className="floor-grid-pattern" />

                {/* Furniture clusters */}
                <div className="preview-furniture desk-cluster-1">
                  <span className="furniture-label">Team Desks</span>
                </div>
                <div className="preview-furniture desk-cluster-2">
                  <span className="furniture-label">Focus Lounge</span>
                </div>

                {/* Acoustic Partition Wall */}
                <div className="acoustic-wall">
                  <span className="acoustic-wall-label">-12dB Wall</span>
                </div>

                {/* Spatial Soundwaves */}
                <div className="preview-audio-bubble wave-1" />
                <div className="preview-audio-bubble wave-2" />

                {/* Colleague A: Alex */}
                <div className="preview-person person-a">
                  <div className="person-avatar" style={{ background: '#059669' }}>
                    <img
                      src="/avatar_alex.png"
                      alt="Alex"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>A</span>
                  </div>
                  <span className="person-info-tag">Alex (Eng)</span>
                </div>

                {/* Colleague B: David */}
                <div className="preview-person person-b">
                  <div className="person-avatar" style={{ background: '#7c3aed' }}>
                    <img
                      src="/avatar_david.png"
                      alt="David"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>D</span>
                  </div>
                  <span className="person-info-tag">David (Focus)</span>
                </div>

                {/* Local User: You (Mia) */}
                <div className="preview-person person-c is-you">
                  <div className="proximity-aura-ring" />
                  <div className="person-avatar" style={{ background: '#2563eb' }}>
                    <img
                      src="/avatar_mia.png"
                      alt="Mia"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>M</span>
                  </div>
                  <span className="person-info-tag">
                    <span>You (Mia)</span>
                    <span className="speaking-wave-mini" title="Speaking">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                </div>

                {/* Proximity Floating HUD */}
                <div className="mockup-proximity-hud">
                  <span className="hud-title">ACTIVE HUDDLE</span>
                  <span className="hud-value">Connected with Alex Rivera</span>
                  <div className="hud-db-bar">
                    <div className="hud-fill" style={{ width: '78%' }} />
                  </div>
                  <span className="hud-db-val">-18.4 dB (Proximity 76px)</span>
                </div>

                {/* Bottom glass dock */}
                <div className="preview-presence glass-dock">
                  <div className="team-avatar-stack">
                    <span className="tiny-avatar a1">M</span>
                    <span className="tiny-avatar a2">A</span>
                    <span className="tiny-avatar a3">D</span>
                  </div>
                  <span>Floor 6 · Engineering Campus</span>
                  <span className="key-hint"><kbd>WASD</kbd> or click to move</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= METRICS STRIP ================= */}
        <section className="metrics-strip">
          <div className="metrics-container">
            <div className="metric-box">
              <span className="metric-val">&lt; 18ms</span>
              <span className="metric-lbl">Positional Latency</span>
              <span className="metric-desc">Real-time Socket.io signaling engine</span>
            </div>
            <div className="metric-box">
              <span className="metric-val">360°</span>
              <span className="metric-lbl">Binaural Audio</span>
              <span className="metric-desc">Dynamic stereo separation & distance falloff</span>
            </div>
            <div className="metric-box">
              <span className="metric-val">60 FPS</span>
              <span className="metric-lbl">Canvas Rendering</span>
              <span className="metric-desc">Hardware-accelerated HTML5 rendering</span>
            </div>
            <div className="metric-box">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Browser WebRTC</span>
              <span className="metric-desc">Zero install, end-to-end encrypted</span>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE SPATIAL AUDIO SIMULATOR ================= */}
        <section className="audio-demo-section" id="audio-demo">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">INTERACTIVE SIMULATION</span>
              <h2>Experience <span>Spatial Proximity Audio</span></h2>
              <p>Drag the distance slider below to hear and see how audio volume automatically adjusts based on virtual proximity.</p>
            </div>

            <div className="audio-sandbox-card glass-panel">
              <div className="sandbox-visual">
                {/* You */}
                <div className="speaker-avatar-node">
                  <div className="avatar-circle you-circle">
                    <img
                      src="/avatar_mia.png"
                      alt="You"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>You</span>
                  </div>
                  <span className="node-name">You (Mia)</span>
                </div>

                {/* Dynamic Connection Beam */}
                <div
                  className="connection-beam"
                  style={{
                    width: `${Math.max(60, Math.min(320, demoDistance * 1.2))}px`,
                    opacity: demoDistance <= 220 ? 1 : 0.3,
                  }}
                >
                  <span className="distance-badge">{demoDistance} px ({volumePercent}%)</span>
                </div>

                {/* Colleague */}
                <div className="speaker-avatar-node">
                  <div
                    className="sound-radius-bubble"
                    style={{
                      transform: `scale(${Math.max(0.4, volumePercent / 100)})`,
                      opacity: Math.max(0.15, volumePercent / 100),
                    }}
                  />
                  <div className="avatar-circle" style={{ borderColor: '#10b981', background: '#10b981' }}>
                    <img
                      src="/avatar_alex.png"
                      alt="Alex"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span>Alex</span>
                  </div>
                  <span className="node-name">Alex Rivera</span>
                </div>
              </div>

              <div className="sandbox-controls">
                <div className="slider-header">
                  <span>Proximity Distance: <strong>{demoDistance} px</strong></span>
                  <span>Acoustic Volume: <strong>{volumePercent}%</strong></span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="260"
                  value={demoDistance}
                  onChange={(e) => setDemoDistance(Number(e.target.value))}
                  className="modern-range-slider"
                  aria-label="Proximity Distance Scrubber"
                />

                <div className="slider-labels">
                  <span>20px (Face-to-Face 100%)</span>
                  <span>100px (Signaling Threshold)</span>
                  <span>260px (Muted 0%)</span>
                </div>
              </div>

              <div className="sandbox-actions">
                <button
                  type="button"
                  className="test-sound-btn"
                  onClick={handleTestChime}
                >
                  <Play size={15} fill="currentColor" />
                  <span>Play Spatial Audio Chime</span>
                </button>

                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  {demoDistance <= 100 ? '✅ Inside P2P WebRTC audio mesh' : '💤 Outside proximity hearing zone'}
                </span>

                <button
                  type="button"
                  className="enter-office-quick"
                  onClick={handleEnterOffice}
                >
                  <span>Launch Live Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= KEY FEATURES GRID ================= */}
        <section className="feature-section" id="features">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">ENGINEERED FOR TEAMS</span>
              <h2>Designed for <span>Natural Connection</span></h2>
              <p>Say goodbye to exhausting Zoom grid fatigue. ProxiSpeak replicates the organic physical dynamics of an agile workplace.</p>
            </div>

            <div className="feature-grid modern-grid">
              {FEATURES.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <article className={`feature-card modern-card ${feature.color}`} key={feature.number}>
                    <div className="card-top">
                      <span className="feature-icon-badge">
                        <IconComponent size={22} />
                      </span>
                      <span className="feature-pill-tag">{feature.tag}</span>
                    </div>
                    <span className="feature-number">{feature.number}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                    <div className="card-hover-border" />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS FLOW ================= */}
        <section className="how-section" id="how-it-works">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">EFFORTLESS ONBOARDING</span>
              <h2>From zero to <span>collaborating in 30 seconds.</span></h2>
              <p>No software to install, no accounts to verify. Just enter your office and walk up to colleagues.</p>
            </div>

            <div className="how-steps modern-steps-flow">
              {HOW_IT_WORKS.map((item, idx) => (
                <React.Fragment key={item.step}>
                  <article className="step-card">
                    <div className="step-number-glow">{item.step}</div>
                    <div className="step-body">
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  </article>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="step-connector-arrow" aria-hidden="true">→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FEATURE COMPARISON TABLE ================= */}
        <section className="comparison-section" id="comparison">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">WHY PROXISPEAK?</span>
              <h2>A Modern Leap <span>Beyond Traditional Meetings</span></h2>
              <p>Compare ProxiSpeak side-by-side with static video conferencing and legacy virtual workspaces.</p>
            </div>

            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th className="highlight-column">ProxiSpeak</th>
                    <th>Legacy Zoom / Meet</th>
                    <th>Gather Town</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, idx) => (
                    <tr key={idx}>
                      <td className="comparison-feature-name">{row.feature}</td>
                      <td className="highlight-column">
                        <span className="comparison-tag-yes">
                          <Check size={16} /> Included
                        </span>
                      </td>
                      <td>
                        {row.zoom === false ? (
                          <span className="comparison-tag-no">
                            <X size={15} style={{ color: '#f43f5e' }} /> No
                          </span>
                        ) : (
                          <span className="comparison-tag-partial">{String(row.zoom)}</span>
                        )}
                      </td>
                      <td>
                        {row.gather === true ? (
                          <span className="comparison-tag-yes">
                            <Check size={15} /> Yes
                          </span>
                        ) : row.gather === false ? (
                          <span className="comparison-tag-no">
                            <X size={15} style={{ color: '#f43f5e' }} /> No
                          </span>
                        ) : (
                          <span className="comparison-tag-partial">{row.gather}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section className="faq-section" id="faq">
          <div className="section-container">
            <div className="section-heading centered">
              <span className="landing-kicker">GOT QUESTIONS?</span>
              <h2>Frequently Asked <span>Questions</span></h2>
              <p>Everything you need to know about spatial audio, privacy, and team onboarding.</p>
            </div>

            <div className="faq-accordion-container">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="faq-question-btn"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className={`faq-arrow ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && <div className="faq-answer-content">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= FINAL CALL TO ACTION ================= */}
        <section className="landing-cta-banner">
          <div className="glass-banner">
            <span className="cta-kicker">READY TO MEET YOUR TEAM?</span>
            <h2>Step into your shared office today.</h2>
            <p>Join hundreds of high-performing remote and hybrid engineering teams already using ProxiSpeak.</p>
            <div className="cta-buttons">
              <button
                type="button"
                className="landing-primary primary-glow-btn"
                onClick={handleEnterOffice}
              >
                <span>Launch Office Now</span>
                <ArrowRight size={16} />
              </button>

              {onDirectOffice && (
                <button
                  type="button"
                  className="landing-direct-btn modern-glass-btn"
                  onClick={onDirectOffice}
                >
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Instant 1-Click Tour</span>
                </button>
              )}

              <button
                type="button"
                className="modern-glass-btn"
                onClick={() => navigate('/login')}
              >
                <span>Sign In to Workspace</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODERN FOOTER ================= */}
      <footer className="modern-footer">
        <div className="footer-container">
          <div className="footer-left">
            <a
              className="landing-brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="brand-logo-glow mini">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6.5V17.5L12 22L20 17.5V6.5L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <span className="brand-title">Proxi<span>Speak</span></span>
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
