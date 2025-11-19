
class AudioService {
  private ctx: AudioContext | null = null;
  private ambientNodes: { stop: () => void }[] = [];

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Procedural Shotgun Sound: White noise burst with exponential decay
  public playShoot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // 1. The "Bang" (Low frequency punch)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);

    // 2. The "Blast" (White noise)
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Variation: Randomize playback rate slightly for variety
    noise.playbackRate.value = 0.8 + Math.random() * 0.4;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, t);
    noiseFilter.frequency.linearRampToValueAtTime(100, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noise.start(t);
  }

  // Procedural Gobble: Frequency modulated triangle wave
  public playGobble() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    
    const gain = this.ctx.createGain();
    
    // Vibrato (The wobble)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 15; // Fast wobble
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 50; // Depth of wobble

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Pitch envelope
    const baseFreq = 300 + Math.random() * 100;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq - 50, t + 0.5);

    // Volume envelope (stuttery)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.setValueAtTime(0, t + 0.2);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    
    lfo.stop(t + 0.6);
    osc.stop(t + 0.6);
  }

  // Procedural Ambient Office: Low hum + random clicks
  public startAmbient() {
    if (!this.ctx) return;
    this.stopAmbient();

    const t = this.ctx.currentTime;

    // 1. AC/Ventilation Hum (Brown-ish noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }

    const hum = this.ctx.createBufferSource();
    hum.buffer = buffer;
    hum.loop = true;
    
    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.05; // Very quiet background

    hum.connect(humGain);
    humGain.connect(this.ctx.destination);
    hum.start(t);

    this.ambientNodes.push({ stop: () => { hum.stop(); hum.disconnect(); } });
  }

  public stopAmbient() {
    this.ambientNodes.forEach(n => n.stop());
    this.ambientNodes = [];
  }
}

export const audioService = new AudioService();
