// All sound is synthesised with WebAudio: no audio files, no network.
// The music is a quiet synthwave bass loop; it only starts after a user gesture.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  // A minor synthwave bass line (Hz): A1 C2 E2 G1, one note per beat.
  const BASS = [55, 65.41, 82.41, 49];
  const PAD = [220, 261.63, 329.63];

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac || ac.state === 'suspended') return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur + 0.02);
    } catch {
      // Audio is decoration; a failure must never break the game.
    }
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    const ac = ensure();
    if (!ac || ac.state === 'suspended') return;
    try {
      const len = Math.floor(ac.sampleRate * dur);
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      src.buffer = buffer;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      const gain = ac.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(ac.destination);
      src.start();
    } catch {
      // See above.
    }
  }

  function startMusic() {
    const ac = ensure();
    if (!ac || musicTimer !== null) return;
    try {
      if (ac.state === 'suspended') void ac.resume();
    } catch {
      return;
    }
    musicTimer = window.setInterval(() => {
      if (muted) return;
      const beat = musicStep % 8;
      const bar = Math.floor(musicStep / 8) % BASS.length;
      tone(BASS[bar], 0.22, 'sawtooth', 0.05);
      if (beat === 0) tone(PAD[bar % PAD.length], 0.9, 'triangle', 0.03);
      if (beat === 4) tone(PAD[(bar + 1) % PAD.length], 0.5, 'triangle', 0.025);
      musicStep += 1;
    }, 240);
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') void ac.resume();
      startMusic();
    },
    jump() {
      tone(320, 0.16, 'square', 0.08, 720);
    },
    doubleJump() {
      tone(420, 0.16, 'square', 0.08, 980);
    },
    coin() {
      tone(988, 0.09, 'sine', 0.09);
      window.setTimeout(() => tone(1319, 0.14, 'sine', 0.09), 70);
    },
    power() {
      [523, 659, 784, 1047].forEach((f, i) => window.setTimeout(() => tone(f, 0.16, 'triangle', 0.09), i * 70));
    },
    hit() {
      noise(0.25, 0.22, 900);
      tone(140, 0.22, 'sawtooth', 0.12, 60);
    },
    fall() {
      tone(500, 0.5, 'sine', 0.08, 120);
    },
    over() {
      [392, 311, 233, 175].forEach((f, i) => window.setTimeout(() => tone(f, 0.3, 'triangle', 0.09), i * 160));
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
