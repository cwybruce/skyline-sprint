# Skyline Sprint — Dossier

A 2D rooftop runner set in Neon Bay at sunset. The player sprints automatically
across procedurally generated rooftops; the only inputs are jump (with a
double jump), slide, pause and mute. Speed rises the longer you survive, the
heat level rises with distance, and a police helicopter joins the chase at
heat 3.

## How to play

- **Run:** the runner moves on their own; the rooftops scroll past.
- **Jump:** Space / ↑ / W / tap. Jump again mid-air for a double jump.
  Clearing the gap between two towers is the core skill; coin arcs hang over
  the gaps.
- **Slide:** hold ↓ / S to slide under billboards. A standing runner is too
  tall to pass under a board; a sliding runner fits.
- **Obstacles:** air-conditioning units and vents are jumped; billboards are
  slid under; antennas mark the roofline. Hitting one costs a heart.
- **Falling:** missing a roof costs a heart and the runner catches the next
  rooftop. Three hearts, then the run ends.
- **Coins:** gold coins are worth 10 points each; arcs over gaps reward the
  riskier jumps.
- **Neon Boost:** a cyan lightning pickup makes the runner invincible for
  4 seconds and lets them smash straight through obstacles (+25 each) while
  scoring double.
- **Hearts:** a rare pink heart pickup restores one heart (max 3).
- **Heat:** 1–5 stars. One star per stretch of distance; at 3 stars the
  police helicopter PD-7 appears overhead with a sweeping searchlight.
- **Score:** distance plus coins, smashes and the boost multiplier. Best
  score is saved in the browser.

## Screens

- **Title:** the runner auto-plays behind the menu (attract mode).
- **Play:** HUD shows score, coins, best, hearts, heat stars, speed and
  progress to the next heat star; a NEON BOOST banner appears while boosted.
- **Paused:** P / Esc, or leaving the tab.
- **Game over:** final score, coins and best; Space runs it back.

## Presentation

- Synthwave sunset: striped sun, purple-to-orange gradient sky, drifting
  clouds, birds, two parallax skyline layers with lit windows, and a street
  far below with car light streaks.
- Neon signs (HOTEL, PIZZA, 24H, NEON, BAR, TACOS, MOTEL, ARCADE), water
  towers, dishes and antennas dress the rooftops.
- Synthesised WebAudio sound only (no audio files): jump, double jump, coin,
  power-up, hit, fall, game-over jingles and a quiet synthwave bass loop.
  M toggles mute. No network request is made at any point.

## Screenshots

All four are real renders of the game's own code in desktop Chrome
(`?shot=…&seed=7` stages the scene deterministically):

1. `1-start.jpg` — title screen over the attract-mode run.
2. `2-play.jpg` — mid-run: rooftops, coins, HUD, heat stars.
3. `3-jump.jpg` — the runner mid-air over a gap, coin arc ahead.
4. `4-end.jpg` — game-over screen with final score and best.

## Tech

- Static files under `game/` (ES modules, no build step, no libraries).
- `game/index.html` + `game/src/` (config, random, input, audio, world,
  render, shots, main). `main.ts` copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `node serve.ts` serves `game/` on http://localhost:8080 for local play.
