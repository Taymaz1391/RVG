/**
 * ============================================================================
 * TOM AI - PROCEDURAL WEB AUDIO SOUND FX
 * ============================================================================
 * Generates delicate, tactile sound cues without any external audio files.
 * ============================================================================
 */

class AudioEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.ctx && typeof window.AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSend() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Audio autoplay restriction fallback
    }
  }

  playDone() {
    if (!this.enabled) return;
    try {
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      // Ignore
    }
  }
}

window.AudioEffects = AudioEffects;
