import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWebRTC } from './useWebRTC';

describe('useWebRTC React Hook', () => {
  let mockTrack;
  let mockStream;
  let mockSocket;

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

    global.RTCPeerConnection = vi.fn().mockImplementation(() => ({
      addTrack: vi.fn(),
      getSenders: vi.fn(() => []),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'test-sdp' }),
      setLocalDescription: vi.fn(),
      setRemoteDescription: vi.fn(),
      addIceCandidate: vi.fn(),
      close: vi.fn(),
      connectionState: 'new',
    }));
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
    expect(result.current.permissionStatus).toBe('idle');
  });

  it('starts audio successfully and sets permission to granted', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(result.current.localStream).toBe(mockStream);
    expect(result.current.permissionStatus).toBe('granted');
  });

  it('handles permission denial gracefully', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
    );

    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    expect(result.current.permissionStatus).toBe('denied');
    expect(result.current.webrtcError).toMatch(/permission was denied/i);
  });

  it('toggles mute on local stream and tracks', async () => {
    const socketRef = { current: mockSocket };
    const { result } = renderHook(() =>
      useWebRTC({ socketRef, localUser: { id: 'u1', x: 100, y: 100 } }),
    );

    await act(async () => {
      await result.current.startAudio();
    });

    expect(result.current.isMuted).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(true);
    expect(mockTrack.enabled).toBe(false);

    act(() => {
      result.current.toggleMute();
    });

    expect(result.current.isMuted).toBe(false);
    expect(mockTrack.enabled).toBe(true);
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
});
