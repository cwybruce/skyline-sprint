// Skyline Sprint — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Player physics. x is fixed on screen; the world scrolls past. */
export const PLAYER = {
  x: 320,
  width: 34,
  height: 62,
  slideHeight: 30,
  gravity: 2600,
  jumpVelocity: -880,
  doubleJumpVelocity: -780,
  maxFall: 1200,
  invulnerable: 1.6,
};

export const LIVES = 3;
export const MAX_HEARTS = 3;

/** Scroll speed in px/s; grows with distance, capped. */
export const SPEED = { start: 380, perSecond: 7, max: 780, boostMult: 1.35 };

/** Rooftop generation. */
export const ROOF = {
  minWidth: 240,
  maxWidth: 560,
  minTop: 380,
  maxTop: 560,
  minGap: 90,
  maxGap: 250,
  /** Gap grows with speed so late jumps stay fair. */
  gapPerSpeed: 0.12,
};

/** Obstacle chances per rooftop (rolled once per roof). */
export const OBSTACLE = {
  acChance: 0.55,
  ventChance: 0.3,
  billboardChance: 0.34,
  antennaChance: 0.22,
  /** Minimum px between two obstacles on the same roof. */
  minSpacing: 170,
};

export const COIN = {
  size: 13,
  points: 10,
  arcChance: 0.75,
  lineChance: 0.5,
};

export const POWERUP = {
  boostSeconds: 4,
  heartChance: 0.05,
  boostChance: 0.16,
};

/** Heat (wanted) level: 1 star per 1400 m of distance, capped at 5. */
export const HEAT = { metresPerStar: 1400, max: 5, heliAt: 3 };

export const PALETTE = {
  skyTop: '#2b1055',
  skyMid: '#7597de',
  skyLow: '#ff7e5f',
  horizon: '#feb47b',
  sunCore: '#ffd76a',
  sunGlow: '#ff9a5a',
  farSkyline: '#4a2b6d',
  midSkyline: '#33204f',
  roofTop: '#241a33',
  roofFace: '#1a1226',
  roofEdge: '#ff5e8a',
  windowLit: '#ffd166',
  windowDark: '#2c2140',
  neonPink: '#ff2e88',
  neonCyan: '#22e6ff',
  neonLime: '#b6ff3c',
  neonAmber: '#ffb347',
  playerJacket: '#ff2e88',
  playerPants: '#1d2b53',
  playerSkin: '#f2c09a',
  playerHair: '#14101f',
  coin: '#ffd94a',
  coinEdge: '#e8a90c',
  text: '#fff6ea',
  muted: '#cbb8e8',
  panel: 'rgba(26, 14, 44, 0.82)',
  danger: '#ff4757',
  boost: '#22e6ff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'skyline-sprint.best';
