// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebRTCManager,
  calculateSpatialVolume,
  calculateSpatialPan,
  calculateLinearVolume,
  calculateExponentialVolume,
  calculateInverseVolume,
  calculateSmoothstepVolume,
  calculateAirDampingCutoff,
  calculateObstacleOcclusion,
  DEFAULT_RTC_CONFIG,
  DEFAULT_SPATIAL_CONFIG,
} from './webrtcManager';

describe('Spatial Audio Math Calculations', () => {
  it('calculates full volume within minDistance', () => {
    expect(calculateSpatialVolume(0, 60, 280)).toBe(1.0);
    expect(calculateSpatialVolume(50, 60, 280)).toBe(1.0);
    expect(calculateSpatialVolume(60, 60, 280)).toBe(1.0);
  });

  it('calculates zero volume beyond maxDistance', () => {
    expect(calculateSpatialVolume(280, 60, 280)).toBe(0.0);
    expect(calculateSpatialVolume(350, 60, 280)).toBe(0.0);
  });

  it('calculates smooth linear falloff between min and max distance', () => {
    const midDistance = 60 + (280 - 60) / 2; // 170
    const volume = calculateSpatialVolume(midDistance, 60, 280);
    expect(volume).toBeCloseTo(0.5, 2);
  });

  it('handles edge case when minDistance is equal to or greater than maxDistance', () => {
    expect(calculateSpatialVolume(50, 100, 100)).toBe(1.0);
    expect(calculateSpatialVolume(100, 100, 100)).toBe(1.0);
    expect(calculateSpatialVolume(150, 100, 100)).toBe(0.0);
  });

  it('calculates stereo panning clamped to [-1, 1]', () => {
    expect(calculateSpatialPan(0, 280)).toBe(0);
    expect(calculateSpatialPan(140, 280)).toBe(0.5);
    expect(calculateSpatialPan(-140, 280)).toBe(-0.5);
    expect(calculateSpatialPan(280, 280)).toBe(1);
    expect(calculateSpatialPan(-280, 280)).toBe(-1);
    expect(calculateSpatialPan(500, 280)).toBe(1);
    expect(calculateSpatialPan(-500, 280)).toBe(-1);
  });

  it('handles invalid or zero maxDistance in calculateSpatialPan', () => {
    expect(calculateSpatialPan(100, 0)).toBe(0);
    expect(calculateSpatialPan(100, -50)).toBe(0);
  });

  it('calculates exponential drop-off with smooth perceptual curvature', () => {
    expect(calculateExponentialVolume(0, 60, 280)).toBe(1.0);
    expect(calculateExponentialVolume(60, 60, 280)).toBe(1.0);
    expect(calculateExponentialVolume(280, 60, 280)).toBe(0.0);
    expect(calculateExponentialVolume(300, 60, 280)).toBe(0.0);

    const mid = calculateExponentialVolume(170, 60, 280, 2.5);
    // Exponential falloff drops faster initially than linear (which is 0.5)
    expect(mid).toBeLessThan(0.5);
    expect(mid).toBeGreaterThan(0.2);
  });

  it('calculates inverse distance drop-off modeling physical 1/r wave expansion', () => {
    expect(calculateInverseVolume(50, 60, 280)).toBe(1.0);
    expect(calculateInverseVolume(60, 60, 280)).toBe(1.0);
    expect(calculateInverseVolume(280, 60, 280)).toBe(0.0);

    const mid = calculateInverseVolume(170, 60, 280, 1.0);
    expect(mid).toBeLessThan(0.5);
    expect(mid).toBeGreaterThan(0.25);
  });

  it('calculates smoothstep S-curve with zero derivative at boundaries', () => {
    expect(calculateSmoothstepVolume(50, 60, 280)).toBe(1.0);
    expect(calculateSmoothstepVolume(60, 60, 280)).toBe(1.0);
    expect(calculateSmoothstepVolume(280, 60, 280)).toBe(0.0);

    const mid = calculateSmoothstepVolume(170, 60, 280);
    expect(mid).toBeCloseTo(0.5, 2);
  });

  it('dispatches calculateSpatialVolume correctly with options object and model names', () => {
    const lin = calculateSpatialVolume(170, { minDistance: 60, maxDistance: 280, attenuationModel: 'linear' });
    expect(lin).toBeCloseTo(0.5, 2);

    const exp = calculateSpatialVolume(170, { minDistance: 60, maxDistance: 280, attenuationModel: 'exponential' });
    expect(exp).toBeLessThan(0.5);

    const inv = calculateSpatialVolume(170, { minDistance: 60, maxDistance: 280, attenuationModel: 'inverse' });
    expect(inv).toBeLessThan(0.5);

    const sm = calculateSpatialVolume(170, { minDistance: 60, maxDistance: 280, attenuationModel: 'smoothstep' });
    expect(sm).toBeCloseTo(0.5, 2);
  });

  it('calculates acoustic air damping cutoff frequency over distance', () => {
    expect(calculateAirDampingCutoff(50, 60, 280)).toBe(20000);
    expect(calculateAirDampingCutoff(60, 60, 280)).toBe(20000);
    expect(calculateAirDampingCutoff(280, 60, 280)).toBe(1000);
    expect(calculateAirDampingCutoff(350, 60, 280)).toBe(1000);

    const midCutoff = calculateAirDampingCutoff(170, 60, 280);
    expect(midCutoff).toBeLessThan(20000);
    expect(midCutoff).toBeGreaterThan(1000);
  });

  it('calculates obstacle occlusion when partition walls block line of sight', () => {
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 400, y: 100 };
    const wall = [{ x: 250, y: 50, width: 20, height: 100 }];

    // Direct line between (100, 100) and (400, 100) passes through wall at x=250..270, y=50..150
    expect(calculateObstacleOcclusion(p1, p2, wall, 0.5)).toBe(0.5);

    // If wall is far away, no obstruction
    const farWall = [{ x: 500, y: 500, width: 20, height: 100 }];
    expect(calculateObstacleOcclusion(p1, p2, farWall, 0.5)).toBe(1.0);

    // Empty obstacles
    expect(calculateObstacleOcclusion(p1, p2, [])).toBe(1.0);
  });
});

describe('WebRTCManager Core Audio & Peer Management', () => {
  let mockAudioTrack;
  let mockMediaStream;
  let mockPeerConnection;
  let mockAudioContext;
  let mockGainNode;
  let mockFilterNode;
  let mockPannerNode;
  let mockAnalyserNode;
  let mockSourceNode;

  beforeEach(() => {
    vi.useFakeTimers();

    mockAudioTrack = {
      kind: 'audio',
      enabled: true,
      stop: vi.fn(),
    };

    mockMediaStream = {
      getTracks: vi.fn(() => [mockAudioTrack]),
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
    };

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic-1', label: 'Internal Mic' },
        ]),
      },
      writable: true,
      configurable: true,
    });

    // Mock Web Audio API
    mockGainNode = {
      gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockFilterNode = {
      type: 'lowpass',
      frequency: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockPannerNode = {
      pan: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAnalyserNode = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn((buf) => buf.fill(50)), // Simulates sound
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createMediaStreamSource: vi.fn(() => mockSourceNode),
      createBiquadFilter: vi.fn(() => mockFilterNode),
      createGain: vi.fn(() => mockGainNode),
      createStereoPanner: vi.fn(() => mockPannerNode),
      createAnalyser: vi.fn(() => mockAnalyserNode),
    };

    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

    // Mock RTCPeerConnection
    mockPeerConnection = {
      addTrack: vi.fn(),
      getSenders: vi.fn(() => []),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
      createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
      setLocalDescription: vi.fn().mockImplementation(async (desc) => {
        mockPeerConnection.localDescription = desc;
      }),
      setRemoteDescription: vi.fn().mockImplementation(async (desc) => {
        mockPeerConnection.remoteDescription = desc;
      }),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      connectionState: 'new',
      onicecandidate: null,
      ontrack: null,
      onconnectionstatechange: null,
    };

    global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPeerConnection);

    window.AudioContext = global.AudioContext;
    window.RTCPeerConnection = global.RTCPeerConnection;
    window.RTCSessionDescription = vi.fn().mockImplementation((desc) => desc);
    window.RTCIceCandidate = vi.fn().mockImplementation((cand) => cand);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with default options and allows setting localUserId', () => {
    const manager = new WebRTCManager({ localUserId: 'user-1' });
    expect(manager.rtcConfig).toEqual(DEFAULT_RTC_CONFIG);
    expect(manager.spatialConfig).toEqual(DEFAULT_SPATIAL_CONFIG);
    expect(manager.localUserId).toBe('user-1');

    manager.setLocalUserId('user-2');
    expect(manager.localUserId).toBe('user-2');

    manager.destroy();
  });

  it('resumes audioContext if it was suspended when getAudioContext is called', () => {
    mockAudioContext.state = 'suspended';
    const manager = new WebRTCManager();
    const ctx = manager.getAudioContext();

    expect(ctx).toBe(mockAudioContext);
    expect(mockAudioContext.resume).toHaveBeenCalled();

    manager.destroy();
  });

  it('throws and triggers onError when getUserMedia is not supported', async () => {
    const errorHandler = vi.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const manager = new WebRTCManager({ onError: errorHandler });
    await expect(manager.startLocalAudio()).rejects.toThrow(/not supported/i);
    expect(errorHandler).toHaveBeenCalled();

    manager.destroy();
  });

  it('initializes local audio stream with getUserMedia constraints and sets up VAD', async () => {
    const speakingHandler = vi.fn();
    const manager = new WebRTCManager({ onLocalSpeaking: speakingHandler });
    const stream = await manager.startLocalAudio({ echoCancellation: false });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: true,
      }),
      video: false,
    });

    expect(stream).toBe(mockMediaStream);
    expect(manager.localStream).toBe(mockMediaStream);
    expect(manager.isMuted).toBe(false);

    // Fast-forward timer to verify VAD interval triggers speaking
    vi.advanceTimersByTime(150);
    expect(speakingHandler).toHaveBeenCalledWith(true, expect.any(Number));

    manager.destroy();
  });

  it('replaces audio track on existing peer connections when new stream is started', async () => {
    const manager = new WebRTCManager();
    const mockSender = {
      track: { kind: 'audio' },
      replaceTrack: vi.fn().mockResolvedValue(undefined),
    };
    mockPeerConnection.getSenders.mockReturnValue([mockSender]);

    manager.createPeer('peer-existing', false);
    await manager.startLocalAudio();

    expect(mockSender.replaceTrack).toHaveBeenCalledWith(mockAudioTrack);
    manager.destroy();
  });

  it('mutes and unmutes local audio tracks correctly and turns off VAD', async () => {
    const speakingHandler = vi.fn();
    const manager = new WebRTCManager({ onLocalSpeaking: speakingHandler });
    await manager.startLocalAudio();

    expect(mockAudioTrack.enabled).toBe(true);

    // Trigger speaking
    vi.advanceTimersByTime(150);
    expect(speakingHandler).toHaveBeenCalledWith(true, expect.any(Number));

    // Mute
    manager.setMute(true);
    expect(manager.isMuted).toBe(true);
    expect(mockAudioTrack.enabled).toBe(false);
    expect(speakingHandler).toHaveBeenCalledWith(false, 0);

    // Advance time while muted, should stay silent
    speakingHandler.mockClear();
    vi.advanceTimersByTime(200);
    expect(speakingHandler).not.toHaveBeenCalledWith(true, expect.any(Number));

    // Unmute
    manager.setMute(false);
    expect(manager.isMuted).toBe(false);
    expect(mockAudioTrack.enabled).toBe(true);

    manager.destroy();
  });

  it('throws and triggers onError when RTCPeerConnection is unsupported', () => {
    const errorHandler = vi.fn();
    global.RTCPeerConnection = undefined;

    const manager = new WebRTCManager({ onError: errorHandler });
    expect(() => manager.createPeer('peer-1')).toThrow(/not supported/i);
    expect(errorHandler).toHaveBeenCalled();

    manager.destroy();
  });

  it('creates peer connections and initiates offers when isInitiator is true', async () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });
    await manager.startLocalAudio();

    const peer = manager.createPeer('peer-david', true);

    expect(global.RTCPeerConnection).toHaveBeenCalled();
    expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockAudioTrack, mockMediaStream);
    expect(peer.peerId).toBe('peer-david');

    await Promise.resolve();
    await Promise.resolve();

    expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    expect(signalHandler).toHaveBeenCalledWith({
      type: 'offer',
      targetId: 'peer-david',
      offer: { type: 'offer', sdp: 'mock-offer-sdp' },
    });

    manager.destroy();
  });

  it('triggers onSignal with ice candidate when onicecandidate fires', () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });
    manager.createPeer('peer-alex', false);

    expect(typeof mockPeerConnection.onicecandidate).toBe('function');
    mockPeerConnection.onicecandidate({ candidate: { candidate: 'cand-123' } });

    expect(signalHandler).toHaveBeenCalledWith({
      type: 'candidate',
      targetId: 'peer-alex',
      candidate: { candidate: 'cand-123' },
    });

    manager.destroy();
  });

  it('attaches remote stream and notifies onRemoteStream when ontrack fires', () => {
    const remoteStreamHandler = vi.fn();
    const remoteSpeakingHandler = vi.fn();
    const manager = new WebRTCManager({
      onRemoteStream: remoteStreamHandler,
      onRemoteSpeaking: remoteSpeakingHandler,
    });
    manager.createPeer('peer-mia', false);

    const mockRemoteTrack = { kind: 'audio' };
    const mockRemoteStream = { id: 'stream-remote' };

    mockPeerConnection.ontrack({
      streams: [mockRemoteStream],
      track: mockRemoteTrack,
    });

    expect(remoteStreamHandler).toHaveBeenCalledWith('peer-mia', mockRemoteStream);

    // Advance time for remote VAD interval
    vi.advanceTimersByTime(250);
    expect(remoteSpeakingHandler).toHaveBeenCalledWith('peer-mia', true, expect.any(Number));

    manager.destroy();
  });

  it('handles peer connection state changes and removes peer on failed or closed', () => {
    const stateHandler = vi.fn();
    const manager = new WebRTCManager({ onPeerConnectionChange: stateHandler });
    manager.createPeer('peer-temp', false);

    mockPeerConnection.connectionState = 'connected';
    mockPeerConnection.onconnectionstatechange();
    expect(stateHandler).toHaveBeenCalledWith('peer-temp', 'connected');
    expect(manager.peers.has('peer-temp')).toBe(true);

    mockPeerConnection.connectionState = 'failed';
    mockPeerConnection.onconnectionstatechange();
    expect(stateHandler).toHaveBeenCalledWith('peer-temp', 'failed');
    expect(manager.peers.has('peer-temp')).toBe(false);

    manager.destroy();
  });

  it('handles remote offer and returns generated answer via signaling callback', async () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });

    await manager.handleOffer('peer-alex', { type: 'offer', sdp: 'incoming-sdp' });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'offer',
      sdp: 'incoming-sdp',
    });
    expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    expect(signalHandler).toHaveBeenCalledWith({
      type: 'answer',
      targetId: 'peer-alex',
      answer: { type: 'answer', sdp: 'mock-answer-sdp' },
    });

    manager.destroy();
  });

  it('handles remote answer and sets remote description', async () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-alex', false);

    await manager.handleAnswer('peer-alex', { type: 'answer', sdp: 'response-sdp' });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'answer',
      sdp: 'response-sdp',
    });

    manager.destroy();
  });

  it('queues ICE candidates until remoteDescription is set, then drains them', async () => {
    const manager = new WebRTCManager();
    const peer = manager.createPeer('peer-marcus', false);

    await manager.handleCandidate('peer-marcus', { candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(1);
    expect(mockPeerConnection.addIceCandidate).not.toHaveBeenCalled();

    await manager.handleOffer('peer-marcus', { type: 'offer', sdp: 'offer-sdp' });
    expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({ candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(0);

    manager.destroy();
  });

  it('updates spatial audio gain and panner based on 2D avatar distance', () => {
    const manager = new WebRTCManager({
      spatialConfig: { minDistance: 60, maxDistance: 280, panEnabled: true },
    });
    manager.getAudioContext();
    manager.createPeer('peer-bob', false);

    // Setup remote audio nodes manually
    mockPeerConnection.ontrack({
      streams: [{ id: 'stream-bob' }],
      track: { kind: 'audio' },
    });

    // Local user at (100, 100), Peer Bob at (200, 100) -> dx = 100, dy = 0, dist = 100
    manager.updateSpatialAudio({ x: 100, y: 100 }, [{ id: 'peer-bob', x: 200, y: 100 }]);

    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockAudioContext.currentTime,
    );
    expect(mockPannerNode.pan.setValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockAudioContext.currentTime,
    );
    expect(mockFilterNode.frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockAudioContext.currentTime,
    );

    manager.destroy();
  });

  it('hooks WebRTC incoming audio track into complete Web Audio API pipeline with lowpass damping', () => {
    const manager = new WebRTCManager({
      spatialConfig: { minDistance: 60, maxDistance: 280, airDamping: true, panEnabled: true },
    });
    manager.getAudioContext();
    manager.createPeer('peer-charlie', false);

    mockPeerConnection.ontrack({
      streams: [{ id: 'stream-charlie' }],
      track: { kind: 'audio' },
    });

    const peer = manager.peers.get('peer-charlie');
    expect(peer.sourceNode).toBeDefined();
    expect(peer.filterNode).toBeDefined();
    expect(peer.gainNode).toBeDefined();
    expect(peer.pannerNode).toBeDefined();
    expect(peer.analyserNode).toBeDefined();

    // Verify chain connectivity: source -> filter -> gain -> panner -> analyser
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockFilterNode);
    expect(mockFilterNode.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockPannerNode);
    expect(mockPannerNode.connect).toHaveBeenCalledWith(mockAnalyserNode);
    expect(mockAnalyserNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);

    manager.destroy();
  });

  it('applies obstacle occlusion and attenuates sound when walls are in line-of-sight', () => {
    const manager = new WebRTCManager({
      spatialConfig: { minDistance: 60, maxDistance: 280, occlusionEnabled: true },
    });
    manager.getAudioContext();
    manager.createPeer('peer-alice', false);

    mockPeerConnection.ontrack({
      streams: [{ id: 'stream-alice' }],
      track: { kind: 'audio' },
    });

    const obstacles = [{ x: 150, y: 50, width: 20, height: 100 }];
    // Local user at (100, 100), Alice at (200, 100) -> line crosses obstacle
    manager.updateSpatialAudio({ x: 100, y: 100 }, [{ id: 'peer-alice', x: 200, y: 100 }], obstacles);

    const peer = manager.peers.get('peer-alice');
    expect(peer.isOccluded).toBe(true);

    manager.destroy();
  });

  it('updates spatial config dynamically at runtime', () => {
    const manager = new WebRTCManager();
    expect(manager.spatialConfig.attenuationModel).toBe('linear');

    manager.updateSpatialConfig({ attenuationModel: 'exponential', minDistance: 80 });
    expect(manager.spatialConfig.attenuationModel).toBe('exponential');
    expect(manager.spatialConfig.minDistance).toBe(80);

    manager.destroy();
  });

  it('safely ignores updateSpatialAudio when position is invalid', () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-bob', false);

    expect(() => manager.updateSpatialAudio(null, [])).not.toThrow();
    expect(() => manager.updateSpatialAudio({ x: NaN, y: 100 }, [])).not.toThrow();

    manager.destroy();
  });

  it('removes peer and closes RTCPeerConnection cleanly', () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-oliver', false);
    expect(manager.peers.has('peer-oliver')).toBe(true);

    manager.removePeer('peer-oliver');
    expect(mockPeerConnection.close).toHaveBeenCalled();
    expect(manager.peers.has('peer-oliver')).toBe(false);

    manager.destroy();
  });

  it('stops local audio and releases media tracks on destroy', async () => {
    const manager = new WebRTCManager();
    await manager.startLocalAudio();

    manager.destroy();
    expect(mockAudioTrack.stop).toHaveBeenCalled();
    expect(manager.localStream).toBeNull();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('audio check: demonstrates two browsers successfully establishing a WebRTC audio connection via signaling', async () => {
    function createMockPC() {
      const pc = {
        addTrack: vi.fn(),
        getSenders: vi.fn(() => []),
        createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
        createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
        setLocalDescription: vi.fn().mockImplementation(async (desc) => {
          pc.localDescription = desc;
        }),
        setRemoteDescription: vi.fn().mockImplementation(async (desc) => {
          pc.remoteDescription = desc;
        }),
        addIceCandidate: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
        connectionState: 'new',
        onicecandidate: null,
        ontrack: null,
        onconnectionstatechange: null,
      };
      return pc;
    }

    const pcA = createMockPC();
    const pcB = createMockPC();
    let instanceCount = 0;
    global.RTCPeerConnection = vi.fn().mockImplementation(() => {
      instanceCount++;
      return instanceCount === 1 ? pcA : pcB;
    });
    window.RTCPeerConnection = global.RTCPeerConnection;

    const signalingServer = {
      relay: (payload) => {
        if (payload.targetId === 'browser-b') {
          if (payload.type === 'offer') browserB.handleOffer('browser-a', payload.offer);
          if (payload.type === 'answer') browserB.handleAnswer('browser-a', payload.answer);
          if (payload.type === 'candidate') browserB.handleCandidate('browser-a', payload.candidate);
        } else if (payload.targetId === 'browser-a') {
          if (payload.type === 'offer') browserA.handleOffer('browser-b', payload.offer);
          if (payload.type === 'answer') browserA.handleAnswer('browser-b', payload.answer);
          if (payload.type === 'candidate') browserA.handleCandidate('browser-b', payload.candidate);
        }
      },
    };

    const browserA = new WebRTCManager({
      localUserId: 'browser-a',
      onSignal: (payload) => signalingServer.relay(payload),
    });

    const browserB = new WebRTCManager({
      localUserId: 'browser-b',
      onSignal: (payload) => signalingServer.relay(payload),
    });

    // 1. Both browsers capture microphone audio using getUserMedia
    await browserA.startLocalAudio();
    await browserB.startLocalAudio();

    expect(browserA.localStream).toBe(mockMediaStream);
    expect(browserB.localStream).toBe(mockMediaStream);

    // 2. Browser A creates peer and initiates offer to Browser B
    browserA.createPeer('browser-b', true);
    await Promise.resolve();
    await Promise.resolve();

    // 3. Both peer instances are created and active
    expect(browserA.peers.has('browser-b')).toBe(true);
    expect(browserB.peers.has('browser-a')).toBe(true);

    // 4. Simulate track exchange (ontrack fires on both sides)
    const remoteStreamA = { id: 'stream-from-a' };
    const remoteStreamB = { id: 'stream-from-b' };

    browserA.peers.get('browser-b').pc.ontrack({
      streams: [remoteStreamB],
      track: { kind: 'audio' },
    });

    browserB.peers.get('browser-a').pc.ontrack({
      streams: [remoteStreamA],
      track: { kind: 'audio' },
    });

    expect(browserA.peers.get('browser-b').remoteStream).toBe(remoteStreamB);
    expect(browserB.peers.get('browser-a').remoteStream).toBe(remoteStreamA);

    browserA.destroy();
    browserB.destroy();
  });
});
