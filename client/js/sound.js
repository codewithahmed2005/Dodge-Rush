// ============================================================
// 🔊 SOUND MANAGER - Web Audio API
// ============================================================

class SoundManager {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.initialized = false;
    
    this.sounds = {};
    
    this.init();
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('🔊 Sound system initialized');
    } catch (e) {
      console.warn('⚠️ Web Audio not supported');
      this.initialized = false;
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // ============================================================
  // 🎵 SOUND GENERATORS
  // ============================================================

  playPause() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.1);
  }

  playResume() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(600, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.context.currentTime + 0.15);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.15);
  }

  playRestart() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, this.context.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.1 + 0.15);
      
      osc.start(this.context.currentTime + i * 0.1);
      osc.stop(this.context.currentTime + i * 0.1 + 0.15);
    });
  }

  playCollision() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const bufferSize = this.context.sampleRate * 0.2;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
    }
    
    const noise = this.context.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    noise.start(this.context.currentTime);
    noise.stop(this.context.currentTime + 0.2);
    
    const osc = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc.connect(gain2);
    gain2.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
    osc.type = 'sawtooth';
    
    gain2.gain.setValueAtTime(0.4, this.context.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.3);
  }

  playEnemyMissed() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.connect(gain);
    gain.connect(this.context.destination);
    
    osc.frequency.setValueAtTime(300, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.15);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
    
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + 0.15);
  }

  playNearMiss() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const osc1 = this.context.createOscillator();
    const gain1 = this.context.createGain();
    osc1.connect(gain1);
    gain1.connect(this.context.destination);
    osc1.frequency.setValueAtTime(80, this.context.currentTime);
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.2, this.context.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
    osc1.start(this.context.currentTime);
    osc1.stop(this.context.currentTime + 0.08);
    
    const osc2 = this.context.createOscillator();
    const gain2 = this.context.createGain();
    osc2.connect(gain2);
    gain2.connect(this.context.destination);
    osc2.frequency.setValueAtTime(80, this.context.currentTime + 0.12);
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.25, this.context.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    osc2.start(this.context.currentTime + 0.12);
    osc2.stop(this.context.currentTime + 0.2);
  }

  playReward() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.08);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.15, this.context.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.08 + 0.12);
      
      osc.start(this.context.currentTime + i * 0.08);
      osc.stop(this.context.currentTime + i * 0.08 + 0.12);
    });
  }

  playLevelUp() {
    if (!this.initialized || !this.enabled) return;
    this.resume();
    
    const notes = [440, 523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.1);
      osc.type = 'square';
      
      gain.gain.setValueAtTime(0.1, this.context.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.1 + 0.1);
      
      osc.start(this.context.currentTime + i * 0.1);
      osc.stop(this.context.currentTime + i * 0.1 + 0.1);
    });
  }
}

const sound = new SoundManager();
export default sound;