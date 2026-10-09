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
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.speechEnabled = true;
    this.volume = 0.7;
    this.currentBgmTheme = 'title';
    this.lastAutoSpeakAt = 0;
    this.lastAutoWord = '';
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
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
    if (this.muted) {
      this.stopBgm();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    }
    return this.muted;
  }

  setBgmEnabled(enabled) {
    this.bgmEnabled = Boolean(enabled);
    if (!this.bgmEnabled) {
      this.stopBgm();
    } else if (!this.muted && this.currentBgmTheme) {
      this.startBgm(this.currentBgmTheme);
    }
    return this.bgmEnabled;
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    return this.sfxEnabled;
  }

  setSpeechEnabled(enabled) {
    this.speechEnabled = Boolean(enabled);
    if (!this.speechEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    return this.speechEnabled;
  }

  applySettings({ bgm = true, sfx = true, speech = true, muted = false } = {}) {
    this.sfxEnabled = Boolean(sfx);
    this.setSpeechEnabled(speech);
    this.setMuted(muted);
    this.setBgmEnabled(bgm);
  }

  toggleMute() {
    return this.setMuted(!this.muted);
  }

  /**
   * 挑選最適合的系統內建語音（優先台灣繁體中文 zh-TW 與美式英文 en-US）
   */
  pickVoice(lang = 'zh-TW') {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices?.() || [];
    if (!voices.length) return null;

    if (lang.toLowerCase().startsWith('en')) {
      return (
        voices.find(v => /en[-_]US/i.test(v.lang) && /(Natural|Online|Microsoft|Google|Samantha|Aria|Jenny|Guy)/i.test(v.name)) ||
        voices.find(v => /en[-_]US/i.test(v.lang)) ||
        voices.find(v => /^en/i.test(v.lang)) ||
        null
      );
    }

    return (
      voices.find(v => /zh[-_]TW/i.test(v.lang) && /(HsiaoChen|HsiaoYu|YunJhe|Hanhan|Yating|Zhiwei|Taiwan|臺灣|台灣)/i.test(v.name)) ||
      voices.find(v => /zh[-_]TW/i.test(v.lang)) ||
      voices.find(v => /zh[-_]HK|zh[-_]CN|^zh/i.test(v.lang)) ||
      null
    );
  }

  /**
   * 智慧語音朗讀：
   * - 單字、詞語、成語、英文單字完成後自動朗讀
   * - 長句（8 字以上）預設以手動朗讀為主，不自動朗讀拖慢節奏
   * - 手動重聽（options.manual = true）具最高優先權，立即播報
   * - 自動朗讀不任意截斷剛開始未滿 650ms 的前一個完整詞語，亦不排隊堆積
   */
  speakText(text, lang = 'zh-TW', options = {}) {
    const manual = Boolean(options?.manual);
    if (this.muted) return false;
    if (!manual && !this.speechEnabled) return false;
    const clean = String(text ?? '').trim();
    if (!clean) return false;

    const charLen = Array.from(clean).length;
    const isEnglish = lang.toLowerCase().startsWith('en');
    // 長句以手動朗讀為主
    if (!manual && !isEnglish && charLen >= 8) {
      return false;
    }

    if (this.playCustomSound(`word_${clean}`)) return true;

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return false;
    }

    try {
      const synth = window.speechSynthesis;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (!manual && synth.speaking && (now - this.lastAutoSpeakAt) < 650) {
        // 不讓新自動語音粗暴截斷剛發音的前一個完整詞語，亦不排入長佇列
        return false;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang;
      const voice = this.pickVoice(lang);
      if (voice) utter.voice = voice;
      utter.rate = isEnglish ? 0.96 : 1.05;
      utter.pitch = 1.0;
      utter.volume = Math.min(1, Math.max(0.25, this.volume * 1.15));
      this.lastAutoSpeakAt = now;
      this.lastAutoWord = clean;
      synth.speak(utter);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 1. 敲對單一注音符號／字母：清脆劍鳴「鏘」，隨 Combo 提升音高
   */
  playKeyHit(combo = 1) {
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
   * 掛載外部自訂音效檔（如 mp3 / wav / ogg），若未掛載或載入失敗則自動使用 WebAudio 合成音效
   */
  registerCustomSound(key, url) {
    this.customSounds = this.customSounds || {};
    const audio = typeof Audio !== 'undefined' ? new Audio(url) : null;
    if (audio) {
      audio.preload = 'auto';
      this.customSounds[key] = audio;
    }
  }

  playCustomSound(key) {
    const sample = this.customSounds?.[key];
    if (!sample) return false;
    try {
      sample.currentTime = 0;
      sample.volume = this.volume;
      const p = sample.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 4. 失誤架招（Miss）：木鐵偏斜震盪聲；若原本達 5 連擊以上則疊加「斷弦破功」音效
   */
  playMiss(previousCombo = 0) {
    if (this.muted || !this.sfxEnabled) return;
    if (this.playCustomSound(previousCombo >= 5 ? 'miss_break' : 'miss')) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 劍身偏斜震盪主音
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(145, now + 0.14);
    gain.gain.setValueAtTime(0.26 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // 若原本有 5 連擊以上被打斷，額外播放「古琴斷弦＋氣息潰散」下行音效
    if (previousCombo >= 5) {
      [587.33, 440.0, 293.66, 174.61].forEach((freq, i) => {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        const t = now + i * 0.045;
        bOsc.frequency.setValueAtTime(freq, t);
        bOsc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.12);
        bGain.gain.setValueAtTime(0.16 * this.volume, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(t);
        bOsc.stop(t + 0.14);
      });
    }
  }

  /**
   * 4.5 連擊里程碑專屬音效（5 連清風、10 連驚雷、15+ 連龍鳳宗師劍意）
   */
  playComboMilestone(combo = 5) {
    if (this.muted || !this.sfxEnabled) return;
    const tierKey = combo >= 15 ? 'combo_15' : combo >= 10 ? 'combo_10' : 'combo_5';
    if (this.playCustomSound(tierKey)) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (combo >= 15) {
      // 15 連擊：金鐘共鳴＋雙八度五聲龍鳳華麗琶音
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(261.63, now);
      bellGain.gain.setValueAtTime(0.32 * this.volume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);
      bell.start(now);
      bell.stop(now + 0.56);

      [523.25, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1567.98, 2093.0].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        const t = now + i * 0.042;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.03, t + 0.34);
        g.gain.setValueAtTime(0.24 * this.volume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } else if (combo >= 10) {
      // 10 連擊：驚雷低音＋五聲電弧疾升音
      const thunder = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      thunder.type = 'sawtooth';
      thunder.frequency.setValueAtTime(140, now);
      thunder.frequency.exponentialRampToValueAtTime(58, now + 0.28);
      tGain.gain.setValueAtTime(0.28 * this.volume, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      thunder.connect(tGain);
      tGain.connect(this.ctx.destination);
      thunder.start(now);
      thunder.stop(now + 0.32);

      [587.33, 783.99, 880.0, 1174.66, 1567.98].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.04;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.24);
        g.gain.setValueAtTime(0.23 * this.volume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } else {
      // 5 連擊：清風竹笛雙音上揚
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + i * 0.045;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.06, t + 0.2);
        g.gain.setValueAtTime(0.22 * this.volume, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.24);
      });
    }
  }

  /**
   * 5. 破招成功（看破破綻）：清越金鐘聲
   */
  playParryBreak() {
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
    if (this.muted || !this.sfxEnabled) return;
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
   * 12.5 依武器流派或靈獸類型播放差異化攻擊音效
   * - sword: 清脆金屬聲、劍氣
   * - saber: 沉重斬擊、烈焰
   * - spear: 破風、雷霆
   * - beast_dog / beast_wolf: 撲擊、低鳴
   * - beast_eagle: 破空俯衝
   * - beast_toad: 毒霧與施術
   */
  playWeaponAttack(styleOrId = 'sword', isFinisher = false) {
    if (this.muted || !this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const gainScale = isFinisher ? 1.25 : 0.9;

    if (styleOrId === 'saber' || styleOrId === 'blade') {
      // 沉重烈焰斬擊
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(68, now + 0.22);
      g.gain.setValueAtTime(0.28 * this.volume * gainScale, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
      return;
    }

    if (styleOrId === 'spear') {
      // 破風雷霆突刺
      [440, 880, 1320].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        const t = now + i * 0.025;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, t + 0.14);
        g.gain.setValueAtTime(0.2 * this.volume * gainScale, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      });
      return;
    }

    if (styleOrId === 'beast_eagle') {
      // 穿雲靈鷹：高亢鷹嘯與破空俯衝
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.21);
      g.gain.setValueAtTime(0.22 * this.volume * gainScale, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
      return;
    }

    if (styleOrId === 'beast_toad') {
      // 碧玉毒蟾：深沉蛙鳴施術與毒霧鼓音
      [185, 240].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const t = now + i * 0.06;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.78, t + 0.16);
        g.gain.setValueAtTime(0.24 * this.volume * gainScale, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.19);
      });
      return;
    }

    if (styleOrId === 'beast_dog' || styleOrId === 'beast_wolf' || styleOrId === 'beast') {
      // 靈犬／蒼狼：迅捷撲咬與低鳴破空
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      const startF = styleOrId === 'beast_wolf' ? 310 : 390;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.17);
      g.gain.setValueAtTime(0.24 * this.volume * gainScale, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }

    // 預設劍系：清脆金屬劍氣
    if (isFinisher) this.playWordComplete(1);
    else this.playCharSlash(1);
  }

  /**
   * 13. 情境國風背景音樂 (BGM)
   * 支援五種情境：'title' (江湖首頁) | 'battle' (一般戰鬥) | 'boss' (Boss 戰) | 'inn' (客棧) | 'story' (劇情與通關)
   */
  startBgm(theme = this.currentBgmTheme || 'title') {
    this.currentBgmTheme = theme || 'title';
    if (this.muted || !this.bgmEnabled) return false;
    if (this.bgmTimer && this.bgmRunning) return true;
    this.init();
    if (!this.ctx) return false;

    const themes = {
      title: {
        stepMs: 1650,
        wave: 'sine',
        gain: 0.048,
        notes: [329.63, 392.00, 440.00, 523.25, 587.33, 440.00, 392.00, 329.63]
      },
      battle: {
        stepMs: 720,
        wave: 'triangle',
        gain: 0.042,
        notes: [261.63, 329.63, 392.00, 440.00, 392.00, 523.25, 440.00, 392.00]
      },
      boss: {
        stepMs: 480,
        wave: 'triangle',
        gain: 0.052,
        notes: [196.00, 220.00, 261.63, 293.66, 329.63, 293.66, 220.00, 196.00]
      },
      inn: {
        stepMs: 1200,
        wave: 'sine',
        gain: 0.045,
        notes: [392.00, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 392.00]
      },
      story: {
        stepMs: 1450,
        wave: 'sine',
        gain: 0.046,
        notes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.00]
      }
    };

    let currentStep = 0;
    const playNext = () => {
      if (!this.bgmRunning || this.muted || !this.bgmEnabled || !this.ctx) return;
      const cfg = themes[this.currentBgmTheme] || themes.title;
      const freq = cfg.notes[currentStep % cfg.notes.length];
      currentStep++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteDur = Math.max(0.35, (cfg.stepMs / 1000) * 0.92);

      osc.type = cfg.wave;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(cfg.gain * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + noteDur + 0.04);

      this.bgmTimer = setTimeout(playNext, cfg.stepMs);
    };

    this.bgmRunning = true;
    playNext();
    return true;
  }

  switchBgm(theme) {
    if (!theme) return;
    const changed = this.currentBgmTheme !== theme;
    this.currentBgmTheme = theme;
    if (this.muted || !this.bgmEnabled) return;
    if (!this.bgmRunning) {
      this.startBgm(theme);
    } else if (changed && this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
      this.bgmRunning = false;
      this.startBgm(theme);
    }
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
      this.startBgm(this.currentBgmTheme);
      return true;
    }
  }
}
