Week 3 Development Tasks

Task 1: Redis Setup

Install and configure Redis.

Install the Node.js Redis client.

Configure Redis connection using environment variables.

Handle Redis connection errors and reconnection.

Task 2: Socket.IO Redis Adapter

Install @socket.io/redis-adapter.

Configure Redis publisher and subscriber clients.

Connect the Redis adapter to the existing Socket.IO server.

Enable communication between multiple Socket.IO server instances.

Task 3: Multi-Instance Architecture

Run multiple Node.js backend instances.

Share Socket.IO room broadcasts across instances.

Address shared participant and room state.

Enable communication between users connected to different instances.

Task 4: WebRTC Mesh Scaling

Preserve existing WebRTC offer and answer signaling.

Support ICE candidate exchange across server instances.

Maintain proximity-based audio connections.

Avoid unnecessary peer-to-peer connections.

Preserve mute, disconnect and reconnect functionality.

Task 5: Testing and Validation

Test Redis publisher and subscriber connectivity.

Test Socket.IO communication across two backend instances.

Verify cross-instance room messaging.

Test WebRTC signaling between users connected to different instances.

Verify participant join, move and leave events.

Ensure existing proximity and audio functionality remains intact.

Task 6: Reliability and Deployment

Handle Redis connection failures.

Configure environment variables securely.

Test server reconnection and graceful shutdown.

Document the multi-instance deployment process.