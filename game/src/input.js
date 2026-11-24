// Keyboard + pointer input. Jump is edge-triggered (one press = one jump, so a
// held key cannot bunny-hop); sliding is held. Confirm starts / restarts.

export const ACTION_JUMP = 1;
export const ACTION_CONFIRM = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const SLIDE_KEYS = new Set(['ArrowDown', 'KeyS']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  let queued = 0;
  const held = new Set();

  function press(code) {
    if (JUMP_KEYS.has(code)) queued |= ACTION_JUMP | ACTION_CONFIRM;
    if (code === 'Enter') queued |= ACTION_CONFIRM;
    if (PAUSE_KEYS.has(code)) queued |= ACTION_PAUSE;
    if (code === 'KeyM') queued |= ACTION_MUTE;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (JUMP_KEYS.has(event.code) || SLIDE_KEYS.has(event.code) || event.code === 'Space') {
      event.preventDefault();
    }
    held.add(event.code);
    press(event.code);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());

  // Tap / click: jump while playing, confirm on menus.
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    queued |= ACTION_JUMP | ACTION_CONFIRM;
  });

  return {
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
    slideHeld() {
      for (const code of SLIDE_KEYS) if (held.has(code)) return true;
      return false;
    },
  };
}
