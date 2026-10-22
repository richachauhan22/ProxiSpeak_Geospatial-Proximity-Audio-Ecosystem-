import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  if (window.HTMLMediaElement) {
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
    window.HTMLMediaElement.prototype.pause = () => {};
    window.HTMLMediaElement.prototype.load = () => {};
  }
}
