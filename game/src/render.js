// Skyline Sprint renderer: a synthwave sunset over Neon Bay — striped sun,
// parallax skylines, neon signs, lit windows, an animated runner, and the HUD.
// The playfield is a fixed 1280x720 logical area scaled to the window.

import { FIELD, PALETTE, FONT, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

const SIGN_WORDS = ['HOTEL', 'PIZZA', '24H', 'NEON', 'BAR', 'TACOS', 'MOTEL', 'ARCADE'];
const SIGN_COLORS = [PALETTE.neonPink, PALETTE.neonCyan, PALETTE.neonLime, PALETTE.neonAmber];

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawSky(world) {
    const { width: W, height: H } = FIELD;
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.78);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.45, '#7b2f8b');
    g.addColorStop(0.75, PALETTE.skyLow);
    g.addColorStop(1, PALETTE.horizon);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Striped synthwave sun, low over the bay.
    const sunX = 950;
    const sunY = 430;
    const sunR = 130;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.1);
    glow.addColorStop(0, 'rgba(255, 154, 90, 0.55)');
    glow.addColorStop(1, 'rgba(255, 154, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunR * 2.2, sunY - sunR * 2.2, sunR * 4.4, sunR * 4.4);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.clip();
    const sg = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sg.addColorStop(0, PALETTE.sunCore);
    sg.addColorStop(1, '#ff5e62');
    ctx.fillStyle = sg;
    ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
    // Slats cut the lower half.
    ctx.fillStyle = 'rgba(255, 126, 95, 0.9)';
    let y = sunY + 8;
    let h = 3;
    while (y < sunY + sunR) {
      ctx.fillRect(sunX - sunR, y, sunR * 2, h);
      y += h + 14;
      h += 2;
    }
    ctx.restore();

    // Clouds: pink streaks.
    for (const c of world.clouds) {
      ctx.fillStyle = 'rgba(255, 183, 197, 0.35)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 183, 197, 0.22)';
      ctx.beginPath();
      ctx.ellipse(c.x + 20, c.y + 8, c.w / 3, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Birds.
    ctx.strokeStyle = 'rgba(30, 16, 48, 0.8)';
    ctx.lineWidth = 2;
    for (const b of world.birds) {
      const flap = Math.sin(world.state.time * 10 + b.phase) * 5;
      ctx.beginPath();
      ctx.moveTo(b.x - 8, b.y);
      ctx.quadraticCurveTo(b.x - 3, b.y - 4 - flap, b.x, b.y);
      ctx.quadraticCurveTo(b.x + 3, b.y - 4 - flap, b.x + 8, b.y);
      ctx.stroke();
    }
  }

  function drawParallax(world, factor, baseY, color, minH, maxH) {
    const { width: W } = FIELD;
    const offset = (world.state.distance * factor) % 320;
    const slot = 320;
    for (let x = -offset - slot; x < W + slot; x += slot) {
      const i = Math.floor((world.state.distance * factor + x + offset) / slot);
      const bw = 150 + hash(i * 7 + 1) * 140;
      const bh = minH + hash(i * 13 + 5) * (maxH - minH);
      const bx = x + hash(i * 3 + 2) * 40;
      ctx.fillStyle = color;
      ctx.fillRect(bx, baseY - bh, bw, bh + (FIELD.height - baseY));
      // Antenna on some towers.
      if (hash(i * 11 + 4) > 0.6) {
        ctx.fillRect(bx + bw / 2 - 2, baseY - bh - 26, 4, 26);
        ctx.fillStyle = PALETTE.neonPink;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, baseY - bh - 28, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Lit windows.
      ctx.fillStyle = 'rgba(255, 209, 102, 0.5)';
      const cols = Math.floor(bw / 26);
      const rows = Math.floor(bh / 34);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (hash(i * 101 + r * 17 + c * 7) > 0.62) {
            ctx.fillRect(bx + 8 + c * 26, baseY - bh + 10 + r * 34, 10, 14);
          }
        }
      }
    }
  }

  function drawStreet(world) {
    const { width: W, height: H } = FIELD;
    const g = ctx.createLinearGradient(0, 640, 0, H);
    g.addColorStop(0, '#160b26');
    g.addColorStop(1, '#0a0514');
    ctx.fillStyle = g;
    ctx.fillRect(0, 640, W, H - 640);
    // Car light streaks far below.
    for (let i = 0; i < 6; i += 1) {
      const speed = 500 + i * 60;
      const x = ((world.state.distance * 1.4 + i * 260) % (W + 200)) - 100;
      ctx.fillStyle = i % 2 ? 'rgba(255, 214, 102, 0.85)' : 'rgba(255, 90, 90, 0.85)';
      ctx.fillRect(W - x, 692 + (i % 3) * 8, 26, 4);
    }
  }

  function drawBuildings(world) {
    const { height: H } = FIELD;
    for (const b of world.buildings) {
      // Face.
      ctx.fillStyle = PALETTE.roofFace;
      ctx.fillRect(b.x, b.top, b.w, H - b.top);
      // Roof slab + neon edge.
      ctx.fillStyle = PALETTE.roofTop;
      ctx.fillRect(b.x, b.top - 6, b.w, 10);
      ctx.fillStyle = PALETTE.roofEdge;
      ctx.fillRect(b.x, b.top - 6, b.w, 2);
      // Windows on the face.
      const cols = Math.floor((b.w - 20) / 30);
      const rows = Math.floor((H - b.top - 30) / 44);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const lit = hash(b.id * 131 + r * 17 + c * 7) > 0.55;
          ctx.fillStyle = lit ? PALETTE.windowLit : PALETTE.windowDark;
          ctx.globalAlpha = lit ? 0.9 : 1;
          ctx.fillRect(b.x + 12 + c * 30, b.top + 16 + r * 44, 16, 22);
          ctx.globalAlpha = 1;
        }
      }
      // Props.
      for (const prop of b.props || []) {
        drawProp(b, prop);
      }
    }
  }

  function drawProp(b, prop) {
    const x = b.x + prop.dx;
    const top = b.top;
    if (prop.kind === 'ac') {
      ctx.fillStyle = '#3a2b52';
      ctx.fillRect(x, top - 46, 54, 46);
      ctx.fillStyle = '#57406f';
      ctx.fillRect(x + 6, top - 40, 42, 8);
      ctx.fillStyle = '#241a33';
      ctx.fillRect(x + 6, top - 28, 42, 12);
    } else if (prop.kind === 'vent') {
      ctx.fillStyle = '#4a3560';
      ctx.fillRect(x, top - 68, 44, 68);
      ctx.fillStyle = '#6b4d85';
      ctx.fillRect(x - 4, top - 74, 52, 8);
      ctx.fillStyle = PALETTE.neonCyan;
      ctx.fillRect(x + 8, top - 56, 6, 40);
    } else if (prop.kind === 'billboard') {
      // Legs + board; the board is the obstacle, the gap below it is the slide lane.
      ctx.fillStyle = '#2c2140';
      ctx.fillRect(x + 10, top - 58, 8, 58);
      ctx.fillRect(x + prop.w - 18, top - 58, 8, 58);
      const glow = hash(prop.dx * 13 + b.id) > 0.5 ? PALETTE.neonPink : PALETTE.neonCyan;
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#1c1030';
      ctx.fillRect(x, top - 128, prop.w, 70);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, top - 126, prop.w - 4, 66);
      ctx.fillStyle = glow;
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SIGN_WORDS[Math.floor(b.id + prop.dx) % SIGN_WORDS.length], x + prop.w / 2, top - 93);
      ctx.restore();
    } else if (prop.kind === 'antenna') {
      ctx.fillStyle = '#3a2b52';
      ctx.fillRect(x + 12, top - 40, 6, 40);
      ctx.fillRect(x, top - 40, 30, 8);
      ctx.strokeStyle = 'rgba(203, 184, 232, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 15, top - 118, x + 2, top - 40);
      ctx.moveTo(x + 15, top - 118, x + 28, top - 40);
      ctx.stroke();
      ctx.fillStyle = '#57406f';
      ctx.fillRect(x + 13, top - 118, 4, 80);
      ctx.fillStyle = PALETTE.neonPink;
      ctx.beginPath();
      ctx.arc(x + 15, top - 120, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.kind === 'tower') {
      ctx.fillStyle = '#33244a';
      ctx.fillRect(x + 8, top - 110, 54, 110);
      ctx.fillStyle = '#4a3560';
      ctx.beginPath();
      ctx.moveTo(x, top - 110);
      ctx.lineTo(x + 35, top - 138);
      ctx.lineTo(x + 70, top - 110);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#241a33';
      ctx.fillRect(x + 30, top - 40, 10, 40);
    } else if (prop.kind === 'sign') {
      const color = SIGN_COLORS[(b.id + prop.dx) % SIGN_COLORS.length];
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = color;
      ctx.font = `bold 30px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SIGN_WORDS[Math.floor(b.id * 3 + prop.dx) % SIGN_WORDS.length], x + 35, top - 84);
      ctx.restore();
      ctx.fillStyle = '#2c2140';
      ctx.fillRect(x + 30, top - 60, 8, 60);
    } else if (prop.kind === 'dish') {
      ctx.strokeStyle = '#57406f';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x + 35, top - 66, 26, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = '#3a2b52';
      ctx.fillRect(x + 32, top - 66, 6, 66);
    }
  }

  function drawCoins(world) {
    for (const c of world.coins) {
      const bobY = c.y + Math.sin(world.state.time * 3 + c.bob) * 3;
      ctx.save();
      ctx.shadowColor = PALETTE.coin;
      ctx.shadowBlur = 10;
      ctx.fillStyle = PALETTE.coin;
      ctx.beginPath();
      ctx.arc(c.x, bobY, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = PALETTE.coinEdge;
      ctx.beginPath();
      ctx.arc(c.x, bobY, c.r - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(c.x - 3, bobY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const u of world.powerups) {
      const bobY = u.y + Math.sin(world.state.time * 3 + u.x) * 3;
      ctx.save();
      if (u.kind === 'boost') {
        ctx.shadowColor = PALETTE.boost;
        ctx.shadowBlur = 16;
        ctx.fillStyle = PALETTE.boost;
        ctx.beginPath();
        ctx.arc(u.x, bobY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#062a33';
        ctx.beginPath();
        ctx.moveTo(u.x + 4, bobY - 14);
        ctx.lineTo(u.x - 7, bobY + 2);
        ctx.lineTo(u.x + 1, bobY + 2);
        ctx.lineTo(u.x - 4, bobY + 14);
        ctx.lineTo(u.x + 8, bobY - 3);
        ctx.lineTo(u.x, bobY - 3);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.shadowColor = PALETTE.neonPink;
        ctx.shadowBlur = 16;
        ctx.fillStyle = PALETTE.neonPink;
        drawHeart(u.x, bobY, 15);
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  }

  function drawHeart(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9);
    ctx.fill();
  }

  function drawObstacles(world) {
    for (const o of world.obstacles) {
      if (o.kind === 'billboard') continue; // the prop painter draws the board
      // A soft red edge marks what hurts.
      ctx.fillStyle = 'rgba(255, 71, 87, 0.9)';
      ctx.fillRect(o.x - 2, o.y - 2, o.w + 4, 3);
    }
  }

  function drawParticles(world) {
    for (const pt of world.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(world) {
    const p = world.player;
    const s = world.state;
    if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0 && !p.dead) return; // blink
    const feetX = p.x + p.w / 2;
    const feetY = p.y + p.h;
    const run = p.runPhase;
    const legSwing = p.onGround ? Math.sin(run) * 12 : 6;
    const boostGlow = s.boost > 0;

    ctx.save();
    if (boostGlow) {
      ctx.shadowColor = PALETTE.boost;
      ctx.shadowBlur = 22;
    }
    // Scarf trailing behind.
    ctx.strokeStyle = PALETTE.neonCyan;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x + 8, p.y + 16);
    const wave = Math.sin(world.state.time * 14) * 5;
    ctx.quadraticCurveTo(p.x - 8, p.y + 14 + wave, p.x - 26, p.y + 20 + wave * 1.6);
    ctx.stroke();

    if (p.sliding) {
      // Low slide: body horizontal, feet first.
      ctx.fillStyle = PALETTE.playerPants;
      ctx.fillRect(p.x - 2, p.y + 14, p.w + 10, 14);
      ctx.fillStyle = PALETTE.playerJacket;
      ctx.fillRect(p.x + 2, p.y + 6, p.w - 2, 16);
      ctx.fillStyle = PALETTE.playerSkin;
      ctx.beginPath();
      ctx.arc(p.x + p.w - 2, p.y + 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.playerHair;
      ctx.beginPath();
      ctx.arc(p.x + p.w - 4, p.y + 6, 9, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      // Legs.
      ctx.strokeStyle = PALETTE.playerPants;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      const hipY = p.y + 34;
      ctx.beginPath();
      ctx.moveTo(p.x + 15, hipY);
      ctx.lineTo(p.x + 15 + legSwing, feetY - 2);
      ctx.moveTo(p.x + 19, hipY);
      ctx.lineTo(p.x + 19 - legSwing, feetY - 2);
      ctx.stroke();
      // Shoes.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + 11 + legSwing, feetY - 6, 10, 5);
      ctx.fillRect(p.x + 15 - legSwing, feetY - 6, 10, 5);
      // Torso: neon jacket.
      ctx.fillStyle = PALETTE.playerJacket;
      ctx.beginPath();
      ctx.roundRect(p.x + 6, p.y + 14, 24, 24, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(p.x + 16, p.y + 14, 4, 24);
      // Arms pumping.
      ctx.strokeStyle = PALETTE.playerJacket;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x + 12, p.y + 18);
      ctx.lineTo(p.x + 12 - legSwing * 0.7, p.y + 30);
      ctx.moveTo(p.x + 26, p.y + 18);
      ctx.lineTo(p.x + 26 + legSwing * 0.7, p.y + 30);
      ctx.stroke();
      // Head.
      ctx.fillStyle = PALETTE.playerSkin;
      ctx.beginPath();
      ctx.arc(p.x + 18, p.y + 8, 10, 0, Math.PI * 2);
      ctx.fill();
      // Hair + headband.
      ctx.fillStyle = PALETTE.playerHair;
      ctx.beginPath();
      ctx.arc(p.x + 18, p.y + 5, 10, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.neonCyan;
      ctx.fillRect(p.x + 8, p.y + 4, 20, 3);
    }
    ctx.restore();
    void feetX;
  }

  function drawHeli(world) {
    const heli = world.heli;
    if (!heli.active) return;
    const t = heli.t;
    // Searchlight sweeping the rooftops.
    const sweep = Math.sin(t * 1.8) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#fff8c4';
    ctx.beginPath();
    ctx.moveTo(heli.x, heli.y + 8);
    ctx.lineTo(heli.x - 70 + sweep * 160, 640);
    ctx.lineTo(heli.x + 70 + sweep * 160, 640);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Body.
    ctx.fillStyle = '#1d2b3a';
    ctx.beginPath();
    ctx.ellipse(heli.x, heli.y, 34, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(heli.x + 28, heli.y - 4, 34, 7);
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(heli.x + 56, heli.y - 12, 6, 14);
    // Cockpit glass.
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.ellipse(heli.x - 20, heli.y - 2, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rotor.
    ctx.strokeStyle = 'rgba(203, 184, 232, 0.9)';
    ctx.lineWidth = 3;
    const rotor = Math.sin(t * 40) * 44;
    ctx.beginPath();
    ctx.moveTo(heli.x - rotor, heli.y - 16);
    ctx.lineTo(heli.x + rotor, heli.y - 16);
    ctx.stroke();
    // Blinking beacon.
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(heli.x, heli.y + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // "PD" tag.
    ctx.fillStyle = '#cbb8e8';
    ctx.font = `bold 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('PD-7', heli.x, heli.y - 22);
  }

  function drawHud(world, best) {
    const s = world.state;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    // Score panel.
    ctx.fillStyle = PALETTE.panel;
    ctx.beginPath();
    ctx.roundRect(18, 16, 250, 84, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText('SCORE', 34, 38);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 34px ${FONT}`;
    ctx.fillText(String(Math.floor(s.score)), 32, 74);
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(196, 62, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5200';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('C', 196, 67);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillText(String(s.coins), 212, 69);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`BEST ${Math.max(best, Math.floor(s.score))}`, 34, 94);

    // Hearts + heat, top right.
    const hx = FIELD.width - 24;
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < s.hearts ? PALETTE.neonPink : 'rgba(255, 94, 138, 0.25)';
      ctx.save();
      ctx.translate(hx - i * 40, 44);
      drawHeart(0, 0, 13);
      ctx.restore();
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 12px ${FONT}`;
    ctx.fillText('HEAT', FIELD.width - 24, 78);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i < s.heat ? '#ff9f1c' : 'rgba(255, 159, 28, 0.25)';
      ctx.font = '20px sans-serif';
      ctx.fillText('★', FIELD.width - 24 - i * 26, 100);
    }
    ctx.textAlign = 'left';
    // Speed + next-star progress.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`${Math.round(s.speed * 0.36)} km/h`, FIELD.width - 130, 126);
    const toNext = 12000 - (s.distance % 12000);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(FIELD.width - 130, 134, 106, 5);
    ctx.fillStyle = '#ff9f1c';
    ctx.fillRect(FIELD.width - 130, 134, 106 * (1 - toNext / 12000), 5);
    void toNext;

    if (s.boost > 0) {
      ctx.save();
      ctx.shadowColor = PALETTE.boost;
      ctx.shadowBlur = 18;
      ctx.fillStyle = PALETTE.boost;
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(`NEON BOOST ${s.boost.toFixed(1)}s — SMASH THROUGH!`, FIELD.width / 2, 56);
      ctx.restore();
    }
  }

  function panel(title, lines, accent) {
    const { width: W, height: H } = FIELD;
    ctx.fillStyle = 'rgba(16, 8, 30, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.panel;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 330, H / 2 - 190, 660, 380, 18);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24;
    ctx.fillStyle = accent;
    ctx.font = `bold 54px ${FONT}`;
    ctx.fillText(title, W / 2, H / 2 - 96);
    ctx.restore();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `20px ${FONT}`;
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, H / 2 - 30 + i * 34);
    });
  }

  function draw(screen, world, best) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(canvas.width / dpr / FIELD.width, canvas.height / dpr / FIELD.height);
    const ox = (canvas.width / dpr - FIELD.width * scale) / 2;
    const oy = (canvas.height / dpr - FIELD.height * scale) / 2;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);

    drawSky(world);
    drawParallax(world, 0.12, 560, PALETTE.farSkyline, 120, 260);
    drawParallax(world, 0.3, 610, PALETTE.midSkyline, 90, 220);
    drawStreet(world);
    drawBuildings(world);
    drawCoins(world);
    drawObstacles(world);
    drawParticles(world);
    drawPlayer(world);
    drawHeli(world);

    // Vignette.
    const vg = ctx.createRadialGradient(640, 360, 320, 640, 360, 780);
    vg.addColorStop(0, 'rgba(10, 5, 20, 0)');
    vg.addColorStop(1, 'rgba(10, 5, 20, 0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(world, best);

    if (screen === SCREEN_TITLE) {
      panel('SKYLINE SPRINT', [
        'Neon Bay rooftop run — chase the sunset, don\'t look down.',
        'SPACE / ↑ / TAP — jump (twice for a double jump)',
        '↓ / S — slide under billboards   ·   P — pause   ·   M — mute',
        `BEST ${best}`,
        'PRESS SPACE TO RUN',
      ], PALETTE.neonPink);
    } else if (screen === SCREEN_PAUSED) {
      panel('PAUSED', ['Take a breath. The sunset waits.', 'P / SPACE — resume'], PALETTE.neonCyan);
    } else if (screen === SCREEN_OVER) {
      const s = world.state;
      panel('WIPED OUT', [
        `SCORE ${Math.floor(s.score)}   ·   COINS ${s.coins}   ·   BEST ${Math.max(best, Math.floor(s.score))}`,
        s.hearts <= 0 ? 'The rooftops win this time.' : '',
        'SPACE — run it back',
      ], PALETTE.danger);
    }
  }

  return { draw };
}
