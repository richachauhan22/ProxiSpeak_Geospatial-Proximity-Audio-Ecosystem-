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
    const radius = 32 * scale;
    const isSpeaking = Boolean(user.isSpeaking);
    const isMuted = Boolean(user.isMuted);
    const isAway = user.status === 'Away';

    // Status ring color
    let ringColor = user.ringColor || user.avatarColor || '#2563eb';
    if (isSpeaking) {
      ringColor = '#10b981'; // Neon mint
    } else if (isMuted) {
      ringColor = '#f59e0b'; // Amber
    } else if (isAway) {
      ringColor = '#94a3b8'; // Slate
    }

    const facing = typeof user.facing === 'number' ? user.facing : (Math.PI * 0.5);

    ctx.save();

    // 1. Directional Ambient Occlusion & Soft Floor Shadow beneath Avatar
    ctx.save();
    ctx.beginPath();
    const shadowOffsetX = 3 * scale;
    const shadowOffsetY = 5 * scale;
    ctx.ellipse(
      x + shadowOffsetX,
      y + radius + shadowOffsetY,
      radius * 0.85,
      radius * 0.32,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = 'rgba(11, 14, 23, 0.28)';
    ctx.filter = 'blur(2px)';
    ctx.fill();
    ctx.restore();

    // 2. Directional Look-at / Field of View (FOV) Orientation Cone & Tick
    ctx.save();
    const coneLen = 60 * scale;
    const fovHalfAngle = Math.PI * 0.22;
    const gradCone = ctx.createRadialGradient(x, y, radius, x, y, coneLen);
    if (isSpeaking) {
      gradCone.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      gradCone.addColorStop(1, 'rgba(16, 185, 129, 0.00)');
    } else {
      gradCone.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
      gradCone.addColorStop(1, 'rgba(6, 182, 212, 0.00)');
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, coneLen, facing - fovHalfAngle, facing + fovHalfAngle);
    ctx.closePath();
    ctx.fillStyle = gradCone;
    ctx.fill();

    // Sharp directional orientation tick on the avatar perimeter
    const tickDist = radius + 2 * scale;
    const tickLen = 6 * scale;
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

    // 3. Speaking State: Glowing pulsating green/teal perimeter ring around avatars currently speaking
    if (isSpeaking) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      const pulse = Math.sin(now * 5) * 0.08;
      const pulseR = radius * (1.04 + pulse);

      ctx.save();
      // Outer neon mint/cyan glow
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 14 * scale;
      ctx.beginPath();
      ctx.arc(x, y, pulseR + 3 * scale, 0, Math.PI * 2);
      ctx.lineWidth = 3 * scale;
      ctx.strokeStyle = '#10B981';
      ctx.stroke();

      // Inner cyan accent ring
      ctx.beginPath();
      ctx.arc(x, y, pulseR + 0.5 * scale, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = '#06B6D4';
      ctx.stroke();
      ctx.restore();

      // Ripple waves expanding outward
      for (let w = 0; w < 3; w++) {
        const phase = ((now * 1.5) + (w * 0.33)) % 1;
        const waveRadius = radius + (22 * scale * phase);
        const waveAlpha = Math.max(0, 0.5 * (1 - phase));

        ctx.beginPath();
        ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
        ctx.lineWidth = (2.2 - phase * 1.1) * scale;
        ctx.strokeStyle = `rgba(16, 185, 129, ${waveAlpha})`;
        ctx.stroke();
      }
    }

    // 4. Outer Status Ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3.5 * scale;
    if (isAway) {
      ctx.setLineDash([4 * scale, 3 * scale]);
    }
    ctx.strokeStyle = ringColor;
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. White Separator Gap
    ctx.beginPath();
    ctx.arc(x, y, radius - 2 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 6. Inner Photo / Face with Initial Fallback
    const photoRadius = radius - 4 * scale;
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
      // Fallback gradient face with initial letter (e.g. M, O, A, D)
      const grad = ctx.createLinearGradient(x - photoRadius, y - photoRadius, x + photoRadius, y + photoRadius);
      grad.addColorStop(0, ringColor);
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(x - photoRadius, y - photoRadius, photoRadius * 2, photoRadius * 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(12, 16 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = user.displayName?.slice(0, 1).toUpperCase() || 'M';
      ctx.fillText(initial, x, y);
    }
    ctx.restore();

    // 7. Backward-compatible Speaking Arc (if present)
    if (isSpeaking && user.arcPosition) {
      ctx.save();
      ctx.beginPath();
      const arcRadius = radius + 5 * scale;
      let startAngle = -Math.PI * 0.22;
      let endAngle = Math.PI * 0.22;

      if (user.arcPosition === 'bottom') {
        startAngle = Math.PI * 0.28;
        endAngle = Math.PI * 0.72;
      }

      ctx.arc(x, y, arcRadius, startAngle, endAngle);
      ctx.lineWidth = 3.5 * scale;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#f97316';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, arcRadius + 3.5 * scale, startAngle + 0.05, endAngle - 0.05);
      ctx.lineWidth = 1.6 * scale;
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
      const br = 9 * scale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1.2 * scale;
      ctx.lineCap = 'round';

      const micW = 2.2 * scale;
      const micH = 4 * scale;
      ctx.beginPath();
      ctx.roundRect(bx - micW, by - micH - 1 * scale, micW * 2, micH * 2, 2 * scale);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bx, by + 3 * scale);
      ctx.lineTo(bx, by + 5 * scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx - 4.5 * scale, by - 4.5 * scale);
      ctx.lineTo(bx + 4.5 * scale, by + 4.5 * scale);
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    }

    // 9. Modern Dark Frosted-Glass Nameplate below avatar
    const name = user.displayName || 'Guest';
    const tagLabel = name + (isLocal ? ' (You)' : '');
    ctx.font = `600 ${Math.max(10, 11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = ctx.measureText(tagLabel).width;
    const labelY = y + radius + 15 * scale;
    const pillW = textWidth + 22 * scale;
    const pillH = 19 * scale;

    ctx.save();
    // Dark frosted-glass pill styling
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 3 * scale;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'; // Dark slate pill
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
    ctx.strokeStyle = isSpeaking ? 'rgba(16, 185, 129, 0.5)' : 'rgba(51, 65, 85, 0.7)';
    ctx.stroke();
    ctx.restore();

    // Active status mini-dot inside nameplate
    const dotX = x - pillW / 2 + 8 * scale;
    const dotY = labelY;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = isSpeaking ? '#10b981' : isMuted ? '#f59e0b' : '#38bdf8';
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagLabel, dotX + 6 * scale, labelY);

    ctx.restore();
  }
}
