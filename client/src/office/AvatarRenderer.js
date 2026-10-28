export class AvatarRenderer {
  constructor() {
    this.imageCache = new Map();
  }

  getImage(url) {
    if (!url) return null;
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url);
    }
    const img = new Image();
    img.src = url;
    this.imageCache.set(url, img);
    return img;
  }

  draw(ctx, user, { x, y, scale = 1, isLocal = false }) {
    const radius = 34 * scale;
    const isSpeaking = Boolean(user.isSpeaking);
    const isMuted = Boolean(user.isMuted);
    const isAway = user.status === 'Away';
    const isDeepWork = user.status === 'In focus' || user.status === 'Deep Work';

    // Status ring color
    let ringColor = user.ringColor || user.avatarColor || '#2563eb';
    if (isSpeaking) {
      ringColor = '#10b981'; // Pulsating emerald
    } else if (isMuted) {
      ringColor = '#f59e0b'; // Soft amber
    } else if (isAway) {
      ringColor = '#94a3b8'; // Soft slate
    }

    const facing = typeof user.facing === 'number' ? user.facing : (Math.PI * 0.5);

    ctx.save();

    // 1. Directional Ambient Occlusion & Soft Floor Shadow beneath Avatar
    ctx.save();
    ctx.beginPath();
    // Shadow offset slightly down-right to simulate overhead-left sunlight/pendant
    const shadowOffsetX = 3 * scale;
    const shadowOffsetY = 6 * scale;
    ctx.ellipse(
      x + shadowOffsetX,
      y + radius + shadowOffsetY,
      radius * 0.88,
      radius * 0.34,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.filter = 'blur(2px)';
    ctx.fill();
    ctx.restore();

    // 2. Directional Look-at / Field of View (FOV) Orientation Cone & Tick
    // Directly tied to user facing angle and spatial stereo panning perception
    ctx.save();
    const coneLen = 65 * scale;
    const fovHalfAngle = Math.PI * 0.22; // ~40 degree subtle cone
    const gradCone = ctx.createRadialGradient(x, y, radius, x, y, coneLen);
    if (isSpeaking) {
      gradCone.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
      gradCone.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
    } else {
      gradCone.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
      gradCone.addColorStop(1, 'rgba(99, 102, 241, 0.00)');
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, coneLen, facing - fovHalfAngle, facing + fovHalfAngle);
    ctx.closePath();
    ctx.fillStyle = gradCone;
    ctx.fill();

    // Sharp directional orientation tick on the avatar perimeter
    const tickDist = radius + 3 * scale;
    const tickLen = 7 * scale;
    const tx1 = x + Math.cos(facing) * tickDist;
    const ty1 = y + Math.sin(facing) * tickDist;
    const tx2 = x + Math.cos(facing) * (tickDist + tickLen);
    const ty2 = y + Math.sin(facing) * (tickDist + tickLen);

    ctx.beginPath();
    ctx.moveTo(tx1, ty1);
    ctx.lineTo(tx2, ty2);
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ringColor;
    ctx.stroke();
    ctx.restore();

    // 3. Animated Speaking Harmonic Waves (Emerald ripple expansion)
    if (isSpeaking) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      for (let w = 0; w < 3; w++) {
        const phase = ((now * 1.5) + (w * 0.33)) % 1;
        const waveRadius = radius + (22 * scale * phase);
        const waveAlpha = Math.max(0, 0.55 * (1 - phase));

        ctx.beginPath();
        ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
        ctx.lineWidth = (2.4 - phase * 1.2) * scale;
        ctx.strokeStyle = `rgba(16, 185, 129, ${waveAlpha})`;
        ctx.stroke();
      }
    }

    // 4. Outer Status Ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 4 * scale;
    if (isAway) {
      ctx.setLineDash([4 * scale, 3 * scale]);
    }
    ctx.strokeStyle = ringColor;
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. White Separator Gap
    ctx.beginPath();
    ctx.arc(x, y, radius - 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 6. Inner Photo / Face with Fallback
    const photoRadius = radius - 4.5 * scale;
    const photoUrl = user.photoUrl || (user.id === 'user-mia' ? '/avatar_mia.png' : null);
    const photo = this.getImage(photoUrl);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, photoRadius, 0, Math.PI * 2);
    ctx.clip();

    if (photo && photo.complete && photo.naturalWidth > 0) {
      ctx.drawImage(
        photo,
        x - photoRadius,
        y - photoRadius,
        photoRadius * 2,
        photoRadius * 2,
      );
    } else {
      // Fallback gradient face
      const grad = ctx.createLinearGradient(x - photoRadius, y - photoRadius, x + photoRadius, y + photoRadius);
      grad.addColorStop(0, ringColor);
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(x - photoRadius, y - photoRadius, photoRadius * 2, photoRadius * 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(12, 18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(user.displayName?.slice(0, 1).toUpperCase() || '?', x, y);
    }
    ctx.restore();

    // 7. Backward-compatible Speaking Arc (Preserves existing arcPosition behavior)
    if (isSpeaking && user.arcPosition) {
      ctx.save();
      ctx.beginPath();
      const arcRadius = radius + 6 * scale;
      let startAngle = -Math.PI * 0.22;
      let endAngle = Math.PI * 0.22;

      if (user.arcPosition === 'bottom') {
        startAngle = Math.PI * 0.28;
        endAngle = Math.PI * 0.72;
      }

      ctx.arc(x, y, arcRadius, startAngle, endAngle);
      ctx.lineWidth = 3.8 * scale;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#f97316'; // Vibrant orange arc
      ctx.stroke();

      // Reverberation echo arc
      ctx.beginPath();
      ctx.arc(x, y, arcRadius + 4 * scale, startAngle + 0.05, endAngle - 0.05);
      ctx.lineWidth = 1.8 * scale;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
      ctx.stroke();
      ctx.restore();
    }

    // 8. Muted Microphone Badge
    if (isMuted) {
      const badgeAngle = Math.PI * 0.28;
      const badgeDistance = radius - 1 * scale;
      const bx = x + Math.cos(badgeAngle) * badgeDistance;
      const by = y + Math.sin(badgeAngle) * badgeDistance;
      const br = 10 * scale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Muted mic icon
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1.3 * scale;
      ctx.lineCap = 'round';

      const micW = 2.5 * scale;
      const micH = 4.5 * scale;
      ctx.beginPath();
      ctx.roundRect(bx - micW, by - micH - 1 * scale, micW * 2, micH * 2, 2 * scale);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bx, by + 3.5 * scale);
      ctx.lineTo(bx, by + 6 * scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx - 5 * scale, by - 5 * scale);
      ctx.lineTo(bx + 5 * scale, by + 5 * scale);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }

    // 9. Modern Glassmorphic Nameplate
    const name = user.displayName || 'Guest';
    const statusText = user.status ? ` · ${user.status}` : '';
    ctx.font = `600 ${Math.max(10, 11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = ctx.measureText(name + (isLocal ? ' (You)' : '')).width;
    const labelY = y + radius + 15 * scale;
    const pillW = textWidth + 18 * scale;
    const pillH = 18 * scale;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 6 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(
      x - pillW / 2,
      labelY - pillH / 2,
      pillW,
      pillH,
      pillH / 2,
    );
    ctx.fill();

    // Subtle border
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.stroke();
    ctx.restore();

    // Active status mini-dot inside nameplate
    const dotX = x - pillW / 2 + 8 * scale;
    const dotY = labelY;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = isSpeaking ? '#10b981' : isMuted ? '#f59e0b' : '#3b82f6';
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(name + (isLocal ? ' (You)' : ''), dotX + 6 * scale, labelY);

    ctx.restore();
  }
}
