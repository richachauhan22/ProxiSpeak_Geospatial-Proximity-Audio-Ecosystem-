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
    const ringColor = user.ringColor || user.avatarColor || (isLocal ? '#2563eb' : '#2563eb');

    ctx.save();

    // 1. Soft Floor Shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + radius + 4 * scale, radius * 0.9, radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40, 30, 20, 0.16)';
    ctx.fill();
    ctx.restore();

    // 2. Outer Colored Ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.lineWidth = 4 * scale;
    ctx.strokeStyle = ringColor;
    ctx.stroke();

    // 3. White Separator Gap
    ctx.beginPath();
    ctx.arc(x, y, radius - 2.5 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 4. Inner Photo / Face
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
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(x - photoRadius, y - photoRadius, photoRadius * 2, photoRadius * 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.max(12, 18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(user.displayName?.slice(0, 1).toUpperCase() || '?', x, y);
    }
    ctx.restore();

    // 5. Orange Audio Speaking Arc (Voice Activity)
    if (user.isSpeaking) {
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
      ctx.strokeStyle = '#f97316'; // Vibrant orange as in screenshot
      ctx.stroke();
      ctx.restore();
    }

    // 6. Muted Microphone Badge (Red circular badge with crossed mic icon)
    if (user.isMuted) {
      const badgeAngle = Math.PI * 0.28; // Bottom-right corner
      const badgeDistance = radius - 1 * scale;
      const bx = x + Math.cos(badgeAngle) * badgeDistance;
      const by = y + Math.sin(badgeAngle) * badgeDistance;
      const br = 10 * scale;

      ctx.save();
      // Badge background circle
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Muted mic icon inside badge
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1.3 * scale;
      ctx.lineCap = 'round';

      // Mic body
      const micW = 2.5 * scale;
      const micH = 4.5 * scale;
      ctx.beginPath();
      ctx.roundRect(bx - micW, by - micH - 1 * scale, micW * 2, micH * 2, 2 * scale);
      ctx.fill();

      // Mic base line
      ctx.beginPath();
      ctx.moveTo(bx, by + 3.5 * scale);
      ctx.lineTo(bx, by + 6 * scale);
      ctx.stroke();

      // Slash line across mic
      ctx.beginPath();
      ctx.moveTo(bx - 5 * scale, by - 5 * scale);
      ctx.lineTo(bx + 5 * scale, by + 5 * scale);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.restore();
    }

    // 7. Clean Nameplate Label
    const name = user.displayName || 'Guest';
    ctx.font = `600 ${Math.max(10, 11 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = ctx.measureText(name).width;
    const labelY = y + radius + 14 * scale;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 1 * scale;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(
      x - textWidth / 2 - 7 * scale,
      labelY - 8 * scale,
      textWidth + 14 * scale,
      16 * scale,
      8 * scale,
    );
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, labelY);

    ctx.restore();
  }
}
