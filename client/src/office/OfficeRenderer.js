import { AvatarRenderer } from './AvatarRenderer';
import { OFFICE_DIMENSIONS } from './OfficeMap';
import { buildVisualGraph, serializeVisualGraph } from './visualGraphSerializer';
import { calculateSpatialVolume } from '../services/webrtcManager';

export class OfficeRenderer {
  constructor({ ctx, width, height, zoom = 100, panX = 0, panY = 0 }) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;

    // Viewport scaling
    const baseScale = Math.min(width / OFFICE_DIMENSIONS.width, height / OFFICE_DIMENSIONS.height);
    this.scale = baseScale * (zoom / 100);
    this.offsetX = (width - OFFICE_DIMENSIONS.width * this.scale) / 2 + this.panX;
    this.offsetY = (height - OFFICE_DIMENSIONS.height * this.scale) / 2 + this.panY;

    this.avatarRenderer = new AvatarRenderer();
    this.remotePositions = new Map();

    // Map background image
    this.mapImage = new Image();
    this.mapImage.src = '/office_map.png';
  }

  screenX(worldX) {
    return this.offsetX + worldX * this.scale;
  }

  screenY(worldY) {
    return this.offsetY + worldY * this.scale;
  }

  drawBackground() {
    const ctx = this.ctx;
    const floorX = this.offsetX;
    const floorY = this.offsetY;
    const floorWidth = OFFICE_DIMENSIONS.width * this.scale;
    const floorHeight = OFFICE_DIMENSIONS.height * this.scale;

    // Canvas outer backdrop (matches oVice neutral warm gray border)
    ctx.fillStyle = '#f0ebe1';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.mapImage.complete && this.mapImage.naturalWidth > 0) {
      // Draw high resolution isometric office map
      ctx.drawImage(this.mapImage, floorX, floorY, floorWidth, floorHeight);
    } else {
      // Warm floor gradient fallback while image is loading
      const grad = ctx.createLinearGradient(floorX, floorY, floorX + floorWidth, floorY + floorHeight);
      grad.addColorStop(0, '#f5ede0');
      grad.addColorStop(1, '#ebdcc7');
      ctx.fillStyle = grad;
      ctx.fillRect(floorX, floorY, floorWidth, floorHeight);
    }
  }

  drawAttenuationHalo(localUser, spatialConfig = {}) {
    if (!localUser) return;
    const ctx = this.ctx;
    const sx = this.screenX(localUser.x);
    const sy = this.screenY(localUser.y);

    const minR = (spatialConfig?.minDistance ?? 60) * this.scale;
    const maxR = (spatialConfig?.maxDistance ?? 280) * this.scale;
    const midR = (minR + maxR) / 2;

    ctx.save();

    // 1. Animated speaking wave ripples when avatar is actively talking
    if (localUser.isSpeaking) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      const ripplePhase = (now * 1.4) % 1;
      const rippleR = minR + (maxR - minR) * ripplePhase;
      const rippleAlpha = Math.max(0, 0.45 * (1 - ripplePhase));

      ctx.beginPath();
      ctx.arc(sx, sy, rippleR, 0, Math.PI * 2);
      ctx.lineWidth = 2.2 * this.scale;
      ctx.strokeStyle = `rgba(249, 115, 22, ${rippleAlpha})`;
      ctx.stroke();

      const ripple2Phase = ((now * 1.4) + 0.5) % 1;
      const ripple2R = minR + (maxR - minR) * ripple2Phase;
      const ripple2Alpha = Math.max(0, 0.35 * (1 - ripple2Phase));

      ctx.beginPath();
      ctx.arc(sx, sy, ripple2R, 0, Math.PI * 2);
      ctx.lineWidth = 1.6 * this.scale;
      ctx.strokeStyle = `rgba(59, 130, 246, ${ripple2Alpha})`;
      ctx.stroke();
    }

    // 2. Outer dynamic attenuation falloff field (soft radial glow)
    const gradient = ctx.createRadialGradient(sx, sy, minR, sx, sy, maxR);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.10)');
    gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.04)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

    ctx.beginPath();
    ctx.arc(sx, sy, maxR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Mid-distance guide ring (50% distance guide)
    ctx.beginPath();
    ctx.setLineDash([2 * this.scale, 4 * this.scale]);
    ctx.arc(sx, sy, midR, 0, Math.PI * 2);
    ctx.lineWidth = 1 * this.scale;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.stroke();

    // 4. Outer sound perimeter (dashed circle)
    ctx.beginPath();
    ctx.arc(sx, sy, maxR, 0, Math.PI * 2);
    ctx.setLineDash([4 * this.scale, 5 * this.scale]);
    ctx.lineWidth = 1.4 * this.scale;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
    ctx.stroke();

    // 5. Inner 100% volume threshold (emerald ring with subtle inner glow)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(sx, sy, minR, 0, Math.PI * 2);
    ctx.lineWidth = 1.8 * this.scale;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.stroke();

    ctx.restore();
  }

  drawProximityConnection(u1, u2, spatialConfig = null) {
    const ctx = this.ctx;
    const x1 = this.screenX(u1.x);
    const y1 = this.screenY(u1.y);
    const x2 = this.screenX(u2.x);
    const y2 = this.screenY(u2.y);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const dist = Math.hypot(u1.x - u2.x, u1.y - u2.y);
    const volume = calculateSpatialVolume(dist, spatialConfig || { minDistance: 60, maxDistance: 280 });
    const volPercent = Math.round(volume * 100);

    // 1. Connection line with volume-dependent opacity & width
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = Math.max(1.8, (1.2 + volume * 1.8) * this.scale);
    ctx.strokeStyle = `rgba(24, 24, 27, ${0.35 + volume * 0.65})`;
    ctx.stroke();

    // 2. Proximity black circular group badge at midpoint
    const badgeR = 14 * this.scale;
    ctx.beginPath();
    ctx.arc(midX, midY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b'; // Black circular badge
    ctx.fill();

    // 3. White team / people icon inside badge
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2 * this.scale;

    // Primary person silhouette
    const s = this.scale;
    ctx.beginPath();
    ctx.arc(midX - 1.5 * s, midY - 3 * s, 2.5 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(midX - 1.5 * s, midY + 4 * s, 4.5 * s, Math.PI, 0, false);
    ctx.fill();

    // Secondary person silhouette (right)
    ctx.beginPath();
    ctx.arc(midX + 4 * s, midY - 2 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(midX + 4 * s, midY + 4 * s, 3.5 * s, Math.PI, 0, false);
    ctx.fill();

    // 4. Enhanced Volume Attenuation Pill Indicator above midpoint
    if (dist > 0) {
      const labelText = `${volPercent}% • ${Math.round(dist)}px`;
      ctx.font = `700 ${Math.max(9, 10 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = ctx.measureText(labelText).width;
      const iconSpace = 10 * this.scale;
      const pillW = textWidth + iconSpace + 14 * this.scale;
      const pillH = 18 * this.scale;
      const pillY = midY - badgeR - 11 * this.scale;
      const pillX = midX - pillW / 2;

      ctx.beginPath();
      const r = pillH / 2;
      ctx.roundRect(pillX, pillY - pillH / 2, pillW, pillH, r);
      ctx.fillStyle = volume > 0.65 ? '#10b981' : volume > 0.25 ? '#2563eb' : '#64748b';
      ctx.fill();

      // Mini sound equalizer bars inside pill
      const barX = pillX + 6 * this.scale;
      const barY = pillY;
      ctx.fillStyle = '#ffffff';
      const h1 = (volume > 0.3 ? 8 : 4) * this.scale;
      const h2 = (volume > 0.6 ? 11 : 6) * this.scale;
      const h3 = (volume > 0.15 ? 7 : 3) * this.scale;
      ctx.fillRect(barX, barY - h1 / 2, 1.5 * this.scale, h1);
      ctx.fillRect(barX + 2.5 * this.scale, barY - h2 / 2, 1.5 * this.scale, h2);
      ctx.fillRect(barX + 5 * this.scale, barY - h3 / 2, 1.5 * this.scale, h3);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, barX + 9 * this.scale, pillY);
    }

    ctx.restore();
  }

  drawTargetIndicator(target) {
    if (!target) return;
    const ctx = this.ctx;
    const x = this.screenX(target.x);
    const y = this.screenY(target.y);
    const r = 16 * this.scale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 2 * this.scale;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.6)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4 * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    ctx.restore();
  }

  drawScene(localUser, participants = [], deltaSeconds = 0.016, target = null, spatialConfig = null) {
    this.drawBackground();

    // Draw dynamic spatial attenuation halo around local user
    if (localUser) {
      this.drawAttenuationHalo(localUser, spatialConfig);
    }

    const allUsers = localUser ? [localUser, ...participants.filter((p) => p.id !== localUser.id)] : participants;

    // Draw click target indicator if moving towards destination
    if (target) {
      this.drawTargetIndicator(target);
    }

    // Proximity connections:
    // Check all pairs for explicit connection or proximity distance <= maxDistance
    const maxAudioDist = spatialConfig?.maxDistance ?? 280;
    const drawnPairs = new Set();
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const u1 = allUsers[i];
        const u2 = allUsers[j];
        const isExplicit = u1.connectedTo === u2.id || u2.connectedTo === u1.id;
        const dist = Math.hypot(u1.x - u2.x, u1.y - u2.y);
        const isNearby = dist <= maxAudioDist;

        if (isExplicit || isNearby) {
          const key = `${Math.min(u1.id, u2.id)}_${Math.max(u1.id, u2.id)}`;
          if (!drawnPairs.has(key)) {
            drawnPairs.add(key);
            this.drawProximityConnection(u1, u2, spatialConfig);
          }
        }
      }
    }

    // Remote avatar interpolation
    const interpolate = 1 - Math.exp(-14 * deltaSeconds);
    const remoteParticipants = participants.filter((p) => !localUser || p.id !== localUser.id);
    const participantIds = new Set(remoteParticipants.map((p) => p.id));
    this.remotePositions.forEach((_pos, id) => {
      if (!participantIds.has(id)) this.remotePositions.delete(id);
    });

    const renderedUsers = remoteParticipants.map((p) => {
      const prev = this.remotePositions.get(p.id) || { x: p.x, y: p.y };
      const pos = {
        x: prev.x + (p.x - prev.x) * interpolate,
        y: prev.y + (p.y - prev.y) * interpolate,
      };
      this.remotePositions.set(p.id, pos);
      return {
        ...p,
        ...pos,
        isLocal: false,
      };
    });

    if (localUser) {
      renderedUsers.push({ ...localUser, isLocal: true });
    }

    // Sort users by Y coordinate for natural depth sorting
    renderedUsers.sort((a, b) => a.y - b.y);

    // Draw each user avatar
    for (const user of renderedUsers) {
      const sx = this.screenX(user.x);
      const sy = this.screenY(user.y);
      this.avatarRenderer.draw(this.ctx, user, {
        x: sx,
        y: sy,
        scale: this.scale,
        isLocal: user.isLocal,
      });
    }
  }

  /**
   * Constructs the structured visual graph representation of the current rendered scene.
   */
  getVisualGraph(localUser, participants = [], officeId = 'office-1') {
    return buildVisualGraph({
      localUser,
      participants,
      officeId,
      viewport: { zoom: this.zoom, panX: this.panX, panY: this.panY },
    });
  }

  /**
   * Serializes the current visual canvas scene into a valid JSON string for backend transmission.
   */
  serializeScene(localUser, participants = [], officeId = 'office-1', options = {}) {
    return serializeVisualGraph({
      localUser,
      participants,
      officeId,
      viewport: { zoom: this.zoom, panX: this.panX, panY: this.panY },
    }, options);
  }
}
