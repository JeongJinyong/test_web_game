export class SoundSystem {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private ambientOscillator?: OscillatorNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3; // 마스터 볼륨

    // 음악과 효과음 채널 분리
    this.musicGain = this.audioContext.createGain();
    this.musicGain.connect(this.masterGain);
    this.musicGain.gain.value = 0.3;

    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.connect(this.masterGain);
    this.sfxGain.gain.value = 0.5;
  }

  // 배경 음악 - 어두운 앰비언트
  playBackgroundMusic(): void {
    // 낮은 주파수 드론 사운드
    const drone1 = this.audioContext.createOscillator();
    drone1.type = 'sine';
    drone1.frequency.value = 60; // 낮은 베이스

    const drone2 = this.audioContext.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 90;

    const drone3 = this.audioContext.createOscillator();
    drone3.type = 'triangle';
    drone3.frequency.value = 180;

    // LFO로 떨림 효과
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(drone1.frequency);
    lfoGain.connect(drone2.frequency);

    // 노이즈 필터
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    drone1.connect(filter);
    drone2.connect(filter);
    drone3.connect(filter);
    filter.connect(this.musicGain);

    drone1.start();
    drone2.start();
    drone3.start();
    lfo.start();

    this.ambientOscillator = drone1;
  }

  // 검 휘두르기 효과음
  playSwingSound(): void {
    const now = this.audioContext.currentTime;

    // 화이트 노이즈 기반 휘두르기 소리
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 4));
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.2);
  }

  // 적 타격 효과음
  playHitSound(): void {
    const now = this.audioContext.currentTime;

    // 펀치 소리 - 낮은 주파수 임펄스
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // 추가 노이즈
    this.playImpactNoise();
  }

  private playImpactNoise(): void {
    const now = this.audioContext.currentTime;
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 2));
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.2;

    noise.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  // 아이템 줍기 효과음
  playPickupSound(): void {
    const now = this.audioContext.currentTime;

    // 밝은 톤의 짧은 멜로디
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G

    frequencies.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.audioContext.createGain();
      const startTime = now + i * 0.05;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }

  // 적 사망 효과음
  playEnemyDeathSound(): void {
    const now = this.audioContext.currentTime;

    // 하강하는 톤
    const osc = this.audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 플레이어 피격 효과음
  playPlayerHurtSound(): void {
    const now = this.audioContext.currentTime;

    // 날카로운 임펄스
    const osc = this.audioContext.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  stopBackgroundMusic(): void {
    if (this.ambientOscillator) {
      this.ambientOscillator.stop();
      this.ambientOscillator = undefined;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number): void {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}
