# ProxiSpeak — WebRTC Integration

## Objective
Establish peer-to-peer audio connections between browsers.

## Planned Implementation
- Capture microphone audio using `getUserMedia()`.
- Create peer connections using `RTCPeerConnection`.
- Exchange offers, answers, and ICE candidates through Socket.IO.
- Receive and play remote audio streams.
- Connect nearby participants within the 100-pixel hearing radius.
- Adjust audio volume according to participant distance.
- Handle mute, leave, disconnect, and reconnection events.
- Test audio communication using two browser sessions.

## Testing Plan
- Verify microphone permissions.
- Test two-way audio between browsers.
- Confirm proximity-based audio behavior.
- Test connection failures and cleanup.

## Status
Planning documented. Implementation and testing are the next steps.
