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

  // 記錄上次修煉過程（精確至關卡內第幾題與內力珠）
  savedSession: {
    difficulty: 'easy',
    stageIndex: 1,
    clearedWordsCount: 0,
    questionCursor: 0,
    qiOrbs: 0,
    typingProgress: null,
    questionPoolKey: null,
    questionQueue: null
  },

  languageMode: 'bopomofo', // 'bopomofo' | 'english'
  showVirtualKeyboard: false,
  requireSpaceForFirstTone: true,
  selectedTextbook: null,
  customVocabularyRaw: '小橋(ㄒㄧㄠˇ ㄑㄧㄠˊ), 流水(ㄌㄧㄡˊ ㄕㄨㄟˇ), 行俠仗義, 自強不息',
  useCustomVocabulary: false,
  mistakes: {} // { '字': { char: '字', symbols: [...], count: 2, timestamp: 123456 } }
};

export const MAX_HERO_HP_CAP = 250;

export class StorageEngine {
  constructor() {
    this.state = this.load();
    // 舊進度只有一份，保留於江湖題本，不推定屬於哪個年級。
    this.state.practiceProfiles ||= {};
    this.state.activePracticeKey ||= 'jianghu';
    this.capturePracticeProfile();
  }

  capturePracticeProfile() {
    const s = this.state;
    s.practiceProfiles ||= {};
    s.practiceProfiles[s.activePracticeKey || 'jianghu'] = structuredClone({
      currentDifficulty: s.currentDifficulty, unlockedDifficulties: s.unlockedDifficulties,
      stageProgress: s.stageProgress, savedSession: s.savedSession,
      selectedTextbook: s.selectedTextbook, useCustomVocabulary: s.useCustomVocabulary,
      languageMode: s.languageMode
    });
  }

  getPracticeProfile(key) {
    if (key === (this.state.activePracticeKey || 'jianghu')) this.capturePracticeProfile();
    return structuredClone(this.state.practiceProfiles[key] || {
      currentDifficulty: 'easy', unlockedDifficulties: ['easy'],
      stageProgress: DEFAULT_SAVE.stageProgress, savedSession: DEFAULT_SAVE.savedSession,
      selectedTextbook: null, useCustomVocabulary: false, languageMode: 'bopomofo'
    });
  }

  activatePracticeProfile(key, source = null) {
    this.capturePracticeProfile();
    const profile = this.getPracticeProfile(key);
    Object.assign(this.state, profile);
    this.state.activePracticeKey = key;
    if (source) Object.assign(this.state, source);
    this.save();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      const maxHp = Math.min(MAX_HERO_HP_CAP, Math.max(100, Number(parsed.maxHp) || 100));
      const currentHp = Math.min(maxHp, Math.max(1, Number(parsed.currentHp) || maxHp));

      // 自動修正舊存檔錯題本中可能留存的 ㄒㄧㄨㄥ 誤植注音
      if (parsed.mistakes && typeof parsed.mistakes === 'object') {
        for (const item of Object.values(parsed.mistakes)) {
          if (Array.isArray(item.symbols)) {
            const joined = item.symbols.join('').replace('ㄒㄧㄨㄥ', 'ㄒㄩㄥ');
            item.symbols = Array.from(joined);
          }
        }
      }

      return {
        ...structuredClone(DEFAULT_SAVE),
        ...parsed,
        maxHp,
        currentHp,
        requireSpaceForFirstTone: true,
        unlockedDifficulties: Array.isArray(parsed.unlockedDifficulties)
          ? parsed.unlockedDifficulties
          : ['easy'],
        stageProgress: parsed.stageProgress || structuredClone(DEFAULT_SAVE.stageProgress),
        savedSession: {
          ...structuredClone(DEFAULT_SAVE.savedSession),
          ...(parsed.savedSession || {})
        }
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save() {
    this.capturePracticeProfile();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // 容錯私人瀏覽模式配額
    }
  }

  /**
   * 即時保存當前關卡內的作答進度（第幾題、題庫游標、內力珠）
   */
  saveSessionProgress({ difficulty, stageIndex, clearedWordsCount, questionCursor, qiOrbs,
    typingProgress = null, questionPoolKey = null, questionQueue = null }) {
    this.state.currentDifficulty = difficulty;
    if (this.state.stageProgress[difficulty]) {
      this.state.stageProgress[difficulty].currentStageIndex = stageIndex;
    }
    this.state.savedSession = {
      difficulty,
      stageIndex,
      clearedWordsCount: Math.max(0, Math.min(9, Number(clearedWordsCount) || 0)),
      questionCursor: Math.max(0, Number(questionCursor) || 0),
      qiOrbs: Math.max(0, Math.min(5, Number(qiOrbs) || 0)),
      typingProgress: typingProgress ? structuredClone(typingProgress) : null,
      questionPoolKey,
      questionQueue: questionQueue ? structuredClone(questionQueue) : null
    };
    this.save();
  }

  /**
   * 結算關卡勝利（10 題通關）
   */
  recordStageVictory(diffId, stageIndex, { stars, wpm, accuracy, rewardCoins }) {
    this.state.coins += rewardCoins;
    // 通關後自動為少俠調息回滿氣血
    this.state.currentHp = this.state.maxHp;

    const diffProg = this.state.stageProgress[diffId];
    if (diffProg) {
      if (stageIndex >= diffProg.maxUnlockedStage && stageIndex < 10) {
        diffProg.maxUnlockedStage = stageIndex + 1;
      }
      // 通關後將該境界的預設關卡推進至下一關
      if (stageIndex < 10) {
        diffProg.currentStageIndex = stageIndex + 1;
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

    // 通關後重置關卡內小題進度，指向下一關第 0 題
    const nextStageIndex = stageIndex < 10 ? stageIndex + 1 : 10;
    this.state.savedSession = {
      difficulty: diffId,
      stageIndex: nextStageIndex,
      clearedWordsCount: 0,
      questionCursor: 0,
      qiOrbs: this.state.savedSession?.qiOrbs || 0
    };

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
