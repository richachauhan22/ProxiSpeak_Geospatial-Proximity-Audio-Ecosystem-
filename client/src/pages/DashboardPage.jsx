import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Compass,
  Volume2,
  Building,
  ArrowRight,
  Radio,
  Clock,
  Sparkles,
  Plus,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar, StatusBadge } from '../components/common/Avatar';
import { Button } from '../components/common/Button';

export function DashboardPage() {
  const { user } = useAuth();
  const {
    currentWorkspace,
    offices,
    teamMembers,
    activity,
    socketStatus,
  } = useWorkspace();
  const navigate = useNavigate();

  const onlineMembers = teamMembers.filter((m) => m.status === 'online' || m.status === 'busy');
  const activeSpeakingCount = teamMembers.filter((m) => m.isSpeaking).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-content-page">
      {/* Welcome Banner */}
      <div className="dashboard-hero-banner">
        <div className="banner-left-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Sparkles size={13} />
            <span>Virtual Workspace Campus Active</span>
          </div>
          <h1 className="banner-title">
            {getGreeting()}, {user?.name || 'Mia'} 👋
          </h1>
          <p className="banner-subtitle">
            Welcome to <strong className="text-slate-800 dark:text-slate-200">{currentWorkspace?.name}</strong>. {onlineMembers.length} teammates are currently strolling across {offices.length} virtual office floors.
          </p>
        </div>

        <div className="banner-actions">
          <Button
            variant="primary"
            size="md"
            icon={Compass}
            iconRight={ArrowRight}
            onClick={() => navigate(`/app/office/${encodeURIComponent(offices[0]?.id || 'oVice HQ / C-03')}`)}
          >
            Enter Main Floor
          </Button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="stats-metric-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">TEAM ONLINE</span>
            <div className="stat-icon-box bg-emerald-500/10 text-emerald-600">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value">{onlineMembers.length}</div>
          <div className="stat-footer text-emerald-600 dark:text-emerald-400">
            <span>● {teamMembers.length} total workspace members</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">ACTIVE HUDDLES</span>
            <div className="stat-icon-box bg-indigo-500/10 text-indigo-600">
              <Radio size={18} />
            </div>
          </div>
          <div className="stat-value">{activeSpeakingCount > 0 ? activeSpeakingCount : 2}</div>
          <div className="stat-footer text-indigo-600 dark:text-indigo-400">
            <span>Spatial WebRTC streams active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">OFFICE FLOORS</span>
            <div className="stat-icon-box bg-purple-500/10 text-purple-600">
              <Building size={18} />
            </div>
          </div>
          <div className="stat-value">{offices.length}</div>
          <div className="stat-footer text-purple-600 dark:text-purple-400">
            <span>Soundproof partitions enabled</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">SPATIAL ENGINE</span>
            <div className="stat-icon-box bg-teal-500/10 text-teal-600">
              <Volume2 size={18} />
            </div>
          </div>
          <div className="stat-value text-teal-600">60 FPS</div>
          <div className="stat-footer text-teal-600 dark:text-teal-400">
            <span>{socketStatus === 'connected' ? 'Low Latency (<18ms)' : 'Simulation Active'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Office Cards (2/3) + Activity / People Sidebar (1/3) */}
      <div className="dashboard-sections-split">
        {/* Left Column: Available Offices */}
        <div className="dashboard-primary-col">
          <div className="section-title-row">
            <div>
              <h2 className="section-heading">Available Virtual Offices</h2>
              <p className="section-subheading">Choose a floor to enter the 2D spatial canvas</p>
            </div>
          </div>

          <div className="offices-cards-grid">
            {offices.map((office) => (
              <div key={office.id} className="office-card-item">
                <div className="office-card-preview-wrap">
                  <img
                    src={office.previewUrl || '/office_map.png'}
                    alt={office.name}
                    className="office-card-preview-img"
                  />
                  <div className="office-floor-pill">{office.floor}</div>
                  <div className="office-live-users-badge">
                    <span className="live-dot" />
                    <span>{office.onlineCount} online</span>
                  </div>
                </div>

                <div className="office-card-body">
                  <h3 className="office-title">{office.name}</h3>
                  <p className="office-desc">{office.description}</p>

                  <div className="office-tags-row">
                    {office.tags?.map((tag) => (
                      <span key={tag} className="office-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="office-card-footer">
                    <div className="office-capacity-info">
                      <span>Capacity: {office.capacity} peers</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      iconRight={ArrowRight}
                      onClick={() => navigate(`/app/office/${encodeURIComponent(office.id)}`)}
                    >
                      Join Office
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Online Colleagues & Activity Feed */}
        <div className="dashboard-sidebar-col">
          {/* Online Colleagues Mini-Drawer */}
          <div className="dashboard-widget-card">
            <div className="widget-header">
              <h3 className="widget-title">Active Colleagues</h3>
              <button
                type="button"
                onClick={() => navigate('/app/people')}
                className="widget-action-link"
              >
                View all ({teamMembers.length})
              </button>
            </div>

            <div className="widget-people-list">
              {teamMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="widget-person-row">
                  <Avatar
                    src={member.avatar}
                    name={member.name}
                    size="sm"
                    status={member.status}
                    color={member.color}
                    isSpeaking={member.isSpeaking}
                  />
                  <div className="person-details">
                    <div className="flex items-center gap-1.5">
                      <span className="person-name">{member.name}</span>
                      {member.isSpeaking && (
                        <span className="speaking-tag-pill">🎙️ Talking</span>
                      )}
                    </div>
                    <span className="person-loc">{member.currentOffice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/office/${encodeURIComponent(member.currentOffice)}`)}
                    className="person-join-btn"
                    title={`Join ${member.name} in ${member.currentOffice}`}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="dashboard-widget-card">
            <div className="widget-header">
              <h3 className="widget-title">Workspace Pulse</h3>
              <Clock size={14} className="text-slate-400" />
            </div>

            <div className="widget-activity-timeline">
              {activity.map((act) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p className="timeline-text">
                      <strong>{act.user}</strong> {act.action} in{' '}
                      <span className="timeline-loc">{act.location}</span>
                    </p>
                    <span className="timeline-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
