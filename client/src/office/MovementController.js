import { CollisionEngine } from './CollisionEngine';

const DEFAULT_SETTINGS = {
  avatarRadius: 18,
  speed: 220,
  worldWidth: 1200,
  worldHeight: 760,
  obstacles: [],
};

export class MovementController {
  constructor(settings = {}) {
    this.config = { ...DEFAULT_SETTINGS, ...settings };
    this.collisionEngine = new CollisionEngine({
      width: this.config.worldWidth,
      height: this.config.worldHeight,
      obstacles: this.config.obstacles,
      avatarRadius: this.config.avatarRadius,
    });
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false,
    };
    this.target = null;
    this.onMove = settings.onMove || (() => {});
  }

  handleKeyDown(event) {
    const value = event.key;
    if (Object.prototype.hasOwnProperty.call(this.keys, value)) {
      this.keys[value] = true;
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    const value = event.key;
    if (Object.prototype.hasOwnProperty.call(this.keys, value)) {
      this.keys[value] = false;
      event.preventDefault();
    }
  }

  setTarget(targetX, targetY) {
    this.target = {
      x: Math.min(Math.max(targetX, this.config.avatarRadius), this.config.worldWidth - this.config.avatarRadius),
      y: Math.min(Math.max(targetY, this.config.avatarRadius), this.config.worldHeight - this.config.avatarRadius),
    };
  }

  clearTarget() {
    this.target = null;
  }

  update(currentPosition, deltaSeconds) {
    const next = { ...currentPosition };
    let axisX = 0;
    let axisY = 0;

    if (this.keys.ArrowUp || this.keys.w) axisY -= 1;
    if (this.keys.ArrowDown || this.keys.s) axisY += 1;
    if (this.keys.ArrowLeft || this.keys.a) axisX -= 1;
    if (this.keys.ArrowRight || this.keys.d) axisX += 1;

    if (axisX !== 0 || axisY !== 0) {
      const magnitude = Math.hypot(axisX, axisY) || 1;
      axisX /= magnitude;
      axisY /= magnitude;
      const distance = this.config.speed * deltaSeconds;
      const proposedX = next.x + axisX * distance;
      const proposedY = next.y + axisY * distance;

      if (this.collisionEngine.canOccupy(proposedX, next.y, next.x, next.y)) {
        next.x = proposedX;
      }

      if (this.collisionEngine.canOccupy(next.x, proposedY, next.x, next.y)) {
        next.y = proposedY;
      }

      this.clearTarget();
    } else if (this.target) {
      const dx = this.target.x - next.x;
      const dy = this.target.y - next.y;
      const distance = Math.hypot(dx, dy);
      const step = this.config.speed * deltaSeconds;

      if (distance <= step) {
        next.x = this.target.x;
        next.y = this.target.y;
        this.clearTarget();
      } else {
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        const candidateX = next.x + normalizedX * step;
        const candidateY = next.y + normalizedY * step;

        if (this.collisionEngine.canOccupy(candidateX, next.y, next.x, next.y)) {
          next.x = candidateX;
        }
        if (this.collisionEngine.canOccupy(next.x, candidateY, next.x, next.y)) {
          next.y = candidateY;
        }
      }
    }

    if (next.x !== currentPosition.x || next.y !== currentPosition.y) {
      this.onMove({ x: next.x, y: next.y });
    }

    return next;
  }
}
