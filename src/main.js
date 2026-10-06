/**
 * 《武俠打字傳》主控制器 (src/main.js)
 * 完整實作：
 * 1. 暗黑式三大境界 $\times$ 10 關（每關 10 題過關制）
 * 2. 完成整字累計 Combo
 * 3. 雙主角與三階神兵換裝
 * 4. 國小三大課本與爸媽自訂祕笈盒
 */

import { KEYBOARD_ROWS } from './data/daqianLayout.js';
import { HEROES, WEAPONS, SHOP_ITEMS, DIFFICULTY_CONFIG, DIABLO_STAGES } from './data/enemies.js';
import { DIFFICULTY_BANKS, parseCustomVocabularyInput } from './data/vocabulary.js';
import { TEXTBOOK_CATALOG } from './data/textbooks.js';
import { TypingEngine } from './engine/TypingEngine.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { StorageEngine } from './engine/StorageEngine.js';
import { CanvasBattleScene } from './scenes/CanvasBattleScene.js';

class WuxiaGameApp {
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
    const diffProg = this.storage.state.stageProgress[this.currentDifficulty];
    const initialIndex = diffProg?.currentStageIndex || 1;
    this.startStage(this.currentDifficulty, initialIndex);
  }

  initDOM() {
    // 建立水墨半透明大千虛擬鍵盤
    const vkPanel = document.getElementById('vk-panel');
    vkPanel.innerHTML = `
      <div class="vk-hint-row">
        <span>左手聲母（黛藍）</span>
        <span>・</span>
        <span>右手韻母（翠綠）</span>
        <span>・</span>
        <span>聲調音律（赤金）</span>
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
    vkPanel.classList.toggle('hidden', !this.storage.state.showVirtualKeyboard);

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

    document.getElementById('btn-toggle-lang').addEventListener('click', (e) => {
      this.storage.state.languageMode = this.storage.state.languageMode === 'bopomofo' ? 'english' : 'bopomofo';
      this.storage.state.useCustomVocabulary = false;
      this.storage.state.selectedTextbook = null;
      this.storage.save();
      this.rebuildQuestionPool();
      this.nextQuestion();
      this.updateHUD();
      e.currentTarget.blur();
    });

    document.getElementById('btn-toggle-vk').addEventListener('click', (e) => {
      this.storage.state.showVirtualKeyboard = !this.storage.state.showVirtualKeyboard;
      this.storage.save();
      vkPanel.classList.toggle('hidden', !this.storage.state.showVirtualKeyboard);
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

    // 開場主頁彈窗按鈕
    document.getElementById('btn-title-start').addEventListener('click', () => {
      this.closeAllModals();
    });
    document.getElementById('btn-title-stages').addEventListener('click', () => {
      this.openStageModal();
    });
    document.getElementById('btn-title-textbook').addEventListener('click', () => {
      this.openTextbookModal();
    });
    document.getElementById('btn-title-shop').addEventListener('click', () => {
      this.openShopModal();
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
      if (e.code === 'Tab') {
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
      if ((e.altKey && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) ||
          ['F1', 'F2', 'F3', 'F4'].includes(e.code)) {
        e.preventDefault();
        const skillMap = {
          Digit1: 'q', F1: 'q',
          Digit2: 'w', F2: 'w',
          Digit3: 'e', F3: 'e',
          Digit4: 'r', F4: 'r'
        };
        this.castSkill(skillMap[e.code]);
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
    this.typing.on('targetLoaded', () => {
      this.renderQuestionDOM();
    });

    this.typing.on('nextSymbol', () => {
      this.renderQuestionDOM();
    });

    this.typing.on('nextChar', () => {
      this.renderQuestionDOM();
    });

    this.typing.on('keyHit', ({ combo, comboTier, isCharCompleted }) => {
      this.audio.playKeyHit(combo);
      if (this.battleScene) {
        this.battleScene.playMicroGather(combo, comboTier);
      }
      this.renderQuestionDOM();
      if (isCharCompleted) {
        this.updateComboBanner(combo, comboTier);
      }
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

      // 內力珠累積
      this.qiOrbs = Math.min(5, this.qiOrbs + 1);
      let burstMultiplier = 1.0;
      if (this.qiOrbs >= 5) {
        burstMultiplier = 1.65;
        this.qiOrbs = 0;
      }

      const finisherDmg = Math.round(
        weapon.atk * 0.95 * (1 + Math.min(combo, 35) * 0.03) * (1 + wpm / 140) *
        (isParryBreak ? 1.4 : 1.0) * burstMultiplier
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
          isCrit: isCrit || burstMultiplier > 1,
          isParryBreak,
          comboTier
        });
      }

      // 每關 10 題過關制推進
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.updateHUD();

      if (this.clearedWordsCount >= this.stageGoal) {
        this.handleStageVictory();
      } else {
        setTimeout(() => {
          if (!this.isStageClearing) this.nextQuestion();
        }, 280);
      }
    });

    this.typing.on('miss', ({ charIndex, previousCombo }) => {
      if (this.storage.state.missShields > 0 && previousCombo >= 3) {
        this.storage.state.missShields--;
        this.typing.combo = previousCombo;
        this.storage.save();
        this.audio.playKeyHit(previousCombo);
        if (this.battleScene) this.battleScene.playMissParry(true);
        this.updateHUD();
        return;
      }

      this.audio.playMiss();
      if (this.battleScene) {
        this.battleScene.playMissParry(false);
      }
      this.updateComboBanner(0, 0);

      // 記錄錯字進錯題墨寶閣
      if (this.typing.currentWord && this.typing.currentWord.characters) {
        const wrongChar = this.typing.currentWord.characters[charIndex];
        if (wrongChar) {
          this.storage.recordMistake(wrongChar);
        }
      }

      // 敵人蓄力推進 8%（不直接扣減玩家 HP）
      if (this.currentStage.enemy.attackIntervalMs > 0) {
        this.enemyAtb = Math.min(0.98, this.enemyAtb + 0.08);
        this.updateHUD();
      }

      const cardEl = document.getElementById(`q-char-${charIndex}`);
      if (cardEl) {
        cardEl.classList.remove('miss');
        void cardEl.offsetWidth;
        cardEl.classList.add('miss');
      }
    });
  }

  /**
   * 啟動暗黑指定境界與關卡
   */
  startStage(diffId, stageIndex) {
    this.currentDifficulty = diffId;
    this.currentStageIndex = Number(stageIndex) || 1;
    this.storage.state.currentDifficulty = diffId;
    const diffProg = this.storage.state.stageProgress[diffId];
    if (diffProg) diffProg.currentStageIndex = this.currentStageIndex;
    this.storage.save();

    const stages = DIABLO_STAGES[diffId] || DIABLO_STAGES.easy;
    this.currentStage = stages[this.currentStageIndex - 1] || stages[0];

    // 每關固定 10 題
    this.stageGoal = 10;
    this.clearedWordsCount = 0;
    this.enemyAtb = 0;
    this.isStageClearing = false;
    this.isBattlePaused = false;

    this.typing.resetStats();
    this.typing.active = true;

    this.refreshBattleVisuals();
    this.rebuildQuestionPool();
    this.nextQuestion();
    this.updateHUD();
    this.updateComboBanner(0, 0);
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
      pool = parseCustomVocabularyInput(st.customVocabularyRaw);
    } else if (st.selectedTextbook) {
      const pub = TEXTBOOK_CATALOG[st.selectedTextbook.publisherId];
      const grade = pub?.grades.find((g) => g.gradeId === st.selectedTextbook.gradeId);
      const lesson = grade?.lessons.find((l) => l.lessonId === st.selectedTextbook.lessonId);
      if (lesson && lesson.words.length > 0) {
        pool = lesson.words.map((w) => ({ ...w, mode: 'bopomofo' }));
      }
    }

    if (pool.length === 0) {
      const bank = DIFFICULTY_BANKS[this.currentDifficulty] || DIFFICULTY_BANKS.easy;
      const stageKey = `stage_${this.currentStageIndex}`;
      pool = bank[stageKey] || bank.stage_1;
    }

    this.questionQueue = [...pool];
    this.questionCursor = 0;
  }

  nextQuestion() {
    if (this.questionQueue.length === 0) {
      this.rebuildQuestionPool();
    }
    const item = this.questionQueue[this.questionCursor % this.questionQueue.length];
    this.questionCursor++;
    this.typing.loadWord(item);
  }

  renderQuestionDOM() {
    const container = document.getElementById('word-characters');
    container.innerHTML = '';

    const word = this.typing.currentWord;
    if (!word) return;

    const diffCfg = DIFFICULTY_CONFIG[this.currentDifficulty];
    const st = this.storage.state;
    let sourceLabel = `【${diffCfg.name}】第 ${this.currentStageIndex} 關（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    if (st.useCustomVocabulary) {
      sourceLabel = `📜 爸媽自訂祕笈本（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    } else if (st.selectedTextbook) {
      const pub = TEXTBOOK_CATALOG[st.selectedTextbook.publisherId];
      sourceLabel = `📘 ${pub?.publisherName || '國小課本'}同步修煉（第 ${this.clearedWordsCount + 1} / ${this.stageGoal} 題）`;
    }

    document.getElementById('scroll-source-label').textContent = sourceLabel;
    document.getElementById('word-meaning-text').textContent = word.meaning || '';

    this.typing.characters.forEach((chObj, cIdx) => {
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
        if (cIdx < this.typing.charIndex || (cIdx === this.typing.charIndex && sIdx < this.typing.symbolIndex)) {
          symSpan.classList.add('typed');
        } else if (cIdx === this.typing.charIndex && sIdx === this.typing.symbolIndex) {
          symSpan.classList.add('active-sym');
        }
        symSpan.textContent = sym;
        zyList.appendChild(symSpan);
      });

      const hanzi = document.createElement('div');
      hanzi.className = 'q-hanzi';
      hanzi.textContent = chObj.char === ' ' ? '␣' : chObj.char;

      card.appendChild(zyList);
      card.appendChild(hanzi);
      container.appendChild(card);
    });

    this.keyDomMap.forEach((el) => el.classList.remove('active-target'));
    const keyInfo = this.typing.getExpectedKeyInfo();
    const fingerEl = document.getElementById('finger-guide-pill');
    if (keyInfo) {
      const keyEl = this.keyDomMap.get(keyInfo.code);
      if (keyEl) keyEl.classList.add('active-target');
      const symLabel = this.typing.mode === 'english' ? keyInfo.en : keyInfo.zy;
      fingerEl.innerHTML = `下一鍵：<strong>${symLabel}</strong>（按鍵 <strong>${keyInfo.en}</strong>・${keyInfo.finger}）`;
    } else {
      fingerEl.innerHTML = `招式完成！劍氣斬擊中...`;
    }
  }

  startAtbTimer() {
    setInterval(() => {
      if (this.isBattlePaused || !this.typing.active || this.isEnemyFrozen) return;
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
    document.getElementById('hero-weapon-badge').textContent = weapon.name.split('・')[1] || weapon.name;
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
      btnE.disabled = this.qiOrbs < 3;
      btnE.classList.toggle('ready', this.qiOrbs >= 3);
    }
    if (btnR) {
      btnR.disabled = this.qiOrbs < 5;
      btnR.classList.toggle('ready', this.qiOrbs >= 5);
    }

    document.getElementById('chapter-title').textContent = `${diffCfg.name}｜${this.currentStage.title}（${this.currentStage.chapterName}）`;
    document.getElementById('coin-count').textContent = st.coins;
    const stats = this.typing.getStats();
    document.getElementById('wpm-display').textContent = stats.wpm;
    document.getElementById('acc-display').textContent = `${stats.accuracy}%`;

    // 敵人血條與擊破進度（以 10 題為基準）
    document.getElementById('enemy-name-text').textContent = enemy.name;
    document.getElementById('enemy-title-badge').textContent = `${this.currentStageIndex} / 10 關`;
    const remainingGoals = Math.max(0, this.stageGoal - this.clearedWordsCount);
    document.getElementById('enemy-hp-text').textContent = `剩餘 ${remainingGoals} / 10 題`;
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
    if (this.currentStageIndex === 10) {
      if (this.currentDifficulty === 'easy') {
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.1rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          🎉 恭喜突破【初出茅廬】！已成功解鎖【名震江湖（中）】全新 10 關挑戰！
        </div>`;
      } else if (this.currentDifficulty === 'medium') {
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.1rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          🏆 恭喜名震江湖！已成功解鎖終極境界【一代宗師（難）】地獄 10 關挑戰！
        </div>`;
      } else {
        breakthroughNotice = `<div style="color:var(--bright-gold); font-size:1.1rem; margin:10px 0; padding:8px; border:1px solid var(--bright-gold); border-radius:6px;">
          👑 恭賀少俠斬破黑風魔皇，登峰造極，榮登武林盟主至尊寶座！
        </div>`;
      }
    }

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const body = document.getElementById('result-modal-body');
    body.innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:2.4rem; margin-bottom:8px;">${starStr}</div>
        <h3 style="color:var(--bright-gold); font-size:1.35rem; margin-bottom:6px;">
          十斬大成！成功擊退【${this.currentStage.enemy.name}】！
        </h3>
        <p style="color:#adb5bd; font-size:0.92rem; margin-bottom:12px;">
          ${this.currentStage.enemy.quote}
        </p>
        ${breakthroughNotice}
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px;">
          <div class="item-box" style="text-align:center;">
            <span style="font-size:0.8rem; color:#adb5bd;">打字速度</span>
            <strong style="font-size:1.4rem; color:var(--sword-cyan);">${stats.wpm} WPM</strong>
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
        <div style="display:flex; justify-content:center; gap:12px;">
          <button class="wuxia-btn" id="btn-result-replay">🔄 重練本關</button>
          <button class="wuxia-btn" id="btn-result-shop">🏮 客棧神兵閣</button>
          ${
            this.currentStageIndex < 10
              ? `<button class="wuxia-btn gold" id="btn-result-next">⚔️ 進入第 ${this.currentStageIndex + 1} 關</button>`
              : `<button class="wuxia-btn gold" id="btn-result-next">🗺️ 查看江湖地圖</button>`
          }
        </div>
      </div>
    `;

    document.getElementById('result-modal-title').textContent = '武林捷報・十斬通關';
    document.getElementById('modal-result').classList.add('open');

    document.getElementById('btn-result-replay')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex);
    });
    document.getElementById('btn-result-shop')?.addEventListener('click', () => {
      this.closeAllModals();
      this.openShopModal();
    });
    document.getElementById('btn-result-next')?.addEventListener('click', () => {
      this.closeAllModals();
      if (this.currentStageIndex < 10) {
        this.startStage(this.currentDifficulty, this.currentStageIndex + 1);
      } else {
        this.openStageModal();
      }
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
      <div style="text-align:center; padding:12px 0;">
        <h3 style="color:#ffd166; font-size:1.3rem; margin-bottom:8px;">
          少俠勝敗乃兵家常事，回客棧喝碗熱茶再戰！
        </h3>
        <p style="color:#ced4da; font-size:0.92rem; margin-bottom:16px;">
          店小二已為少俠包紮完畢（氣血已全滿恢復），並獲得歷練賞金 <strong>+${consolation} 🪙</strong>！
        </p>
        <div style="display:flex; justify-content:center; gap:12px;">
          <button class="wuxia-btn" id="btn-fail-shop">🏮 去客棧換把好劍</button>
          <button class="wuxia-btn gold" id="btn-fail-retry">⚔️ 重整旗鼓再戰</button>
        </div>
      </div>
    `;
    document.getElementById('result-modal-title').textContent = '暫回客棧・調息養氣';
    document.getElementById('modal-result').classList.add('open');

    document.getElementById('btn-fail-shop')?.addEventListener('click', () => {
      this.closeAllModals();
      this.openShopModal();
    });
    document.getElementById('btn-fail-retry')?.addEventListener('click', () => {
      this.closeAllModals();
      this.startStage(this.currentDifficulty, this.currentStageIndex);
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => m.classList.remove('open'));
    this.isStageClearing = false;
    this.isBattlePaused = false;
    this.typing.active = true;
  }

  /**
   * 暗黑三大境界 $\times$ 10 關地圖選單彈窗（支援切換易／中／難）
   */
  openStageModal() {
    this.isBattlePaused = true;
    const modalEl = document.getElementById('modal-stages');
    modalEl.classList.add('open');
    this.renderStageSelectionTabs(this.currentDifficulty);
  }

  renderStageSelectionTabs(activeDiffId) {
    const listEl = document.getElementById('stage-list-grid');
    listEl.innerHTML = '';

    // 建立頂部境界切換按鈕列
    let tabHeader = document.getElementById('diff-tab-header');
    if (!tabHeader) {
      tabHeader = document.createElement('div');
      tabHeader.id = 'diff-tab-header';
      tabHeader.style.cssText = 'display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap;';
      listEl.parentElement.insertBefore(tabHeader, listEl);
    }
    tabHeader.innerHTML = '';

    const unlocked = this.storage.state.unlockedDifficulties || ['easy'];

    Object.values(DIFFICULTY_CONFIG).forEach((cfg) => {
      const isUnlocked = unlocked.includes(cfg.id);
      const isCurrentTab = cfg.id === activeDiffId;
      const btn = document.createElement('button');
      btn.className = `wuxia-btn ${isCurrentTab ? 'gold' : ''}`;
      btn.innerHTML = `${isUnlocked ? '' : '🔒 '}${cfg.name}`;
      btn.title = cfg.gradeDesc;
      if (!isUnlocked) {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.addEventListener('click', () => {
          this.renderStageSelectionTabs(cfg.id);
        });
      }
      tabHeader.appendChild(btn);
    });

    // 渲染所選境界之 10 關
    const stages = DIABLO_STAGES[activeDiffId] || DIABLO_STAGES.easy;
    const diffProg = this.storage.state.stageProgress[activeDiffId] || { maxUnlockedStage: 1, records: {} };

    stages.forEach((st) => {
      const isUnlocked = st.stageIndex <= diffProg.maxUnlockedStage;
      const rec = diffProg.records[st.stageIndex];
      const stars = rec ? '⭐'.repeat(rec.stars) : isUnlocked ? '待挑戰' : '🔒 未解鎖';
      const isCurrent = activeDiffId === this.currentDifficulty && st.stageIndex === this.currentStageIndex;

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
        </div>
        <button class="wuxia-btn ${isCurrent ? 'gold' : ''}" ${isUnlocked ? '' : 'disabled'}>
          ${isCurrent ? '⚔️ 當前修煉中' : isUnlocked ? '前往挑戰' : '🔒 需通關前一關'}
        </button>
      `;

      if (isUnlocked) {
        card.querySelector('button').addEventListener('click', () => {
          this.closeAllModals();
          this.startStage(activeDiffId, st.stageIndex);
        });
      }
      listEl.appendChild(card);
    });
  }

  openShopModal() {
    this.isBattlePaused = true;
    this.renderShopItems();
    document.getElementById('modal-shop').classList.add('open');
  }

  renderShopItems() {
    const st = this.storage.state;
    document.getElementById('shop-coin-display').textContent = st.coins;

    const weaponGrid = document.getElementById('shop-weapons-grid');
    weaponGrid.innerHTML = '';

    WEAPONS.forEach((w) => {
      const owned = st.ownedWeapons.includes(w.id);
      const equipped = st.equippedWeaponId === w.id;

      const box = document.createElement('div');
      box.className = 'item-box' + (equipped ? ' active-choice' : '');
      box.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between;">
            <strong style="color:var(--bright-gold);">${w.name}</strong>
            <span style="color:var(--sword-cyan); font-size:0.84rem;">ATK +${w.atk}</span>
          </div>
          <div style="font-size:0.8rem; color:#90e0ef; margin-top:2px;">外觀：${w.OutfitName}</div>
          <div style="font-size:0.8rem; color:#adb5bd; margin-top:4px;">${w.desc}</div>
        </div>
        <button class="wuxia-btn ${equipped ? 'gold' : ''}">
          ${equipped ? '✅ 已佩帶' : owned ? '佩帶此劍' : `🪙 ${w.price} 銅錢購買`}
        </button>
      `;

      box.querySelector('button').addEventListener('click', () => {
        if (equipped) return;
        if (owned) {
          st.equippedWeaponId = w.id;
          this.audio.playCoin();
        } else if (st.coins >= w.price) {
          st.coins -= w.price;
          st.ownedWeapons.push(w.id);
          st.equippedWeaponId = w.id;
          this.audio.playCoin();
        } else {
          this.audio.playMiss();
          return;
        }
        this.storage.save();
        this.refreshBattleVisuals();
        this.updateHUD();
        this.renderShopItems();
      });

      weaponGrid.appendChild(box);
    });

    const itemGrid = document.getElementById('shop-items-grid');
    itemGrid.innerHTML = '';

    SHOP_ITEMS.forEach((item) => {
      const box = document.createElement('div');
      box.className = 'item-box';
      box.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between;">
            <strong style="color:#69db7c;">${item.name}</strong>
            <span style="color:var(--bright-gold);">🪙 ${item.price}</span>
          </div>
          <div style="font-size:0.82rem; color:#adb5bd; margin-top:4px;">${item.desc}</div>
        </div>
        <button class="wuxia-btn">購買使用</button>
      `;

      box.querySelector('button').addEventListener('click', () => {
        if (st.coins < item.price) {
          this.audio.playMiss();
          return;
        }
        st.coins -= item.price;
        if (item.type === 'heal') {
          st.currentHp = Math.min(st.maxHp, st.currentHp + item.value);
        } else if (item.type === 'full_heal_boost') {
          st.maxHp += item.maxHpBonus;
          st.currentHp = st.maxHp;
        } else if (item.type === 'shield_miss') {
          st.missShields += item.value;
        }
        this.audio.playCoin();
        this.storage.save();
        this.updateHUD();
        this.renderShopItems();
      });

      itemGrid.appendChild(box);
    });
  }

  openTextbookModal() {
    this.isBattlePaused = true;
    const container = document.getElementById('textbook-list-container');
    container.innerHTML = '';

    Object.values(TEXTBOOK_CATALOG).forEach((pub) => {
      pub.grades.forEach((grade) => {
        grade.lessons.forEach((lesson) => {
          const isSelected =
            this.storage.state.selectedTextbook?.lessonId === lesson.lessonId &&
            !this.storage.state.useCustomVocabulary;

          const card = document.createElement('div');
          card.className = 'item-box' + (isSelected ? ' active-choice' : '');
          const previewWords = lesson.words.map((w) => w.text).join('、');
          card.innerHTML = `
            <div>
              <div style="display:flex; justify-content:space-between;">
                <strong style="color:var(--bright-gold);">【${pub.publisherName}】${grade.gradeName}</strong>
              </div>
              <div style="font-size:0.9rem; color:#fff; margin-top:3px;">${lesson.title}</div>
              <div style="font-size:0.8rem; color:#adb5bd; margin-top:4px;">收錄生字詞：${previewWords}</div>
            </div>
            <button class="wuxia-btn ${isSelected ? 'gold' : ''}">
              ${isSelected ? '✅ 目前修煉課次' : '📘 選用此課本題庫'}
            </button>
          `;

          card.querySelector('button').addEventListener('click', () => {
            this.storage.state.selectedTextbook = {
              publisherId: pub.publisherId,
              gradeId: grade.gradeId,
              lessonId: lesson.lessonId
            };
            this.storage.state.useCustomVocabulary = false;
            this.storage.state.languageMode = 'bopomofo';
            this.storage.save();
            this.rebuildQuestionPool();
            this.nextQuestion();
            this.closeAllModals();
          });

          container.appendChild(card);
        });
      });
    });

    document.getElementById('btn-clear-textbook').onclick = () => {
      this.storage.state.selectedTextbook = null;
      this.storage.save();
      this.rebuildQuestionPool();
      this.nextQuestion();
      this.closeAllModals();
    };

    document.getElementById('modal-textbook').classList.add('open');
  }

  openCustomWordsModal() {
    this.isBattlePaused = true;
    const inputEl = document.getElementById('custom-vocab-textarea');
    inputEl.value = this.storage.state.customVocabularyRaw || '';
    document.getElementById('modal-custom-words').classList.add('open');

    document.getElementById('btn-save-custom-vocab').onclick = () => {
      const raw = inputEl.value.trim();
      const parsed = parseCustomVocabularyInput(raw);
      if (parsed.length > 0) {
        this.storage.state.customVocabularyRaw = raw;
        this.storage.state.useCustomVocabulary = true;
        this.storage.save();
        this.rebuildQuestionPool();
        this.nextQuestion();
      }
      this.closeAllModals();
    };
  }

  /**
   * 施放主動武功招式
   */
  castSkill(skillId) {
    if (this.isBattlePaused || !this.typing.active) return;
    const weapon = this.getEquippedWeapon();

    if (skillId === 'q') {
      // ⚡ 青蓮劍氣：消耗 2 氣，造成 1.5 倍攻擊
      if (this.qiOrbs < 2) return;
      this.qiOrbs -= 2;
      const dmg = Math.round(weapon.atk * 1.5);
      this.audio.playSkillSlash();
      if (this.battleScene) {
        this.battleScene.playSkillSlash({ damage: dmg, isCrit: true });
      }
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.updateHUD();
      if (this.clearedWordsCount >= this.stageGoal) {
        this.handleStageVictory();
      } else {
        setTimeout(() => {
          if (!this.isStageClearing) this.nextQuestion();
        }, 280);
      }
    } else if (skillId === 'w') {
      // 🌊 凌波微步：消耗 2 氣，將敵人蓄力條歸零並定身 3 秒
      if (this.qiOrbs < 2) return;
      this.qiOrbs -= 2;
      this.enemyAtb = 0;
      this.isEnemyFrozen = true;
      this.audio.playSkillDodge();
      if (this.battleScene) {
        this.battleScene.playSkillDodge();
      }
      setTimeout(() => {
        this.isEnemyFrozen = false;
      }, 3000);
      this.updateHUD();
    } else if (skillId === 'e') {
      // 🌿 太極回春：消耗 3 氣，恢復 35 HP
      if (this.qiOrbs < 3) return;
      this.qiOrbs -= 3;
      const st = this.storage.state;
      st.currentHp = Math.min(st.maxHp, st.currentHp + 35);
      this.storage.save();
      this.audio.playSkillHeal();
      if (this.battleScene) {
        this.battleScene.playSkillHeal({ healAmount: 35 });
      }
      this.updateHUD();
    } else if (skillId === 'r') {
      // 🔥 流雲劍訣：消耗 5 氣（滿氣），全屏水墨一刀斬
      if (this.qiOrbs < 5) return;
      this.qiOrbs = 0;
      const dmg = Math.round(weapon.atk * 3.2);
      this.audio.playUltimateBurst();
      if (this.battleScene) {
        this.battleScene.playUltimateBurst({ damage: dmg });
      }
      this.clearedWordsCount = Math.min(this.stageGoal, this.clearedWordsCount + 1);
      this.updateHUD();
      if (this.clearedWordsCount >= this.stageGoal) {
        this.handleStageVictory();
      } else {
        setTimeout(() => {
          if (!this.isStageClearing) this.nextQuestion();
        }, 320);
      }
    }
  }

  /**
   * 打開開場主頁彈窗
   */
  openTitleModal() {
    this.isBattlePaused = true;
    document.getElementById('modal-title-screen').classList.add('open');
  }

  /**
   * 打開錯題墨寶閣彈窗
   */
  openMistakesModal() {
    this.isBattlePaused = true;
    this.renderMistakesDOM();
    document.getElementById('modal-mistakes').classList.add('open');
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
    const drillQuestions = list.map((item) => ({
      text: item.char,
      meaning: `【錯題特訓】歷次生疏 ${item.count} 次`,
      characters: [
        {
          char: item.char,
          symbols: item.symbols && item.symbols.length > 0 ? item.symbols : ['ㄅ']
        }
      ]
    }));

    this.questionQueue = drillQuestions;
    this.questionCursor = 0;
    this.stageGoal = Math.min(10, drillQuestions.length);
    this.clearedWordsCount = 0;
    this.isStageClearing = false;
    this.isBattlePaused = false;
    this.nextQuestion();
    this.updateHUD();
    this.closeAllModals();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WuxiaGameApp();
});
