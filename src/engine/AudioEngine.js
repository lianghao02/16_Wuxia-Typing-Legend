/**
 * 《武俠打字傳》音效引擎 (AudioEngine)
 * 依照視覺與音效企劃書第 13 節規範：
 * - 正確輸入：清脆微鳴「鏘」
 * - Combo 遞增：五聲音階與音調逐步攀升
 * - 完成單字：俐落劍光斬擊聲
 * - 完成詞語：飽滿劍氣破風聲
 * - 打錯字：溫和短促金屬格擋聲（絕不使用刺耳警報音）
 * - 通關勝利：東方五聲音階（宮商角徵羽）古箏琶音
 */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * 1. 敲對單一注音符號／字母：清脆劍鳴「鏘」，隨 Combo 提升音高
   */
  playKeyHit(combo = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 東方五聲音階頻率倍率 (C, D, E, G, A)
    const pentatonicSteps = [1, 1.125, 1.25, 1.5, 1.667, 2.0, 2.25, 2.5];
    const stepIdx = ( Math.max(0, combo - 1) ) % pentatonicSteps.length;
    const octaveBoost = Math.min(Math.floor((combo - 1) / 8) * 0.15, 0.45);
    const baseFreq = 523.25 * (pentatonicSteps[stepIdx] + octaveBoost); // C5 基準

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.065);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * 2. 完成單一國字：小型劍光揮砍聲
   */
  playCharSlash(comboTier = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 白噪音濾波模擬劍風
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + comboTier * 300, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.11);
    filter.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * 3. 完成整個詞語／必殺技：大範圍劍氣破風與共鳴
   */
  playWordComplete(comboTier = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 破風重擊噪訊
    const duration = 0.26;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.38 * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    // 劍氣清脆泛音共鳴
    const freqs = comboTier >= 2 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 783.99];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.02);
      osc.frequency.exponentialRampToValueAtTime(f * 1.02, now + 0.28);

      g.gain.setValueAtTime(0.14 * this.volume, now + idx * 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.02);
      osc.stop(now + 0.31);
    });
  }

  /**
   * 4. 失誤架招（Miss）：短促溫和的木劍/鐵劍格擋聲，不刺耳
   */
  playMiss() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.09);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * 5. 破招成功（看破破綻）：清越金鐘聲
   */
  playParryBreak() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.24 * this.volume, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.36);
    });
  }

  /**
   * 6. 玩家受擊
   */
  playPlayerHurt() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.18);

    gain.gain.setValueAtTime(0.22 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * 7. 銅錢與商店購買音效
   */
  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2 * this.volume, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.23);
    });
  }

  /**
   * 8. 通關勝利：古箏五聲音階琶音
   */
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.22 * this.volume, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.46);
    });
  }

  /**
   * 9. 武功招式：青蓮劍氣
   */
  playSkillSlash() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [659.25, 987.77].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + i * 0.03 + 0.12);
      gain.gain.setValueAtTime(0.26 * this.volume, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.16);
    });
  }

  /**
   * 10. 武功招式：凌波微步（冰封定身・玉石風鈴）
   */
  playSkillDodge() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [1046.5, 1318.51, 1567.98].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.2 * this.volume, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.32);
    });
  }

  /**
   * 11. 武功招式：太極回春（回血甘霖調息）
   */
  playSkillHeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [329.63, 392.0, 493.88, 659.25].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.07);
      gain.gain.setValueAtTime(0.18 * this.volume, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.4);
    });
  }

  /**
   * 12. 武功招式：流雲劍訣（全屏大招裂空）
   */
  playUltimateBurst() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 重低音共鳴
    const bass = this.ctx.createOscillator();
    const bgain = this.ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(110, now);
    bass.frequency.exponentialRampToValueAtTime(55, now + 0.35);
    bgain.gain.setValueAtTime(0.32 * this.volume, now);
    bgain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    bass.connect(bgain);
    bgain.connect(this.ctx.destination);
    bass.start(now);
    bass.stop(now + 0.4);

    // 高頻水墨破空
    [783.99, 1046.5, 1318.51].forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      g.gain.setValueAtTime(0.25 * this.volume, now + idx * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.32);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.34);
    });
  }

  /**
   * 13. 古風禪意背景樂 (BGM) - 輕柔五聲古琴撥弦循環
   */
  startBgm() {
    if (this.bgmTimer || this.muted) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 329.63, delay: 0 },    // E4 (角)
      { f: 392.00, delay: 1800 }, // G4 (徵)
      { f: 440.00, delay: 3600 }, // A4 (羽)
      { f: 523.25, delay: 5400 }, // C5 (宮)
      { f: 587.33, delay: 7200 }, // D5 (商)
      { f: 440.00, delay: 9000 }, // A4
      { f: 392.00, delay: 10800 },// G4
      { f: 329.63, delay: 12600 } // E4
    ];

    let currentStep = 0;
    const playNext = () => {
      if (!this.bgmRunning || this.muted) return;
      const note = melody[currentStep % melody.length];
      currentStep++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, now);
      // 輕柔古風泛音，極低背景音量 0.05
      gain.gain.setValueAtTime(0.05 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.65);

      this.bgmTimer = setTimeout(playNext, 1800);
    };

    this.bgmRunning = true;
    playNext();
  }

  stopBgm() {
    this.bgmRunning = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBgm() {
    if (this.bgmRunning) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }
}
