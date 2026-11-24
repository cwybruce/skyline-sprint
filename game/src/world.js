// Skyline Sprint world: rooftops scroll past a fixed player. The player runs,
// jumps (twice), slides under billboards, grabs coins, smashes obstacles while
// boosted, and loses a heart on a hit or a fall into a gap.

import {
  FIELD, PLAYER, SPEED, ROOF, OBSTACLE, COIN, POWERUP, HEAT, LIVES, MAX_HEARTS,
} from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_COIN = 4;
export const EVENT_POWER = 8;
export const EVENT_FALL = 16;
export const EVENT_JUMP = 32;
export const EVENT_DOUBLE = 64;

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createWorld(random) {
  const world = {
    state: { score: 0, coins: 0, hearts: LIVES, heat: 1, speed: SPEED.start, distance: 0, time: 0, boost: 0, smashed: 0 },
    player: {
      x: PLAYER.x, y: 0, vy: 0, w: PLAYER.width, h: PLAYER.height,
      onGround: true, jumps: 0, sliding: false, slideTimer: 0,
      invuln: 0, coyote: 0, runPhase: 0, dead: false, landDust: 0,
    },
    buildings: [],
    obstacles: [],
    coins: [],
    powerups: [],
    particles: [],
    clouds: [],
    birds: [],
    heli: { active: false, x: 900, y: 110, t: 0 },
    nextX: 0,
    over: false,
  };

  function jumpReach(speed) {
    return Math.max(130, Math.min(300, speed * 0.55));
  }

  function makeBuilding(x) {
    const w = random.range(ROOF.minWidth, ROOF.maxWidth);
    const prev = world.buildings[world.buildings.length - 1];
    let top = random.range(ROOF.minTop, ROOF.maxTop);
    if (prev) top = Math.max(ROOF.minTop, Math.min(ROOF.maxTop, prev.top + random.range(-90, 90)));
    const b = { x, w, top, id: world.buildings.length };
    world.buildings.push(b);

    // Rooftop props, spaced out so no roof is unfair.
    let cursor = 40;
    const lastPropEnd = { at: 0 };
    while (cursor < w - 110) {
      const roll = random.next();
      let kind = null;
      let pw = 0;
      let ph = 0;
      if (roll < OBSTACLE.acChance) { kind = 'ac'; pw = 54; ph = 46; }
      else if (roll < OBSTACLE.acChance + OBSTACLE.ventChance) { kind = 'vent'; pw = 44; ph = 68; }
      else if (roll < OBSTACLE.acChance + OBSTACLE.ventChance + OBSTACLE.billboardChance) { kind = 'billboard'; pw = 120; ph = 128; }
      else if (roll < OBSTACLE.acChance + OBSTACLE.ventChance + OBSTACLE.billboardChance + OBSTACLE.antennaChance) { kind = 'antenna'; pw = 30; ph = 40; }
      if (kind && cursor - lastPropEnd.at >= OBSTACLE.minSpacing * 0.4 && cursor + pw < w - 30) {
        const px = b.x + cursor;
        if (kind === 'billboard') {
          // Collision box is the board only; the player slides under it.
          world.obstacles.push({ x: px, y: b.top - 128, w: pw, h: 70, kind, roof: b.top });
        } else {
          world.obstacles.push({ x: px, y: b.top - ph, w: pw, h: ph, kind, roof: b.top });
        }
        b.props = b.props || [];
        b.props.push({ kind, dx: cursor, w: pw, h: ph });
        lastPropEnd.at = cursor + pw;
        cursor += pw + random.range(210, 300);
      } else {
        cursor += random.range(90, 160);
      }
    }

    // Decoration: water tower or neon sign on some roofs (never an obstacle).
    if (random.chance(0.4)) {
      b.props = b.props || [];
      b.props.push({ kind: random.pick(['tower', 'sign', 'sign', 'dish']), dx: w - 96, w: 70, h: 110 });
    }

    // Coin line on the roof, sometimes a high arc that needs a double jump.
    if (random.chance(COIN.lineChance)) {
      const cy = random.chance(0.35) ? b.top - 170 : b.top - 46;
      const cx = b.x + random.range(60, Math.max(70, w - 180));
      for (let i = 0; i < 4; i += 1) {
        world.coins.push({ x: cx + i * 34, y: cy, r: COIN.size, taken: false, bob: random.range(0, 6.28) });
      }
    }

    // Power-up on some roofs.
    if (random.chance(POWERUP.boostChance)) {
      world.powerups.push({ x: b.x + random.range(80, Math.max(90, w - 80)), y: b.top - 60, kind: 'boost', taken: false });
    } else if (random.chance(POWERUP.heartChance)) {
      world.powerups.push({ x: b.x + random.range(80, Math.max(90, w - 80)), y: b.top - 60, kind: 'heart', taken: false });
    }

    // Gap coins: an arc over the gap that follows this roof.
    const gap = random.range(ROOF.minGap, jumpReach(world.state.speed));
    if (random.chance(COIN.arcChance)) {
      const gx = x + w + gap / 2;
      for (let i = -2; i <= 2; i += 1) {
        world.coins.push({
          x: gx + i * 34, y: b.top - 90 - (2 - Math.abs(i)) * 26, r: COIN.size, taken: false, bob: random.range(0, 6.28),
        });
      }
    }
    return { building: b, nextX: x + w + gap };
  }

  function generateAhead() {
    while (world.nextX < FIELD.width + 700) {
      const made = makeBuilding(world.nextX);
      world.nextX = made.nextX;
    }
  }

  function groundTopAt(px) {
    for (const b of world.buildings) {
      if (px >= b.x && px <= b.x + b.w) return b.top;
    }
    return null;
  }

  function shiftWorld(dx) {
    for (const list of [world.buildings, world.obstacles, world.coins, world.powerups, world.particles]) {
      for (const o of list) o.x += dx;
    }
    world.nextX += dx;
  }

  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i += 1) {
      const a = random.range(0, Math.PI * 2);
      const v = random.range(speed * 0.3, speed);
      world.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120,
        life: random.range(0.35, 0.7), maxLife: 0.7, color, size: random.range(3, 7), gravity: 900,
      });
    }
  }

  function respawn() {
    const p = world.player;
    const ahead = world.buildings.find((b) => b.x + b.w > p.x + 80);
    if (!ahead) return;
    const dx = -((ahead.x + 60) - p.x);
    shiftWorld(dx);
    p.y = ahead.top - p.h;
    p.vy = 0;
    p.onGround = true;
    p.jumps = 0;
    p.invuln = PLAYER.invulnerable;
  }

  function reset() {
    world.state = { score: 0, coins: 0, hearts: LIVES, heat: 1, speed: SPEED.start, distance: 0, time: 0, boost: 0, smashed: 0 };
    world.player = {
      x: PLAYER.x, y: 0, vy: 0, w: PLAYER.width, h: PLAYER.height,
      onGround: true, jumps: 0, sliding: false, slideTimer: 0,
      invuln: 0, coyote: 0, runPhase: 0, dead: false, landDust: 0,
    };
    world.buildings = [];
    world.obstacles = [];
    world.coins = [];
    world.powerups = [];
    world.particles = [];
    world.heli = { active: false, x: 900, y: 110, t: 0 };
    world.over = false;
    world.nextX = -80;
    // First roof is long and flat so the start is gentle.
    const first = { x: -80, w: 900, top: 520, id: 0, props: [] };
    world.buildings.push(first);
    world.nextX = first.x + first.w + 110;
    for (let i = 0; i < 3; i += 1) {
      world.coins.push({ x: 520 + i * 34, y: 520 - 46, r: COIN.size, taken: false, bob: i });
    }
    world.player.y = first.top - PLAYER.height;
    for (let i = 0; i < 7; i += 1) {
      world.clouds.push({ x: random.range(0, 1400), y: random.range(40, 220), w: random.range(120, 260), speed: random.range(6, 16) });
    }
    generateAhead();
  }

  /** Simple autopilot for the title screen and the staged screenshots. */
  function autopilot() {
    const p = world.player;
    const front = p.x + p.w;
    let jump = false;
    let slide = false;
    for (const o of world.obstacles) {
      const d = o.x - front;
      if (d > -10 && d < 190 && o.y + o.h > p.y) {
        if (o.kind === 'billboard') slide = d < 150;
        else if (p.onGround) jump = true;
      }
    }
    const gapAhead = groundTopAt(front + 130) === null && groundTopAt(front + 40) !== null;
    if (gapAhead && p.onGround) jump = true;
    return { jump, slide };
  }

  function step(dt, input, attract) {
    const s = world.state;
    const p = world.player;
    let events = 0;
    if (world.over) return events;

    s.time += dt;
    const baseSpeed = Math.min(SPEED.start + s.time * SPEED.perSecond, SPEED.max);
    s.boost = Math.max(0, s.boost - dt);
    s.speed = s.boost > 0 ? baseSpeed * SPEED.boostMult : baseSpeed;
    const scroll = s.speed * dt;
    s.distance += scroll;
    s.score += scroll * 0.1 * (s.boost > 0 ? 2 : 1);
    s.heat = Math.min(HEAT.max, 1 + Math.floor(s.distance / 12000));

    // Scroll the world.
    for (const b of world.buildings) b.x -= scroll;
    for (const o of world.obstacles) o.x -= scroll;
    for (const c of world.coins) c.x -= scroll;
    for (const u of world.powerups) u.x -= scroll;
    for (const pt of world.particles) { pt.x -= scroll * 0.4; }
    world.nextX -= scroll;
    generateAhead();
    while (world.buildings.length && world.buildings[0].x + world.buildings[0].w < -120) world.buildings.shift();
    world.obstacles = world.obstacles.filter((o) => o.x + o.w > -120);
    world.coins = world.coins.filter((c) => c.x > -60 && !c.taken);
    world.powerups = world.powerups.filter((u) => u.x > -60 && !u.taken);

    // Clouds and birds drift on their own parallax.
    for (const c of world.clouds) {
      c.x -= c.speed * dt;
      if (c.x + c.w < -50) { c.x = FIELD.width + 60; c.y = random.range(40, 220); }
    }
    if (random.chance(dt * 0.12) && world.birds.length < 3) {
      world.birds.push({ x: FIELD.width + 20, y: random.range(90, 240), speed: random.range(60, 110), phase: random.range(0, 6) });
    }
    for (const b of world.birds) b.x -= (b.speed + s.speed * 0.25) * dt;
    world.birds = world.birds.filter((b) => b.x > -40);

    // Helicopter joins the chase once the heat is up.
    const heli = world.heli;
    heli.t += dt;
    heli.active = s.heat >= HEAT.heliAt;
    if (heli.active) {
      const targetX = p.x + 240 + Math.sin(heli.t * 0.7) * 90;
      heli.x += (targetX - heli.x) * Math.min(1, dt * 1.5);
      heli.y = 108 + Math.sin(heli.t * 1.3) * 14;
    }

    // Player physics: keep the feet planted when the height changes (slide).
    const wantSlide = input.slide && p.onGround;
    const feetBefore = p.y + p.h;
    p.sliding = wantSlide;
    p.h = wantSlide ? PLAYER.slideHeight : PLAYER.height;
    p.y = feetBefore - p.h;
    if (input.jump) {
      if (p.onGround || p.coyote > 0) {
        p.vy = PLAYER.jumpVelocity;
        p.onGround = false;
        p.coyote = 0;
        p.jumps = 1;
        events |= EVENT_JUMP;
        burst(p.x + p.w / 2, p.y + p.h, '#cbb8e8', 5, 120);
      } else if (p.jumps < 2) {
        p.vy = PLAYER.doubleJumpVelocity;
        p.jumps = 2;
        events |= EVENT_DOUBLE;
        burst(p.x + p.w / 2, p.y + p.h, '#22e6ff', 8, 160);
      }
    }
    const prevFeet = p.y + p.h;
    p.vy = Math.min(p.vy + PLAYER.gravity * dt, PLAYER.maxFall);
    p.y += p.vy * dt;
    p.runPhase += dt * (p.onGround ? s.speed * 0.045 : 0);
    p.invuln = Math.max(0, p.invuln - dt);
    p.coyote = Math.max(0, p.coyote - dt);

    const feet = p.y + p.h;
    const centreX = p.x + p.w / 2;
    const top = groundTopAt(centreX);
    if (top !== null && p.vy >= 0 && feet >= top && prevFeet <= top + 42) {
      if (!p.onGround && p.vy > 500) burst(centreX, top, '#8d7bb8', 6, 140);
      p.y = top - p.h;
      p.vy = 0;
      p.onGround = true;
      p.jumps = 0;
      p.coyote = 0.1;
    } else if (top === null || feet < top - 2) {
      if (p.onGround && top === null) { p.onGround = false; p.coyote = 0.1; }
      else if (top !== null && feet < top - 2) p.onGround = false;
    }

    // Obstacle collisions.
    const pRect = { x: p.x + 4, y: p.y, w: p.w - 8, h: p.h };
    for (const o of world.obstacles) {
      if (rectsOverlap(pRect, o)) {
        if (s.boost > 0) {
          o.smashed = true;
          s.smashed += 1;
          s.score += 25;
          burst(o.x + o.w / 2, o.y + o.h / 2, '#22e6ff', 14, 260);
        } else if (p.invuln <= 0) {
          p.invuln = PLAYER.invulnerable;
          if (!attract) s.hearts -= 1;
          events |= EVENT_HIT;
          burst(centreX, p.y + p.h / 2, '#ff4757', 16, 300);
          if (s.hearts <= 0 && !attract) {
            world.over = true;
            p.dead = true;
            events |= EVENT_OVER;
            return events;
          }
        }
      }
    }
    world.obstacles = world.obstacles.filter((o) => !o.smashed);

    // Coins and power-ups.
    for (const c of world.coins) {
      const dx = c.x - centreX;
      const dy = (c.y + Math.sin(s.time * 3 + c.bob) * 3) - (p.y + p.h / 2);
      if (dx * dx + dy * dy < (c.r + 22) * (c.r + 22)) {
        c.taken = true;
        s.coins += 1;
        s.score += COIN.points;
        events |= EVENT_COIN;
        burst(c.x, c.y, '#ffd94a', 6, 150);
      }
    }
    for (const u of world.powerups) {
      if (!u.taken && rectsOverlap(pRect, { x: u.x - 16, y: u.y - 16, w: 32, h: 32 })) {
        u.taken = true;
        events |= EVENT_POWER;
        if (u.kind === 'boost') {
          s.boost = POWERUP.boostSeconds;
          burst(centreX, p.y + p.h / 2, '#22e6ff', 18, 280);
        } else {
          s.hearts = Math.min(MAX_HEARTS, s.hearts + 1);
          burst(centreX, p.y + p.h / 2, '#ff5e8a', 14, 220);
        }
      }
    }

    // Particles.
    for (const pt of world.particles) {
      pt.life -= dt;
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    world.particles = world.particles.filter((pt) => pt.life > 0);

    // Fell into a gap.
    if (p.y > FIELD.height + 60) {
      events |= EVENT_FALL;
      if (!attract) {
        s.hearts -= 1;
        if (s.hearts <= 0) {
          world.over = true;
          p.dead = true;
          events |= EVENT_OVER;
          return events;
        }
      }
      respawn();
    }

    return events;
  }

  reset();
  world.reset = reset;
  world.step = step;
  world.autopilot = autopilot;
  world.groundTopAt = groundTopAt;
  return world;
}
