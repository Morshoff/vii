/**
 * Audio manager for romantic background music and subtle sound effects.
 */

class SoundController {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private volume: number = 0.85;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initAudio() {
    if (!this.audio && typeof window !== 'undefined') {
      this.audio = new Audio('/audio/romantic_bgm.mp3');
      this.audio.loop = true;
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';
    }

    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  public async playMusic(): Promise<boolean> {
    this.initAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    if (this.audio) {
      try {
        this.audio.currentTime = 0;
        await this.audio.play();
        this.isPlaying = true;
        return true;
      } catch (err) {
        console.warn('Audio autoplay blocked or failed, fallback to WebAudio synth:', err);
        this.startAmbientSynth();
        this.isPlaying = true;
        return false;
      }
    }
    return false;
  }

  public pauseMusic() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audio) {
      this.audio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public restartMusic() {
    if (this.audio) {
      this.audio.currentTime = 0;
      if (!this.isMuted) {
        this.audio.play().catch(() => {});
      }
      this.isPlaying = true;
    }
  }

  /**
   * Generates a dreamy fairy sparkle chime sound effect using Web Audio API
   */
  public playSparkleSound() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      const now = this.audioCtx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major pentatonic sparkles

      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.45);
      });
    } catch {
      // Ignore audio glitches safely
    }
  }

  /**
   * Generates a warm bass swell / heartbeat pulse sound
   */
  public playHeartbeatSound() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }

  /**
   * Generates a soft whoosh sound when particles explode outwards
   */
  public playBurstSound() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const bufferSize = this.audioCtx.sampleRate * 0.3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  private startAmbientSynth() {
    // Optional fallback ambient chords if needed
  }
}

export const soundController = new SoundController();
