/**
 * 《武俠打字傳》主控制器 (src/main.js)
 * 完整實作：
 * 1. 暗黑式三大境界 $\times$ 10 關（每關 10 題過關制）
 * 2. 完成整字累計 Combo
 * 3. 雙主角與三階神兵換裝
 * 4. 國小三大課本與爸媽自訂祕笈盒
 */

import { KEYBOARD_ROWS } from './data/daqianLayout.js?v=20261007_fix6';
import { HEROES, WEAPONS, SHOP_ITEMS, DIFFICULTY_CONFIG, DIABLO_STAGES } from './data/enemies.js?v=20261007_mixfx';
import { DIFFICULTY_BANKS, parseCustomVocabularyInput } from './data/vocabulary.js?v=20261007_beta2_final';
import { TEXTBOOK_CATALOG, TEXTBOOK_SOURCE_STATUS, PUBLISHER_RESOURCE_LINKS } from './data/textbooks.js?v=20261007_beta2_final';
import { buildGradeQuestionQueue, describeGradeQuestionRatio } from './data/gradeQuestionMix.js';
import { getCharacterReadings, getDictionaryEntries, getDictionaryUsage, MOE_MINI_METADATA } from './data/moeDictionary.js?v=20261007_beta2_final';
import { getWeaponEffectProfile } from './data/weaponEffects.js';
import { PRACTICE_CHOICES, MAIN_PRACTICE_CHOICES, ENGLISH_PRACTICE_BANKS } from './data/practice.js?v=20261007_beta2_final';
import { TypingEngine } from './engine/TypingEngine.js?v=20261007_beta2_final';
import { AudioEngine } from './engine/AudioEngine.js?v=20261007_fix6';
import { StorageEngine, MAX_HERO_HP_CAP } from './engine/StorageEngine.js?v=20261007_uxfix';
import { CanvasBattleScene } from './scenes/CanvasBattleScene.js?v=20261007_beta2_final';

export function getSkillShortcut(event) {
  if (event.ctrlKey || event.metaKey) return null;
  const skillMap = { Digit1: 'q', F1: 'q', Digit2: 'w', F2: 'w',
    Digit3: 'e', F3: 'e', Digit4: 'r', F4: 'r' };
  return event.altKey || /^F[1-4]$/.test(event.code) ? skillMap[event.code] || null : null;
}

// 顯示分組依當前字的位置推算，續玩仍沿用輸入引擎的原始索引。
export function getCharacterPage(charIndex, characterCount, pageSize = 4) {
  const position = Math.max(0, Math.min(charIndex, characterCount - 1));
  const start = Math.floor(position / pageSize) * pageSize;
  return { start, end: Math.min(start + pageSize, characterCount),
    page: Math.floor(start / pageSize) + 1, total: Math.ceil(characterCount / pageSize) };
}

// 複製後洗牌，保留題目與重複題的數量，不改動原始教材順序。
export function shuffleQuestions(pool, random = Math.random, previousText = null) {
  const queue = [...pool];
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  if (previousText !== null && queue[0]?.text === previousText) {
    const next = queue.findIndex((item) => item.text !== previousText);
    if (next > 0) [queue[0], queue[next]] = [queue[next], queue[0]];
  }
  return queue;
}

// 英文以完整單字分組，字後的空白鍵隨該單字顯示。
export function getQuestionPage(charIndex, text, mode) {
  if (mode !== 'english') return getCharacterPage(charIndex, Array.from(text).length);
  const words = [...text.matchAll(/\S+/g)];
  if (!words.length) return { start: 0, end: text.length, page: 1, total: 1 };
  let index = words.findIndex((word, i) => charIndex >= word.index && charIndex < (words[i + 1]?.index ?? text.length));
  if (index < 0) index = words.length - 1;
  return { start: words[index].index, end: words[index + 1]?.index ?? text.length,
    page: index + 1, total: words.length };
}

function hasSameQuestions(queue, pool) {
  if (!Array.isArray(queue) || queue.length !== pool.length) return false;
  const serialize = (items) => JSON.stringify(items.map((item) => JSON.stringify(item)).sort());
  return serialize(queue) === serialize(pool);
}

export class WuxiaGameApp {
  get isBattlePaused() { return this._isBattlePaused; }

  set isBattlePaused(value) {
    this._isBattlePaused = Boolean(value);
    this.typing?.setPaused(this._isBattlePaused || Boolean(this.isBackgroundPaused));
  }
  constructor() {
    this.storage = new StorageEngine();
    this.audio = new AudioEngine();
    this.typing = new TypingEngine({
      requireSpaceForFirstTone: this.storage.state.requireSpaceForFirstTone
    });

    this.battleScene = null;
    this.currentDifficulty = this.storage.state.currentDifficulty || 'easy';
    this.currentStageIndex = 1;
    this.currentStage = DIABLO_STAGES.easy[0];

    // 每關 10 題通關制計數器
    this.stageGoal = 10;
    this.clearedWordsCount = 0; // 0 ~ 10
    this.isMistakeDrill = false;

    this.enemyAtb = 0; // 0 ~ 1
    this.qiOrbs = 0;   // 0 ~ 5
    this.isEnemyFrozen = false;
    this.isBattlePaused = false;
    this.isStageClearing = false;

    this.questionQueue = [];
    this.questionCursor = 0;
    this.keyDomMap = new Map();

    window.__wuxiaApp = this;
    this.initDOM();
    this.bindTypingEvents();
    this.initBattleRenderer();
    this.startAtbTimer();
  }

  getEquippedWeapon() {
    return WEAPONS.find((w) => w.id === this.storage.state.equippedWeaponId) || WEAPONS[0];
  }

  getHero() {
    return HEROES[this.storage.state.heroId] || HEROES.yun;
  }

  initBattleRenderer() {
    this.battleScene = new CanvasBattleScene('phaser-Stage');
    const saved = this.storage.state.savedSession;
    const unlocked = this.storage.state.unlockedDifficulties || ['easy'];
    const targetDiff = (saved?.difficulty && unlocked.includes(saved.difficulty))
      ? saved.difficulty
      : (this.storage.state.currentDifficulty || 'easy');
    const diffProg = this.storage.state.stageProgress[targetDiff];
    const initialIndex = saved?.stageIndex || diffProg?.currentStageIndex || 1;
    this.startStage(targetDiff, initialIndex, { resumeSession: true });
  }

  initDOM() {
    const updateBackgroundPause = (paused) => {
      this.isBackgroundPaused = paused;
      this.typing.setPaused(this.isBattlePaused || paused);
      this.saveCurrentSessionProgress();
    };
    window.addEventListener('blur', () => updateBackgroundPause(true));
    window.addEventListener('focus', () => updateBackgroundPause(document.hidden));
    document.addEventListener('visibilitychange', () => updateBackgroundPause(document.hidden || !document.hasFocus()));
    // 建立水墨半透明大千虛擬鍵盤
    const vkPanel = document.getElementById('vk-panel');
    vkPanel.innerHTML = `
      <div class="vk-hint-row">
        <span>左手鍵位（黛藍）</span>
        <span>・</span>
        <span>右手鍵位（翠綠）</span>
        <span>・</span>
        <span>聲調音律（赤金）</span>
        <button class="vk-close-btn" id="btn-close-vk" type="button">✕ 收起 (Tab)</button>
      </div>
    `;
    KEYBOARD_ROWS.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';
      row.forEach((k) => {
        const keyEl = document.createElement('div');
        let zoneClass = 'zone-left';
        if (k.code === 'Space') {
          zoneClass = 'zone-space';
        } else if (k.isTone) {
          zoneClass = 'zone-tone';
        } else if (k.finger && k.finger.startsWith('右手')) {
          zoneClass = 'zone-right';
        }
        keyEl.className = `vk-key ${zoneClass}` + (k.isWide ? ' wide' : '');
        keyEl.innerHTML = `<span class="vk-en">${k.en}</span><span class="vk-zy">${k.label || k.zy}</span>`;
        rowEl.appendChild(keyEl);
        this.keyDomMap.set(k.code, keyEl);
      });
      vkPanel.appendChild(rowEl);
    });
    // 根據存檔設定初始化虛擬鍵盤顯隱與按鈕文字
    const updateVkBtnText = () => {
      const isVisible = !!this.storage.state.showVirtualKeyboard;
      const btn = document.getElementById('btn-toggle-vk');
      if (btn) {
        btn.textContent = isVisible ? '⌨️ 指法鍵盤：開 (Tab)' : '⌨️ 指法鍵盤：關 (Tab)';
      }
    };
    vkPanel.classList.toggle('hidden', !this.storage.state.showVirtualKeyboard);
    updateVkBtnText();
    document.getElementById('btn-close-vk').addEventListener('click', (event) => {
      if (this.storage.state.showVirtualKeyboard) document.getElementById('btn-toggle-vk').click();
      event.currentTarget.blur();
    });
    // 控制列高度會隨鍵盤及視窗寬度變化，題目可用高度依實際尺寸保留。
    if (typeof ResizeObserver !== 'undefined') {
      const updateBattleLayout = () => {
        const overlay = document.getElementById('dom-overlay');
        overlay.style.setProperty('--dock-height', `${document.querySelector('.bottom-dock').offsetHeight}px`);
        const topCards = window.innerWidth <= 960 || (window.innerWidth <= 1360 && this.storage.state.showVirtualKeyboard);
        const cards = [...document.querySelectorAll(topCards ? '.hud-top > *' : '.hud-center')];
        const bottom = Math.max(...cards.map(card => card.getBoundingClientRect().bottom));
        overlay.style.setProperty('--question-top', `${Math.max(window.innerHeight <= 700 && this.storage.state.showVirtualKeyboard ? 90 : 120, Math.ceil(bottom + 12))}px`);
      };
      this.dockObserver = new ResizeObserver(updateBattleLayout);
      document.querySelectorAll('.bottom-dock, .hud-top > *').forEach(element => this.dockObserver.observe(element));
      window.addEventListener('resize', updateBattleLayout);
    }

    // 綁定頂部與底部工具按鈕
    document.getElementById('btn-switch-hero').addEventListener('click', (e) => {
      this.storage.state.heroId = this.storage.state.heroId === 'yun' ? 'su' : 'yun';
      this.storage.save();
      this.refreshBattleVisuals();
      this.updateHUD();
      e.currentTarget.blur();
    });

    document.getElementById('btn-open-title').addEventListener('click', (e) => {
      this.openTitleModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-open-practice').addEventListener('click', () => {
      this.openPracticeModal();
    });
    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.openExclusiveModal('modal-settings');
      document.getElementById('btn-toggle-vk').focus({ preventScroll: true });
    });

    document.getElementById('btn-toggle-lang').addEventListener('click', (e) => {
      this.openPracticeModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-toggle-vk').addEventListener('click', (e) => {
      this.storage.state.showVirtualKeyboard = !this.storage.state.showVirtualKeyboard;
      this.storage.save();
      vkPanel.classList.toggle('hidden', !this.storage.state.showVirtualKeyboard);
      updateVkBtnText();
      e.currentTarget.blur();
    });

    document.getElementById('btn-toggle-audio').addEventListener('click', (e) => {
      const muted = this.audio.toggleMute();
      e.currentTarget.textContent = muted ? '🔇 音效：關' : '🔊 音效：開';
      e.currentTarget.blur();
    });

    document.getElementById('btn-toggle-bgm').addEventListener('click', (e) => {
      const running = this.audio.toggleBgm();
      e.currentTarget.textContent = running ? '🎵 配樂：開' : '🎵 配樂：關';
      e.currentTarget.blur();
    });

    document.getElementById('btn-stages').addEventListener('click', (e) => {
      this.openStageModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-shop').addEventListener('click', (e) => {
      this.openShopModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-textbook').addEventListener('click', (e) => {
      this.openTextbookModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-mistakes').addEventListener('click', (e) => {
      this.openMistakesModal();
      e.currentTarget.blur();
    });

    document.getElementById('btn-custom-words').addEventListener('click', (e) => {
      this.openCustomWordsModal();
      e.currentTarget.blur();
    });

    // 技能槽點擊綁定
    document.getElementById('btn-skill-q').addEventListener('click', (e) => {
      this.castSkill('q');
      e.currentTarget.blur();
    });
    document.getElementById('btn-skill-w').addEventListener('click', (e) => {
      this.castSkill('w');
      e.currentTarget.blur();
    });
    document.getElementById('btn-skill-e').addEventListener('click', (e) => {
      this.castSkill('e');
      e.currentTarget.blur();
    });
    document.getElementById('btn-skill-r').addEventListener('click', (e) => {
      this.castSkill('r');
      e.currentTarget.blur();
    });

    // 首頁只提供介紹與單一進入遊戲入口。
    document.getElementById('btn-title-start').addEventListener('click', () => {
      this.openPracticeModal();
    });

    // 錯題本彈窗按鈕
    document.getElementById('btn-start-mistake-drill').addEventListener('click', () => {
      this.startMistakeDrill();
    });
    document.getElementById('btn-clear-mistakes').addEventListener('click', () => {
      this.storage.clearAllMistakes();
      this.renderMistakesDOM();
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // 全域鍵盤監聽
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' && !this.isBattlePaused) {
        e.preventDefault();
        document.getElementById('btn-toggle-vk').click();
        return;
      }
      if (e.code === 'Escape') {
        if (this.isBattlePaused) {
          this.closeAllModals();
        } else {
          this.openStageModal();
        }
        return;
      }

      // 技能快捷鍵：Alt+1~4 或 F1~F4
      const skillShortcut = getSkillShortcut(e);
      if (skillShortcut) {
        e.preventDefault();
        this.castSkill(skillShortcut);
        return;
      }

      if (!this.isBattlePaused) {
        this.typing.handleKeyDown(e);
      }
    });

    window.addEventListener('compositionupdate', (e) => {
      if (!this.isBattlePaused) {
        this.typing.handleCompositionUpdate(e);
      }
    });
  }

  /**
   * 訂閱 TypingEngine 事件並轉發至 Phaser 與 DOM
   */
  bindTypingEvents() {
    window.addEventListener('beforeunload', () => this.saveCurrentSessionProgress());
    this.typing.on('targetLoaded', () => {
      this.consecutiveMisses = 0;
      this.renderQuestionDOM();
    });

    this.typing.on('nextSymbol', () => {
      this.renderQuestionDOM();
    });

    this.typing.on('nextChar', () => {
      this.renderQuestionDOM();
    });

    this.typing.on('keyHit', ({ combo, comboTier, isCharCompleted }) => {
      this.consecutiveMisses = 0;
      this.audio.playKeyHit(combo);
      if (this.battleScene) {
        this.battleScene.playMicroGather(combo, comboTier);
      }
      this.renderQuestionDOM();
      if (isCharCompleted) {
        this.updateComboBanner(combo, comboTier);
      }
      this.saveCurrentSessionProgress();
    });

    this.typing.on('charComplete', ({ charObj, combo, comboTier, wpm, isLastChar }) => {
      const weapon = this.getEquippedWeapon();
      const isCrit = Math.random() < weapon.critRate || comboTier >= 2;
      const baseDmg = Math.round(
        weapon.atk * 0.42 * (1 + Math.min(combo, 30) * 0.025) * (1 + wpm / 160) * (isCrit ? 1.45 : 1)
      );

      this.renderQuestionDOM();

      if (!isLastChar && this.battleScene) {
        this.audio.playCharSlash(comboTier);
        this.battleScene.playCharSlash({
          charText: charObj.char,
          damage: baseDmg,
          isCrit,
          comboTier
        });
      }
    });

    this.typing.on('wordComplete', ({ word, combo, comboTier, wpm }) => {
      const weapon = this.getEquippedWeapon();
      const isCrit = Math.random() < (weapon.critRate + 0.15) || comboTier >= 1;
      const isParryBreak = this.enemyAtb >= 0.72;

      // 滿氣保留供主動施招，不自動消耗第五顆內力珠。
      this.qiOrbs = Math.min(5, this.qiOrbs + 1);

      const finisherDmg = Math.round(
        weapon.atk * 0.95 * (1 + Math.min(combo, 35) * 0.03) * (1 + wpm / 140) *
        (isParryBreak ? 1.4 : 1.0)
      );

      if (isParryBreak) {
        this.enemyAtb = 0;
        this.audio.playParryBreak();
      } else {
        this.audio.playWordComplete(comboTier);
      }

      if (this.battleScene) {
        this.battleScene.playWordFinisher({
          wordText: word.text,
          damage: finisherDmg,
          isCrit,
          isParryBreak,
          comboTier
        });
      }

      // 每關 10 題過關制推進
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.typing.active = false;
      if (!this.isMistakeDrill) {
        this.saveCurrentSessionProgress();
      }
      this.updateHUD();

      if (this.clearedWordsCount >= this.stageGoal) {
        if (this.isMistakeDrill) {
          this.handleMistakeDrillVictory();
        } else {
          this.handleStageVictory();
        }
      } else {
        this.scheduleNextQuestion(280);
      }
    });

    this.typing.on('miss', ({ charObj, charIndex, previousCombo }) => {
      // 由引擎的逐字狀態收錄；護身符只保護連擊，仍保留需要練習的字。
      const wrongChar = charObj;
      if (wrongChar) this.storage.recordMistake(wrongChar, this.typing.mode);
      if (this.storage.state.missShields > 0 && previousCombo >= 3) {
        this.storage.state.missShields--;
        this.typing.combo = previousCombo;
        this.storage.save();
        this.audio.playKeyHit(previousCombo);
        if (this.battleScene) this.battleScene.playMissParry(true);
        this.updateHUD();
        this.saveCurrentSessionProgress();
        return;
      }

      this.consecutiveMisses = (this.consecutiveMisses || 0) + 1;
      this.audio.playMiss();
      if (this.battleScene) {
        this.battleScene.playMissParry(false);
      }
      this.updateComboBanner(0, 0);

      // 敵人蓄力推進 8%（不直接扣減玩家 HP）
      if (this.currentStage.enemy.attackIntervalMs > 0) {
        this.enemyAtb = Math.min(0.98, this.enemyAtb + 0.08);
        this.updateHUD();
      }

      // 重新渲染題目 DOM 以觸發連續錯誤教學指引
      this.renderQuestionDOM();
      this.saveCurrentSessionProgress();

      const cardEl = document.getElementById(`q-char-${charIndex}`);
      if (cardEl) {
        cardEl.classList.remove('miss');
        void cardEl.offsetWidth;
        cardEl.classList.add('miss');
      }
    });
  }

  /**
   * 即時將目前關卡內已斬題數、題庫游標與內力珠存入 StorageEngine
   */
  saveCurrentSessionProgress() {
    if (this.isMistakeDrill || this.isStageClearing) return;
    this.storage.saveSessionProgress({
      difficulty: this.currentDifficulty,
      stageIndex: this.currentStageIndex,
      clearedWordsCount: this.clearedWordsCount,
      questionCursor: this.questionCursor,
      qiOrbs: this.qiOrbs,
      typingProgress: this.typing.active ? this.typing.getProgress() : null,
      questionPoolKey: this.questionPoolKey,
      questionQueue: this.questionQueue
    });
  }

  /**
   * 啟動暗黑指定境界與關卡（支援 resumeSession 恢復上次打到第幾題）
   */
  startStage(diffId, stageIndex, { resumeSession = false } = {}) {
    clearTimeout(this.nextQuestionTimer);
    this.isMistakeDrill = false;
    this.currentDifficulty = diffId;
    this.currentStageIndex = Number(stageIndex) || 1;
    this.storage.state.currentDifficulty = diffId;
    const diffProg = this.storage.state.stageProgress[diffId];
    if (diffProg) diffProg.currentStageIndex = this.currentStageIndex;

    const stages = DIABLO_STAGES[diffId] || DIABLO_STAGES.easy;
    this.currentStage = stages[this.currentStageIndex - 1] || stages[0];

    // 每關固定 10 題
    this.stageGoal = 10;
    const saved = this.storage.state.savedSession;
    let canResume =
      resumeSession &&
      saved &&
      saved.difficulty === diffId &&
      Number(saved.stageIndex) === this.currentStageIndex &&
      (saved.clearedWordsCount > 0 || saved.typingProgress) &&
      saved.clearedWordsCount < this.stageGoal;

    this.clearedWordsCount = canResume ? saved.clearedWordsCount : 0;
    if (canResume && typeof saved.qiOrbs === 'number') {
      this.qiOrbs = saved.qiOrbs;
    }

    this.enemyAtb = 0;
    this.consecutiveMisses = 0;
    this.isStageClearing = false;
    this.isBattlePaused = false;

    this.typing.resetStats();
    this.typing.active = true;

    this.refreshBattleVisuals();
    this.rebuildQuestionPool();
    // 常用字題庫僅新增字時，舊隊列仍可練完；下次挑戰才從擴充題庫抽題。
    const expandedCommonQueue = ['moe', 'mixed'].includes(this.storage.state.selectedTextbook?.publisherId) &&
      Array.isArray(saved?.questionQueue) && saved.questionQueue.length > 0 &&
      saved.questionQueue.length < this.questionPool.length &&
      new Set(saved.questionQueue.map(word => word.text)).size === saved.questionQueue.length &&
      saved.questionQueue.every(word => this.questionPool.some(item => JSON.stringify(item) === JSON.stringify(word)));
    if (canResume && !expandedCommonQueue && ((saved.questionPoolKey && saved.questionPoolKey !== this.questionPoolKey) ||
        (saved.questionQueue && !hasSameQuestions(saved.questionQueue, this.questionPool)))) {
      canResume = false;
      this.clearedWordsCount = 0;
    }
    if (canResume) {
      // 舊版沒有洗牌隊列，使用原始教材順序接續，避免升級後跳題。
      this.questionQueue = saved.questionQueue
        ? structuredClone(saved.questionQueue) : [...this.questionPool];
      this.questionCursor = Math.max(0, Number(saved.questionCursor) || this.clearedWordsCount);
    }
    if (canResume && saved.typingProgress && (saved.questionPoolKey === this.questionPoolKey || expandedCommonQueue)) {
      const currentIndex = Math.max(0, this.questionCursor - 1);
      this.typing.loadWord(this.questionQueue[currentIndex % this.questionQueue.length]);
      this.typing.restoreProgress(saved.typingProgress);
    } else {
      this.nextQuestion();
    }
    this.saveCurrentSessionProgress();
    this.updateHUD();
    this.updateComboBanner(this.typing.combo, this.typing.getComboTier());
  }

  refreshBattleVisuals() {
    if (!this.battleScene) return;
    this.battleScene.setupBattle({
      hero: this.getHero(),
      weapon: this.getEquippedWeapon(),
      stage: this.currentStage
    });
  }

  /**
   * 依暗黑境界與關卡載入 10 題專屬題庫
   */
  rebuildQuestionPool() {
    let pool = [];
    const st = this.storage.state;

    if (st.useCustomVocabulary && st.customVocabularyRaw) {
      try {
        pool = parseCustomVocabularyInput(st.customVocabularyRaw);
      } catch (error) {
        st.useCustomVocabulary = false;
        this.storage.save();
        // 舊存檔可能含未收錄字，保留原文並告知需補注音，暫用預設題庫。
        window.alert(`自訂祕笈需要補注音，已暫時恢復預設題庫。\n${error.message}`);
      }
    } else if (st.selectedTextbook) {
      const pub = TEXTBOOK_CATALOG[st.selectedTextbook.publisherId];
      const grade = pub?.grades.find((g) => g.gradeId === st.selectedTextbook.gradeId);
      const lesson = grade?.lessons.find((l) => l.lessonId === st.selectedTextbook.lessonId);
      if (lesson && lesson.words.length > 0) {
        pool = lesson.words.map((w) => ({ ...w, mode: 'bopomofo' }));
      }
    }

    if (pool.length === 0) {
      if (st.activePracticeKey === 'english') {
        pool = ENGLISH_PRACTICE_BANKS[this.currentDifficulty] || ENGLISH_PRACTICE_BANKS.easy;
      }
    }
    if (pool.length === 0) {
      const bank = DIFFICULTY_BANKS[this.currentDifficulty] || DIFFICULTY_BANKS.easy;
      const stageKey = `stage_${this.currentStageIndex}`;
      pool = bank[stageKey] || bank.stage_1;
    }

    this.questionPool = [...pool];
    this.questionPoolKey = JSON.stringify(pool);
    this.questionQueue = this.createQuestionQueue(this.questionQueue[0]?.text ?? null);
    this.questionCursor = 0;
  }

  createQuestionQueue(previousText = null) {
    const selected = this.storage.state.selectedTextbook;
    const gradeLevel = selected?.publisherId === 'mixed'
      ? Number(/^g([1-6])_mix$/.exec(selected.gradeId)?.[1]) : 0;
    const queue = gradeLevel && !this.storage.state.useCustomVocabulary && !this.isMistakeDrill
      ? buildGradeQuestionQueue(this.questionPool, gradeLevel, this.currentDifficulty)
      : shuffleQuestions(this.questionPool);
    // 換批後盡量不讓前一題立即重複，保持原本的抽題比例。
    if (queue.length > 1 && queue[0].text === previousText) {
      const index = queue.findIndex(word => word.text !== previousText);
      if (index > 0) [queue[0], queue[index]] = [queue[index], queue[0]];
    }
    return queue;
  }

  nextQuestion() {
    clearTimeout(this.nextQuestionTimer);
    if (this.questionQueue.length === 0) {
      this.rebuildQuestionPool();
    }
    if (this.questionCursor >= this.questionQueue.length) {
      const previousText = this.questionQueue[(this.questionCursor - 1) % this.questionQueue.length]?.text;
      this.questionQueue = this.createQuestionQueue(previousText);
      this.questionCursor = 0;
    }
    const item = this.questionQueue[this.questionCursor % this.questionQueue.length];
    this.questionCursor++;
    this.typing.loadWord(item);
    this.typing.active = true;
    this.saveCurrentSessionProgress();
  }

  scheduleNextQuestion(delay) {
    clearTimeout(this.nextQuestionTimer);
    this.nextQuestionTimer = setTimeout(() => {
      if (!this.isStageClearing) this.nextQuestion();
    }, delay);
  }

  renderQuestionDOM() {
    const container = document.getElementById('word-characters');
    container.innerHTML = '';

    const word = this.typing.currentWord;
    if (!word) return;

    const diffCfg = DIFFICULTY_CONFIG[this.currentDifficulty];
    const st = this.storage.state;
    let sourceLabel = `【${diffCfg.name}】第 ${this.currentStageIndex} 關（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    if (this.isMistakeDrill) {
      sourceLabel = `📝 錯題墨寶閣・專項特訓（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    } else if (st.useCustomVocabulary) {
      sourceLabel = `📜 爸媽自訂祕笈本（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    } else if (st.selectedTextbook) {
      const pub = TEXTBOOK_CATALOG[st.selectedTextbook.publisherId];
      const grade = pub?.grades.find((item) => item.gradeId === this.storage.state.selectedTextbook.gradeId);
      sourceLabel = `📘 ${pub?.publisherName || '國語練習'}・${grade?.gradeName || ''}（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    } else if (st.activePracticeKey === 'english') {
      sourceLabel = `🔤 英文練習・${diffCfg.name}（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    }

    document.getElementById('scroll-source-label').textContent = sourceLabel;
    const examples = this.typing.mode === 'bopomofo' && !word.isSingleKey && Array.from(word.text).length === 1
      ? getDictionaryUsage(word.text, word.bopomofo?.[0] || '') : [];
    document.getElementById('word-meaning-text').textContent = examples.length
      ? `例詞：${examples.join('、')}` : word.meaning || '';

    const needHint = (this.consecutiveMisses || 0) >= 2;

    const page = getQuestionPage(this.typing.charIndex, word.text, this.typing.mode);
    container.classList.toggle('english-characters', this.typing.mode === 'english');
    const context = document.getElementById('question-context');
    const progress = document.getElementById('question-page-progress');
    const grouped = page.total > 1;
    context.hidden = !grouped;
    progress.hidden = !grouped;
    context.textContent = grouped ? word.text : '';
    progress.textContent = grouped
      ? this.typing.mode === 'english'
        ? `第 ${page.page} / ${page.total} 個單字（打完自動接續）`
        : `第 ${page.page} / ${page.total} 組・第 ${page.start + 1}～${page.end} 字（打完自動接續）`
      : '';

    this.typing.characters.forEach((chObj, cIdx) => {
      if (cIdx < page.start || cIdx >= page.end) return;
      const card = document.createElement('div');
      card.className = 'q-char-card';
      card.id = `q-char-${cIdx}`;
      if (chObj.completed) card.classList.add('done');
      else if (cIdx === this.typing.charIndex) card.classList.add('current');

      const zyList = document.createElement('div');
      zyList.className = 'q-zy-list';

      chObj.symbols.forEach((sym, sIdx) => {
        const symSpan = document.createElement('span');
        symSpan.className = 'q-zy-item';
        if (sym === '␣') {
          symSpan.classList.add('tone-space');
          symSpan.title = '一聲（請按空白鍵）';
        }
        if (cIdx < this.typing.charIndex || (cIdx === this.typing.charIndex && sIdx < this.typing.symbolIndex)) {
          symSpan.classList.add('typed');
        } else if (cIdx === this.typing.charIndex && sIdx === this.typing.symbolIndex) {
          symSpan.classList.add('active-sym');
          if (needHint) {
            symSpan.classList.add('hint-flare');
          }
        }
        symSpan.textContent = sym === '␣' ? '␣一聲' : sym;
        zyList.appendChild(symSpan);
      });

      const hanzi = document.createElement('div');
      hanzi.className = 'q-hanzi';
      hanzi.textContent = chObj.char === ' ' ? '␣' : chObj.char;

      if (this.typing.mode !== 'english') card.appendChild(zyList);
      card.appendChild(hanzi);
      container.appendChild(card);
    });

    this.keyDomMap.forEach((el) => el.classList.remove('active-target'));
    const keyInfo = this.typing.getExpectedKeyInfo();
    const fingerEl = document.getElementById('finger-guide-pill');
    fingerEl.classList.toggle('needs-help', needHint && !!keyInfo);

    if (keyInfo) {
      const keyEl = this.keyDomMap.get(keyInfo.code);
      if (keyEl) keyEl.classList.add('active-target');
      const isSpaceTone = keyInfo.code === 'Space' || keyInfo.zy === '␣' || keyInfo.zy === 'ˉ';
      const symLabel =
        this.typing.mode === 'english'
          ? keyInfo.en
          : isSpaceTone
          ? '一聲（空白鍵 ␣）'
          : keyInfo.zy;
      const keyLabel = isSpaceTone ? 'Space 空白鍵' : keyInfo.en;
      const keycapBadge = this.renderKeycapBadgeHTML(keyInfo);

      const curChar = this.typing.characters[this.typing.charIndex]?.char || '';
      const label = needHint ? `💡 請打「${curChar}」：` : '下一鍵：';
      const vkTip = needHint && !this.storage.state.showVirtualKeyboard && this.consecutiveMisses >= 3
        ? '<small class="guide-keyboard-tip">找不到鍵位？按 Tab 展開鍵盤。</small>' : '';
      fingerEl.innerHTML = `${keycapBadge}<span>${label}<strong class="guide-sym-chip">${symLabel}</strong>（按鍵 <strong class="guide-key-chip">${keyLabel}</strong>・${keyInfo.finger}）${vkTip}</span>`;
    } else {
      fingerEl.innerHTML = `招式完成！劍氣斬擊中...`;
    }
    // 矮視窗的題目區可捲動，錯鍵指引出現時確保完整可見。
    if (needHint) {
      fingerEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      const paper = container.closest('.paper-scroll');
      if (paper) paper.scrollTop = 0;
    }
  }

  /**
   * 依據預期鍵位動態產生 v4 四色空白鍵帽疊字徽章（左手青藍、右手青綠、聲調暖金、一聲長條空白鍵）
   */
  renderKeycapBadgeHTML(keyInfo) {
    if (!keyInfo) return '';
    const isSpace = keyInfo.code === 'Space' || keyInfo.isWide || keyInfo.zy === '␣' || keyInfo.zy === 'ˉ';
    let keycapImg = './assets/ui/keycap_left_v4.png';
    if (isSpace) {
      keycapImg = './assets/ui/keycap_space_v4.png';
    } else if (keyInfo.isTone) {
      keycapImg = './assets/ui/keycap_tone_v4.png';
    } else if (keyInfo.finger && keyInfo.finger.startsWith('右手')) {
      keycapImg = './assets/ui/keycap_right_v4.png';
    }

    const topEn = isSpace ? 'SPACE' : keyInfo.en;
    const mainZy =
      this.typing.mode === 'english'
        ? keyInfo.en
        : isSpace
        ? '一聲・空白鍵'
        : keyInfo.zy;

    return `
      <span class="v4-keycap-widget ${isSpace ? 'is-space' : ''}">
        <img src="${keycapImg}" alt="" class="v4-keycap-bg" />
        <span class="v4-keycap-overlay">
          <span class="v4-keycap-en">${topEn}</span>
          <span class="v4-keycap-zy">${mainZy}</span>
        </span>
      </span>
    `;
  }

  startAtbTimer() {
    setInterval(() => {
      if (this.isBattlePaused || this.isBackgroundPaused || !this.typing.active || this.isEnemyFrozen) return;
      const interval = this.currentStage?.enemy?.attackIntervalMs || 0;
      if (interval <= 0) {
        this.enemyAtb = 0;
        this.updateAtbUI();
        return;
      }

      this.enemyAtb += 100 / interval;
      if (this.enemyAtb >= 1.0) {
        this.enemyAtb = 0;
        this.triggerEnemyAttack();
      }
      this.updateAtbUI();
    }, 100);
  }

  updateAtbUI() {
    const atbBar = document.getElementById('enemy-atb-bar');
    const alertBanner = document.getElementById('parry-alert-banner');
    const pct = Math.min(100, Math.round(this.enemyAtb * 100));
    atbBar.style.width = `${pct}%`;

    const isDanger = this.enemyAtb >= 0.72;
    atbBar.classList.toggle('danger', isDanger);
    alertBanner.classList.toggle('show', isDanger);
    if (this.battleScene) {
      this.battleScene.setEnemyDangerAlert(isDanger);
    }
  }

  triggerEnemyAttack() {
    const atk = this.currentStage.enemy.atk || 10;
    this.storage.state.currentHp = Math.max(0, this.storage.state.currentHp - atk);
    this.storage.save();
    this.audio.playPlayerHurt();
    if (this.battleScene) {
      this.battleScene.playEnemyAttack(atk);
    }
    this.updateHUD();

    if (this.storage.state.currentHp <= 0) {
      this.handleStageDefeat();
    }
  }

  updateHUD() {
    const st = this.storage.state;
    const hero = this.getHero();
    const weapon = this.getEquippedWeapon();
    const enemy = this.currentStage.enemy;
    const diffCfg = DIFFICULTY_CONFIG[this.currentDifficulty];

    document.getElementById('hero-name-text').textContent = hero.name;
    const avatarEl = document.getElementById('hero-avatar-img');
    if (avatarEl && hero.avatar) {
      avatarEl.src = hero.avatar;
    }
    const weaponIconEl = document.getElementById('hero-weapon-icon');
    if (weaponIconEl && weapon.icon) {
      weaponIconEl.src = weapon.icon;
    }
    document.getElementById('hero-weapon-badge').textContent = weapon.name.split('・')[1] || weapon.name;
    document.getElementById('hero-weapon-badge').title = `${getWeaponEffectProfile(weapon).name}・每關練習題數不變`;
    document.getElementById('hero-hp-text').textContent = `${st.currentHp} / ${st.maxHp}`;
    document.getElementById('hero-hp-bar').style.width = `${Math.round((st.currentHp / st.maxHp) * 100)}%`;
    document.getElementById('shield-count').textContent = st.missShields;

    for (let i = 1; i <= 5; i++) {
      const dot = document.getElementById(`qi-dot-${i}`);
      if (dot) dot.classList.toggle('filled', i <= this.qiOrbs);
    }

    // 更新技能槽可用與發光狀態
    const btnQ = document.getElementById('btn-skill-q');
    const btnW = document.getElementById('btn-skill-w');
    const btnE = document.getElementById('btn-skill-e');
    const btnR = document.getElementById('btn-skill-r');
    if (btnQ) {
      btnQ.disabled = this.qiOrbs < 2;
      btnQ.classList.toggle('ready', this.qiOrbs >= 2);
    }
    if (btnW) {
      btnW.disabled = this.qiOrbs < 2;
      btnW.classList.toggle('ready', this.qiOrbs >= 2);
    }
    if (btnE) {
      const canHeal = this.qiOrbs >= 3 && st.currentHp < st.maxHp;
      btnE.disabled = !canHeal;
      btnE.classList.toggle('ready', canHeal);
    }
    if (btnR) {
      btnR.disabled = this.qiOrbs < 5;
      btnR.classList.toggle('ready', this.qiOrbs >= 5);
    }

    if (this.isMistakeDrill) {
      document.getElementById('chapter-title').textContent = `📝 錯題墨寶閣・專項特訓（共 ${this.stageGoal} 題）`;
    } else {
      document.getElementById('chapter-title').textContent = `${diffCfg.name}｜${this.currentStage.title}（${this.currentStage.chapterName}）`;
    }
    document.getElementById('coin-count').textContent = st.coins;
    const stats = this.typing.getStats();
    document.getElementById('wpm-display').textContent = stats.wpm;
    const unitEl = document.getElementById('speed-unit');
    if (unitEl) unitEl.textContent = stats.speedUnit;
    document.getElementById('acc-display').textContent = `${stats.accuracy}%`;

    // 敵人血條與擊破進度
    document.getElementById('enemy-name-text').textContent = this.isMistakeDrill ? '心魔墨影（錯題特訓）' : enemy.name;
    document.getElementById('enemy-title-badge').textContent = this.isMistakeDrill ? '特訓' : `${this.currentStageIndex} / 10 關`;
    const remainingGoals = Math.max(0, this.stageGoal - this.clearedWordsCount);
    document.getElementById('enemy-hp-text').textContent = `剩餘 ${remainingGoals} / ${this.stageGoal} 題`;
    document.getElementById('enemy-hp-bar').style.width = `${Math.round((remainingGoals / this.stageGoal) * 100)}%`;

    document.getElementById('btn-toggle-lang').textContent =
      st.languageMode === 'english' ? '🔤 模式：西洋英打' : '🀄 模式：大千注音';
  }

  updateComboBanner(combo, tier) {
    const banner = document.getElementById('combo-banner');
    const numEl = document.getElementById('combo-num');
    const tagEl = document.getElementById('combo-tag');

    if (combo < 2) {
      banner.style.opacity = '0';
      return;
    }
    banner.style.opacity = '1';
    numEl.textContent = `Combo ×${combo}`;
    const tags = ['初窺門徑', '⚔️ 劍光如虹 (1.15x)', '🌪️ 氣流殘影 (1.3x)', '🔥 劍意覺醒 (1.5x)'];
    tagEl.textContent = tags[tier] || tags[0];
  }

  /**
   * 勝利結算（通關 10 題）
   */
  handleStageVictory() {
    if (this.isStageClearing) return;
    this.isStageClearing = true;
    this.isBattlePaused = true;
    this.typing.active = false;
    this.audio.playVictory();

    const stats = this.typing.getStats();
    const stars = stats.accuracy >= 92 ? 3 : stats.accuracy >= 80 ? 2 : 1;
    const rewardCoins = this.currentStage.rewardCoins;

    this.storage.recordStageVictory(this.currentDifficulty, this.currentStageIndex, {
      stars,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      rewardCoins
    });
    this.updateHUD();

    // 檢查是否突破境界（通關第 10 關）
    let breakthroughNotice = '';
    let nextDiffId = null;
    let nextBtnLabel = `⚔️ 進入第 ${this.currentStageIndex + 1} 關`;
    if (this.currentStageIndex === 10) {
      if (this.currentDifficulty === 'easy') {
        nextDiffId = 'medium';
        nextBtnLabel = '⚔️ 晉升下一境界：名震江湖（第 1 關）';
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.05rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          🎉 恭喜突破【初出茅廬】！已成功解鎖【名震江湖（中）】全新 10 關挑戰！
        </div>`;
      } else if (this.currentDifficulty === 'medium') {
        nextDiffId = 'hard';
        nextBtnLabel = '⚔️ 晉升終極境界：一代宗師（第 1 關）';
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.05rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          🏆 恭喜名震江湖！已成功解鎖終極境界【一代宗師（難）】地獄 10 關挑戰！
        </div>`;
      } else {
        nextBtnLabel = '🗺️ 查看江湖境界地圖';
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.05rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          👑 恭賀少俠斬破黑風魔皇，登峰造極，榮登武林盟主至尊寶座！
        </div>`;
      }
    }

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const stampImg =
      stars >= 3
        ? './assets/ui/stamp_perfect_v4.png'
        : './assets/ui/stamp_record_v4.png';
    const stampAlt = stars >= 3 ? '完勝印章' : '破關印章';

    const body = document.getElementById('result-modal-body');
    body.innerHTML = `
      <div class="results-scroll-stage">
        <img src="${stampImg}" alt="${stampAlt}" class="result-stamp-badge" />
        <div style="font-size:2.4rem; margin-bottom:8px;">${starStr}</div>
        <h3 style="color:var(--bright-gold); font-size:1.35rem; margin-bottom:6px;">
          十斬大成！成功擊退【${this.currentStage.enemy.name}】！
        </h3>
        <p style="color:#adb5bd; font-size:0.92rem; margin-bottom:6px;">
          ${this.currentStage.enemy.quote}
        </p>
        <p style="color:#69db7c; font-size:0.86rem; margin-bottom:12px;">
          ❤️ 少俠戰後運功調息，氣血已全滿恢復（${this.storage.state.currentHp} / ${this.storage.state.maxHp}）！
        </p>
        ${breakthroughNotice}
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px;">
          <div class="item-box" style="text-align:center;">
            <span style="font-size:0.8rem; color:#adb5bd;">打字速度</span>
            <strong style="font-size:1.4rem; color:var(--sword-cyan);">${stats.wpm} ${stats.speedUnit}</strong>
          </div>
          <div style="text-align:center;" class="item-box">
            <span style="font-size:0.8rem; color:#adb5bd;">正確率</span>
            <strong style="font-size:1.4rem; color:#69db7c;">${stats.accuracy}%</strong>
          </div>
          <div style="text-align:center;" class="item-box">
            <span style="font-size:0.8rem; color:#adb5bd;">獲得賞金</span>
            <strong style="font-size:1.4rem; color:var(--bright-gold);">+${rewardCoins} 🪙</strong>
          </div>
        </div>
        <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
          <button class="wuxia-btn" id="btn-result-replay">🔄 重練本關</button>
          <button class="wuxia-btn" id="btn-result-shop">🏮 客棧神兵閣</button>
          <button class="wuxia-btn" id="btn-result-map">🗺️ 選關地圖</button>
          <button class="wuxia-btn gold" id="btn-result-next">${nextBtnLabel}（Enter）</button>
        </div>
      </div>
    `;

    document.getElementById('result-modal-title').textContent = '武林捷報・十斬通關';
    this.openExclusiveModal('modal-result');

    document.getElementById('btn-result-replay')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex, { resumeSession: false });
    });
    document.getElementById('btn-result-shop')?.addEventListener('click', () => {
      this.openShopModal();
    });
    document.getElementById('btn-result-map')?.addEventListener('click', () => {
      this.openStageModal(nextDiffId || this.currentDifficulty);
    });
    document.getElementById('btn-result-next')?.addEventListener('click', () => {
      this.closeAllModals();
      if (this.currentStageIndex < 10) {
        this.startStage(this.currentDifficulty, this.currentStageIndex + 1, { resumeSession: false });
      } else if (nextDiffId) {
        this.startStage(nextDiffId, 1, { resumeSession: false });
      } else {
        this.openStageModal(this.currentDifficulty);
      }
    });
    // 將焦點移至下一步，使用原生 Enter 啟動；彈窗內 Tab 可切換其他按鈕。
    document.getElementById('btn-result-next')?.focus({ preventScroll: true });
  }

  /**
   * 錯題墨寶閣專項特訓完成結算（獨立於主線關卡，不誤觸主線通關）
   */
  handleMistakeDrillVictory() {
    if (this.isStageClearing) return;
    this.isStageClearing = true;
    this.isBattlePaused = true;
    this.typing.active = false;
    this.audio.playVictory();

    const stats = this.typing.getStats();
    const bonusCoins = Math.max(15, this.stageGoal * 5);
    this.storage.state.coins += bonusCoins;
    this.storage.save();
    this.updateHUD();

    const stampImg = stats.accuracy >= 92 ? './assets/ui/stamp_perfect_v4.png' : './assets/ui/stamp_record_v4.png';
    const body = document.getElementById('result-modal-body');
    body.innerHTML = `
      <div class="results-scroll-stage">
        <img src="${stampImg}" alt="特訓印章" class="result-stamp-badge" />
        <h3 style="color:var(--bright-gold); font-size:1.35rem; margin-bottom:8px;">
          📝 錯題特訓大成！共斬破 ${this.stageGoal} 道生疏字詞！
        </h3>
        <p style="color:#ced4da; font-size:0.92rem; margin-bottom:14px;">
          特訓速度：<strong style="color:var(--sword-cyan);">${stats.wpm} ${stats.speedUnit}</strong> ｜
          正確率：<strong style="color:#69db7c;">${stats.accuracy}%</strong> ｜
          勤學賞金：<strong style="color:var(--bright-gold);">+${bonusCoins} 🪙</strong>
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="wuxia-btn" id="btn-drill-clear-return">🗑️ 清空已練熟錯題並回主線</button>
          <button class="wuxia-btn gold" id="btn-drill-return-stage">⚔️ 返回主線關卡繼續修煉</button>
        </div>
      </div>
    `;
    document.getElementById('result-modal-title').textContent = '墨寶閣・特訓捷報';
    this.openExclusiveModal('modal-result');

    document.getElementById('btn-drill-clear-return')?.addEventListener('click', () => {
      this.mistakeDrillKeys.forEach(key => this.storage.removeMistake(key));
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex, { resumeSession: true });
    });
    document.getElementById('btn-drill-return-stage')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex, { resumeSession: true });
    });
  }

  handleStageDefeat() {
    if (this.isStageClearing) return;
    this.isStageClearing = true;
    this.isBattlePaused = true;
    this.typing.active = false;

    const consolation = Math.round(this.currentStage.rewardCoins * 0.5);
    this.storage.state.coins += consolation;
    this.storage.state.currentHp = this.storage.state.maxHp;
    this.storage.save();
    this.updateHUD();

    const body = document.getElementById('result-modal-body');
    body.innerHTML = `
      <div class="results-scroll-stage">
        <img src="./assets/ui/stamp_retry_v4.png" alt="重整旗鼓印章" class="result-stamp-badge" />
        <h3 style="color:#ffd166; font-size:1.3rem; margin-bottom:8px;">
          少俠勝敗乃兵家常事，回客棧喝碗熱茶再戰！
        </h3>
        <p style="color:#ced4da; font-size:0.92rem; margin-bottom:16px;">
          店小二已為少俠包紮完畢（氣血已全滿恢復），並獲得歷練賞金 <strong>+${consolation} 🪙</strong>！
        </p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <button class="wuxia-btn" id="btn-fail-shop">🏮 去客棧換把好劍</button>
          <button class="wuxia-btn gold" id="btn-fail-retry">⚔️ 接續本關再戰</button>
        </div>
      </div>
    `;
    document.getElementById('result-modal-title').textContent = '暫回客棧・調息養氣';
    this.openExclusiveModal('modal-result');

    document.getElementById('btn-fail-shop')?.addEventListener('click', () => {
      this.openShopModal();
    });
    document.getElementById('btn-fail-retry')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex, { resumeSession: true });
    });
  }

  /**
   * 單一彈窗開啟保護：先關閉所有其他彈窗並將卷軸歸零，防止彈窗疊加與橫幅被截斷
   */
  openExclusiveModal(modalId) {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
    this.isBattlePaused = true;
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      modalEl.classList.add('open');
      const card = modalEl.querySelector('.modal-card');
      if (card) card.scrollTop = 0;
    }
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
    this.isStageClearing = false;
    this.isBattlePaused = false;
    this.typing.active = true;
  }

  /**
   * 暗黑三大境界 × 10 關地圖選單彈窗（支援切換易／中／難）
   */
  openStageModal(targetDiffId) {
    this.pendingPracticeKey = null;
    const activeDiff = (typeof targetDiffId === 'string' && DIFFICULTY_CONFIG[targetDiffId])
      ? targetDiffId
      : this.currentDifficulty;
    this.renderStageSelectionTabs(activeDiff);
    this.openExclusiveModal('modal-stages');
  }

  openPracticeModal() {
    const select = document.getElementById('practice-book');
    select.replaceChildren();
    MAIN_PRACTICE_CHOICES.forEach(choice => {
      const option = document.createElement('option');
      option.value = choice.key;
      option.textContent = choice.label;
      select.appendChild(option);
    });
    select.value = MAIN_PRACTICE_CHOICES.some(c => c.key === this.storage.state.activePracticeKey)
      ? this.storage.state.activePracticeKey : 'grade-1';
    const refresh = () => {
      const choice = PRACTICE_CHOICES.find(c => c.key === select.value);
      const profile = this.storage.getPracticeProfile(choice.key);
      const saved = profile.savedSession;
      const diff = saved?.difficulty || profile.currentDifficulty;
      const selected = choice.source?.selectedTextbook;
      const lesson = selected && TEXTBOOK_CATALOG[selected.publisherId]?.grades
        .find(g => g.gradeId === selected.gradeId)?.lessons.find(l => l.lessonId === selected.lessonId);
      const gradeLevel = Number(/^grade-([1-6])$/.exec(choice.key)?.[1]);
      const ratioDescription = gradeLevel ? `${describeGradeQuestionRatio(gradeLevel, diff)}。` : '';
      const poolDescription = lesson ? `題庫共 ${lesson.words.length} 題，依境界分層隨機抽題。${ratioDescription}` : '';
      document.getElementById('practice-summary').textContent =
        `${choice.description} ${poolDescription} 上次進度：${DIFFICULTY_CONFIG[diff].name}・第 ${saved?.stageIndex || 1} 關。`;
    };
    select.onchange = refresh;
    refresh();
    document.getElementById('btn-practice-realms').onclick = () => {
      this.pendingPracticeKey = select.value;
      const profile = this.storage.getPracticeProfile(select.value);
      this.renderStageSelectionTabs(profile.savedSession?.difficulty || profile.currentDifficulty);
      this.openExclusiveModal('modal-stages');
    };
    document.getElementById('btn-practice-back').onclick = () => this.openPracticeModal();
    this.openExclusiveModal('modal-practice');
    select.focus({ preventScroll: true });
  }

  commitPracticeChoice(key) {
    this.saveCurrentSessionProgress();
    const choice = PRACTICE_CHOICES.find(c => c.key === key);
    this.storage.activatePracticeProfile(key, choice?.source || null);
    this.qiOrbs = this.storage.state.savedSession?.qiOrbs || 0;
    this.pendingPracticeKey = null;
  }

  renderStageSelectionTabs(activeDiffId) {
    const listEl = document.getElementById('stage-list-grid');
    listEl.innerHTML = '';

    // 建立頂部境界切換按鈕列
    let tabHeader = document.getElementById('diff-tab-header');
    if (!tabHeader) {
      tabHeader = document.createElement('div');
      tabHeader.id = 'diff-tab-header';
      tabHeader.style.cssText = 'display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; flex-shrink:0;';
      listEl.parentElement.insertBefore(tabHeader, listEl);
    }
    tabHeader.innerHTML = '';

    const practiceKey = this.pendingPracticeKey || this.storage.state.activePracticeKey || 'jianghu';
    const profile = this.storage.getPracticeProfile(practiceKey);
    const unlocked = profile.unlockedDifficulties || ['easy'];
    const gradeLevel = Number(/^grade-([1-6])$/.exec(practiceKey)?.[1]);
    document.getElementById('stage-practice-label').textContent =
      `題本：${PRACTICE_CHOICES.find(c => c.key === practiceKey)?.label || '自訂題本'}・各題本獨立記錄進度` +
      (gradeLevel ? `｜${describeGradeQuestionRatio(gradeLevel, activeDiffId)}` : '');

    Object.values(DIFFICULTY_CONFIG).forEach((cfg) => {
      const isUnlocked = unlocked.includes(cfg.id);
      const isCurrentTab = cfg.id === activeDiffId;
      const prog = profile.stageProgress[cfg.id] || { records: {} };
      const clearedCount = Object.keys(prog.records || {}).length;
      const badgeImg = cfg.badgeIcon
        ? `<img src="${cfg.badgeIcon}" alt="${cfg.name}" class="inline-realm-badge" />`
        : '';

      const btn = document.createElement('button');
      btn.className = `wuxia-btn ${isCurrentTab ? 'gold' : ''}`;
      btn.innerHTML = `${badgeImg}<span>${isUnlocked ? '🔓 ' : '🔒 '}${cfg.name} (${clearedCount}/10關)</span>`;
      btn.title = isUnlocked ? '以所選題本挑戰此境界，年級不會隨境界改變。' : `需先通關此題本前一境界第 10 關首領解鎖`;
      if (!isUnlocked) {
        btn.style.opacity = '0.55';
      }
      btn.addEventListener('click', () => {
        if (!isUnlocked) {
          this.audio.playMiss();
          return;
        }
        this.renderStageSelectionTabs(cfg.id);
      });
      tabHeader.appendChild(btn);
    });

    // 渲染所選境界之 10 關
    const stages = DIABLO_STAGES[activeDiffId] || DIABLO_STAGES.easy;
    const diffProg = profile.stageProgress[activeDiffId] || { maxUnlockedStage: 1, records: {} };
    const saved = profile.savedSession;

    stages.forEach((st) => {
      const isUnlocked = unlocked.includes(activeDiffId) && st.stageIndex <= diffProg.maxUnlockedStage;
      const rec = diffProg.records[st.stageIndex];
      const stars = rec ? '⭐'.repeat(rec.stars) : isUnlocked ? '待挑戰' : '🔒 未解鎖';
      const isCurrent =
        !this.isMistakeDrill &&
        practiceKey === (this.storage.state.activePracticeKey || 'jianghu') &&
        activeDiffId === (saved?.difficulty || profile.currentDifficulty) &&
        st.stageIndex === (saved?.stageIndex || diffProg.currentStageIndex);

      const hasSavedMidProgress =
        saved &&
        saved.difficulty === activeDiffId &&
        Number(saved.stageIndex) === st.stageIndex &&
        (saved.clearedWordsCount > 0 || saved.typingProgress) &&
        saved.clearedWordsCount < 10;

      const progressBadge = hasSavedMidProgress
        ? `<div style="font-size:0.78rem; color:#ffd166; margin-top:3px;">📌 上次進度：已斬 ${saved.clearedWordsCount} / 10 題</div>`
        : '';

      const card = document.createElement('div');
      card.className = 'item-box' + (isCurrent ? ' active-choice' : '');
      if (!isUnlocked) card.style.opacity = '0.55';

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--bright-gold);">${st.title}</strong>
            <span style="font-size:0.8rem; color:#72efdd;">${stars}</span>
          </div>
          <div style="font-size:0.82rem; color:#adb5bd; margin-top:3px;">
            ${st.chapterName} ｜ 守關：${st.enemy.name}
          </div>
          <div style="font-size:0.8rem; color:#ced4da; margin-top:4px;">
            通關賞金：🪙 ${st.rewardCoins} ｜ 10 題十斬挑戰
          </div>
          ${progressBadge}
        </div>
        <div style="display:flex; gap:6px;">
          <button class="wuxia-btn ${isCurrent ? 'gold' : ''}" style="flex:1; justify-content:center;" data-action="start" ${isUnlocked ? '' : 'disabled'}>
            ${
              !isUnlocked
                ? '🔒 需通關前一關'
                : hasSavedMidProgress
                ? `⚔️ 繼續 (第 ${saved.clearedWordsCount + 1}/10 題)`
                : isCurrent
                ? '⚔️ 當前修煉中'
                : '前往挑戰'
            }
          </button>
          ${
            isUnlocked && hasSavedMidProgress
              ? `<button class="wuxia-btn" data-action="restart" title="從第 1 題重新挑戰">🔄 重頭</button>`
              : ''
          }
        </div>
      `;

      if (isUnlocked) {
        card.querySelector('[data-action="start"]')?.addEventListener('click', () => {
          this.commitPracticeChoice(practiceKey);
          this.closeAllModals();
          this.startStage(activeDiffId, st.stageIndex, { resumeSession: hasSavedMidProgress });
        });
        card.querySelector('[data-action="restart"]')?.addEventListener('click', () => {
          this.commitPracticeChoice(practiceKey);
          this.closeAllModals();
          this.startStage(activeDiffId, st.stageIndex, { resumeSession: false });
        });
      }
      listEl.appendChild(card);
    });
  }

  openShopModal() {
    this.renderShopItems();
    this.openExclusiveModal('modal-shop');
  }

  renderShopItems(feedbackMsg = '') {
    const st = this.storage.state;
    document.getElementById('shop-coin-display').textContent = st.coins;
    const hpEl = document.getElementById('shop-hp-display');
    if (hpEl) hpEl.textContent = `${st.currentHp} / ${st.maxHp}`;
    const shieldEl = document.getElementById('shop-shield-display');
    if (shieldEl) shieldEl.textContent = `${st.missShields} 張`;
    const diagEl = document.getElementById('shop-dialogue-text');
    if (diagEl && feedbackMsg) {
      diagEl.innerHTML = `<span style="color:#ffd166; font-weight:700;">${feedbackMsg}</span>`;
    }

    const weaponGrid = document.getElementById('shop-weapons-grid');
    weaponGrid.innerHTML = '';

    WEAPONS.forEach((w) => {
      const owned = st.ownedWeapons.includes(w.id);
      const equipped = st.equippedWeaponId === w.id;
      const canAfford = st.coins >= w.price;

      const box = document.createElement('div');
      box.className = 'item-box' + (equipped ? ' active-choice' : '');
      box.innerHTML = `
        <div class="shop-item-thumb-row">
          <img class="shop-item-icon" src="${w.icon}" alt="${w.name}" title="${w.name}" />
          ${w.outfitIcon ? `<img class="shop-item-icon" src="${w.outfitIcon}" alt="${w.OutfitName}" title="${w.OutfitName}" />` : ''}
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:var(--bright-gold);">${w.name}</strong>
              <span style="color:var(--light-cyan); font-size:0.84rem; font-weight:700;">${getWeaponEffectProfile(w).name}</span>
            </div>
            <div style="font-size:0.8rem; color:#90e0ef; margin-top:2px;">袍服：${w.OutfitName}</div>
            <div style="font-size:0.78rem; color:#d0d8df; margin-top:3px;">${w.desc}<br>劍氣演出強度 ${w.atk}・每關練習題數不變</div>
          </div>
        </div>
        <button class="wuxia-btn ${equipped ? 'gold' : ''}" style="display:flex; align-items:center; justify-content:center; gap:5px;" ${(!owned && !canAfford) ? 'disabled' : ''}>
          ${
            equipped
              ? '✅ 已佩帶'
              : owned
              ? '⚔️ 佩帶此劍'
              : canAfford
              ? `<img src="./assets/icons/copper_coins_v3.png" alt="銅錢" style="width:16px;height:16px;object-fit:contain;" /> ${w.price} 銅錢購買`
              : `🔒 銅錢不足（需 ${w.price}）`
          }
        </button>
      `;

      box.querySelector('button').addEventListener('click', () => {
        if (equipped) return;
        let msg = '';
        if (owned) {
          st.equippedWeaponId = w.id;
          this.audio.playCoin();
          msg = `✨ 已換上【${w.name}】與【${w.OutfitName}】，少俠英姿煥發！`;
        } else if (st.coins >= w.price) {
          st.coins -= w.price;
          st.ownedWeapons.push(w.id);
          st.equippedWeaponId = w.id;
          this.audio.playCoin();
          msg = `🎉 恭賀少俠購得名門神兵【${w.name}】，立繪與劍氣已同步升級！`;
        } else {
          this.audio.playMiss();
          return;
        }
        this.storage.save();
        this.refreshBattleVisuals();
        this.updateHUD();
        this.renderShopItems(msg);
      });

      weaponGrid.appendChild(box);
    });

    const itemGrid = document.getElementById('shop-items-grid');
    itemGrid.innerHTML = '';

    SHOP_ITEMS.forEach((item) => {
      const isFullHp = st.currentHp >= st.maxHp;
      const isMaxCapHp = st.maxHp >= MAX_HERO_HP_CAP;
      const isMaxShields = st.missShields >= 10;

      let disabledReason = '';
      if (item.type === 'heal' && isFullHp) {
        disabledReason = '✅ 氣血已滿（無須服用）';
      } else if (item.type === 'full_heal_boost' && isMaxCapHp && isFullHp) {
        disabledReason = `✅ 已達宗師氣血極限 (${MAX_HERO_HP_CAP})`;
      } else if (item.type === 'shield_miss' && isMaxShields) {
        disabledReason = '✅ 護身符已達上限 (10張)';
      } else if (st.coins < item.price) {
        disabledReason = `🔒 銅錢不足（需 ${item.price}）`;
      }

      const box = document.createElement('div');
      box.className = 'item-box';
      box.innerHTML = `
        <div class="shop-item-thumb-row">
          ${item.icon ? `<img class="shop-item-icon" src="${item.icon}" alt="${item.name}" title="${item.name}" />` : ''}
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong style="color:#69db7c;">${item.name}</strong>
              <span style="color:var(--bright-gold); display:inline-flex; align-items:center; gap:3px; font-weight:700;">
                <img src="./assets/icons/copper_coins_v3.png" alt="銅錢" style="width:16px;height:16px;object-fit:contain;" /> ${item.price}
              </span>
            </div>
            <div style="font-size:0.8rem; color:#adb5bd; margin-top:4px;">${item.desc}</div>
          </div>
        </div>
        <button class="wuxia-btn" ${disabledReason ? 'disabled' : ''}>
          ${disabledReason || '🧪 購買並立即使用'}
        </button>
      `;

      box.querySelector('button').addEventListener('click', () => {
        if (disabledReason || st.coins < item.price) {
          this.audio.playMiss();
          return;
        }
        st.coins -= item.price;
        let msg = '';
        if (item.type === 'heal') {
          const before = st.currentHp;
          st.currentHp = Math.min(st.maxHp, st.currentHp + item.value);
          msg = `🌿 已敷上【${item.name}】，氣血恢復 +${st.currentHp - before}（目前 ${st.currentHp} / ${st.maxHp}）！`;
        } else if (item.type === 'full_heal_boost') {
          const oldMax = st.maxHp;
          st.maxHp = Math.min(MAX_HERO_HP_CAP, st.maxHp + item.maxHpBonus);
          st.currentHp = st.maxHp;
          msg = st.maxHp > oldMax
            ? `🔥 服下【${item.name}】打通任督二脈！氣血上限提升至 ${st.maxHp} 並全滿恢復！`
            : `🔥 服下【${item.name}】，氣血已全滿恢復至 ${st.currentHp} / ${st.maxHp}！`;
        } else if (item.type === 'shield_miss') {
          st.missShields = Math.min(10, st.missShields + item.value);
          msg = `🛡️ 已佩掛【${item.name}】，目前共有 ${st.missShields} 張護身符可抵擋按錯斷連！`;
        }
        this.audio.playCoin();
        this.storage.save();
        this.updateHUD();
        this.renderShopItems(msg);
      });

      itemGrid.appendChild(box);
    });
  }

  openTextbookModal() {
    const container = document.getElementById('textbook-list-container');
    container.innerHTML = '';
    const resources = document.getElementById('publisher-resource-links');
    resources.replaceChildren();
    PUBLISHER_RESOURCE_LINKS.forEach((resource) => {
      const link = document.createElement('a');
      link.href = resource.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = resource.name;
      link.style.marginRight = '1rem';
      resources.appendChild(link);
    });

    [TEXTBOOK_CATALOG.mixed].forEach((pub) => {
      pub.grades.forEach((grade) => {
        grade.lessons.forEach((lesson) => {
          const isSelected =
            this.storage.state.selectedTextbook?.lessonId === lesson.lessonId &&
            !this.storage.state.useCustomVocabulary;

          const card = document.createElement('div');
          card.className = 'item-box' + (isSelected ? ' active-choice' : '');
          const previewWords = lesson.words.slice(0, 5).map((w) => w.text).join('、');
          card.innerHTML = `
            <div class="shop-item-thumb-row">
              <span style="font-size:2rem;">${pub.publisherId === 'moe' ? '📖' : '📚'}</span>
              <div style="flex:1;">
                <div style="display:flex; justify-content:space-between;">
                  <strong style="color:var(--bright-gold);">【${pub.publisherName}】${grade.gradeName}</strong>
                </div>
                <div style="font-size:0.9rem; color:#fff; margin-top:3px;">${lesson.title}</div>
                <div style="font-size:0.8rem; color:#ffd166;">${(pub.sourceStatus || TEXTBOOK_SOURCE_STATUS).label}</div>
                <div style="font-size:0.8rem; color:#d0d8df; margin-top:4px;">共 ${lesson.words.length} 題・每關隨機練習 10 題<br>內容預覽：${previewWords}${lesson.words.length > 5 ? '…' : ''}</div>
              </div>
            </div>
            <button class="wuxia-btn ${isSelected ? 'gold' : ''}" style="justify-content:center;">
              ${isSelected ? '✅ 目前修煉題庫' : '📘 選用此練習題庫'}
            </button>
          `;

          card.querySelector('button').addEventListener('click', () => {
            const choice = PRACTICE_CHOICES.find(c => c.source?.selectedTextbook?.lessonId === lesson.lessonId && c.source.selectedTextbook.publisherId === pub.publisherId);
            if (!choice) return;
            this.pendingPracticeKey = choice.key;
            const profile = this.storage.getPracticeProfile(choice.key);
            this.renderStageSelectionTabs(profile.currentDifficulty);
            this.openExclusiveModal('modal-stages');
          });

          container.appendChild(card);
        });
      });
    });

    document.getElementById('btn-clear-textbook').onclick = () => {
      this.openPracticeModal();
    };

    this.openExclusiveModal('modal-textbook');
  }

  openCustomWordsModal() {
    const inputEl = document.getElementById('custom-vocab-textarea');
    inputEl.value = this.storage.state.customVocabularyRaw || '';
    const errorEl = document.getElementById('custom-vocab-error');
    errorEl.textContent = '';
    document.getElementById('dictionary-source').textContent =
      `${MOE_MINI_METADATA.attribution}（版本 ${MOE_MINI_METADATA.version}）。${MOE_MINI_METADATA.characterCount.toLocaleString()} 字、${MOE_MINI_METADATA.entryCount.toLocaleString()} 筆條目。`;
    document.getElementById('dictionary-reading-result').textContent = '';
    let lookupId = 0;
    document.getElementById('btn-dictionary-lookup').onclick = async () => {
      const requestId = ++lookupId;
      const character = document.getElementById('dictionary-character').value.trim();
      const result = document.getElementById('dictionary-reading-result');
      if (Array.from(character).length !== 1) {
        result.textContent = '請輸入一個國字。';
        return;
      }
      result.textContent = '正在載入字典釋義…';
      try {
        const entries = await getDictionaryEntries(character);
        if (requestId !== lookupId) return;
        result.textContent = entries.length ? entries.map(entry =>
          `「${character}」${entry.reading}：${entry.definition.replace(/&&|[ㄅ-ㄩ˙ˊˇˋ]+/g, '')}`).join('\n\n')
          : `「${character}」未收錄，請由家長或教師補上注音。`;
      } catch {
        if (requestId === lookupId) result.textContent = '字典暫時無法載入，請檢查連線後再按查詢。';
      }
    };
    this.openExclusiveModal('modal-custom-words');

    document.getElementById('btn-save-custom-vocab').onclick = () => {
      const raw = inputEl.value.trim();
      let parsed;
      try {
        parsed = parseCustomVocabularyInput(raw);
        if (!parsed.length) throw new Error('請輸入國字詞彙或英文單字。');
      } catch (error) {
        errorEl.textContent = error.message;
        return;
      }
      if (parsed.length > 0) {
        this.storage.state.customVocabularyRaw = raw;
        this.storage.save();
        this.pendingPracticeKey = 'custom';
        const profile = this.storage.getPracticeProfile('custom');
        this.renderStageSelectionTabs(profile.currentDifficulty);
        this.openExclusiveModal('modal-stages');
      }
    };
  }

  /**
   * 在畫面中央輕輕浮現水墨招式橫幅，施展後優雅淡出
   */
  showSkillFloatingBanner(title) {
    const banner = document.getElementById('floating-skill-banner');
    if (!banner) return;
    banner.textContent = title;
    banner.classList.add('active');
    if (this._skillBannerTimer) clearTimeout(this._skillBannerTimer);
    this._skillBannerTimer = setTimeout(() => {
      banner.classList.remove('active');
    }, 1100);
  }

  /**
   * 施放主動武功招式
   */
  castSkill(skillId) {
    if (this.isBattlePaused || !this.typing.active) return;
    const weapon = this.getEquippedWeapon();

    if (skillId === 'q') {
      // ⚡ 青蓮劍氣：消耗 2 氣，以 1.5 倍劍氣演出完成整題。
      if (this.qiOrbs < 2) return;
      this.qiOrbs -= 2;
      this.showSkillFloatingBanner('⚡ 青蓮劍氣！');
      const dmg = Math.round(weapon.atk * 1.5);
      this.audio.playSkillSlash();
      if (this.battleScene) {
        this.battleScene.playSkillSlash({ damage: dmg, isCrit: true });
      }
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.typing.active = false;
      this.saveCurrentSessionProgress();
      this.updateHUD();
      if (this.clearedWordsCount >= this.stageGoal) {
        if (this.isMistakeDrill) this.handleMistakeDrillVictory();
        else this.handleStageVictory();
      } else {
        this.scheduleNextQuestion(280);
      }
    } else if (skillId === 'w') {
      // 🌊 凌波微步：消耗 2 氣，將敵人蓄力條歸零並定身 3 秒
      if (this.qiOrbs < 2) return;
      this.qiOrbs -= 2;
      this.showSkillFloatingBanner('🌊 凌波微步！');
      this.enemyAtb = 0;
      this.isEnemyFrozen = true;
      this.audio.playSkillDodge();
      if (this.battleScene) {
        this.battleScene.playSkillDodge();
      }
      setTimeout(() => {
        this.isEnemyFrozen = false;
      }, 3000);
      this.saveCurrentSessionProgress();
      this.updateHUD();
    } else if (skillId === 'e') {
      // 🌿 太極回春：消耗 3 氣，恢復 35 HP（滿血時不扣氣）
      if (this.qiOrbs < 3) return;
      const st = this.storage.state;
      if (st.currentHp >= st.maxHp) {
        this.showSkillFloatingBanner('🌿 少俠氣血已滿，無須調息！');
        return;
      }
      this.qiOrbs -= 3;
      this.showSkillFloatingBanner('🌿 太極回春！');
      const healAmount = Math.min(35, st.maxHp - st.currentHp);
      st.currentHp = Math.min(st.maxHp, st.currentHp + 35);
      this.storage.save();
      this.saveCurrentSessionProgress();
      this.audio.playSkillHeal();
      if (this.battleScene) {
        this.battleScene.playSkillHeal({ healAmount });
      }
      this.updateHUD();
    } else if (skillId === 'r') {
      // 🔥 流雲劍訣：消耗 5 氣（滿氣），全屏水墨一刀斬
      if (this.qiOrbs < 5) return;
      this.qiOrbs = 0;
      this.showSkillFloatingBanner('🔥 流雲劍訣！');
      const dmg = Math.round(weapon.atk * 3.2);
      this.audio.playUltimateBurst();
      if (this.battleScene) {
        this.battleScene.playUltimateBurst({ damage: dmg });
      }
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.typing.active = false;
      this.saveCurrentSessionProgress();
      this.updateHUD();
      if (this.clearedWordsCount >= this.stageGoal) {
        if (this.isMistakeDrill) this.handleMistakeDrillVictory();
        else this.handleStageVictory();
      } else {
        this.scheduleNextQuestion(320);
      }
    }
  }

  /**
   * 打開開場主頁彈窗
   */
  openTitleModal() {
    this.openExclusiveModal('modal-title-screen');
  }

  /**
   * 打開錯題墨寶閣彈窗
   */
  openMistakesModal() {
    this.renderMistakesDOM();
    this.openExclusiveModal('modal-mistakes');
  }

  /**
   * 渲染錯題卡片清單
   */
  renderMistakesDOM() {
    const grid = document.getElementById('mistake-card-grid');
    grid.innerHTML = '';
    const list = this.storage.getMistakes();

    if (list.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #adb5bd;">
          🍵 目前墨寶閣空空如也，少俠功力純熟無錯字！
        </div>
      `;
      return;
    }

    list.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'mistake-card';
      const zyText = (item.symbols || []).join(' ');
      card.innerHTML = `
        <div class="mistake-char">${item.char}</div>
        <div class="mistake-symbols">${zyText}</div>
        <div class="mistake-badge">累計生疏：${item.count} 次</div>
      `;
      grid.appendChild(card);
    });
  }

  /**
   * 發起錯題專項特訓
   */
  startMistakeDrill() {
    const list = this.storage.getMistakes();
    if (list.length === 0) {
      alert('目前墨寶閣無錯題！少俠可繼續闖關修煉。');
      return;
    }

    // 將錯題轉化為題目清單
    const drillQuestions = list.map((item) => {
      const cleanZy =
        item.symbols && item.symbols.length > 0
          ? item.symbols.filter((s) => s !== '␣').join('')
          : item.char;
      return {
        text: item.char,
        bopomofo: [cleanZy],
        meaning: `【錯題特訓】歷次生疏 ${item.count} 次`,
        mode: item.mode || (/^[a-z ]$/i.test(item.char) ? 'english' : 'bopomofo'),
        isSingleKey: !!item.isSingleKey || /^[ㄅ-ㄩ]$/.test(item.char)
      };
    });

    this.isMistakeDrill = true;
    this.questionQueue = shuffleQuestions(drillQuestions);
    this.questionPool = drillQuestions;
    this.questionCursor = 0;
    this.stageGoal = Math.min(10, drillQuestions.length);
    this.mistakeDrillKeys = this.questionQueue.slice(0, this.stageGoal).map(word => word.text);
    this.clearedWordsCount = 0;
    this.typing.resetStats();
    this.isStageClearing = false;
    this.isBattlePaused = false;
    this.closeAllModals();
    this.nextQuestion();
    this.updateHUD();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new WuxiaGameApp();
  });
}
