import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import officeService from '../services/officeService';
import userService from '../services/userService';
import notificationService from '../services/notificationService';
import { MOCK_WORKSPACES, MOCK_OFFICES, MOCK_TEAM_MEMBERS, MOCK_NOTIFICATIONS, MOCK_ACTIVITY } from '../services/mockDataService';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState(MOCK_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState(MOCK_WORKSPACES[0]);
  const [offices, setOffices] = useState(MOCK_OFFICES);
  const [activeOffice, setActiveOffice] = useState(MOCK_OFFICES[0]);
  const [teamMembers, setTeamMembers] = useState(MOCK_TEAM_MEMBERS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [socketStatus, setSocketStatus] = useState('connected'); // 'connected' | 'connecting' | 'disconnected'
  const [isLoading, setIsLoading] = useState(false);

  // Refresh data from backend / mock services
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOffices, fetchedMembers, fetchedNotifs] = await Promise.all([
        officeService.getOffices(),
        userService.getTeamMembers(),
        notificationService.getNotifications(),
      ]);
      setOffices(fetchedOffices);
      setTeamMembers(fetchedMembers);
      setNotifications(fetchedNotifs);
    } catch (e) {
      console.warn('[WorkspaceContext] Data load fallback:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const switchWorkspace = (workspaceId) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) setCurrentWorkspace(ws);
  };

  const selectOffice = (officeId) => {
    const found = offices.find((o) => o.id === officeId || o.slug === officeId);
    if (found) setActiveOffice(found);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    offices,
    activeOffice,
    selectOffice,
    teamMembers,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    activity,
    socketStatus,
    setSocketStatus,
    isLoading,
    refreshData,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export default WorkspaceContext;
