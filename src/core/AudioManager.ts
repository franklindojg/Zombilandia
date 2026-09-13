/**
 * BloxVerse 3D - AudioManager (Web Audio API Synthesizer)
 * High performance, zero asset downloads, works smoothly on mobile Android and desktop.
 */

export class AudioManager {
  private static instance: AudioManager | null = null;
  private ctx: AudioContext | null = null;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.4;
  private isMuted: boolean = false;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmInterval: any = null;
  private isBgmPlaying: boolean = false;

  private constructor() {
    // Lazy initialize on first interaction
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(): void {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  public playJump(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.14);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // AudioContext safe fail
    }
  }

  public playCoin(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Arpeggio note 1 (B5 = 987Hz)
      osc1.frequency.setValueAtTime(987.77, now);
      // Arpeggio note 2 (E6 = 1318.5Hz)
      osc1.frequency.setValueAtTime(1318.5, now + 0.08);

      osc2.frequency.setValueAtTime(1975.5, now + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.42);
      osc2.stop(now + 0.42);
    } catch {
      // Safe
    }
  }

  public playCheckpoint(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // 3 uplifting chord notes (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        const startTime = now + idx * 0.07;
        gain.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Safe
    }
  }

  public playTrampoline(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.25);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Safe
    }
  }

  public playDamage(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Safe
    }
  }

  public playLand(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Safe
    }
  }

  public playInteract(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(660, now + 0.06);

      gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Safe
    }
  }

  // --- HORROR SOUND SYSTEM ---

  public playDoorCreak(isOpen: boolean): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // Creaking wooden door friction sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      if (isOpen) {
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.linearRampToValueAtTime(160, now + 0.25);
        osc.frequency.linearRampToValueAtTime(80, now + 0.5);
      } else {
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.35);
      }

      // Filter to sound like heavy wood
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(this.sfxVolume * 0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isOpen ? 0.55 : 0.4));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + (isOpen ? 0.6 : 0.45));

      // Add door latch click
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(220, now + (isOpen ? 0.02 : 0.3));
      clickGain.gain.setValueAtTime(this.sfxVolume * 0.18, now + (isOpen ? 0.02 : 0.3));
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + (isOpen ? 0.08 : 0.36));
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now + (isOpen ? 0.02 : 0.3));
      clickOsc.stop(now + (isOpen ? 0.1 : 0.38));
    } catch {
      // Safe
    }
  }

  public playFlashlightClick(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Safe
    }
  }

  public playGhostScreech(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // Dissonant supernatural shrieking wail
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      lfo.type = 'triangle';

      osc1.frequency.setValueAtTime(650, now);
      osc1.frequency.exponentialRampToValueAtTime(920, now + 0.4);
      osc1.frequency.exponentialRampToValueAtTime(420, now + 1.2);

      osc2.frequency.setValueAtTime(675, now); // Dissonant beating
      osc2.frequency.exponentialRampToValueAtTime(950, now + 0.4);
      osc2.frequency.exponentialRampToValueAtTime(405, now + 1.2);

      // Tremolo/Vibrato LFO
      lfo.frequency.setValueAtTime(14, now);
      lfoGain.gain.setValueAtTime(80, now);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(now + 1.45);
      osc1.stop(now + 1.45);
      osc2.stop(now + 1.45);
    } catch {
      // Safe
    }
  }

  public playKeyPickup(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // Metallic resonant chime
      const freqs = [784, 987, 1318, 1568];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(this.sfxVolume * 0.28, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.65);
      });
    } catch {
      // Safe
    }
  }

  public playJumpscare(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // Heavy discord blast + sudden noise
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(110, now);
      osc1.frequency.linearRampToValueAtTime(55, now + 0.8);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(840, now);
      osc2.frequency.exponentialRampToValueAtTime(140, now + 0.9);

      gain.gain.setValueAtTime(this.sfxVolume * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.1);
      osc2.stop(now + 1.1);
    } catch {
      // Safe
    }
  }

  public playDoorUnlocked(): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      // Heavy iron mechanism unlocking
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(360, now + 0.12);
      osc.frequency.setValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      // Safe
    }
  }

  // Dynamic Heartbeat System
  private heartbeatInterval: any = null;
  private lastHeartbeatDistance: number = 999;

  public updateHeartbeat(distanceToGhost: number): void {
    this.lastHeartbeatDistance = distanceToGhost;

    // Ghost is far (> 35m), stop heartbeat
    if (distanceToGhost > 35) {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      return;
    }

    // Interval maps from 1100ms (at 35m) to 320ms (at < 5m)
    const normalized = Math.max(0, Math.min(1, (distanceToGhost - 5) / 30));
    const intervalMs = Math.round(320 + normalized * 780);

    if (!this.heartbeatInterval) {
      this.playSingleHeartbeat(distanceToGhost);
      this.heartbeatInterval = setInterval(() => {
        this.playSingleHeartbeat(this.lastHeartbeatDistance);
      }, intervalMs);
    }
  }

  private playSingleHeartbeat(distance: number): void {
    this.init();
    if (!this.ctx || this.isMuted || this.sfxVolume <= 0) return;

    try {
      const now = this.ctx.currentTime;
      const proximity = Math.max(0.15, Math.min(1.0, 1 - (distance / 35)));

      // Thump 1 (Lub)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(70, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      gain1.gain.setValueAtTime(this.sfxVolume * 0.45 * proximity, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Thump 2 (Dub) slightly higher pitch, delayed by 140ms
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(60, now + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.26);

      gain2.gain.setValueAtTime(this.sfxVolume * 0.38 * proximity, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.29);
    } catch {
      // Safe
    }
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public startBackgroundMusic(): void {
    if (this.isBgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    // Dark ominous horror ambient drone (diminished / minor notes with sub-bass drone)
    const horrorNotes = [65.41, 69.30, 77.78, 82.41, 103.83, 116.54]; // C2, C#2, Eb2, E2, G#2, Bb2
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || this.musicVolume <= 0) return;
      try {
        const now = this.ctx.currentTime;
        const note = horrorNotes[step % horrorNotes.length];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180 + Math.sin(step) * 60, now);

        gain.gain.setValueAtTime(this.musicVolume * 0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.9);

        step = (step + 1) % horrorNotes.length;
      } catch {
        // Safe
      }
    }, 1600);
  }

  public startHorrorDrone(): void {
    this.startBackgroundMusic();
  }

  public stopBackgroundMusic(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.stopHeartbeat();
    this.isBgmPlaying = false;
  }
}
