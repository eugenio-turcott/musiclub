// src/utils/gashaponAudio.js

class GashaponSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    try {
      const saved = localStorage.getItem('musiclub_gashapon_sound');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch (e) {
      this.enabled = true;
    }
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    try {
      localStorage.setItem('musiclub_gashapon_sound', String(enabled));
    } catch (e) {}
  }

  isEnabled() {
    return this.enabled;
  }

  // 1. Coin Insert: Crisp metallic ping & coin sliding down chute
  playCoinInsert() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);

    // Second metallic ping
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2600, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(3200, now + 0.18);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.2, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(now + 0.06);
    osc2.stop(now + 0.3);
  }

  // 2. Crank Turn: Heavy ratchet mechanical clicks
  playCrankTurn(speed = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const clickCount = 6;
    const interval = (0.05 / speed);

    for (let i = 0; i < clickCount; i++) {
      const clickTime = now + (i * interval);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, clickTime);
      osc.frequency.exponentialRampToValueAtTime(40, clickTime + 0.03);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600 + i * 80, clickTime);
      filter.Q.setValueAtTime(3, clickTime);

      gain.gain.setValueAtTime(0.22, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  }

  // 3. Globe Shake: Rumbling capsule balls swirling and colliding
  playGlobeShake() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const count = 8;

    for (let i = 0; i < count; i++) {
      const hitTime = now + (i * 0.12) + (Math.random() * 0.04);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, hitTime);
      osc.frequency.exponentialRampToValueAtTime(100, hitTime + 0.08);

      gain.gain.setValueAtTime(0.15, hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(hitTime);
      osc.stop(hitTime + 0.1);
    }
  }

  // 4. Capsule Drop: Rolling swoosh and bounce thud in the collection tray
  playCapsuleDrop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Slide swoosh
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.2), this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    filter.Q.setValueAtTime(2, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.2);

    // Primary impact bounce
    const impactTime = now + 0.22;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, impactTime);
    osc.frequency.exponentialRampToValueAtTime(80, impactTime + 0.12);

    gain.gain.setValueAtTime(0.35, impactTime);
    gain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(impactTime);
    osc.stop(impactTime + 0.15);

    // Second smaller bounce
    const bounce2Time = impactTime + 0.12;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(240, bounce2Time);
    osc2.frequency.exponentialRampToValueAtTime(90, bounce2Time + 0.08);

    gain2.gain.setValueAtTime(0.2, bounce2Time);
    gain2.gain.exponentialRampToValueAtTime(0.001, bounce2Time + 0.09);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(bounce2Time);
    osc2.stop(bounce2Time + 0.1);
  }

  // 5. Capsule Pop: Suction release & crisp crystal snap
  playCapsuleOpen() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pop oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);

    // Sparkle noise
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1800, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.2);

    gain2.gain.setValueAtTime(0.18, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(now + 0.04);
    osc2.stop(now + 0.25);
  }

  // 6. Fanfare Reveal: Sparkly celebratory arpeggio (C major 9 / Pentatonic glow)
  playFanfare(rarity = 'epic') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = rarity === 'legendary' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5, E5, G5, C6, E6, G6
      : [440.00, 554.37, 659.25, 880.00, 1108.73]; // A4, C#5, E5, A5, C#6

    notes.forEach((freq, i) => {
      const noteTime = now + (i * 0.07);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const duration = i === notes.length - 1 ? 0.8 : 0.35;
      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  }

  // 7. Review Submitted / XP Earned: Upward triumph chime
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50];

    chord.forEach((freq, idx) => {
      const t = now + (idx * 0.06);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.4);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }
}

export const gashaponSound = new GashaponSoundEngine();
