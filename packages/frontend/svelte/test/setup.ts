import '@testing-library/jest-dom/vitest';
import '@testing-library/svelte/vitest';

// Svelte transitions (fade/fly/etc.) call Element.animate(); jsdom doesn't ship the
// Web Animations API. Provide a no-op stub that satisfies the surface Svelte uses.
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
  Element.prototype.animate = function animate() {
    return {
      cancel() {},
      finish() {},
      play() {},
      pause() {},
      reverse() {},
      addEventListener() {},
      removeEventListener() {},
      onfinish: null,
      oncancel: null,
      finished: Promise.resolve(),
      currentTime: 0,
      playState: 'finished',
    } as unknown as Animation;
  };
}
