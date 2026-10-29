import { useEffect, useRef, useState } from 'react';
import { OfficeRenderer } from './OfficeRenderer';
import { MovementController } from './MovementController';
import { OFFICE_DIMENSIONS, OFFICE_OBSTACLES } from './OfficeMap';
import { OFFICE_ZONES, getNearbyObject } from './zones.js'; // <--- WEEK 3
import { sounds } from '../services/soundEffects';

export default function OfficeCanvas({
  localUser,
  participants,
  onLocalMove,
  onZoneChange, // <--- WEEK 3: Notifies parent when entering/leaving a room
  onInteract,   // <--- WEEK 3: Triggered when pressing [E] near an object
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
    onLocalMove,
    onZoneChange,
    onInteract,
    zoom,
  });
  latestPropsRef.current = {
    localUser,
    participants,
    onLocalMove,
    onZoneChange,
    onInteract,
    zoom,
  };

  // Recenter on local user if requested
  useEffect(() => {
    if (recenterTrigger > 0 && onPanChange) {
      onPanChange(0, 0);
      panRef.current = { x: 0, y: 0 };
    }
  }, [recenterTrigger]);

  useEffect(() => {
    panRef.current = { x: panX, y: panY };
  }, [panX, panY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');

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

    // ==========================================
    // WEEK 3: Initialize Movement with Zone detection
    // ==========================================
    movementRef.current = new MovementController({
      avatarRadius: 28,
      speed: 260,
      worldWidth: OFFICE_DIMENSIONS.width,
      worldHeight: OFFICE_DIMENSIONS.height,
      obstacles: OFFICE_OBSTACLES,
      onZoneChange: ({ zoneId, zone }) => {
        if (latestPropsRef.current.onZoneChange) {
          latestPropsRef.current.onZoneChange(zoneId, zone);
        }
        sounds?.playProximityChime?.(); // Play subtle chime when stepping through doors
      },
    });

    movementUserIdRef.current = localUser?.id || null;
    movementPositionRef.current = localUser ? { x: localUser.x, y: localUser.y } : null;

    const handleKeyDown = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      // WEEK 3: Press 'E' to interact with nearby whiteboard or coffee machine
      if (event.key.toLowerCase() === 'e' && movementPositionRef.current) {
        const nearbyObj = getNearbyObject(
          movementPositionRef.current.x,
          movementPositionRef.current.y,
          75
        );
        if (nearbyObj && latestPropsRef.current.onInteract) {
          latestPropsRef.current.onInteract(nearbyObj);
        }
      }

      movementRef.current?.handleKeyDown(event);
    };

    const handleKeyUp = (event) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      movementRef.current?.handleKeyUp(event);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Pointer events for smooth click-to-walk and drag-to-pan
    const handlePointerDown = (event) => {
      isDraggingRef.current = true;
      hasMovedDragRef.current = false;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
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
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        if (onPanChange) {
          onPanChange(panRef.current.x, panRef.current.y);
        }
      }
    };

    const handlePointerUp = (event) => {
      if (!hasMovedDragRef.current && isDraggingRef.current) {
        const rect = canvas.getBoundingClientRect();
        const scale = renderRef.current?.scale || 1;
        const offsetX = renderRef.current?.offsetX || 0;
        const offsetY = renderRef.current?.offsetY || 0;
        const worldX = (event.clientX - rect.left - offsetX) / scale;
        const worldY = (event.clientY - rect.top - offsetY) / scale;

        movementRef.current?.setTarget(worldX, worldY);
        sounds?.playClick?.();
      }
      isDraggingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    const renderFrame = (timestamp) => {
      const deltaSeconds = Math.min((timestamp - lastTimeRef.current) / 1000 || 0.016, 0.05);
      lastTimeRef.current = timestamp;
      const {
        localUser: currentUser,
        participants: currentParticipants,
        onLocalMove: moveUser,
      } = latestPropsRef.current;

      if (currentUser?.id !== movementUserIdRef.current) {
        movementUserIdRef.current = currentUser?.id || null;
        movementPositionRef.current = currentUser ? { x: currentUser.x, y: currentUser.y } : null;
      }

      if (currentUser && movementPositionRef.current) {
        const updated = movementRef.current.update(movementPositionRef.current, deltaSeconds);
        movementPositionRef.current = updated;

        // ==========================================
        // WEEK 3: Acoustic Zone Proximity Check
        // ==========================================
        const myZoneId = movementRef.current.currentZoneId;
        const nearby = new Set();

        (currentParticipants || []).forEach((p) => {
          if (p.id !== currentUser.id) {
            // Check if separated by private room wall
            const peerZoneId = p.zoneId || null;
            let canHear = true;

            // If one person is in a private room and the other is not -> blocked!
            if (myZoneId !== peerZoneId) {
              if (myZoneId !== null || peerZoneId !== null) {
                canHear = false;
              }
            }

            // Podium speaker is always heard
            if (p.isBroadcasting) canHear = true;

            const dist = Math.hypot(p.x - updated.x, p.y - updated.y);
            if (dist <= 240 && canHear) {
              nearby.add(p.id);
              if (!nearbyUsersRef.current.has(p.id)) {
                sounds?.playProximityChime?.();
              }
            }
          }
        });
        nearbyUsersRef.current = nearby;

        if (
          moveUser &&
          (updated.x !== currentUser.x || updated.y !== currentUser.y) &&
          timestamp - lastBroadcastRef.current >= 60
        ) {
          lastBroadcastRef.current = timestamp;
          moveUser({
            ...updated,
            zoneId: myZoneId,
          });
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
          Math.min(rect.width / OFFICE_DIMENSIONS.width, rect.height / OFFICE_DIMENSIONS.height) *
          (latestPropsRef.current.zoom / 100);
        renderRef.current.offsetX =
          (rect.width - OFFICE_DIMENSIONS.width * renderRef.current.scale) / 2 + panRef.current.x;
        renderRef.current.offsetY =
          (rect.height - OFFICE_DIMENSIONS.height * renderRef.current.scale) / 2 + panRef.current.y;

        const displayUser =
          currentUser && movementPositionRef.current
            ? { ...currentUser, ...movementPositionRef.current, zoneId: movementRef.current.currentZoneId }
            : null;

        // Render base map and avatars
        renderRef.current.drawScene(
          displayUser,
          currentParticipants || [],
          deltaSeconds,
          movementRef.current?.target,
        );

        // ==========================================
        // WEEK 3: Draw Room Carpets & Borders on Top of Scene
        // ==========================================
        const ctx = renderRef.current.ctx;
        const scale = renderRef.current.scale;
        const offX = renderRef.current.offsetX;
        const offY = renderRef.current.offsetY;

        ctx.save();
        ctx.translate(offX, offY);
        ctx.scale(scale, scale);

        OFFICE_ZONES.forEach((zone) => {
          // Room floor tint
          ctx.fillStyle = zone.color;
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

          // Room boundary border
          ctx.strokeStyle = zone.borderColor;
          ctx.lineWidth = 2;
          ctx.setLineDash(zone.type === 'private' ? [8, 5] : [4, 4]);
          ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
          ctx.setLineDash([]);

          // Room Label Tag
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          const label = `${zone.name} ${zone.type === 'private' ? '🔒' : '📢'}`;
          ctx.font = 'bold 11px sans-serif';
          const textW = ctx.measureText(label).width;
          ctx.fillRect(zone.x + 8, zone.y + 8, textW + 12, 18);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, zone.x + 14, zone.y + 21);
        });

        // Prompt if standing near Whiteboard or Object
        if (movementPositionRef.current) {
          const nearObj = getNearbyObject(
            movementPositionRef.current.x,
            movementPositionRef.current.y,
            75
          );
          if (nearObj) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.font = 'bold 12px sans-serif';
            const promptW = ctx.measureText(nearObj.prompt).width;
            const px = movementPositionRef.current.x - promptW / 2;
            const py = movementPositionRef.current.y - 45;
            ctx.fillRect(px - 8, py - 14, promptW + 16, 22);
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(nearObj.prompt, px, py + 2);
          }
        }

        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();
    };
  }, [zoom]);

  return (
    <div className="office-canvas-wrapper">
      <canvas ref={canvasRef} className="office-canvas" aria-label="ProxiSpeak virtual office floor" />
    </div>
  );
}