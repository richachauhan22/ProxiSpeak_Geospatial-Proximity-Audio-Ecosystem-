export class CollisionEngine {
  constructor({ width, height, obstacles = [], avatarRadius = 18 }) {
    this.width = width;
    this.height = height;
    this.obstacles = obstacles;
    this.avatarRadius = avatarRadius;
  }

  isWithinBounds(x, y) {
    return (
      x >= this.avatarRadius &&
      y >= this.avatarRadius &&
      x <= this.width - this.avatarRadius &&
      y <= this.height - this.avatarRadius
    );
  }

  penetration(x, y, obstacle) {
    const nearestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width));
    const nearestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height));
    const distance = Math.hypot(x - nearestX, y - nearestY);
    return Math.max(0, this.avatarRadius - distance);
  }

  canOccupy(x, y, fromX = x, fromY = y) {
    if (!this.isWithinBounds(x, y)) return false;

    return this.obstacles.every((obstacle) => {
      const nextPenetration = this.penetration(x, y, obstacle);
      if (nextPenetration === 0) return true;

      const currentPenetration = this.penetration(fromX, fromY, obstacle);
      return currentPenetration > 0 && nextPenetration < currentPenetration;
    });
  }
}
