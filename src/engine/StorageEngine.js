/**
 * 《武俠打字傳》暗黑三難度存檔管理引擎 (StorageEngine.js)
 * 紀錄各難度（easy, medium, hard）的關卡解鎖、星等、WPM 與暗黑式境界晉升
 */

const STORAGE_KEY = 'wuxia_typing_legend_save_v2';

const DEFAULT_SAVE = {
  heroId: 'yun',
  coins: 80,
  maxHp: 100,
  currentHp: 100,
  equippedWeaponId: 'wood_sword',
  ownedWeapons: ['wood_sword'],
  missShields: 1,

  // 暗黑三大難度解鎖與進度
  currentDifficulty: 'easy', // 'easy' | 'medium' | 'hard'
  unlockedDifficulties: ['easy'], // 通關 easy 第 10 關解鎖 medium，通關 medium 第 10 關解鎖 hard
  stageProgress: {
    easy: { currentStageIndex: 1, maxUnlockedStage: 1, records: {} },
    medium: { currentStageIndex: 1, maxUnlockedStage: 1, records: {} },
    hard: { currentStageIndex: 1, maxUnlockedStage: 1, records: {} }
  },

  languageMode: 'bopomofo', // 'bopomofo' | 'english'
  showVirtualKeyboard: true,
  requireSpaceForFirstTone: false,
  selectedTextbook: null,
  customVocabularyRaw: '小橋(ㄒㄧㄠˇ ㄑㄧㄠˊ), 流水(ㄌㄧㄡˊ ㄕㄨㄟˇ), 行俠仗義, 自強不息',
  useCustomVocabulary: false,
  mistakes: {} // { '字': { char: '字', symbols: [...], count: 2, timestamp: 123456 } }
};

export class StorageEngine {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(DEFAULT_SAVE),
        ...parsed,
        unlockedDifficulties: Array.isArray(parsed.unlockedDifficulties)
          ? parsed.unlockedDifficulties
          : ['easy'],
        stageProgress: parsed.stageProgress || structuredClone(DEFAULT_SAVE.stageProgress)
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // 容錯私人瀏覽模式配額
    }
  }

  /**
   * 結算關卡勝利（10 題通關）
   */
  recordStageVictory(diffId, stageIndex, { stars, wpm, accuracy, rewardCoins }) {
    this.state.coins += rewardCoins;
    const diffProg = this.state.stageProgress[diffId];
    if (diffProg) {
      if (stageIndex >= diffProg.maxUnlockedStage && stageIndex < 10) {
        diffProg.maxUnlockedStage = stageIndex + 1;
      }
      const prev = diffProg.records[stageIndex] || { stars: 0, bestWpm: 0, bestAccuracy: 0 };
      diffProg.records[stageIndex] = {
        stars: Math.max(prev.stars, stars),
        bestWpm: Math.max(prev.bestWpm, wpm),
        bestAccuracy: Math.max(prev.bestAccuracy, accuracy)
      };
    }

    // 暗黑式境界突破解鎖判定
    if (stageIndex === 10) {
      if (diffId === 'easy' && !this.state.unlockedDifficulties.includes('medium')) {
        this.state.unlockedDifficulties.push('medium');
      } else if (diffId === 'medium' && !this.state.unlockedDifficulties.includes('hard')) {
        this.state.unlockedDifficulties.push('hard');
      }
    }

    this.save();
  }

  /**
   * 記錄錯字至錯題本
   */
  recordMistake(charObj) {
    if (!charObj || !charObj.char) return;
    if (!this.state.mistakes) this.state.mistakes = {};
    const key = charObj.char;
    const existing = this.state.mistakes[key];
    if (existing) {
      existing.count = (existing.count || 1) + 1;
      existing.timestamp = Date.now();
    } else {
      this.state.mistakes[key] = {
        char: charObj.char,
        symbols: charObj.symbols || [],
        count: 1,
        timestamp: Date.now()
      };
    }
    this.save();
  }

  /**
   * 取得錯題列表（依錯誤次數降序排列）
   */
  getMistakes() {
    if (!this.state.mistakes) return [];
    return Object.values(this.state.mistakes).sort((a, b) => b.count - a.count);
  }

  /**
   * 將錯字自錯題本除名
   */
  removeMistake(charKey) {
    if (this.state.mistakes && this.state.mistakes[charKey]) {
      delete this.state.mistakes[charKey];
      this.save();
    }
  }

  /**
   * 清空所有錯題墨寶
   */
  clearAllMistakes() {
    this.state.mistakes = {};
    this.save();
  }
}
