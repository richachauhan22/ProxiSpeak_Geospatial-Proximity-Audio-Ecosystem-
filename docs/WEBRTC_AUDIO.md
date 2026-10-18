# ProxiSpeak WebRTC Peer-to-Peer Spatial Audio Documentation

This document provides a comprehensive technical overview of the WebRTC peer-to-peer audio architecture, browser audio capture (`getUserMedia`), signaling protocol, voice activity detection, and 2D spatial audio attenuation implemented in ProxiSpeak.

---

## 🎧 Architecture Overview

ProxiSpeak uses a decentralized peer-to-peer (P2P) mesh topology for real-time voice communication, coordinated via a centralized Socket.io signaling layer. Audio streams are spatialized dynamically in the client's Web Audio API graph based on the relative Cartesian distance between avatars in the virtual office.

```
                    ┌────────────────────────────┐
                    │  Socket.io Signaling Relay │
                    │     (Express / Node.js)    │
                    └─────────────┬──────────────┘
                                  │
                 Signaling events │ (Offer / Answer / ICE)
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
┌───────┴────────┐                                ┌────────┴───────┐
│   Client A     │ ◄════════════════════════════► │    Client B    │
│  (Local User)  │     Direct P2P Audio Track     │  (Remote Peer) │
│                │     via RTCPeerConnection      │                │
└────────────────┘                                └────────────────┘
```

---

## 🎤 1. Local Microphone Capture (`getUserMedia`)

Local audio capture is managed by `WebRTCManager` (`client/src/services/webrtcManager.js`) and accessed by the `useWebRTC` React hook (`client/src/hooks/useWebRTC.js`).

### Audio Constraints
```javascript
const constraints = {
  audio: {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: false,
};
```

### Features:
- **Automatic Track Management**: Audio tracks are extracted from the `MediaStream` and added to all active `RTCPeerConnection` instances.
- **Hardware-level Muting**: Toggling mute enables or disables the audio track (`track.enabled = !isMuted`), preventing sensitive audio from leaving the browser.
- **Permission Lifecycle**: Tracks states (`'idle'`, `'prompt'`, `'granted'`, `'denied'`, `'unsupported'`) and provides user-friendly browser permission guidance in the UI.

---

## 🔄 2. WebRTC Signaling Protocol

Since WebRTC cannot establish direct P2P connections without exchanging session metadata, ProxiSpeak utilizes Socket.io to relay Session Description Protocol (SDP) and Interactive Connectivity Establishment (ICE) candidates between peers.

### STUN Configuration
```javascript
export const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};
```

### Signaling Message Flow
1. **Join Notification**: When User A enters the office, existing participants are received in `office:joined`.
2. **Deterministic Initiator**: To avoid call collisions (glare), the peer with the lexicographically smaller ID initiates the connection:
   ```javascript
   const isInitiator = localUserId < peerId;
   manager.createPeer(peerId, isInitiator);
   ```
3. **Offer Creation**: Initiator calls `pc.createOffer()`, sets `localDescription`, and emits `webrtc:offer` to the server:
   ```json
   {
     "targetId": "user-david",
     "offer": { "type": "offer", "sdp": "..." }
   }
   ```
4. **Relay**: The server routes the payload to David's socket:
   ```javascript
   io.to(targetSocketId).emit('webrtc:offer', { senderId, offer });
   ```
5. **Answer Creation**: David sets `remoteDescription`, creates answer via `pc.createAnswer()`, sets `localDescription`, and emits `webrtc:answer`.
6. **ICE Candidates**: Both peers exchange ICE candidates via `webrtc:ice-candidate`. If candidates arrive before `remoteDescription` is set, they are queued and drained automatically once the description is ready.

---

## 🗣️ 3. Voice Activity Detection (VAD)

ProxiSpeak includes client-side Voice Activity Detection using the Web Audio API without requiring external heavy models.

```
MediaStream ──► MediaStreamAudioSourceNode ──► AnalyserNode (fftSize 256)
                                                     │
                                                     ▼
                                            ByteFrequencyData
                                            Volume > Threshold?
                                            ├── Yes: isSpeaking = true
                                            └── No:  isSpeaking = false
```

- **Local Speaking Feedback**: When talking, the user's avatar displays an active orange voice arc, and the bottom toolbar renders animated green equalizer waves.
- **Remote Speaking Feedback**: Remote incoming streams are routed through per-peer `AnalyserNode` instances so nearby speaking colleagues light up visually in real time.

---

## 🌐 4. 2D Spatial Audio Attenuation & Stereo Panning

ProxiSpeak simulates realistic proximity audio falloff on the virtual office floor (1440 × 894 px canvas).

### Falloff Parameters:
- **Min Distance (`minDistance`)**: 60px (full volume, $1.0$).
- **Max Distance (`maxDistance`)**: 280px (silent beyond this threshold, $0.0$).
- **Smooth Linear Falloff Curve**:
  $$\text{Volume}(d) = \begin{cases} 1.0 & \text{if } d \le 60 \\ 0.0 & \text{if } d \ge 280 \\ 1.0 - \frac{d - 60}{280 - 60} & \text{otherwise} \end{cases}$$

### Stereo Panning ($[-1, 1]$):
$$\text{Pan}(\Delta x) = \max\left(-1, \min\left(1, \frac{\Delta x}{280}\right)\right)$$
Where $\Delta x = x_{\text{peer}} - x_{\text{local}}$. A teammate to the user's left sounds in the left headphone channel, while one to the right sounds in the right channel.

### Web Audio Routing Graph:
```
Remote MediaStream ──► MediaStreamAudioSourceNode
                             │
                             ▼
                         GainNode (Dynamic Distance Volume)
                             │
                             ▼
                     StereoPannerNode (Left/Right Directional Pan)
                             │
                             ▼
                         AnalyserNode (Remote VAD Indicator)
                             │
                             ▼
                     audioContext.destination (Speakers / Headphones)
```

---

## 🎛️ 5. Frontend Components & User Controls

| Component | Responsibility |
|---|---|
| [`WebRTCManager`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/services/webrtcManager.js) | Native WebRTC and Web Audio orchestration class. |
| [`useWebRTC`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/hooks/useWebRTC.js) | Custom React hook binding WebRTC state to React rendering lifecycle. |
| [`BottomToolbar`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/components/BottomToolbar.jsx) | Microphone toggle, real-time audio activity meter, mute states, and permission alerts. |
| [`SettingsModal`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/components/OfficeModals.jsx) | Input microphone device selector, live input test level bar, and proximity falloff distance slider (100px - 400px). |
| [`OfficeCanvas`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/office/OfficeCanvas.jsx) | 2D canvas drawing avatars with orange voice activity halos and muted badges. |

---

## 🧪 6. Testing & Quality Assurance

The WebRTC audio pipeline is verified via comprehensive unit tests in Vitest:
- [`webrtcManager.test.js`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/services/webrtcManager.test.js):
  - Spatial volume boundary & falloff math
  - Stereo pan boundary clamping
  - `getUserMedia` constraints verification
  - Track-level mute/unmute execution
  - Offer/answer handshake generation
  - ICE candidate queue buffering & draining
  - Clean peer and stream destruction
- [`useWebRTC.test.js`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/hooks/useWebRTC.test.js):
  - React hook mount/unmount lifecycles
  - Audio permission state transitions
  - Socket signaling listener binding & cleanup
