/**
 * 《武俠打字傳》核心輸入引擎 (TypingEngine)
 * 職責：
 * 1. 完全解耦於 Phaser 與 DOM，採純事件驅動 (EventEmitter)
 * 2. 支援臺灣大千注音實體鍵碼 (e.code) 直接判定（免選字、零延遲）
 * 3. 相容微軟新注音 IME composition 攔截與純英數模式
 * 4. 具備「一聲空白鍵智慧防呆緩衝」與「原地防錯免按 Backspace」機制
 */

import {
  CODE_TO_BOPOMOFO,
  BOPOMOFO_TO_KEY_INFO,
  EN_TO_KEY_INFO,
  TONE_MARKS,
  normalizeBopomofoSequence
} from '../data/daqianLayout.js?v=20261007_fix6';

const IGNORED_CODES = new Set([
  'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock',
  'Tab', 'Escape', 'Backspace', 'Enter', 'ArrowUp', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ContextMenu', 'NumLock', 'ScrollLock'
]);

export class TypingEngine {
  constructor(options = {}) {
    this.listeners = new Map();
    this.requireSpaceForFirstTone = options.requireSpaceForFirstTone ?? true;
    this.active = false;
    this.mode = 'bopomofo'; // 'bopomofo' | 'english'

    // 當前題目狀態
    this.currentWord = null;
    this.characters = [];
    this.charIndex = 0;
    this.symbolIndex = 0;

    // 戰鬥與打字統計數據
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.completedWords = 0;
    this.completedChars = 0;
    this.sessionStartTime = null;
    this.wordStartTime = null;

    // 防重覆與一聲空白鍵緩衝時間戳
    this.lastKeydownHandledAt = 0;
    this.lastFirstToneCompleteAt = 0;
    this.lastCompositionData = '';
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        handler(payload);
      }
    }
  }

  setRequireSpaceForFirstTone(val) {
    this.requireSpaceForFirstTone = Boolean(val);
    if (this.currentWord) {
      this.loadWord(this.currentWord, false);
    }
  }

  resetStats() {
    this.combo = 0;
    this.maxCombo = 0;
    this.totalHits = 0;
    this.totalMisses = 0;
    this.completedWords = 0;
    this.completedChars = 0;
    this.sessionStartTime = null;
    this.emit('comboChange', { combo: 0, maxCombo: 0, tier: 0 });
  }

  /**
   * 載入新題目
   * @param {Object} wordItem - { text, bopomofo, meaning, mode, isSingleKey }
   * @param {Boolean} resetTimer - 是否重設單題計時
   */
  loadWord(wordItem, resetTimer = true) {
    this.currentWord = wordItem;
    this.mode = wordItem.mode || 'bopomofo';
    this.charIndex = 0;
    this.symbolIndex = 0;
    if (resetTimer) {
      this.wordStartTime = performance.now();
      if (!this.sessionStartTime) {
        this.sessionStartTime = performance.now();
      }
    }

    const textChars = Array.from(wordItem.text || '');

    if (this.mode === 'english') {
      this.characters = textChars.map((ch) => ({
        char: ch,
        rawBopomofo: '',
        symbols: [ch === ' ' ? '␣' : ch.toLowerCase()],
        typedCount: 0,
        completed: false,
        isFirstTone: false
      }));
    } else {
      // 注音模式
      const bopomofoList = Array.isArray(wordItem.bopomofo)
        ? wordItem.bopomofo
        : String(wordItem.bopomofo || '').trim().split(/\s+/);

      this.characters = textChars.map((ch, idx) => {
        const rawZy = bopomofoList[idx] || ch;
        const isSingleKey = Boolean(wordItem.isSingleKey) || (rawZy.length === 1 && ch === rawZy);
        const symbols = normalizeBopomofoSequence(
          rawZy,
          !isSingleKey && this.requireSpaceForFirstTone
        );
        const lastSym = symbols[symbols.length - 1];
        const hasExplicitTone = TONE_MARKS.has(lastSym);

        return {
          char: ch,
          rawBopomofo: rawZy,
          symbols,
          typedCount: 0,
          completed: false,
          isFirstTone: !isSingleKey && !hasExplicitTone
        };
      });
    }

    this.emit('targetLoaded', {
      word: this.currentWord,
      characters: this.characters,
      mode: this.mode,
      expectedKeyInfo: this.getExpectedKeyInfo()
    });
  }

  /**
   * 取得當前等待輸入的符號與對應實體鍵資訊
   */
  getExpectedSymbol() {
    const charObj = this.characters[this.charIndex];
    if (!charObj) return null;
    return charObj.symbols[this.symbolIndex] || null;
  }

  /** 保存目前題目與待輸入位置；完成題目時不保存為未完成題。 */
  getProgress() {
    if (!this.currentWord || !this.getExpectedSymbol()) return null;
    const now = performance.now();
    const stats = {};
    for (const key of ['combo', 'maxCombo', 'totalHits', 'totalMisses', 'completedWords', 'completedChars']) {
      stats[key] = this[key];
    }
    return {
      word: structuredClone(this.currentWord),
      charIndex: this.charIndex,
      symbolIndex: this.symbolIndex,
      stats,
      elapsedMs: this.sessionStartTime === null ? 0 : now - this.sessionStartTime,
      wordElapsedMs: this.wordStartTime === null ? 0 : now - this.wordStartTime
    };
  }

  /** 依目前已載入題目恢復進度，題目或索引不一致時拒絕套用。 */
  restoreProgress(progress) {
    if (!progress || JSON.stringify(progress.word) !== JSON.stringify(this.currentWord)) return false;
    const { charIndex, symbolIndex } = progress;
    if (!Number.isInteger(charIndex) || !Number.isInteger(symbolIndex) ||
        charIndex < 0 || charIndex >= this.characters.length || symbolIndex < 0 ||
        symbolIndex >= this.characters[charIndex].symbols.length) return false;
    this.charIndex = charIndex;
    this.symbolIndex = symbolIndex;
    this.characters.forEach((ch, i) => {
      ch.completed = i < charIndex;
      ch.typedCount = i < charIndex ? ch.symbols.length : i === charIndex ? symbolIndex : 0;
    });
    for (const key of ['combo', 'maxCombo', 'totalHits', 'totalMisses', 'completedWords', 'completedChars']) {
      this[key] = Math.max(0, Number(progress.stats?.[key]) || 0);
    }
    const now = performance.now();
    this.sessionStartTime = now - Math.max(0, Number(progress.elapsedMs) || 0);
    this.wordStartTime = now - Math.max(0, Number(progress.wordElapsedMs) || 0);
    this.lastCompositionData = '';
    this.emit('targetLoaded', { word: this.currentWord, characters: this.characters,
      mode: this.mode, expectedKeyInfo: this.getExpectedKeyInfo() });
    return true;
  }

  getExpectedKeyInfo() {
    const sym = this.getExpectedSymbol();
    if (!sym) return null;
    if (this.mode === 'english') {
      return EN_TO_KEY_INFO[sym.toLowerCase()] || null;
    }
    return BOPOMOFO_TO_KEY_INFO[sym] || null;
  }

  /**
   * 計算目前 WPM (每分鐘字數) 與正確率
   */
  getStats() {
    const now = performance.now();
    const elapsedMinutes = this.sessionStartTime
      ? Math.max((now - this.sessionStartTime) / 60000, 0.05)
      : 0.05;
    // 以每 3.5 個按鍵約折算 1 個完整字計算即時速度
    const wpm = Math.round((this.totalHits / 3.5) / elapsedMinutes);
    const totalAttempts = this.totalHits + this.totalMisses;
    const accuracy = totalAttempts > 0
      ? Math.round((this.totalHits / totalAttempts) * 100)
      : 100;

    return {
      wpm: this.totalHits > 0 ? Math.min(wpm, 220) : 0,
      accuracy,
      combo: this.combo,
      maxCombo: this.maxCombo,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      completedWords: this.completedWords,
      completedChars: this.completedChars
    };
  }

  getComboTier(combo = this.combo) {
    if (combo >= 20) return 3; // 劍意狀態
    if (combo >= 10) return 2; // 氣流殘影
    if (combo >= 5) return 1;  // 劍光強化
    return 0;
  }

  /**
   * 處理鍵盤按下事件 (支援英數模式與微軟新注音實體鍵碼攔截)
   */
  handleKeyDown(e) {
    if (!this.active || !this.currentWord) return false;
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    if (IGNORED_CODES.has(e.code) || e.code.startsWith('F')) return false;

    const now = performance.now();
    const expectedSymbol = this.getExpectedSymbol();
    if (!expectedSymbol) return false;

    let inputSymbol = null;

    if (this.mode === 'english') {
      if (e.code === 'Space') {
        inputSymbol = '␣';
      } else if (e.code.startsWith('Key')) {
        inputSymbol = e.code.slice(3).toLowerCase();
      } else if (e.key && e.key.length === 1 && e.key !== 'Process') {
        inputSymbol = e.key.toLowerCase();
      }
    } else {
      // 注音模式：優先以實體鍵盤位置 (e.code) 映射大千注音符號
      inputSymbol = CODE_TO_BOPOMOFO[e.code] || null;

      // 若瀏覽器直接傳入注音字元
      if (!inputSymbol && e.key && BOPOMOFO_TO_KEY_INFO[e.key]) {
        inputSymbol = e.key;
      }
    }

    if (!inputSymbol) {
      this.emit('rawEvent', {
        type: 'keydown_unmapped',
        code: e.code,
        key: e.key,
        mapped: null,
        expected: expectedSymbol,
        action: '略過非字元鍵'
      });
      return false;
    }

    // 阻擋瀏覽器預設滾動或選字行為
    if (e.cancelable) {
      e.preventDefault();
    }
    this.lastKeydownHandledAt = now;

    // 智慧防呆：若剛完成一個「一聲」字，玩家因肌肉記憶在 650ms 內補按了空白鍵，自動吸收不扣連擊
    if (
      this.mode === 'bopomofo' &&
      inputSymbol === '␣' &&
      expectedSymbol !== '␣' &&
      now - this.lastFirstToneCompleteAt < 650
    ) {
      this.lastFirstToneCompleteAt = 0;
      this.emit('rawEvent', {
        type: 'keydown_grace_space',
        code: e.code,
        key: e.key,
        mapped: '␣ (一聲空白鍵)',
        expected: expectedSymbol,
        action: '一聲空白鍵智慧吸收（不計失誤）'
      });
      return true;
    }

    return this.processSymbolInput(inputSymbol, {
      source: 'keydown',
      code: e.code,
      key: e.key
    });
  }

  /**
   * 備援：處理 IME compositionupdate 事件（針對軟鍵盤或未提供 e.code 的特殊環境）
   */
  handleCompositionUpdate(e) {
    if (!this.active || !this.currentWord) return;
    const now = performance.now();
    // 若實體按鍵 keydown 已經在 45ms 內即時處理過，避免重覆觸發
    if (now - this.lastKeydownHandledAt < 45) return;

    const data = e.data || '';
    if (!data || data === this.lastCompositionData) return;
    this.lastCompositionData = data;

    const lastChar = Array.from(data).pop();
    if (lastChar && BOPOMOFO_TO_KEY_INFO[lastChar]) {
      this.processSymbolInput(lastChar, {
        source: 'compositionupdate',
        code: 'IME',
        key: lastChar
      });
    }
  }

  /**
   * 核心比對邏輯
   */
  processSymbolInput(inputSymbol, meta = {}) {
    const charObj = this.characters[this.charIndex];
    if (!charObj) return false;

    const expectedSymbol = charObj.symbols[this.symbolIndex];
    const now = performance.now();

    // 輕聲彈性：若玩家在字首就先按了 ˙ (7)，而該字確實含有輕聲 ˙，亦視為有效或提示
    if (inputSymbol === expectedSymbol) {
      // 命中正確按鍵（按鍵層級：聚氣與統計，不增加 Combo）
      this.totalHits++;
      charObj.typedCount++;
      const matchedSymbolIndex = this.symbolIndex;
      const matchedCharIndex = this.charIndex;
      this.symbolIndex++;

      // 檢查該國字／字母是否已完成所有音標
      const isCharCompleted = this.symbolIndex >= charObj.symbols.length;
      const isLastChar = isCharCompleted && (matchedCharIndex >= this.characters.length - 1);

      // 僅在「完成一整個國字」或「英文單字／單鍵」時 Combo +1，並同步推進游標至下一字
      if (isCharCompleted) {
        charObj.completed = true;
        this.completedChars++;
        this.combo++;
        if (this.combo > this.maxCombo) {
          this.maxCombo = this.combo;
        }
        if (charObj.isFirstTone && !this.requireSpaceForFirstTone) {
          this.lastFirstToneCompleteAt = now;
        }
        if (!isLastChar) {
          this.charIndex++;
          this.symbolIndex = 0;
        }
      }

      const stats = this.getStats();
      const comboTier = this.getComboTier(this.combo);

      this.emit('rawEvent', {
        type: 'hit',
        code: meta.code,
        key: meta.key,
        mapped: inputSymbol,
        expected: expectedSymbol,
        action: `命中符號 [${inputSymbol}]`
      });

      if (isCharCompleted) {
        this.emit('comboChange', {
          combo: this.combo,
          maxCombo: this.maxCombo,
          tier: comboTier
        });
      }

      this.emit('keyHit', {
        symbol: inputSymbol,
        charObj,
        charIndex: matchedCharIndex,
        symbolIndex: matchedSymbolIndex,
        combo: this.combo,
        comboTier,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        isCharCompleted,
        expectedKeyInfo: this.getExpectedKeyInfo()
      });

      if (isCharCompleted) {
        this.emit('charComplete', {
          charObj,
          charIndex: matchedCharIndex,
          totalChars: this.characters.length,
          combo: this.combo,
          comboTier,
          wpm: stats.wpm,
          isLastChar,
          nextCharIndex: this.charIndex,
          expectedKeyInfo: this.getExpectedKeyInfo()
        });

        if (isLastChar) {
          // 整詞／整句完成！
          this.completedWords++;
          const elapsedMs = now - (this.wordStartTime || now);
          this.emit('wordComplete', {
            word: this.currentWord,
            characters: this.characters,
            combo: this.combo,
            comboTier,
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            elapsedMs
          });
        } else {
          this.emit('nextChar', {
            charIndex: this.charIndex,
            expectedKeyInfo: this.getExpectedKeyInfo()
          });
        }
      } else {
        // 同一字的下一個注音符號
        this.emit('nextSymbol', {
          charIndex: this.charIndex,
          symbolIndex: this.symbolIndex,
          expectedKeyInfo: this.getExpectedKeyInfo()
        });
      }

      return true;
    } else {
      // 輸入失誤（Miss）：不扣血、不需按 Backspace，僅斷 Combo 與發出格擋提示
      this.totalMisses++;
      const previousCombo = this.combo;
      this.combo = 0;

      this.emit('rawEvent', {
        type: 'miss',
        code: meta.code,
        key: meta.key,
        mapped: inputSymbol,
        expected: expectedSymbol,
        action: `失誤架招（輸入 ${inputSymbol}，目標為 ${expectedSymbol}）`
      });

      this.emit('comboChange', {
        combo: 0,
        maxCombo: this.maxCombo,
        tier: 0
      });

      this.emit('miss', {
        expectedSymbol,
        actualSymbol: inputSymbol,
        charObj,
        charIndex: this.charIndex,
        symbolIndex: this.symbolIndex,
        previousCombo,
        expectedKeyInfo: this.getExpectedKeyInfo()
      });

      return false;
    }
  }
}
