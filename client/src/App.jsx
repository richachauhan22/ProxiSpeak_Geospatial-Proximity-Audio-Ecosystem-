import { useCallback, useEffect, useRef, useState } from 'react';
import OfficeCanvas from './office/OfficeCanvas';
import JoinOfficePage from './pages/JoinOfficePage';
import LandingPage from './pages/LandingPage';
import { useSocket } from './hooks/useSocket';
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
import {
  DEFAULT_LOCAL_USER,
  DEFAULT_OFFICE_PARTICIPANTS,
} from './office/OfficeMap';

const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

function App() {
  const joinRequestRef = useRef(null);
  const localUserRef = useRef(null);
  const joinTimeoutRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const mutedRef = useRef(false);
  const mountedRef = useRef(true);

  const [displayName, setDisplayName] = useState('Mia');
  const [avatarColor, setAvatarColor] = useState('#2563eb');
  const [avatarUrl, setAvatarUrl] = useState('/avatar_mia.png');
  const [officeId, setOfficeId] = useState('oVice HQ / C-03');
  const [joined, setJoined] = useState(
    () => window.location.pathname === '/office',
  );
  const [localUser, setLocalUser] = useState(() => DEFAULT_LOCAL_USER);
  const [participants, setParticipants] = useState(
    () => DEFAULT_OFFICE_PARTICIPANTS,
  );
  const [error, setError] = useState('');
  const [proximityMessage, setProximityMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [recenterCount, setRecenterCount] = useState(0);
  const [reactions, setReactions] = useState([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [miniMapOpen, setMiniMapOpen] = useState(false);

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
      closeAllPeerConnections();
      stopLocalAudio();
      if (joinRequestRef.current) {
        setError('Connection lost. Reconnecting to the office…');
      }
    },
    onConnectError: () => {
      setIsJoining(false);
    },
  });

  function emitJoin() {
    const socket = socketRef.current;
    const request = joinRequestRef.current;

    if (!socket || !request || !socket.connected) return;

    socket.emit('office:join', {
      officeId: request.officeId,
      displayName: request.displayName,
      avatarColor: request.avatarColor,
    });

    window.clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = window.setTimeout(() => {
      // Keep the existing local demo fallback if the server doesn't respond.
      setIsJoining(false);
      setJoined(true);
      setPage('office');
      if (window.location.pathname !== '/office') {
        window.history.pushState({}, '', '/office');
      }
    }, 1500);
  }

  function stopLocalAudio() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }

  function closePeerConnection(peerId) {
    const pc = peerConnectionsRef.current.get(peerId);

    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }

    pendingCandidatesRef.current.delete(peerId);

    const audio = remoteAudioRef.current.get(peerId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      remoteAudioRef.current.delete(peerId);
    }
  }

  function closeAllPeerConnections() {
    for (const peerId of [...peerConnectionsRef.current.keys()]) {
      closePeerConnection(peerId);
    }
    pendingCandidatesRef.current.clear();
  }

  async function ensureLocalAudio() {
    if (localStreamRef.current) return localStreamRef.current;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Microphone access is unavailable. Use a supported browser and a secure connection (HTTPS or localhost).',
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // The user may have left the office while the permission prompt was open.
    if (!mountedRef.current || !localUserRef.current?.id) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('You are no longer connected to the office.');
    }

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !mutedRef.current;
    });

    localStreamRef.current = stream;
    return stream;
  }

  const getPeerConnection = useCallback((peerId) => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionsRef.current.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit('webrtc:ice-candidate', {
          to: peerId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (!stream) return;

      let audio = remoteAudioRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudioRef.current.set(peerId, audio);
      }

      audio.srcObject = stream;
      audio.play().catch(() => {
        setProximityMessage(
          'A nearby voice connection is ready. If you cannot hear audio, interact with the page and check your browser audio settings.',
        );
      });
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        closePeerConnection(peerId);
      }
    };

    return pc;
  }, []);

  async function addLocalTracks(pc) {
    const stream = await ensureLocalAudio();

    const existingTrackIds = new Set(
      pc.getSenders()
        .map((sender) => sender.track?.id)
        .filter(Boolean),
    );

    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        pc.addTrack(track, stream);
      }
    });
  }

  async function flushPendingCandidates(peerId, pc) {
    const queued = pendingCandidatesRef.current.get(peerId) || [];
    pendingCandidatesRef.current.delete(peerId);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (candidateError) {
        console.warn('Could not apply queued ICE candidate:', candidateError);
      }
    }
  }

  async function handleProximityEntered(payload) {
    const peerId = payload?.userId;
    const peerName = payload?.displayName || 'A teammate';
    const me = localUserRef.current;
    const socket = socketRef.current;

    setProximityMessage(`${peerName} is nearby!`);

    // Do not request microphone access in the local demo or before joining
    // the server-backed office.
    if (
      !joined ||
      !me?.id ||
      !peerId ||
      peerId === me.id ||
      !socket?.connected
    ) {
      return;
    }

    // Both clients receive proximity:entered. Only one should initiate.
    // This deterministic rule prevents both clients from creating offers.
    if (String(me.id) > String(peerId)) return;

    try {
      const pc = getPeerConnection(peerId);
      await addLocalTracks(pc);

      // Avoid creating a duplicate offer if the connection is already active.
      if (pc.signalingState !== 'stable') return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('webrtc:offer', {
        to: peerId,
        description: pc.localDescription,
      });
    } catch (audioError) {
      console.error('Could not start nearby voice:', audioError);
      setProximityMessage(
        audioError?.message || 'Could not start microphone audio.',
      );
    }
  }

  async function handleWebRTCOffer(payload) {
    const peerId = payload?.from;
    const description = payload?.description;
    const me = localUserRef.current;
    const socket = socketRef.current;

    if (
      !joined ||
      !me?.id ||
      !peerId ||
      !description ||
      !socket?.connected
    ) {
      return;
    }

    try {
      const pc = getPeerConnection(peerId);
      await addLocalTracks(pc);
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      await flushPendingCandidates(peerId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('webrtc:answer', {
        to: peerId,
        description: pc.localDescription,
      });
    } catch (audioError) {
      console.error('Could not answer voice offer:', audioError);
      setProximityMessage(
        audioError?.message || 'Could not answer the voice connection.',
      );
    }
  }

  async function handleWebRTCAnswer(payload) {
    const peerId = payload?.from;
    const description = payload?.description;
    const pc = peerConnectionsRef.current.get(peerId);

    if (!pc || !description) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      await flushPendingCandidates(peerId, pc);
    } catch (audioError) {
      console.error('Could not apply voice answer:', audioError);
    }
  }

  async function handleICECandidate(payload) {
    const peerId = payload?.from;
    const candidate = payload?.candidate;
    if (!peerId || !candidate) return;

    const pc = peerConnectionsRef.current.get(peerId);
    if (!pc || !pc.remoteDescription) {
      const queued = pendingCandidatesRef.current.get(peerId) || [];
      queued.push(candidate);
      pendingCandidatesRef.current.set(peerId, queued);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (candidateError) {
      console.warn('Could not add ICE candidate:', candidateError);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.clearTimeout(joinTimeoutRef.current);
      closeAllPeerConnections();
      stopLocalAudio();
    };
  }, []);

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

      const userMap = new Map();
      DEFAULT_OFFICE_PARTICIPANTS.forEach((person) => {
        userMap.set(person.id, person);
      });
      (officeUsers || []).forEach((person) => {
        if (person.id !== user.id) userMap.set(person.id, person);
      });

      setParticipants([...userMap.values()]);
      setJoined(true);
      setPage('office');

      if (window.location.pathname !== '/office') {
        window.history.pushState({}, '', '/office');
      }

      setError('');
    };

    const handleAvatarJoined = (user) => {
      setParticipants((current) => {
        if (current.some((member) => member.id === user.id)) return current;
        return [...current, { ...user }];
      });
    };

    const handleAvatarLeft = ({ id }) => {
      setParticipants((current) =>
        current.filter((member) => member.id !== id),
      );

      closePeerConnection(id);

      const currentUser = localUserRef.current;
      if (currentUser && currentUser.id === id) {
        closeAllPeerConnections();
        stopLocalAudio();
        localUserRef.current = null;
        setJoined(false);
        joinRequestRef.current = null;
        setPage('landing');

        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
        }
      }
    };

    const handleAvatarMove = (payload) => {
      setParticipants((current) =>
        current.map((member) =>
          member.id === payload.id
            ? { ...member, x: payload.x, y: payload.y }
            : member,
        ),
      );

      const currentUser = localUserRef.current;
      if (currentUser && currentUser.id === payload.id) {
        const nextUser = {
          ...currentUser,
          x: payload.x,
          y: payload.y,
        };
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
      closeAllPeerConnections();
      stopLocalAudio();
      setJoined(false);
      joinRequestRef.current = null;
      setPage('landing');

      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    };

    const handleProximityLeft = ({ userId } = {}) => {
      if (userId) closePeerConnection(userId);
      setProximityMessage('Your teammate moved out of hearing range.');
    };

    const handleWebRTCError = (payload) => {
      setProximityMessage(
        payload?.message || 'The voice connection could not be established.',
      );
    };

    const handlePopState = () => {
      if (window.location.pathname === '/office' || joined) {
        setPage('office');
      } else {
        setPage(window.location.pathname === '/join' ? 'join' : 'landing');
      }
    };

    socket.on('office:joined', handleJoined);
    socket.on('avatar:joined', handleAvatarJoined);
    socket.on('avatar:left', handleAvatarLeft);
    socket.on('avatar:move', handleAvatarMove);
    socket.on('proximity:entered', handleProximityEntered);
    socket.on('proximity:left', handleProximityLeft);
    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:ice-candidate', handleICECandidate);
    socket.on('webrtc:error', handleWebRTCError);
    socket.on('error', handleError);
    socket.on('office:left', handleOfficeLeft);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.clearTimeout(joinTimeoutRef.current);
      window.removeEventListener('popstate', handlePopState);
      socket.off('office:joined', handleJoined);
      socket.off('avatar:joined', handleAvatarJoined);
      socket.off('avatar:left', handleAvatarLeft);
      socket.off('avatar:move', handleAvatarMove);
      socket.off('proximity:entered', handleProximityEntered);
      socket.off('proximity:left', handleProximityLeft);
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:ice-candidate', handleICECandidate);
      socket.off('webrtc:error', handleWebRTCError);
      socket.off('error', handleError);
      socket.off('office:left', handleOfficeLeft);
    };
  }, [joined, displayName, avatarUrl, avatarColor]);

  const navigate = (nextPage) => {
    const path = nextPage === 'landing' ? '/' : `/${nextPage}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setPage(nextPage);
    if (nextPage === 'office') setJoined(true);
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
      // Demo mode: no microphone or real WebRTC connection.
      setJoined(true);
      setPage('office');
      setIsJoining(false);
      if (window.location.pathname !== '/office') {
        window.history.pushState({}, '', '/office');
      }
      return;
    }

    emitJoin();
  };

  const handleInstantDemo = () => {
    closeAllPeerConnections();
    stopLocalAudio();

    const demoUser = {
      ...DEFAULT_LOCAL_USER,
      displayName: displayName || 'Mia',
      avatarColor: avatarColor || '#2563eb',
      ringColor: avatarColor || '#2563eb',
      photoUrl: avatarUrl || '/avatar_mia.png',
    };

    setLocalUser(demoUser);
    localUserRef.current = demoUser;
    joinRequestRef.current = null;
    setJoined(true);
    navigate('office');
  };

  const handleLeaveOffice = () => {
    if (socketRef.current?.connected && localUserRef.current?.id) {
      socketRef.current.emit('office:leave', { officeId });
    }

    closeAllPeerConnections();
    stopLocalAudio();
    localUserRef.current = null;
    joinRequestRef.current = null;
    setJoined(false);
    setProximityMessage('');
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
      current.map((member) =>
        member.id === nextUser.id
          ? { ...member, x: nextPosition.x, y: nextPosition.y }
          : member,
      ),
    );

    if (socketRef.current?.connected) {
      socketRef.current.emit('office:move', {
        officeId,
        x: nextPosition.x,
        y: nextPosition.y,
      });
    }
  };

  const handleToggleMute = () => {
    setIsMuted((previous) => {
      const next = !previous;
      mutedRef.current = next;

      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });

      setLocalUser((current) => ({
        ...current,
        isMuted: next,
        isSpeaking: !next,
      }));

      return next;
    });
  };

  const handleToggleVideo = () => {
    setIsVideoOn((previous) => !previous);
  };

  const handleReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((previous) => [
      ...previous,
      {
        id,
        emoji,
        x: localUser?.x || 554,
        y: localUser?.y || 164,
      },
    ]);

    window.setTimeout(() => {
      setReactions((previous) => previous.filter((reaction) => reaction.id !== id));
    }, 2400);
  };

  return (
    <div className={`app-shell ${page}-shell`}>
      {page === 'landing' && !joined ? (
        <LandingPage
          onEnter={() => navigate('join')}
          onDirectOffice={handleInstantDemo}
          onExplore={() =>
            document.getElementById('features')?.scrollIntoView({
              behavior: 'smooth',
            })
          }
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
        <div className="ovice-office-container">
          <OviceHeader
            officeId={officeId}
            participantCount={participants.length + (localUser ? 1 : 0)}
            connectionStatus={
              connectionStatus === 'connected' ? 'Fast' : connectionStatus
            }
            onToggleMenu={() => setSettingsOpen(true)}
            onToggleParticipants={() => setParticipantsOpen((previous) => !previous)}
            onToggleChat={() => setChatOpen((previous) => !previous)}
            onToggleCalendar={() => setCalendarOpen(true)}
            onToggleNotifications={() => setNotificationsOpen(true)}
            onOpenHelp={() => setHelpOpen(true)}
            onLeaveOffice={() => setLeaveConfirmOpen(true)}
            chatOpen={chatOpen}
            participantsOpen={participantsOpen}
          />

          <main className="ovice-main-viewport">
            <FloorSelector currentFloor={6} />

            {proximityMessage && (
              <div
                style={{
                  position: 'absolute',
                  top: '70px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#2563eb',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  zIndex: 1000,
                }}
              >
                {proximityMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  position: 'absolute',
                  top: '120px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#991b1b',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  zIndex: 1000,
                  maxWidth: '90%',
                }}
              >
                {error}
              </div>
            )}

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

            {reactions.map((reaction) => (
              <div
                key={reaction.id}
                className="floating-emoji"
                style={{
                  left: `calc(50% + ${(reaction.x - 720) * (zoomLevel / 100) + panPosition.x}px)`,
                  top: `calc(50% + ${(reaction.y - 447) * (zoomLevel / 100) + panPosition.y}px)`,
                }}
              >
                {reaction.emoji}
              </div>
            ))}

            <MiniMapOverlay
              isOpen={miniMapOpen}
              onClose={() => setMiniMapOpen(false)}
              localUser={localUser}
              participants={participants}
              onTeleport={(x, y) => handleLocalMove({ x, y })}
            />

            <BottomToolbar
              localUser={localUser}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onRecenter={() => setRecenterCount((count) => count + 1)}
              onToggleMute={handleToggleMute}
              onToggleVideo={handleToggleVideo}
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              onReaction={handleReaction}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenAddMenu={() => setToolsOpen(true)}
              onToggleMiniMap={() => setMiniMapOpen((previous) => !previous)}
              onLeaveOffice={() => setLeaveConfirmOpen(true)}
              onOpenHelp={() => setHelpOpen(true)}
              miniMapOpen={miniMapOpen}
            />

            <ChatDrawer
              isOpen={chatOpen}
              onClose={() => setChatOpen(false)}
              officeId={officeId}
              localUser={localUser}
            />

            <ParticipantsDrawer
              isOpen={participantsOpen}
              onClose={() => setParticipantsOpen(false)}
              participants={participants}
              localUser={localUser}
            />

            <CalendarModal
              isOpen={calendarOpen}
              onClose={() => setCalendarOpen(false)}
            />
            <NotificationsModal
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
            <SettingsModal
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              onLeaveOffice={() => setLeaveConfirmOpen(true)}
            />
            <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
            <QuickToolsModal
              isOpen={toolsOpen}
              onClose={() => setToolsOpen(false)}
            />
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