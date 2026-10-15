// Sonido sintetizado, sin archivos de audio externos.
export class SoundEngine {
      constructor() { this.ctx = null; }
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      }
      playTone(freq = 440, duration = 0.12, type = 'sawtooth', vol = 0.07) {
        try {
          this.init();
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
      }
      playMachineGun() {
        this.playTone(155 + Math.random() * 45, 0.045, 'square', 0.055);
      }
      playMissileLaunch() {
        this.playTone(320, 0.18, 'sawtooth', 0.09);
        setTimeout(() => this.playTone(180, 0.25, 'triangle', 0.09), 50);
      }
      playExplosion() {
        this.playTone(85, 0.38, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(52, 0.45, 'square', 0.14), 60);
      }
      playPickup() {
        [440, 587, 880].forEach((f, idx) => {
          setTimeout(() => this.playTone(f, 0.08, 'triangle', 0.08), idx * 50);
        });
      }
    }
    export const sfx = new SoundEngine();
