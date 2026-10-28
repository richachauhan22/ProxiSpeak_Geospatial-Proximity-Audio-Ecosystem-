import { AvatarRenderer } from './AvatarRenderer';
import {
  OFFICE_DIMENSIONS,
  OFFICE_ZONES,
  WORKSTATION_DESKS,
  GLASS_PARTITIONS,
  INTERACTIVE_OBJECTS,
  ARCHITECTURAL_ELEMENTS,
} from './OfficeMap';
import { buildVisualGraph, serializeVisualGraph } from './visualGraphSerializer';
import { calculateSpatialVolume, calculateObstacleOcclusion } from '../services/webrtcManager';

export class OfficeRenderer {
  constructor({ ctx, width, height, zoom = 100, panX = 0, panY = 0, lightingMode = 'daylight' }) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.zoom = zoom;
    this.panX = panX;
    this.panY = panY;
    this.lightingMode = lightingMode; // 'daylight' | 'sunset' | 'studio'

    // Viewport scaling
    const baseScale = Math.min(width / OFFICE_DIMENSIONS.width, height / OFFICE_DIMENSIONS.height);
    this.scale = baseScale * (zoom / 100);
    this.offsetX = (width - OFFICE_DIMENSIONS.width * this.scale) / 2 + this.panX;
    this.offsetY = (height - OFFICE_DIMENSIONS.height * this.scale) / 2 + this.panY;

    this.avatarRenderer = new AvatarRenderer();
    this.remotePositions = new Map();

    // Map background image fallback (if present in public)
    this.mapImage = new Image();
    this.mapImage.src = '/office_map.png';
  }

  screenX(worldX) {
    return this.offsetX + worldX * this.scale;
  }

  screenY(worldY) {
    return this.offsetY + worldY * this.scale;
  }

  /* =========================================================================
     1. PROCEDURAL ARCHITECTURAL FLOOR PLAN & TEXTURES
     ========================================================================= */

  drawFloorBase() {
    const ctx = this.ctx;
    const floorX = this.offsetX;
    const floorY = this.offsetY;
    const floorW = OFFICE_DIMENSIONS.width * this.scale;
    const floorH = OFFICE_DIMENSIONS.height * this.scale;

    // Outer neutral canvas backdrop (Warm studio border)
    ctx.fillStyle = '#0f172a'; // Deep slate viewport surrounding canvas
    ctx.fillRect(0, 0, this.width, this.height);

    // Floor base shadow (building floor plate elevation)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 32 * this.scale;
    ctx.shadowOffsetY = 16 * this.scale;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(floorX, floorY, floorW, floorH);
    ctx.restore();

    // Primary Floor: Light Scandinavian Oak Wood Base
    const oakGrad = ctx.createLinearGradient(floorX, floorY, floorX + floorW, floorY + floorH);
    oakGrad.addColorStop(0, '#f5efe6');
    oakGrad.addColorStop(1, '#ebdccb');
    ctx.fillStyle = oakGrad;
    ctx.fillRect(floorX, floorY, floorW, floorH);

    // Subtle Architectural Wood Plank Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 150, 120, 0.15)';
    ctx.lineWidth = 1 * this.scale;
    const plankStep = 28 * this.scale;
    for (let py = floorY; py < floorY + floorH; py += plankStep) {
      ctx.beginPath();
      ctx.moveTo(floorX, py);
      ctx.lineTo(floorX + floorW, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawZones() {
    const ctx = this.ctx;

    for (const zone of OFFICE_ZONES) {
      const zx = this.screenX(zone.bounds.x);
      const zy = this.screenY(zone.bounds.y);
      const zw = zone.bounds.width * this.scale;
      const zh = zone.bounds.height * this.scale;

      ctx.save();

      // Zone specific floor texturing
      if (zone.floorType === 'acoustic-carpet') {
        // Quiet Library: Acoustic charcoal carpet tiles
        const carpetGrad = ctx.createLinearGradient(zx, zy, zx + zw, zy + zh);
        carpetGrad.addColorStop(0, '#e2e8f0');
        carpetGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = carpetGrad;
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 12 * this.scale);
        ctx.fill();

        // Carpet acoustic grid pattern
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.14)';
        ctx.lineWidth = 1 * this.scale;
        const tile = 24 * this.scale;
        for (let x = zx; x < zx + zw; x += tile) {
          ctx.beginPath();
          ctx.moveTo(x, zy);
          ctx.lineTo(x, zy + zh);
          ctx.stroke();
        }
        for (let y = zy; y < zy + zh; y += tile) {
          ctx.beginPath();
          ctx.moveTo(zx, y);
          ctx.lineTo(zx + zw, y);
          ctx.stroke();
        }
      } else if (zone.floorType === 'terrazzo') {
        // Lounge & Huddle: Polished terrazzo tiles
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 14 * this.scale);
        ctx.fill();

        // Terrazzo subtle grid
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
        ctx.lineWidth = 1 * this.scale;
        const tileSize = 40 * this.scale;
        for (let x = zx; x < zx + zw; x += tileSize) {
          ctx.beginPath();
          ctx.moveTo(x, zy);
          ctx.lineTo(x, zy + zh);
          ctx.stroke();
        }
      } else if (zone.floorType === 'wood-stage') {
        // Presentation: Raised warm wood stage
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.roundRect(zx, zy, zw, zh, 14 * this.scale);
        ctx.fill();

        // Stage border LED trim
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();
      }

      // Zone Title Ribbon & Header
      ctx.fillStyle = 'rgba(30, 41, 59, 0.72)';
      ctx.font = `700 ${Math.max(10, 11 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${zone.icon} ${zone.label.toUpperCase()}`, zx + 14 * this.scale, zy + 12 * this.scale);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.85)';
      ctx.font = `500 ${Math.max(8, 9 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(zone.sublabel, zx + 14 * this.scale, zy + 26 * this.scale);

      // Acoustic Mute Zone Indicator Pill
      if (zone.isMuteZone) {
        const pillX = zx + zw - 110 * this.scale;
        const pillY = zy + 12 * this.scale;
        ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, 96 * this.scale, 20 * this.scale, 10 * this.scale);
        ctx.fill();
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
        ctx.stroke();

        ctx.fillStyle = '#7c3aed';
        ctx.font = `700 ${Math.max(8, 9 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🤫 MUTE RADIUS', pillX + 48 * this.scale, pillY + 10 * this.scale);
      }

      ctx.restore();
    }
  }

  /* =========================================================================
     2. GLASS WALLS & ACOUSTIC BARRIERS
     ========================================================================= */

  drawGlassWalls() {
    const ctx = this.ctx;

    for (const wall of GLASS_PARTITIONS) {
      const x1 = this.screenX(wall.x1);
      const y1 = this.screenY(wall.y1);
      const x2 = this.screenX(wall.x2);
      const y2 = this.screenY(wall.y2);

      ctx.save();

      // Soft contact shadow
      ctx.beginPath();
      ctx.moveTo(x1, y1 + 3 * this.scale);
      ctx.lineTo(x2, y2 + 3 * this.scale);
      ctx.lineWidth = 8 * this.scale;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.stroke();

      // Outer glass aluminum channel frame
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 6 * this.scale;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.stroke();

      // Inner translucent glass core with frosted glow
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = 3.5 * this.scale;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.stroke();

      // Frosted specular glass reflection hash marks
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.beginPath();
      ctx.moveTo(midX - 12 * this.scale, midY - 6 * this.scale);
      ctx.lineTo(midX + 12 * this.scale, midY + 6 * this.scale);
      ctx.lineWidth = 1.4 * this.scale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();

      // Glass door cutout if wall has a doorway
      if (wall.hasDoor) {
        const doorSx = this.screenX(wall.doorX);
        const doorW = wall.doorWidth * this.scale;
        ctx.clearRect(doorSx - doorW / 2, y1 - 4 * this.scale, doorW, 8 * this.scale);

        // Door threshold hinge line
        ctx.beginPath();
        ctx.moveTo(doorSx - doorW / 2, y1);
        ctx.lineTo(doorSx + doorW / 2, y1);
        ctx.setLineDash([3 * this.scale, 3 * this.scale]);
        ctx.lineWidth = 1.2 * this.scale;
        ctx.strokeStyle = '#94a3b8';
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Acoustic rating badge on wall
      if (wall.dampeningDb) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.font = `600 ${Math.max(7, 8 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Glass ${wall.dampeningDb}dB`, midX, midY - 8 * this.scale);
      }

      ctx.restore();
    }
  }

  /* =========================================================================
     3. REALISTIC FURNITURE: STANDING DESKS, CHAIRS, MONITORS, SOFAS, PLANTS
     ========================================================================= */

  drawFurniture() {
    const ctx = this.ctx;

    // 1. Lounge Sectional Area Rug & Curved Terracotta Sofa
    const { rug, sofa, table } = ARCHITECTURAL_ELEMENTS.loungeArea;
    const rugX = this.screenX(rug.x);
    const rugY = this.screenY(rug.y);
    const rugW = rug.width * this.scale;
    const rugH = rug.height * this.scale;

    // Area rug
    ctx.save();
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.roundRect(rugX - rugW / 2, rugY - rugH / 2, rugW, rugH, 16 * this.scale);
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1 * this.scale;
    ctx.setLineDash([4 * this.scale, 4 * this.scale]);
    ctx.stroke();
    ctx.restore();

    // Curved Terracotta Lounge Sofa
    const sofaX = this.screenX(sofa.x);
    const sofaY = this.screenY(sofa.y);
    const sofaR = sofa.radius * this.scale;

    ctx.save();
    // Sofa shadow
    ctx.beginPath();
    ctx.arc(sofaX + 4 * this.scale, sofaY + 6 * this.scale, sofaR, 0, Math.PI * 1.5);
    ctx.lineWidth = 26 * this.scale;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
    ctx.stroke();

    // Curved Sofa Body
    ctx.beginPath();
    ctx.arc(sofaX, sofaY, sofaR, -Math.PI * 0.1, Math.PI * 1.1);
    ctx.lineWidth = 22 * this.scale;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c2410c'; // Terracotta fabric
    ctx.stroke();

    // Sofa Cushion Inlay
    ctx.beginPath();
    ctx.arc(sofaX, sofaY, sofaR, -Math.PI * 0.08, Math.PI * 1.08);
    ctx.lineWidth = 14 * this.scale;
    ctx.strokeStyle = '#ea580c';
    ctx.stroke();

    // Low oak coffee table with succulent tray
    const tblX = this.screenX(table.x);
    const tblY = this.screenY(table.y);
    const tblW = table.width * this.scale;
    const tblH = table.height * this.scale;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.fillRect(tblX - tblW / 2 + 2 * this.scale, tblY - tblH / 2 + 4 * this.scale, tblW, tblH);

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(tblX - tblW / 2, tblY - tblH / 2, tblW, tblH, 8 * this.scale);
    ctx.fill();

    // Succulent plant on coffee table
    ctx.beginPath();
    ctx.arc(tblX, tblY, 6 * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = '#15803d';
    ctx.fill();
    ctx.restore();

    // 2. Boardroom Executive Walnut Conference Table & Leather Chairs
    const bt = ARCHITECTURAL_ELEMENTS.boardroomTable;
    const btx = this.screenX(bt.x);
    const bty = this.screenY(bt.y);
    const btw = bt.width * this.scale;
    const bth = bt.height * this.scale;

    ctx.save();
    // Table Ambient Occlusion Shadow
    ctx.beginPath();
    ctx.roundRect(btx - btw / 2 + 4 * this.scale, bty - bth / 2 + 8 * this.scale, btw, bth, 20 * this.scale);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.filter = 'blur(3px)';
    ctx.fill();
    ctx.filter = 'none';

    // Rich Walnut Wood Tabletop
    const walnutGrad = ctx.createLinearGradient(btx - btw / 2, bty, btx + btw / 2, bty);
    walnutGrad.addColorStop(0, '#451a03');
    walnutGrad.addColorStop(0.5, '#78350f');
    walnutGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = walnutGrad;
    ctx.beginPath();
    ctx.roundRect(btx - btw / 2, bty - bth / 2, btw, bth, 18 * this.scale);
    ctx.fill();

    // Cable Well & Microphone Grommets
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(btx - 35 * this.scale, bty - 8 * this.scale, 70 * this.scale, 16 * this.scale, 4 * this.scale);
    ctx.fill();

    // Executive Conference Chairs
    for (const chair of bt.chairs) {
      const cx = this.screenX(chair.x);
      const cy = this.screenY(chair.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 11 * this.scale, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 * this.scale;
      ctx.stroke();
    }
    ctx.restore();

    // 3. Workstation Desks (Open Focus Pods + Library Carrels)
    for (const desk of WORKSTATION_DESKS) {
      const dx = this.screenX(desk.x);
      const dy = this.screenY(desk.y);
      const dw = desk.width * this.scale;
      const dh = desk.height * this.scale;

      ctx.save();

      // Contact shadow beneath desk
      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      ctx.beginPath();
      ctx.roundRect(dx - dw / 2 + 2 * this.scale, dy - dh / 2 + 5 * this.scale, dw, dh, 6 * this.scale);
      ctx.fill();

      // Desk Surface (Light Oak or Walnut)
      ctx.fillStyle = desk.surface === 'walnut' ? '#78350f' : '#f5e6d3';
      ctx.beginPath();
      ctx.roundRect(dx - dw / 2, dy - dh / 2, dw, dh, 6 * this.scale);
      ctx.fill();

      // Subtle desk bevel border
      ctx.strokeStyle = desk.surface === 'walnut' ? '#451a03' : '#d4b996';
      ctx.lineWidth = 1.4 * this.scale;
      ctx.stroke();

      // Dual Monitors or Single Display with Glowing Code Syntax / Charts
      const monitorW = 32 * this.scale;
      const monitorH = 7 * this.scale;
      const monitorOffsetY = desk.orientation === 'south' ? -14 * this.scale : 14 * this.scale;

      // Monitor 1 (Left)
      const m1X = dx - 18 * this.scale;
      const m1Y = dy + monitorOffsetY;
      ctx.fillStyle = '#0f172a'; // Bezel
      ctx.fillRect(m1X - monitorW / 2, m1Y - monitorH / 2, monitorW, monitorH);
      // Code syntax glow
      ctx.fillStyle = desk.codeTheme === 'emerald' ? '#10b981' : desk.codeTheme === 'rose' ? '#f43f5e' : '#38bdf8';
      ctx.fillRect(m1X - monitorW / 2 + 2 * this.scale, m1Y - monitorH / 2 + 1.5 * this.scale, monitorW - 4 * this.scale, monitorH - 3 * this.scale);

      // Monitor 2 (Right if dual monitors)
      if (desk.monitors === 2) {
        const m2X = dx + 18 * this.scale;
        const m2Y = dy + monitorOffsetY;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(m2X - monitorW / 2, m2Y - monitorH / 2, monitorW, monitorH);
        // Dashboard chart glow
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(m2X - monitorW / 2 + 2 * this.scale, m2Y - monitorH / 2 + 1.5 * this.scale, monitorW - 4 * this.scale, monitorH - 3 * this.scale);
      }

      // Ergonomic Mesh Office Chair with subtle swivel
      const chX = this.screenX(desk.chair.x);
      const chY = this.screenY(desk.chair.y);
      const chR = 12 * this.scale;

      // Chair shadow
      ctx.beginPath();
      ctx.arc(chX + 2 * this.scale, chY + 3 * this.scale, chR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
      ctx.fill();

      // Chair seat & curved lumbar mesh
      ctx.beginPath();
      ctx.arc(chX, chY, chR, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.8 * this.scale;
      ctx.stroke();

      // Chair armrests
      ctx.lineWidth = 2.4 * this.scale;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(chX - chR + 1 * this.scale, chY - 4 * this.scale);
      ctx.lineTo(chX - chR + 1 * this.scale, chY + 4 * this.scale);
      ctx.moveTo(chX + chR - 1 * this.scale, chY - 4 * this.scale);
      ctx.lineTo(chX + chR - 1 * this.scale, chY + 4 * this.scale);
      ctx.stroke();

      // Desk occupancy & label
      ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
      ctx.font = `600 ${Math.max(7, 8 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(desk.label, dx, dy + (desk.orientation === 'south' ? 14 : -14) * this.scale);

      ctx.restore();
    }

    // 4. Indoor Potted Plants (Fiddle-leaf figs & monsteras)
    for (const plant of ARCHITECTURAL_ELEMENTS.plants) {
      const px = this.screenX(plant.x);
      const py = this.screenY(plant.y);
      const pr = plant.radius * this.scale;

      ctx.save();
      // Contact shadow
      ctx.beginPath();
      ctx.arc(px + 3 * this.scale, py + 5 * this.scale, pr * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
      ctx.fill();

      // Ceramic planter pot rim
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = '#ea580c'; // Terracotta ceramic pot
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.6 * this.scale;
      ctx.stroke();

      // Fiddle-leaf fig / monstera foliage lobes
      const leafCount = plant.type === 'fig' ? 6 : 8;
      for (let l = 0; l < leafCount; l++) {
        const ang = (l / leafCount) * Math.PI * 2;
        const lx = px + Math.cos(ang) * pr * 0.7;
        const ly = py + Math.sin(ang) * pr * 0.7;
        ctx.beginPath();
        ctx.arc(lx, ly, pr * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = l % 2 === 0 ? '#15803d' : '#166534';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* =========================================================================
     4. INTERACTIVE OBJECTS: WHITEBOARDS, BROADCAST SCREEN, COFFEE STATION
     ========================================================================= */

  drawInteractiveObjects() {
    const ctx = this.ctx;

    for (const obj of INTERACTIVE_OBJECTS) {
      const ox = this.screenX(obj.x);
      const oy = this.screenY(obj.y);
      const ow = obj.width * this.scale;
      const oh = obj.height * this.scale;

      ctx.save();

      if (obj.type === 'whiteboard') {
        // Architectural Dry-Erase Whiteboard in Boardroom
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(ox - ow / 2, oy + 3 * this.scale, ow, oh);

        // Board aluminum frame
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(ox - ow / 2, oy - oh / 2, ow, oh, 4 * this.scale);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();

        // Diagram sketches and sticky notes on whiteboard
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(ox - 35 * this.scale, oy - 4 * this.scale, 18 * this.scale, 8 * this.scale);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(ox - 10 * this.scale, oy - 4 * this.scale, 18 * this.scale, 8 * this.scale);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(ox + 15 * this.scale, oy - 4 * this.scale, 14 * this.scale, 8 * this.scale);

        // Marker tray
        ctx.fillStyle = '#64748b';
        ctx.fillRect(ox - ow / 2 + 10 * this.scale, oy + oh / 2 - 1 * this.scale, ow - 20 * this.scale, 2.5 * this.scale);

        // Interactive click hint pill
        ctx.fillStyle = '#2563eb';
        ctx.font = `700 ${Math.max(8, 9 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('✏️ CLICK TO DRAW WHITEBOARD', ox, oy - 14 * this.scale);
      } else if (obj.type === 'broadcast-pillar') {
        // Presentation Zone Screen Broadcast Pillar
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(ox - ow / 2, oy - oh / 2, ow, oh, 6 * this.scale);
        ctx.fill();

        // Screen display active preview with wave
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(now * 3);
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.4 + 0.6 * pulse})`;
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();

        ctx.fillStyle = '#818cf8';
        ctx.font = `700 ${Math.max(8, 9 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📡 SCREEN BROADCAST PILLAR', ox, oy);
      } else if (obj.type === 'coffee-station') {
        // Lounge Espresso Bar Counter
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(ox - ow / 2, oy - oh / 2, ow, oh, 8 * this.scale);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5 * this.scale;
        ctx.stroke();

        // Espresso machine & steam wand
        ctx.fillStyle = '#334155';
        ctx.fillRect(ox - 24 * this.scale, oy - 12 * this.scale, 24 * this.scale, 24 * this.scale);

        ctx.fillStyle = '#f59e0b';
        ctx.font = `700 ${Math.max(8, 9 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☕ ESPRESSO BAR', ox, oy + 16 * this.scale);
      }

      ctx.restore();
    }
  }

  /* =========================================================================
     5. DYNAMIC DAYLIGHT & AMBIENT PENDANT LIGHTING OVERLAYS
     ========================================================================= */

  drawLightingOverlays() {
    const ctx = this.ctx;
    const floorX = this.offsetX;
    const floorY = this.offsetY;
    const floorW = OFFICE_DIMENSIONS.width * this.scale;
    const floorH = OFFICE_DIMENSIONS.height * this.scale;

    ctx.save();

    if (this.lightingMode === 'sunset') {
      // Warm Golden Hour Amber Overlay
      const sunsetGrad = ctx.createLinearGradient(floorX, floorY, floorX + floorW, floorY + floorH);
      sunsetGrad.addColorStop(0, 'rgba(251, 146, 60, 0.12)');
      sunsetGrad.addColorStop(1, 'rgba(234, 88, 12, 0.06)');
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(floorX, floorY, floorW, floorH);
    } else if (this.lightingMode === 'studio') {
      // Evening Ambient Overlay with Warm Overhead Pendant Lighting Pools
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(floorX, floorY, floorW, floorH);

      // Warm pendant light circles casting illumination pools onto tables and rugs
      for (const light of ARCHITECTURAL_ELEMENTS.pendantLights) {
        const lx = this.screenX(light.x);
        const ly = this.screenY(light.y);
        const lr = light.radius * this.scale;

        const lightGrad = ctx.createRadialGradient(lx, ly, 10 * this.scale, lx, ly, lr);
        lightGrad.addColorStop(0, light.color);
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0.00)');

        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fillStyle = lightGrad;
        ctx.fill();
      }
    } else {
      // Default Daylight: Crisp Directional Sunbeam Shift from North-West Windows
      const sunGrad = ctx.createLinearGradient(floorX, floorY, floorX + floorW * 0.5, floorY + floorH);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
      sunGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
      sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0.00)');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(floorX, floorY, floorW, floorH);
    }

    ctx.restore();
  }

  /* =========================================================================
     6. SPATIAL AUDIO HORIZON & DISTANCE ATTENUATION
     ========================================================================= */

  drawAttenuationHalo(localUser, spatialConfig = {}) {
    if (!localUser) return;
    const ctx = this.ctx;
    const sx = this.screenX(localUser.x);
    const sy = this.screenY(localUser.y);

    const minR = (spatialConfig?.minDistance ?? 60) * this.scale;
    const maxR = (spatialConfig?.maxDistance ?? 280) * this.scale;
    const midR = (minR + maxR) / 2;

    ctx.save();

    // 1. Dynamic Speaking Waves when user is actively talking
    if (localUser.isSpeaking) {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
      for (let i = 0; i < 2; i++) {
        const phase = ((now * 1.4) + (i * 0.5)) % 1;
        const rippleR = minR + (maxR - minR) * phase;
        const rippleAlpha = Math.max(0, 0.45 * (1 - phase));

        ctx.beginPath();
        ctx.arc(sx, sy, rippleR, 0, Math.PI * 2);
        ctx.lineWidth = 2 * this.scale;
        ctx.strokeStyle = `rgba(16, 185, 129, ${rippleAlpha})`;
        ctx.stroke();
      }
    }

    // 2. Falloff Zone: Soft dynamic radial gradient (Gradual attenuation horizon)
    const gradient = ctx.createRadialGradient(sx, sy, minR, sx, sy, maxR);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

    ctx.beginPath();
    ctx.arc(sx, sy, maxR, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Falloff Perimeter: Subtle dashed ring
    ctx.beginPath();
    ctx.arc(sx, sy, maxR, 0, Math.PI * 2);
    ctx.setLineDash([4 * this.scale, 5 * this.scale]);
    ctx.lineWidth = 1.4 * this.scale;
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.stroke();

    // 4. Mid-distance 50% Volume Guide
    ctx.beginPath();
    ctx.arc(sx, sy, midR, 0, Math.PI * 2);
    ctx.setLineDash([2 * this.scale, 4 * this.scale]);
    ctx.lineWidth = 1 * this.scale;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.stroke();

    // 5. Hearable Zone: Inner 100% full-volume threshold
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.arc(sx, sy, minR, 0, Math.PI * 2);
    ctx.lineWidth = 1.8 * this.scale;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
    ctx.stroke();

    // Zone Labels
    ctx.fillStyle = '#10b981';
    ctx.font = `700 ${Math.max(7, 8 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('100% HEARABLE ZONE', sx, sy - minR - 4 * this.scale);

    ctx.restore();
  }

  /* =========================================================================
     7. RAYCASTED PROXIMITY LINKS & WALL OBSTRUCTION DETECTION
     ========================================================================= */

  drawProximityConnection(u1, u2, spatialConfig = null, obstacles = []) {
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

    // Wall Obstruction Raycast check
    const occlusion = calculateObstacleOcclusion(
      { x: u1.x, y: u1.y },
      { x: u2.x, y: u2.y },
      obstacles,
      0.45,
    );
    const isObstructed = occlusion < 1.0;

    ctx.save();

    // Faint low-opacity Bezier connection link
    ctx.beginPath();
    // Subtle curve offset at midpoint for natural organic feel
    const dx = x2 - x1;
    const dy = y2 - y1;
    const curveOffset = Math.sin((x1 + y1) * 0.01) * 12 * this.scale;
    const cx = midX - (dy / (dist || 1)) * curveOffset;
    const cy = midY + (dx / (dist || 1)) * curveOffset;

    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.lineWidth = Math.max(1.6, (1.2 + volume * 2.0) * this.scale);
    ctx.strokeStyle = isObstructed
      ? 'rgba(239, 68, 68, 0.45)' // Reddish-amber when wall-dampened
      : `rgba(99, 102, 241, ${0.25 + volume * 0.65})`; // Vibrant spatial indigo
    if (isObstructed) {
      ctx.setLineDash([4 * this.scale, 4 * this.scale]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Volume & Metric Distance Pill (e.g., "78% • 1.4m")
    if (dist > 0) {
      const metricDist = (dist / 60).toFixed(1); // 60px ≈ 1.0m scale
      const labelText = isObstructed
        ? `⚠️ Dampened -12dB • ${metricDist}m`
        : `${volPercent}% • ${metricDist}m`;

      ctx.font = `700 ${Math.max(9, 10 * this.scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textWidth = ctx.measureText(labelText).width;
      const pillW = textWidth + 18 * this.scale;
      const pillH = 20 * this.scale;
      const pillX = midX - pillW / 2;
      const pillY = midY - pillH / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
      ctx.shadowBlur = 6 * this.scale;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = isObstructed
        ? '#ef4444'
        : volume > 0.65 ? '#10b981' : volume > 0.25 ? '#6366f1' : '#64748b';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, midX, midY);
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
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4 * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.restore();
  }

  /* =========================================================================
     8. MASTER SCENE DRAW LOOP
     ========================================================================= */

  drawScene(localUser, participants = [], deltaSeconds = 0.016, target = null, spatialConfig = null, obstacles = []) {
    // 1. Procedural floor base & textures
    this.drawFloorBase();

    // 2. Functional zones (Focus pods, Boardroom, Lounge, Library, Stage)
    this.drawZones();

    // 3. Furniture (Standing desks, chairs, conference tables, sofa, plants)
    this.drawFurniture();

    // 4. Glass walls & acoustic partitions
    this.drawGlassWalls();

    // 5. Interactive office objects (Whiteboard, Broadcast pillar, Coffee station)
    this.drawInteractiveObjects();

    // 6. Dynamic daylight & ambient pendant lighting overlays
    this.drawLightingOverlays();

    // 7. Spatial audio attenuation halo around local user
    if (localUser) {
      this.drawAttenuationHalo(localUser, spatialConfig);
    }

    const allUsers = localUser ? [localUser, ...participants.filter((p) => p.id !== localUser.id)] : participants;

    // Draw click destination indicator if moving
    if (target) {
      this.drawTargetIndicator(target);
    }

    // 8. Raycasted proximity links with volume & wall obstruction detection
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
            this.drawProximityConnection(u1, u2, spatialConfig, obstacles);
          }
        }
      }
    }

    // 9. Remote avatar interpolation
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

    // Depth sorting by Y coordinate for natural 2.5D overlap
    renderedUsers.sort((a, b) => a.y - b.y);

    // 10. Draw avatars with directional orientation & animated status rings
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
