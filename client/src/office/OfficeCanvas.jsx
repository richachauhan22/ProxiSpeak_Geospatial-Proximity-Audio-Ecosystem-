
import { useEffect, useRef } from 'react';
import { OfficeRenderer } from './OfficeRenderer';
import { MovementController } from './MovementController';
import { OFFICE_DIMENSIONS, OFFICE_OBSTACLES } from './OfficeMap';
import { sounds } from '../services/soundEffects';
import { getNearbyParticipants } from './proximity';

export default function OfficeCanvas({
  localUser,
  participants,
  nearbyParticipants,
  onLocalMove,
  zoom = 100,
  panX = 0,
  panY = 0,
  onPanChange,
  recenterTrigger = 0,
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const movementRef = useRef(null);
  const movementPositionRef = useRef(null);
  const movementUserIdRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const lastTimeRef = useRef(0);
  const renderRef = useRef(null);
  const panRef = useRef({ x: panX, y: panY });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedDragRef = useRef(false);
  const nearbyUsersRef = useRef(new Set());

  const latestPropsRef = useRef({
    localUser,
    participants,
    nearbyParticipants,
    onLocalMove,
    zoom,
  });

  latestPropsRef.current = {
    localUser,
    participants,
    nearbyParticipants,
    onLocalMove,
    zoom,
  };

  // Recenter the office view when requested
  useEffect(() => {
    if (recenterTrigger > 0 && onPanChange) {
      onPanChange(0, 0);
      panRef.current = { x: 0, y: 0 };
    }
  }, [recenterTrigger, onPanChange]);

  useEffect(() => {
    panRef.current = { x: panX, y: panY };
  }, [panX, panY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      renderRef.current = new OfficeRenderer({
        ctx: context,
        width: rect.width,
        height: rect.height,
        zoom: latestPropsRef.current.zoom,
        panX: panRef.current.x,
        panY: panRef.current.y,
      });
    };

    resizeCanvas();

    movementRef.current = new MovementController({
      avatarRadius: 28,
      speed: 260,
      worldWidth: OFFICE_DIMENSIONS.width,
      worldHeight: OFFICE_DIMENSIONS.height,
      obstacles: OFFICE_OBSTACLES,
    });

    movementUserIdRef.current = localUser?.id || null;
    movementPositionRef.current = localUser
      ? { x: localUser.x, y: localUser.y }
      : null;

    const handleKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      movementRef.current?.handleKeyDown(event);
    };

    const handleKeyUp = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      movementRef.current?.handleKeyUp(event);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Pointer events: click to move, drag to pan
    const handlePointerDown = (event) => {
      isDraggingRef.current = true;
      hasMovedDragRef.current = false;
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    const handlePointerMove = (event) => {
      if (!isDraggingRef.current) return;

      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;

      if (Math.hypot(dx, dy) > 5) {
        hasMovedDragRef.current = true;

        panRef.current = {
          x: panRef.current.x + dx,
          y: panRef.current.y + dy,
        };

        dragStartRef.current = {
          x: event.clientX,
          y: event.clientY,
        };

        onPanChange?.(panRef.current.x, panRef.current.y);
      }
    };

    const handlePointerUp = (event) => {
      if (!hasMovedDragRef.current && isDraggingRef.current) {
        const rect = canvas.getBoundingClientRect();
        const scale = renderRef.current?.scale || 1;
        const offsetX = renderRef.current?.offsetX || 0;
        const offsetY = renderRef.current?.offsetY || 0;

        const worldX =
          (event.clientX - rect.left - offsetX) / scale;
        const worldY =
          (event.clientY - rect.top - offsetY) / scale;

        movementRef.current?.setTarget(worldX, worldY);
        sounds.playClick();
      }

      isDraggingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const renderFrame = (timestamp) => {
      const deltaSeconds = Math.min(
        (timestamp - lastTimeRef.current) / 1000 || 0.016,
        0.05
      );

      lastTimeRef.current = timestamp;

      const {
        localUser: currentUser,
        participants: currentParticipants,
        nearbyParticipants: currentNearbyParticipants,
        onLocalMove: moveUser,
      } = latestPropsRef.current;

      if (currentUser?.id !== movementUserIdRef.current) {
        movementUserIdRef.current = currentUser?.id || null;

        movementPositionRef.current = currentUser
          ? { x: currentUser.x, y: currentUser.y }
          : null;
      }

      if (currentUser && movementPositionRef.current) {
        const updated = movementRef.current.update(
          movementPositionRef.current,
          deltaSeconds
        );

        movementPositionRef.current = updated;

        // Play a chime when a participant enters the 100-pixel range.
        // Fall back to the utility here if App.jsx has not passed the list.
        const nearbyList = Array.isArray(currentNearbyParticipants)
          ? currentNearbyParticipants
          : getNearbyParticipants(currentUser, currentParticipants || []);

        const nearby = new Set(
          nearbyList.map((participant) => participant.id)
        );

        nearby.forEach((participantId) => {
          if (!nearbyUsersRef.current.has(participantId)) {
            sounds.playProximityChime();
          }
        });

        nearbyUsersRef.current = nearby;

        if (
          moveUser &&
          (updated.x !== currentUser.x || updated.y !== currentUser.y) &&
          timestamp - lastBroadcastRef.current >= 60
        ) {
          lastBroadcastRef.current = timestamp;
          moveUser(updated);
        }
      }

      if (renderRef.current) {
        const rect = canvas.getBoundingClientRect();

        renderRef.current.width = rect.width;
        renderRef.current.height = rect.height;
        renderRef.current.zoom = latestPropsRef.current.zoom;
        renderRef.current.panX = panRef.current.x;
        renderRef.current.panY = panRef.current.y;

        renderRef.current.scale =
          Math.min(
            rect.width / OFFICE_DIMENSIONS.width,
            rect.height / OFFICE_DIMENSIONS.height
          ) * (latestPropsRef.current.zoom / 100);

        renderRef.current.offsetX =
          (rect.width -
            OFFICE_DIMENSIONS.width * renderRef.current.scale) /
            2 +
          panRef.current.x;

        renderRef.current.offsetY =
          (rect.height -
            OFFICE_DIMENSIONS.height * renderRef.current.scale) /
            2 +
          panRef.current.y;

        const displayUser =
          currentUser && movementPositionRef.current
            ? { ...currentUser, ...movementPositionRef.current }
            : null;

        renderRef.current.drawScene(
          displayUser,
          currentParticipants || [],
          deltaSeconds,
          movementRef.current?.target
        );
      }

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="office-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="office-canvas"
        aria-label="ProxiSpeak virtual office floor"
      />
    </div>
  );
}
