// Stage a scene for a screenshot: ?shot=start|play|jump|end (with &seed=N).
// The world is advanced with the same autopilot the title screen uses, so the
// shot is a real render of the game's own code, not a mock-up.

import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function advance(world, frames, attract) {
  for (let i = 0; i < frames; i += 1) {
    const input = world.autopilot();
    world.step(STEP, input, attract);
    if (world.over) break;
  }
}

export function stageShot(name, world) {
  if (name === 'start') {
    world.reset();
    advance(world, 100, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    world.reset();
    advance(world, 360, false);
    if (world.over) {
      // The autopilot wiped out: restart and take an earlier, living moment.
      world.reset();
      advance(world, 200, false);
    }
    // Settle until the invulnerability blink is fully over, so the runner is
    // visible in the capture (attract mode: no hearts are lost while settling).
    for (let i = 0; i < 120 && world.player.invuln > 0; i += 1) {
      world.step(STEP, world.autopilot(), true);
    }
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  if (name === 'jump') {
    world.reset();
    for (let i = 0; i < 1200; i += 1) {
      const input = world.autopilot();
      world.step(STEP, input, false);
      const p = world.player;
      const overGap = world.groundTopAt(p.x + p.w / 2) === null;
      if (!p.onGround && overGap && p.vy < 200) break;
      if (world.over) { world.reset(); advance(world, 200, false); break; }
    }
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  // end
  world.reset();
  advance(world, 1500, false);
  if (!world.over) {
    world.state.hearts = 0;
    world.over = true;
    world.player.dead = true;
  }
  return { screen: SCREEN_OVER, best: 2480 };
}
