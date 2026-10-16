import { describe, expect, it } from 'vitest';
import { MovementController } from './MovementController';

describe('MovementController', () => {
  it('normalizes diagonal movement and respects office bounds', () => {
    const controller = new MovementController({
      avatarRadius: 18,
      speed: 220,
      worldWidth: 1200,
      worldHeight: 760,
    });
    controller.handleKeyDown({ key: 'd', preventDefault() {} });
    controller.handleKeyDown({ key: 's', preventDefault() {} });
    const position = controller.update({ x: 100, y: 100 }, 0.05);

    expect(Math.hypot(position.x - 100, position.y - 100)).toBeCloseTo(11, 5);

    controller.handleKeyUp({ key: 'd', preventDefault() {} });
    controller.handleKeyUp({ key: 's', preventDefault() {} });
    controller.handleKeyDown({ key: 'ArrowLeft', preventDefault() {} });
    const bounded = controller.update({ x: 18, y: 100 }, 0.05);
    expect(bounded.x).toBe(18);
  });

  it('stops movement when an avatar reaches a solid desk', () => {
    const controller = new MovementController({
      avatarRadius: 18,
      speed: 220,
      worldWidth: 300,
      worldHeight: 300,
      obstacles: [{ x: 100, y: 100, width: 70, height: 50 }],
    });
    controller.handleKeyDown({ key: 'd', preventDefault() {} });
    const position = controller.update({ x: 50, y: 125 }, 0.5);

    expect(position.x).toBeLessThan(100);
  });
});
