import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebRTC } from './useWebRTC';

describe('useWebRTC React Hook', () => {
  let mockTrack;
  let mockStream;
  let mockSocket;
  let mockPeerConnection;

  beforeEach(() => {
    mockTrack = {
      kind: 'audio',
      enabled: true,
      stop: vi.fn(),
    };

    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
      getAudioTracks: vi.fn(() => [mockTrack]),
    };

    mockSocket = {
      connected: true,
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });

    mockPeerConnection = {
      addTrack: vi.fn(),
      getSenders: vi.fn(() => []),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'test-sdp' }),
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
      addIceCandidate: vi.fn(),
      close: vi.fn(),
      connectionState: 'new',
    };

    global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPeerConnection);

    window.RTCPeerConnection = global.RTCPeerConnection;
    window.RTCSessionDescription = vi.fn().mockImplementation((desc) => desc);
    window.RTCIceCandidate = vi.fn().mockImplementation((cand) => cand);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with default initial states', () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    expect(result.current.localStream).toBeNull();
    expect(result.current.isMuted).toBe(false);
    expect(result.current.isLocalSpeaking).toBe(false);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.permissionStatus).toBe('idle');
    expect(result.current.connectedPeers).toEqual([]);
    expect(result.current.speakingPeers.size).toBe(0);
    expect(result.current.webrtcError).toBeNull();
  });

  it('starts audio successfully and sets permission to granted', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      const stream = await result.current.startAudio({ echoCancellation: true });
      expect(stream).toBe(mockStream);
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({ echoCancellation: true }),
      video: false,
    });
    expect(result.current.localStream).toBe(mockStream);
    expect(result.current.permissionStatus).toBe('granted');
  });

  it('handles permission denial gracefully with clear error state', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
    );

    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      const res = await result.current.startAudio();
      expect(res).toBeNull();
    });

    expect(result.current.permissionStatus).toBe('denied');
    expect(result.current.webrtcError).toMatch(/permission was denied/i);
  });

  it('handles unsupported environment gracefully', async () => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    expect(result.current.permissionStatus).toBe('unsupported');
    expect(result.current.webrtcError).toMatch(/not supported/i);
  });

  it('stops audio, releases media stream, and resets speaking state', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });
    expect(result.current.localStream).not.toBeNull();

    act(() => {
      result.current.stopAudio();
    });

    expect(result.current.localStream).toBeNull();
    expect(result.current.isLocalSpeaking).toBe(false);
    expect(result.current.audioLevel).toBe(0);
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('toggles mute on local stream and tracks using toggleMute', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    expect(result.current.isMuted).toBe(false);

    act(() => {
      const nextMute = result.current.toggleMute();
      expect(nextMute).toBe(true);
    });

    expect(result.current.isMuted).toBe(true);
    expect(mockTrack.enabled).toBe(false);

    act(() => {
      const nextMute = result.current.toggleMute();
      expect(nextMute).toBe(false);
    });

    expect(result.current.isMuted).toBe(false);
    expect(mockTrack.enabled).toBe(true);
  });

  it('explicitly sets mute state using setMute', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    act(() => {
      result.current.setMute(true);
    });
    expect(result.current.isMuted).toBe(true);

    act(() => {
      result.current.setMute(false);
    });
    expect(result.current.isMuted).toBe(false);
  });

  it('subscribes and cleans up socket signaling events', () => {
    const socketRef = { current: mockSocket };
    const { unmount } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 }, enabled: true }),
    );

    expect(mockSocket.on).toHaveBeenCalledWith('webrtc:offer', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('webrtc:answer', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('webrtc:ice-candidate', expect.any(Function));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith('webrtc:offer', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('webrtc:answer', expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith('webrtc:ice-candidate', expect.any(Function));
  });

  it('creates peers when room participants are present with deterministic initiator', () => {
    const socketRef = { current: mockSocket };
    const participants = [
      { id: 'user-a', x: 200, y: 200 },
      { id: 'user-z', x: 300, y: 300 },
    ];

    // Local user is 'user-m' (between 'user-a' and 'user-z')
    // user-m > user-a -> user-a is initiator, user-m waits
    // user-m < user-z -> user-m is initiator to user-z
    const { result } = renderHook(() =>
      useWebRTC({
        socketRef,
        localUser: { id: 'user-m', x: 100, y: 100 },
        participants,
        enabled: true,
      }),
    );

    expect(result.current.manager.peers.has('user-a')).toBe(true);
    expect(result.current.manager.peers.has('user-z')).toBe(true);
  });

  it('routes incoming socket signaling events to manager handlers', () => {
    const socketHandlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      socketHandlers[event] = handler;
    });

    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 }, enabled: true }),
    );

    const handleOfferSpy = vi.spyOn(result.current.manager, 'handleOffer');
    const handleAnswerSpy = vi.spyOn(result.current.manager, 'handleAnswer');
    const handleCandidateSpy = vi.spyOn(result.current.manager, 'handleCandidate');

    act(() => {
      socketHandlers['webrtc:offer']?.({ senderId: 'u2', offer: { type: 'offer', sdp: 'sdp' } });
      socketHandlers['webrtc:answer']?.({ senderId: 'u2', answer: { type: 'answer', sdp: 'sdp' } });
      socketHandlers['webrtc:ice-candidate']?.({ senderId: 'u2', candidate: { candidate: 'c' } });
    });

    expect(handleOfferSpy).toHaveBeenCalledWith('u2', { type: 'offer', sdp: 'sdp' });
    expect(handleAnswerSpy).toHaveBeenCalledWith('u2', { type: 'answer', sdp: 'sdp' });
    expect(handleCandidateSpy).toHaveBeenCalledWith('u2', { candidate: 'c' });
  });

  it('emits outgoing signaling events over socket when manager onSignal triggers', () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 }, enabled: true }),
    );

    act(() => {
      result.current.manager.onSignal({
        type: 'offer',
        targetId: 'u2',
        offer: { sdp: 'off' },
      });
      result.current.manager.onSignal({
        type: 'answer',
        targetId: 'u2',
        answer: { sdp: 'ans' },
      });
      result.current.manager.onSignal({
        type: 'candidate',
        targetId: 'u2',
        candidate: { cand: 'ice' },
      });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('webrtc:offer', { targetId: 'u2', offer: { sdp: 'off' } });
    expect(mockSocket.emit).toHaveBeenCalledWith('webrtc:answer', { targetId: 'u2', answer: { sdp: 'ans' } });
    expect(mockSocket.emit).toHaveBeenCalledWith('webrtc:ice-candidate', { targetId: 'u2', candidate: { cand: 'ice' } });
  });

  it('updates spatial audio when localUser or participants change coordinates', () => {
    const socketRef = { current: mockSocket };
    let localUser = { id: 'u1', x: 100, y: 100 };
    let participants = [{ id: 'u2', x: 150, y: 150 }];

    const { result, rerender } = renderHook(
      ({ user, parts }) =>
        useWebRTC({ socketRef, localUser: user, participants: parts, enabled: true }),
      { initialProps: { user: localUser, parts: participants } },
    );

    const updateSpatialSpy = vi.spyOn(result.current.manager, 'updateSpatialAudio');

    localUser = { id: 'u1', x: 120, y: 120 };
    rerender({ user: localUser, parts: participants });

    expect(updateSpatialSpy).toHaveBeenCalledWith(localUser, participants);
  });

  it('only sends WebRTC offer/answers to users within 100-pixel radius and suppresses them beyond 100 pixels', () => {
    const socketRef = { current: mockSocket };
    const participants = [
      { id: 'near-peer', x: 150, y: 100 }, // dist = 50px <= 100px
      { id: 'far-peer', x: 300, y: 300 },   // dist ≈ 283px > 100px
    ];

    const { result } = renderHook(() =>
      useWebRTC({
        socketRef,
        localUser: { id: 'u1', x: 100, y: 100 },
        participants,
        enabled: true,
      }),
    );

    mockSocket.emit.mockClear();

    act(() => {
      // Near peer (50px <= 100px): must emit offer
      result.current.manager.onSignal({
        type: 'offer',
        targetId: 'near-peer',
        offer: { sdp: 'near-offer' },
      });

      // Far peer (283px > 100px): must suppress offer
      result.current.manager.onSignal({
        type: 'offer',
        targetId: 'far-peer',
        offer: { sdp: 'far-offer' },
      });

      // Near peer (50px <= 100px): must emit answer
      result.current.manager.onSignal({
        type: 'answer',
        targetId: 'near-peer',
        answer: { sdp: 'near-answer' },
      });

      // Far peer (283px > 100px): must suppress answer
      result.current.manager.onSignal({
        type: 'answer',
        targetId: 'far-peer',
        answer: { sdp: 'far-answer' },
      });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('webrtc:offer', {
      targetId: 'near-peer',
      offer: { sdp: 'near-offer' },
    });
    expect(mockSocket.emit).not.toHaveBeenCalledWith('webrtc:offer', {
      targetId: 'far-peer',
      offer: { sdp: 'far-offer' },
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('webrtc:answer', {
      targetId: 'near-peer',
      answer: { sdp: 'near-answer' },
    });
    expect(mockSocket.emit).not.toHaveBeenCalledWith('webrtc:answer', {
      targetId: 'far-peer',
      answer: { sdp: 'far-answer' },
    });
  });
});
