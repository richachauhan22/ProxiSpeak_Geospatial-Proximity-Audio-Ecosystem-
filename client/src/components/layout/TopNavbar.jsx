import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Signal,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

export function TopNavbar({ onToggleMobile }) {
  const { user, logout } = useAuth();
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    unreadCount,
    socketStatus,
  } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const workspaceRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target)) {
        setWorkspaceMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/people?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getStatusConfig = () => {
    switch (socketStatus) {
      case 'connected':
        return { text: 'Realtime Connected', color: 'bg-emerald-500', textClass: 'text-emerald-700' };
      case 'connecting':
        return { text: 'Connecting Mesh...', color: 'bg-amber-500 animate-pulse', textClass: 'text-amber-700' };
      case 'disconnected':
      default:
        return { text: 'Offline Mode', color: 'bg-rose-500', textClass: 'text-rose-700' };
    }
  };

  const status = getStatusConfig();

  return (
    <header className="app-top-navbar" aria-label="Top navigation">
      {/* Left section: mobile hamburger & workspace selector */}
      <div className="top-nav-left">
        <button
          type="button"
          onClick={onToggleMobile}
          className="mobile-nav-toggle-btn md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Workspace Dropdown */}
        <div className="relative" ref={workspaceRef}>
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="top-nav-workspace-btn"
          >
            <div className="workspace-icon-box">
              <Building size={15} />
            </div>
            <span className="workspace-title-text">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {workspaceMenuOpen && (
            <div className="top-nav-dropdown workspace-dropdown-menu">
              <div className="dropdown-section-title">SWITCH WORKSPACE</div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setWorkspaceMenuOpen(false);
                  }}
                  className={`workspace-option-row ${
                    ws.id === currentWorkspace?.id ? 'active' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="option-name">{ws.name}</span>
                    <span className="option-role-tag">{ws.role}</span>
                  </div>
                  {ws.id === currentWorkspace?.id && <Check size={14} className="text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle section: Global search */}
      <div className="top-nav-center">
        <form onSubmit={handleSearchSubmit} className="top-nav-search-form">
          <Search size={15} className="search-icon" />
          <input
            type="search"
            placeholder="Search colleagues, focus rooms, or offices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="top-nav-search-input"
          />
          <kbd className="search-shortcut-kbd">⌘K</kbd>
        </form>
      </div>

      {/* Right section: Status badge, theme toggle, notifications, profile */}
      <div className="top-nav-right">
        {/* Real-time Socket Indicator */}
        <div className="realtime-status-pill" title="Socket.io and WebRTC status">
          <span className={`status-beacon-dot ${status.color}`} />
          <span className="status-beacon-text">{status.text}</span>
        </div>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="top-nav-icon-btn"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
          aria-label="Toggle visual theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => navigate('/app/notifications')}
          className="top-nav-icon-btn relative"
          title="View notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="top-nav-notif-badge">{unreadCount}</span>}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="top-nav-user-avatar-btn"
            aria-label="User account menu"
          >
            <Avatar
              src={user?.avatar || '/avatar_mia.png'}
              name={user?.name || 'Mia'}
              size="sm"
              status="online"
              color={user?.avatarColor || '#2563eb'}
            />
          </button>

          {userMenuOpen && (
            <div className="top-nav-dropdown user-dropdown-menu">
              <div className="user-dropdown-header">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user?.name || 'Mia Chen'}
                </span>
                <span className="text-xs text-slate-500 truncate">{user?.email || 'user@proxispeak.internal'}</span>
              </div>

              <div className="user-dropdown-divider" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/app/profile');
                }}
                className="user-dropdown-item"
              >
                <User size={15} />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/app/settings');
                }}
                className="user-dropdown-item"
              >
                <Settings size={15} />
                <span>App Settings</span>
              </button>

              <div className="user-dropdown-divider" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="user-dropdown-item text-rose-600 hover:text-rose-700"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
