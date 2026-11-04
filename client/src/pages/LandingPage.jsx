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
  Sparkles,
  ChevronDown,
  Check,
  X,
  Play,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    number: '01',
    title: 'Spatial Audio',
    copy: 'Hear colleagues as they approach. Sound volume and stereo balance automatically adjust based on physical pixel distance.',
    icon: Volume2,
    tag: '360° Attenuation',
    color: '#6366f1',
  },
  {
    number: '02',
    title: 'Virtual Office',
    copy: 'Explore an interactive 2D workspace. Glide avatars smoothly across meeting tables, private focus cabins, and open lounges at 60 FPS.',
    icon: Compass,
    tag: '60 FPS Canvas',
    color: '#3b82f6',
  },
  {
    number: '03',
    title: 'Real-Time Collaboration',
    copy: 'Meet colleagues without creating formal meeting links or scheduling calendar invites. Walk up and start talking naturally.',
    icon: Users,
    tag: 'Frictionless',
    color: '#14b8a6',
  },
  {
    number: '04',
    title: 'Smart Proximity Detection',
    copy: 'Identifies nearby colleagues within a 100px proximity radius and dynamically groups participants into ad-hoc spatial audio clusters.',
    icon: Radio,
    tag: 'O(1) Spatial Grid',
    color: '#10b981',
  },
  {
    number: '05',
    title: 'Interactive Workspace',
    copy: 'Work in a shared digital environment with interactive whiteboards, acoustic sound-blocking partitions, and multi-floor zones.',
    icon: Building,
    tag: 'Acoustic Occlusion',
    color: '#8b5cf6',
  },
  {
    number: '06',
    title: 'Secure Communication',
    copy: 'Direct WebRTC peer-to-peer audio encrypted in transit. Clear microphone permission management and hardware telemetry privacy.',
    icon: ShieldCheck,
    tag: 'P2P WebRTC',
    color: '#f59e0b',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Join Your Workspace',
    desc: 'Enter your company digital campus with one click. Select your customizable avatar and customize your display badge.',
  },
  {
    step: '02',
    title: 'Move Your Avatar',
    desc: 'Use intuitive WASD or arrow keys to stroll across the virtual office floor, or simply click any desk to navigate there.',
  },
  {
    step: '03',
    title: 'Approach Your Colleagues',
    desc: 'When you step into a colleague’s 100px proximity circle, you automatically establish an instant peer-to-peer audio channel.',
  },
  {
    step: '04',
    title: 'Start Talking Naturally',
    desc: 'No Zoom links. No waiting rooms. Experience spatial binaural volume that fades in and out just like walking in a real room.',
  },
];

const COMPARISON = [
  { feature: 'Spontaneous hallway bump-ins', proxispeak: true, zoom: false, gather: true },
  { feature: 'Proximity-based 3D spatial panning', proxispeak: true, zoom: false, gather: 'Basic' },
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
    q: 'Do I need to install any software or plugins?',
    a: 'No. ProxiSpeak is 100% web native. It runs on any modern browser using WebRTC, Web Audio API, and HTML5 Canvas with zero downloads or browser extensions required.',
  },
  {
    q: 'What happens when two people stand behind an office wall or partition?',
    a: 'ProxiSpeak features real-time obstacle raycasting. If a sound-blocking cubicle partition or glass boardroom wall intersects the line of sight between two avatars, audio is automatically attenuated (-12dB) with acoustic muffling applied.',
  },
  {
    q: 'Can ProxiSpeak scale to large teams?',
    a: 'Yes. Our backend utilizes an O(1) Spatial Hash Grid and Redis Pub/Sub signaling cluster with WebRTC mesh degree capping (up to 8 prioritized simultaneous active speakers) to prevent client CPU and bandwidth saturation.',
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
      navigate('/app');
    }
  };

  const handleTestChime = () => {
    sounds.playProximityChime();
  };

  const volumePercent = Math.max(0, Math.min(100, Math.round((1 - demoDistance / 260) * 100)));

  return (
    <div className="landing-page modern-landing">
      {/* Ambient background blur orbs */}
      <div className="landing-ambient-orb orb-1" aria-hidden="true" />
      <div className="landing-ambient-orb orb-2" aria-hidden="true" />
      <div className="landing-ambient-orb orb-3" aria-hidden="true" />

      {/* Sticky Modern Frosted Header */}
      <header className="landing-nav glass-nav sticky top-0 z-50">
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
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-secondary-btn"
            onClick={() => navigate('/login')}
          >
            <span>Login</span>
          </button>

          <button
            type="button"
            className="landing-nav-cta pulse-glow"
            onClick={handleEnterOffice}
            aria-label="Enter Virtual Office"
          >
            <span>Get Started</span>
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
              <span className="badge-text">Move Closer. Connect Naturally.</span>
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
            </div>

            {/* Metrics Bar */}
            <div className="hero-metrics-strip">
              <div className="metric-cell">
                <span className="metric-val">&lt; 18ms</span>
                <span className="metric-lbl">Positional Latency</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-cell">
                <span className="metric-val">360°</span>
                <span className="metric-lbl">Binaural Panning</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-cell">
                <span className="metric-val">60 FPS</span>
                <span className="metric-lbl">Canvas Rendering</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-cell">
                <span className="metric-val">100%</span>
                <span className="metric-lbl">Browser WebRTC</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Visual Showcase */}
          <div className="landing-hero-visual">
            <div className="hero-preview-frame">
              <div className="preview-top-chrome">
                <div className="chrome-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="chrome-url-bar">
                  <span>proxispeak.app/app/office/oVice-HQ-C03</span>
                </div>
                <div className="chrome-live-pill">
                  <span className="live-dot" /> LIVE CANVAS
                </div>
              </div>

              {/* Simulated Virtual Office Canvas */}
              <div className="hero-canvas-mockup">
                <div className="mockup-office-bg">
                  {/* Desks and Obstacles */}
                  <div className="mockup-desk desk-left" />
                  <div className="mockup-desk desk-right" />
                  <div className="mockup-table center-table">
                    <span className="table-label">Central Lounge</span>
                  </div>
                  <div className="mockup-wall acoustic-wall">
                    <span>Acoustic Partition (-12dB)</span>
                  </div>

                  {/* Avatars */}
                  <div className="mockup-avatar avatar-mia" style={{ left: '38%', top: '44%' }}>
                    <div className="avatar-proximity-ring" />
                    <div className="avatar-disc bg-blue-600">
                      <img src="/avatar_mia.png" alt="Mia" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <span className="avatar-tag">You (Mia)</span>
                    <span className="avatar-speaking-wave">🔊</span>
                  </div>

                  <div className="mockup-avatar avatar-alex" style={{ left: '52%', top: '42%' }}>
                    <div className="avatar-disc bg-emerald-600">
                      <img src="/avatar_alex.png" alt="Alex" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <span className="avatar-tag">Alex (Eng)</span>
                    <span className="avatar-connection-line" />
                  </div>

                  <div className="mockup-avatar avatar-david" style={{ left: '72%', top: '65%' }}>
                    <div className="avatar-disc bg-purple-600">
                      <img src="/avatar_david.png" alt="David" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <span className="avatar-tag">David (Quiet Zone)</span>
                  </div>

                  {/* Spatial Soundwaves */}
                  <div className="hero-soundwave wave-1" />
                  <div className="hero-soundwave wave-2" />

                  {/* Proximity Floating HUD */}
                  <div className="mockup-proximity-hud">
                    <div className="hud-metric">
                      <span className="hud-title">ACTIVE HUDDLE</span>
                      <span className="hud-value text-emerald-400">Connected with Alex Rivera</span>
                    </div>
                    <div className="hud-db-bar">
                      <div className="hud-fill" style={{ width: '78%' }} />
                    </div>
                    <span className="hud-db-val">-18.4 dB (Proximity 76px)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section id="features" className="landing-features-section">
          <div className="section-header-centered">
            <span className="section-kicker">BUILT FOR IMMERSIVE WORK</span>
            <h2 className="section-title">Designed for Natural Connection</h2>
            <p className="section-subtitle">
              Say goodbye to exhausting Zoom grid fatigue. ProxiSpeak replicates the organic physical dynamics of an agile workplace.
            </p>
          </div>

          <div className="features-grid-container">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.number} className="feature-card-modern">
                  <div className="feature-card-top">
                    <div className="feature-icon-badge" style={{ backgroundColor: `${feat.color}15`, color: feat.color }}>
                      <Icon size={24} />
                    </div>
                    <span className="feature-card-num">{feat.number}</span>
                  </div>
                  <h3 className="feature-card-title">{feat.title}</h3>
                  <p className="feature-card-copy">{feat.copy}</p>
                  <div className="feature-card-footer">
                    <span className="feature-tag-pill">{feat.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="section-header-centered">
            <span className="section-kicker">FOUR INTUITIVE STEPS</span>
            <h2 className="section-title">How ProxiSpeak Works</h2>
            <p className="section-subtitle">
              No meeting links. No calendar invitations. Collaboration as frictionless as real life.
            </p>
          </div>

          <div className="how-it-works-grid">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={item.step} className="how-step-card">
                <div className="step-number-glow">{item.step}</div>
                <h3 className="step-card-title">{item.title}</h3>
                <p className="step-card-desc">{item.desc}</p>
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="step-connector-arrow" aria-hidden="true">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= INTERACTIVE SPATIAL AUDIO SIMULATOR ================= */}
        <section id="audio-demo" className="landing-audio-simulator-section">
          <div className="simulator-card-wrapper">
            <div className="simulator-copy">
              <span className="section-kicker">INTERACTIVE SIMULATION</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Test the Spatial Audio Falloff
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Drag the avatar distance scrubber below to hear how volume naturally attenuates as distance varies between 20px and 260px.
              </p>

              <div className="distance-slider-control">
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span>Proximity Distance: {demoDistance} px</span>
                  <span className="text-indigo-600 dark:text-indigo-400">Acoustic Volume: {volumePercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="260"
                  value={demoDistance}
                  onChange={(e) => setDemoDistance(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                  aria-label="Proximity Distance"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>20px (Face to Face, 100%)</span>
                  <span>100px (Signaling Threshold)</span>
                  <span>260px (Muted, 0%)</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="btn-modern btn-primary text-sm flex items-center gap-2"
                >
                  <Play size={14} />
                  <span>Play Spatial Audio Chime</span>
                </button>
                <span className="text-xs text-slate-500">
                  {demoDistance <= 100 ? '✅ Inside P2P WebRTC mesh' : '💤 Outside proximity hearing zone'}
                </span>
              </div>
            </div>

            <div className="simulator-visual">
              <div className="radar-circle-outer">
                <div
                  className="radar-circle-proximity"
                  style={{ width: `${Math.max(40, (demoDistance / 260) * 220)}px`, height: `${Math.max(40, (demoDistance / 260) * 220)}px` }}
                />
                <div className="radar-avatar-local">
                  <span>You</span>
                </div>
                <div
                  className="radar-avatar-remote"
                  style={{
                    transform: `translate(${Math.round(demoDistance * 0.45)}px, -${Math.round(demoDistance * 0.2)}px)`,
                  }}
                >
                  <span>Alex</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURE COMPARISON ================= */}
        <section className="landing-comparison-section">
          <div className="section-header-centered">
            <span className="section-kicker">WHY PROXISPEAK?</span>
            <h2 className="section-title">A Modern Leap Beyond Traditional Meetings</h2>
            <p className="section-subtitle">
              See how ProxiSpeak compares to traditional videoconferencing tools and static virtual offices.
            </p>
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
                    <td className="font-medium text-slate-800 dark:text-slate-200">{row.feature}</td>
                    <td className="highlight-column">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                        <Check size={16} /> Included
                      </span>
                    </td>
                    <td>
                      {row.zoom === false ? (
                        <span className="text-slate-400"><X size={16} className="inline text-rose-400" /> No</span>
                      ) : (
                        <span className="text-slate-500">{String(row.zoom)}</span>
                      )}
                    </td>
                    <td>
                      {row.gather === true ? (
                        <span className="text-slate-700 dark:text-slate-300"><Check size={16} className="inline text-emerald-500" /> Yes</span>
                      ) : row.gather === false ? (
                        <span className="text-slate-400"><X size={16} className="inline text-rose-400" /> No</span>
                      ) : (
                        <span className="text-slate-500">{row.gather}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= FREQUENTLY ASKED QUESTIONS ================= */}
        <section className="landing-faq-section">
          <div className="section-header-centered">
            <span className="section-kicker">COMMON QUESTIONS</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
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
        </section>

        {/* ================= FINAL CALL TO ACTION ================= */}
        <section className="landing-cta-banner">
          <div className="cta-banner-inner">
            <h2 className="cta-banner-title">
              Ready to Experience Natural Remote Collaboration?
            </h2>
            <p className="cta-banner-subtitle">
              Join thousands of distributed engineers, designers, and teams who move closer and communicate naturally every day.
            </p>
            <div className="cta-banner-actions">
              <button
                type="button"
                className="btn-modern btn-primary text-base px-8 py-3.5 shadow-xl"
                onClick={handleEnterOffice}
                aria-label="Enter Virtual Office"
              >
                <span>Enter Your Virtual Office Now</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="btn-modern btn-secondary text-base px-6 py-3.5"
                onClick={() => navigate('/login')}
              >
                <span>Sign In to Existing Workspace</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer id="about" className="landing-footer">
        <div className="footer-top-grid">
          <div className="footer-col-brand">
            <div className="flex items-center gap-2 mb-3">
              <div className="brand-logo-icon">
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
              <span className="font-bold text-lg text-slate-900 dark:text-white">ProxiSpeak</span>
            </div>
            <p className="text-sm text-slate-500 mb-4 max-w-xs">
              Move Closer. Connect Naturally. The real-time geospatial virtual office powered by WebRTC and Web Audio API.
            </p>
            <span className="text-xs text-slate-400">© 2026 ProxiSpeak, Inc. All rights reserved.</span>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Spatial Audio</a>
            <a href="#features">2D Virtual Office</a>
            <a href="#features">Acoustic Partitioning</a>
            <a href="#how-it-works">How It Works</a>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <a href="/docs/WEBRTC_AUDIO.md" target="_blank" rel="noreferrer">Audio DSP Spec</a>
            <a href="/docs/MESH_SCALING_AND_REDIS.md" target="_blank" rel="noreferrer">Mesh Scaling</a>
            <a href="/docs/ROOM_PERSISTENCE_AND_SPATIAL_ENGINE.md" target="_blank" rel="noreferrer">Spatial Engine</a>
          </div>

          <div id="contact" className="footer-col">
            <h4>Security & Privacy</h4>
            <a href="#privacy">End-to-End Encryption</a>
            <a href="#privacy">Hardware Permissions</a>
            <a href="#privacy">Telemetry Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
