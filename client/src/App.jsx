import { useEffect, useRef, useState } from 'react';
import OfficeCanvas from './office/OfficeCanvas';
import JoinOfficePage from './pages/JoinOfficePage';
import LandingPage from './pages/LandingPage';
import { useSocket } from './hooks/useSocket';
import { useWebRTC } from './hooks/useWebRTC';
import OviceHeader from './components/OviceHeader';
import FloorSelector from './components/FloorSelector';
import BottomToolbar from './components/BottomToolbar';
import ChatDrawer from './components/ChatDrawer';
import ParticipantsDrawer from './components/ParticipantsDrawer';
import MiniMapOverlay from './components/MiniMapOverlay';
import {
  CalendarModal,
  NotificationsModal,
  SettingsModal,
  HelpModal,
  QuickToolsModal,
  LeaveConfirmModal,
} from './components/OfficeModals';
import { DEFAULT_LOCAL_USER, DEFAULT_OFFICE_PARTICIPANTS } from './office/OfficeMap';
import { sounds } from './services/soundEffects';

function App() {
  const joinRequestRef = useRef(null);
  const localUserRef = useRef(null);
  const joinTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const [displayName, setDisplayName] = useState('Mia');
  const [avatarColor, setAvatarColor] = useState('#2563eb');
  const [avatarUrl, setAvatarUrl] = useState('/avatar_mia.png');
  const [officeId, setOfficeId] = useState('oVice HQ / C-03');
  const [joined, setJoined] = useState(() => window.location.pathname === '/office');
  const [localUser, setLocalUser] = useState(() => DEFAULT_LOCAL_USER);
  const [participants, setParticipants] = useState(() => DEFAULT_OFFICE_PARTICIPANTS);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [recenterCount, setRecenterCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  // Floating reactions
  const [reactions, setReactions] = useState([]);

  // UI Drawers & Modals
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [miniMapOpen, setMiniMapOpen] = useState(false);
  const [proximityDistance, setProximityDistance] = useState(240);

  // Video toggle
  const [isVideoOn, setIsVideoOn] = useState(true);

  const [page, setPage] = useState(() => {
    if (window.location.pathname === '/office') return 'office';
    if (window.location.pathname === '/join') return 'join';
    return 'landing';
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  const { socketRef, connectionStatus, setConnectionStatus } = useSocket({
    onConnect: () => {
      setError('');
      if (joinRequestRef.current) emitJoin();
    },
    onDisconnect: () => {
      if (joinRequestRef.current) setError('Connection lost. Reconnecting to the office…');
    },
    onConnectError: () => {
      setIsJoining(false);
    },
  });

  const isOfficeActive = (joined || page === 'office');

  const {
    localStream,
    isMuted,
    isLocalSpeaking,
    audioLevel,
    permissionStatus,
    speakingPeers,
    webrtcError,
    startAudio,
    stopAudio,
    toggleMute,
  } = useWebRTC({
    socketRef,
    localUser,
    participants,
    enabled: isOfficeActive,
    spatialConfig: {
      maxDistance: proximityDistance,
    },
  });

  useEffect(() => {
    if (isOfficeActive) {
      startAudio().catch(() => {});
    } else {
      stopAudio();
    }
  }, [isOfficeActive, startAudio, stopAudio]);

  useEffect(() => {
    if (webrtcError) {
      showToast(webrtcError);
    }
  }, [webrtcError]);

  const navigate = (nextPage) => {
    const path = nextPage === 'landing' ? '/' : `/${nextPage}`;
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setPage(nextPage);
    if (nextPage === 'office') {
      setJoined(true);
    }
  };

  useEffect(() => {
    localUserRef.current = localUser;
  }, [localUser]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return undefined;

    const handleJoined = ({ user, participants: officeUsers }) => {
      window.clearTimeout(joinTimeoutRef.current);
      setIsJoining(false);
      const mergedUser = {
        ...DEFAULT_LOCAL_USER,
        ...user,
        displayName: user.displayName || displayName,
        photoUrl: avatarUrl,
        avatarColor: user.avatarColor || avatarColor,
        ringColor: user.avatarColor || avatarColor,
      };
      localUserRef.current = mergedUser;
      setLocalUser(mergedUser);

      // Merge real participants with default screenshot teammates
      const userMap = new Map();
      DEFAULT_OFFICE_PARTICIPANTS.forEach((p) => userMap.set(p.id, p));
      (officeUsers || []).forEach((p) => {
        if (p.id !== user.id) userMap.set(p.id, p);
      });
      setParticipants([...userMap.values()]);

      setJoined(true);
      setPage('office');
      showToast(`Welcome to ${officeId}!`);
      if (window.location.pathname !== '/office') window.history.pushState({}, '', '/office');
      setError('');
    };

    const handleAvatarJoined = (user) => {
      setParticipants((current) => {
        const existing = current.find((member) => member.id === user.id);
        if (existing) return current;
        showToast(`${user.displayName || 'A teammate'} joined the office`);
        return [...current, { ...user }];
      });
    };

    const handleAvatarLeft = ({ id }) => {
      setParticipants((current) => current.filter((member) => member.id !== id));
      const currentUser = localUserRef.current;
      if (currentUser && currentUser.id === id) {
        localUserRef.current = null;
        setJoined(false);
        joinRequestRef.current = null;
        setPage('landing');
        if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
      }
    };

    const handleAvatarMove = (payload) => {
      setParticipants((current) =>
        current.map((member) =>
          member.id === payload.id ? { ...member, x: payload.x, y: payload.y } : member,
        ),
      );
      const currentUser = localUserRef.current;
      if (currentUser && currentUser.id === payload.id) {
        const nextUser = { ...currentUser, x: payload.x, y: payload.y };
        localUserRef.current = nextUser;
        setLocalUser(nextUser);
      }
    };

    const handleError = (payload) => {
      window.clearTimeout(joinTimeoutRef.current);
      setIsJoining(false);
      setConnectionStatus(socket.connected ? 'connected' : 'error');
      setError(payload?.message || 'Connection error');
      if (!localUserRef.current) joinRequestRef.current = null;
    };

    const handleOfficeLeft = () => {
      setJoined(false);
      joinRequestRef.current = null;
      setPage('landing');
      if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    };

    socket.on('office:joined', handleJoined);
    socket.on('avatar:joined', handleAvatarJoined);
    socket.on('avatar:left', handleAvatarLeft);
    socket.on('avatar:move', handleAvatarMove);
    socket.on('error', handleError);
    socket.on('office:left', handleOfficeLeft);

    const handlePopState = () => {
      if (window.location.pathname === '/office' || joined) {
        setPage('office');
      } else {
        setPage(window.location.pathname === '/join' ? 'join' : 'landing');
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.clearTimeout(joinTimeoutRef.current);
      window.removeEventListener('popstate', handlePopState);
      socket.off('office:joined', handleJoined);
      socket.off('avatar:joined', handleAvatarJoined);
      socket.off('avatar:left', handleAvatarLeft);
      socket.off('avatar:move', handleAvatarMove);
      socket.off('error', handleError);
      socket.off('office:left', handleOfficeLeft);
    };
  }, [joined, displayName, avatarUrl, avatarColor]);

  const emitJoin = () => {
    const socket = socketRef.current;
    const joinRequest = joinRequestRef.current;
    if (!socket || !joinRequest) return;

    socket.emit('office:join', {
      officeId: joinRequest.officeId,
      displayName: joinRequest.displayName,
      avatarColor: joinRequest.avatarColor,
    });

    window.clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = window.setTimeout(() => {
      // Local interactive fallback
      setIsJoining(false);
      setJoined(true);
      setPage('office');
      showToast(`Joined ${officeId}`);
      if (window.location.pathname !== '/office') window.history.pushState({}, '', '/office');
    }, 1500);
  };

  const handleJoinOffice = () => {
    setError('');
    const normalizedName = displayName.trim();
    const normalizedOfficeId = officeId.trim();
    if (normalizedName.length < 2 || normalizedName.length > 24) {
      setError('Display name must be 2-24 characters long.');
      return;
    }
    if (normalizedOfficeId.length < 2 || normalizedOfficeId.length > 48) {
      setError('Office ID must be 2-48 characters long.');
      return;
    }

    joinRequestRef.current = {
      displayName: normalizedName,
      officeId: normalizedOfficeId,
      avatarColor,
    };
    setIsJoining(true);

    const updatedUser = {
      ...DEFAULT_LOCAL_USER,
      displayName: normalizedName,
      avatarColor,
      ringColor: avatarColor,
      photoUrl: avatarUrl,
    };
    setLocalUser(updatedUser);
    localUserRef.current = updatedUser;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setJoined(true);
      setPage('office');
      setIsJoining(false);
      showToast(`Joined ${officeId}`);
      if (window.location.pathname !== '/office') window.history.pushState({}, '', '/office');
      return;
    }

    emitJoin();
  };

  const handleInstantDemo = () => {
    const demoUser = {
      ...DEFAULT_LOCAL_USER,
      displayName: displayName || 'Mia',
      avatarColor: avatarColor || '#2563eb',
      ringColor: avatarColor || '#2563eb',
      photoUrl: avatarUrl || '/avatar_mia.png',
    };
    setLocalUser(demoUser);
    localUserRef.current = demoUser;
    setJoined(true);
    showToast('Entered demo office mode');
    navigate('office');
  };

  const handleLeaveOffice = () => {
    stopAudio();
    if (socketRef.current?.connected) {
      socketRef.current.emit('office:leave', { officeId });
    }
    setJoined(false);
    joinRequestRef.current = null;
    navigate('landing');
  };

  const handleLocalMove = (nextPosition) => {
    const currentUser = localUserRef.current;
    if (!currentUser) return;

    const nextUser = {
      ...currentUser,
      x: nextPosition.x,
      y: nextPosition.y,
    };

    localUserRef.current = nextUser;
    setLocalUser(nextUser);
    setParticipants((current) =>
      current.map((member) => (member.id === nextUser.id ? { ...member, x: nextPosition.x, y: nextPosition.y } : member)),
    );
    if (socketRef.current?.connected) {
      socketRef.current.emit('office:move', { officeId, x: nextPosition.x, y: nextPosition.y });
    }
  };

  const handleToggleMute = () => {
    if (permissionStatus === 'denied' || !localStream) {
      startAudio().then((stream) => {
        if (stream) {
          showToast('Microphone connected via WebRTC');
        }
      });
      return;
    }
    const nextMuted = toggleMute();
    showToast(nextMuted ? 'Microphone Muted' : 'Microphone Unmuted');
  };

  const handleToggleVideo = () => {
    setIsVideoOn((prev) => {
      const next = !prev;
      showToast(next ? 'Camera Turned On' : 'Camera Turned Off');
      return next;
    });
  };

  const handleReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji, x: localUser?.x || 554, y: localUser?.y || 164 }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  const currentLocalUser = {
    ...localUser,
    isMuted,
    isSpeaking: isLocalSpeaking,
  };

  const activeParticipants = participants.map((p) => ({
    ...p,
    isSpeaking: speakingPeers.has(p.id) || Boolean(p.isSpeaking),
  }));

  return (
    <div className={`app-shell ${page}-shell modern-theme`}>
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="proxi-toast-banner" role="status">
          <span className="toast-sparkle">✨</span>
          <span className="toast-content">{toastMessage}</span>
        </div>
      )}

      {page === 'landing' && !joined ? (
        <LandingPage
          onEnter={() => navigate('join')}
          onDirectOffice={handleInstantDemo}
          onExplore={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        />
      ) : page === 'join' && !joined ? (
        <JoinOfficePage
          displayName={displayName}
          setDisplayName={setDisplayName}
          avatarColor={avatarColor}
          setAvatarColor={setAvatarColor}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          officeId={officeId}
          setOfficeId={setOfficeId}
          onSubmit={handleJoinOffice}
          onBack={() => navigate('landing')}
          error={error}
          connectionStatus={connectionStatus}
          loading={isJoining}
        />
      ) : (
        /* ================= VIRTUAL OFFICE WORKSPACE ================= */
        <div className="ovice-office-container modern-office-viewport">
          {/* 1. Modern Frosted Header */}
          <OviceHeader
            officeId={officeId}
            participantCount={activeParticipants.length + (currentLocalUser ? 1 : 0)}
            connectionStatus={connectionStatus === 'connected' ? 'Fast' : connectionStatus}
            onToggleMenu={() => setSettingsOpen(true)}
            onToggleParticipants={() => setParticipantsOpen((prev) => !prev)}
            onToggleChat={() => setChatOpen((prev) => !prev)}
            onToggleCalendar={() => setCalendarOpen(true)}
            onToggleNotifications={() => setNotificationsOpen(true)}
            onOpenHelp={() => setHelpOpen(true)}
            onLeaveOffice={() => setLeaveConfirmOpen(true)}
            chatOpen={chatOpen}
            participantsOpen={participantsOpen}
            onCopyLink={() => showToast('Office link copied to clipboard!')}
          />

          {/* 2. Main Floor Workspace */}
          <main className="ovice-main-viewport modern-canvas-holder">
            {/* Left Floating Floor Selector Widget (6F) */}
            <FloorSelector
              currentFloor={6}
              onFloorChange={(fl) => showToast(`Elevator moved to Floor ${fl}F`)}
            />

            {/* Virtual Office Floor Canvas */}
            <OfficeCanvas
              localUser={currentLocalUser}
              participants={activeParticipants}
              onLocalMove={handleLocalMove}
              zoom={zoomLevel}
              panX={panPosition.x}
              panY={panPosition.y}
              onPanChange={(x, y) => setPanPosition({ x, y })}
              recenterTrigger={recenterCount}
            />

            {/* Floating Emojis */}
            {reactions.map((r) => (
              <div
                key={r.id}
                className="floating-emoji modern-floating-reaction"
                style={{
                  left: `calc(50% + ${(r.x - 720) * (zoomLevel / 100) + panPosition.x}px)`,
                  top: `calc(50% + ${(r.y - 447) * (zoomLevel / 100) + panPosition.y}px)`,
                }}
              >
                {r.emoji}
              </div>
            ))}

            {/* Radar Mini-map Overlay */}
            <MiniMapOverlay
              isOpen={miniMapOpen}
              onClose={() => setMiniMapOpen(false)}
              localUser={currentLocalUser}
              participants={activeParticipants}
              onTeleport={(x, y) => {
                handleLocalMove({ x, y });
                showToast('Navigated to map coordinate');
              }}
            />

            {/* Bottom Floating Controls Toolbar */}
            <BottomToolbar
              localUser={currentLocalUser}
              zoomLevel={zoomLevel}
              onZoomChange={(next) => setZoomLevel(next)}
              onRecenter={() => {
                setRecenterCount((c) => c + 1);
                showToast('View recentered on avatar');
              }}
              onToggleMute={handleToggleMute}
              onToggleVideo={handleToggleVideo}
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isSpeaking={isLocalSpeaking}
              audioLevel={audioLevel}
              permissionStatus={permissionStatus}
              onReaction={handleReaction}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenAddMenu={() => setToolsOpen(true)}
              onToggleMiniMap={() => setMiniMapOpen((prev) => !prev)}
              onLeaveOffice={() => setLeaveConfirmOpen(true)}
              onOpenHelp={() => setHelpOpen(true)}
              miniMapOpen={miniMapOpen}
            />

            {/* Side Drawers */}
            <ChatDrawer
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
              officeId={officeId}
              localUser={currentLocalUser}
            />
            <ParticipantsDrawer
              isOpen={participantsOpen}
              onClose={() => setParticipantsOpen(false)}
              participants={activeParticipants}
              localUser={currentLocalUser}
              onTeleportToUser={(x, y) => {
                handleLocalMove({ x, y });
                showToast('Walked to teammate');
              }}
            />

            {/* Modals */}
            <CalendarModal
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              onJoinMeetingArea={(x, y) => {
                handleLocalMove({ x, y });
                showToast('Arrived at meeting zone');
              }}
            />
            <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            <SettingsModal
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onLeaveOffice={() => setLeaveConfirmOpen(true)}
              proximityDistance={proximityDistance}
              onProximityChange={setProximityDistance}
              audioLevel={audioLevel}
              isMuted={isMuted}
              permissionStatus={permissionStatus}
              onRequestMic={startAudio}
            />
            <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
            <QuickToolsModal isOpen={toolsOpen} onClose={() => setToolsOpen(false)} />
            <LeaveConfirmModal
              isOpen={leaveConfirmOpen}
              onClose={() => setLeaveConfirmOpen(false)}
              onConfirm={handleLeaveOffice}
            />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
