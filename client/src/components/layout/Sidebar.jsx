import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Users,
  Bell,
  Settings,
  User,
  LogOut,
  Building,
  Volume2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Avatar } from '../common/Avatar';

export function Sidebar({ isMobileOpen = false, onCloseMobile }) {
  const { user, logout } = useAuth();
  const { currentWorkspace, unreadCount, activeOffice } = useWorkspace();
  const navigate = useNavigate();

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: 'Overview' },
    {
      to: `/app/office/${encodeURIComponent(activeOffice?.id || 'oVice HQ / C-03')}`,
      icon: Compass,
      label: 'Virtual Office',
      badge: 'Live',
    },
    { to: '/app/people', icon: Users, label: 'Team Members' },
    {
      to: '/app/notifications',
      icon: Bell,
      label: 'Notifications',
      count: unreadCount,
    },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      aria-label="Application sidebar"
    >
      {/* Brand Header */}
      <div className="sidebar-brand-wrapper">
        <a
          href="/app"
          onClick={(e) => {
            e.preventDefault();
            navigate('/app');
            if (onCloseMobile) onCloseMobile();
          }}
          className="sidebar-brand-link"
        >
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
          <div className="brand-text-col">
            <span className="brand-name">
              Proxi<span className="brand-name-accent">Speak</span>
            </span>
            <span className="brand-tagline">Spatial Virtual Office</span>
          </div>
        </a>
      </div>

      {/* Active Workspace Pill */}
      <div className="sidebar-workspace-card">
        <div className="workspace-badge-icon">
          <Building size={14} />
        </div>
        <div className="workspace-info">
          <span className="workspace-label">WORKSPACE</span>
          <span className="workspace-name" title={currentWorkspace?.name}>
            {currentWorkspace?.name || 'Acme Corp HQ'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">MAIN NAVIGATION</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="nav-item-icon-wrap">
                <Icon size={18} />
              </div>
              <span className="nav-item-label">{item.label}</span>
              {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              {item.count > 0 && (
                <span className="nav-item-counter">{item.count}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Office Jump Widget */}
      <div className="sidebar-office-quicklink">
        <div className="office-quicklink-header">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-indigo-400" />
            <span>CURRENT FLOOR</span>
          </div>
          <span className="live-indicator-dot" />
        </div>
        <div className="office-quicklink-name">{activeOffice?.name || 'oVice HQ / Floor 3'}</div>
        <button
          type="button"
          onClick={() => {
            navigate(`/app/office/${encodeURIComponent(activeOffice?.id || 'oVice HQ / C-03')}`);
            if (onCloseMobile) onCloseMobile();
          }}
          className="office-jump-button"
        >
          <span>Enter 2D Canvas</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* User Footer */}
      <div className="sidebar-user-footer">
        <div
          className="user-profile-summary"
          onClick={() => {
            navigate('/app/profile');
            if (onCloseMobile) onCloseMobile();
          }}
          role="button"
          tabIndex={0}
        >
          <Avatar
            src={user?.avatar || '/avatar_mia.png'}
            name={user?.name || 'Mia'}
            size="sm"
            status="online"
            color={user?.avatarColor || '#2563eb'}
          />
          <div className="user-details">
            <span className="user-name">{user?.name || 'Mia Chen'}</span>
            <span className="user-role">{user?.title || 'Product Lead'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title="Sign out of ProxiSpeak"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
