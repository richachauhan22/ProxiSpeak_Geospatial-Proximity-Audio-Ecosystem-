import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  Radio,
  Building,
  Volume2,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Button } from '../components/common/Button';

export function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    unreadCount,
  } = useWorkspace();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'proximity'

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'proximity') return n.type === 'proximity';
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case 'proximity':
        return <Volume2 size={16} className="text-indigo-600" />;
      case 'office':
        return <Compass size={16} className="text-emerald-600" />;
      case 'collaboration':
        return <Sparkles size={16} className="text-purple-600" />;
      case 'layout':
        return <Building size={16} className="text-amber-600" />;
      default:
        return <Bell size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="notifications-center-page">
      {/* Header */}
      <div className="section-title-row flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Stay updated on spatial proximity audio connections, huddles, and workspace layout changes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={Check}
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={clearNotifications}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notif-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`notif-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`notif-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('proximity')}
          className={`notif-tab-btn ${activeTab === 'proximity' ? 'active' : ''}`}
        >
          Proximity Audio
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="notif-empty-state">
          <Bell size={40} className="text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No notifications in this view
          </h3>
          <p className="text-xs text-slate-500">
            You are fully caught up with all campus activity!
          </p>
        </div>
      ) : (
        <div className="notif-list-container">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`notif-item-card ${!item.read ? 'unread' : ''}`}
              onClick={() => markAsRead(item.id)}
            >
              <div className="notif-icon-col">{getNotifIcon(item.type)}</div>

              <div className="notif-content-col">
                <div className="flex items-center justify-between">
                  <h4 className="notif-item-title">{item.title}</h4>
                  <span className="notif-item-time">{item.timestamp}</span>
                </div>
                <p className="notif-item-message">{item.message}</p>
                {item.officeId && (
                  <div className="notif-office-jump mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/office/${encodeURIComponent(item.officeId)}`);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      <Compass size={12} />
                      <span>Enter {item.officeId}</span>
                    </button>
                  </div>
                )}
              </div>

              {!item.read && <span className="notif-unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
