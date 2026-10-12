import { useEffect, useRef, useState } from 'react';
import OfficeCanvas from './office/OfficeCanvas';
import JoinOfficePage from './pages/JoinOfficePage';
import LandingPage from './pages/LandingPage';
import { useSocket } from './hooks/useSocket';
import OviceHeader from './components/OviceHeader';
import FloorSelector from './components/FloorSelector';
import BottomToolbar from './components/BottomToolbar';
import ChatDrawer from './components/ChatDrawer';
import ParticipantsDrawer from './components/ParticipantsDrawer';
import { CalendarModal, NotificationsModal, SettingsModal } from './components/OfficeModals';
import { DEFAULT_LOCAL_USER, DEFAULT_OFFICE_PARTICIPANTS } from './office/OfficeMap';

function App() {
  const joinRequestRef = useRef(null);
  const localUserRef = useRef(null);
  const joinTimeoutRef = useRef(null);

  const [displayName, setDisplayName] = useState('Mia');
  const [avatarColor, setAvatarColor] = useState('#2563eb');
  const [officeId, setOfficeId] = useState('oVice HQ / C-03');
  const [joined, setJoined] = useState(() => window.location.pathname === '/office');
  const [localUser, setLocalUser] = useState(() => DEFAULT_LOCAL_USER);
  const [participants, setParticipants] = useState(() => DEFAULT_OFFICE_PARTICIPANTS);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [recenterCount, setRecenterCount] = useState(0);

  // Floating reactions
  const [reactions, setReactions] = useState([]);

  // UI Drawers & Modals
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [miniMapOpen, setMiniMapOpen] = useState(false);

  // Audio / Video toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  const [page, setPage] = useState(() => {
    if (window.location.pathname === '/office') return 'office';
    if (window.location.pathname === '/join') return 'join';
    return 'landing';
  });

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
      // Even if standalone or offline, office preview is fully operational
    },
  });

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
      if (window.location.pathname !== '/office') window.history.pushState({}, '', '/office');
      setError('');
    };

    const handleAvatarJoined = (user) => {
      setParticipants((current) => {
        const existing = current.find((member) => member.id === user.id);
        if (existing) return current;
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
        setPage('join');
        if (window.location.pathname !== '/join') window.history.pushState({}, '', '/join');
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
      setPage('join');
      if (window.location.pathname !== '/join') window.history.pushState({}, '', '/join');
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
  }, [joined, displayName]);

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
      // If server does not respond within 3s, enter office in local/interactive mode!
      setIsJoining(false);
      setJoined(true);
      setPage('office');
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
    };
    setLocalUser(updatedUser);
    localUserRef.current = updatedUser;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      // Standalone mode -> enter office directly
      setJoined(true);
      setPage('office');
      setIsJoining(false);
      if (window.location.pathname !== '/office') window.history.pushState({}, '', '/office');
      return;
    }

    emitJoin();
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
    setIsMuted((prev) => {
      const next = !prev;
      setLocalUser((curr) => ({
        ...curr,
        isMuted: next,
        isSpeaking: !next,
      }));
      return next;
    });
  };

  const handleToggleVideo = () => {
    setIsVideoOn((prev) => !prev);
  };

  const handleReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, { id, emoji, x: localUser?.x || 554, y: localUser?.y || 164 }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  return (
    <div className={`app-shell ${page}-shell`}>
      {page === 'landing' && !joined ? (
        <LandingPage
          onEnter={() => navigate('join')}
          onDirectOffice={() => navigate('office')}
          onExplore={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
        />
      ) : page === 'join' && !joined ? (
        <JoinOfficePage
          displayName={displayName}
          setDisplayName={setDisplayName}
          avatarColor={avatarColor}
          setAvatarColor={setAvatarColor}
          officeId={officeId}
          setOfficeId={setOfficeId}
          onSubmit={handleJoinOffice}
          onBack={() => navigate('landing')}
          error={error}
          connectionStatus={connectionStatus}
          loading={isJoining}
        />
      ) : (
        /* ================= EXACT OVICE VIRTUAL OFFICE UI ================= */
        <div className="ovice-office-container">
          {/* 1. Header (Navbar) */}
          <OviceHeader
            officeId={officeId}
            participantCount={participants.length + (localUser ? 1 : 0)}
            connectionStatus="Fast"
            onToggleMenu={() => setSettingsOpen(true)}
            onToggleParticipants={() => setParticipantsOpen((prev) => !prev)}
            onToggleChat={() => setChatOpen((prev) => !prev)}
            onToggleCalendar={() => setCalendarOpen(true)}
            onToggleNotifications={() => setNotificationsOpen(true)}
            chatOpen={chatOpen}
            participantsOpen={participantsOpen}
          />

          {/* 2. Main Floor Workspace */}
          <main className="ovice-main-viewport">
            {/* Left Floating Floor Selector Widget (6F) */}
            <FloorSelector currentFloor={6} />

            {/* Virtual Office Floor Canvas */}
            <OfficeCanvas
              localUser={localUser}
              participants={participants}
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
                className="floating-emoji"
                style={{
                  left: `calc(50% + ${(r.x - 720) * (zoomLevel / 100) + panPosition.x}px)`,
                  top: `calc(50% + ${(r.y - 447) * (zoomLevel / 100) + panPosition.y}px)`,
                }}
              >
                {r.emoji}
              </div>
            ))}

            {/* Bottom Floating Controls Toolbar */}
            <BottomToolbar
              localUser={localUser}
              zoomLevel={zoomLevel}
              onZoomChange={(next) => setZoomLevel(next)}
              onRecenter={() => setRecenterCount((c) => c + 1)}
              onToggleMute={handleToggleMute}
              onToggleVideo={handleToggleVideo}
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              onReaction={handleReaction}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenAddMenu={() => setChatOpen(true)}
              onToggleMiniMap={() => setMiniMapOpen((prev) => !prev)}
              miniMapOpen={miniMapOpen}
            />

            {/* Side Drawers */}
            <ChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} officeId={officeId} />
            <ParticipantsDrawer
              isOpen={participantsOpen}
              onClose={() => setParticipantsOpen(false)}
              participants={participants}
              localUser={localUser}
            />

            {/* Modals */}
            <CalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
            <NotificationsModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
