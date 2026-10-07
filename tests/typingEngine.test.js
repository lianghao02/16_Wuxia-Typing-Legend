import test from 'node:test';
import assert from 'node:assert/strict';
import { TypingEngine } from '../src/engine/TypingEngine.js';
import { parseCustomVocabularyInput, DIFFICULTY_BANKS } from '../src/data/vocabulary.js';
import { DIFFICULTY_CONFIG, DIABLO_STAGES } from '../src/data/enemies.js';
import { TEXTBOOK_CATALOG, getGradeMixedWords } from '../src/data/textbooks.js';
import { getOriginalProseWords } from '../src/data/originalProse.js';
import { getGradeVocabulary } from '../src/data/gradeVocabulary.js';
import { buildGradeQuestionQueue, getGradeQuestionRatio, getQuestionLengthGroup } from '../src/data/gradeQuestionMix.js';
import { WEAPONS } from '../src/data/enemies.js';
import { CanvasBattleScene } from '../src/scenes/CanvasBattleScene.js';
import { WuxiaGameApp, getSkillShortcut, shuffleQuestions, getQuestionPage } from '../src/main.js';
import { StorageEngine } from '../src/engine/StorageEngine.js';
import { MOE_MINI_METADATA, getDictionaryEntries, getCharacterReadings,
  getDictionaryExampleReading, getDictionaryUsage, isDictionaryReading } from '../src/data/moeDictionary.js';
import { MOE_MINI_SHEETS } from '../src/data/moeMiniRecords.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PRACTICE_CHOICES, MAIN_PRACTICE_CHOICES, ENGLISH_PRACTICE_BANKS } from '../src/data/practice.js';

test('37. 計時從首次作答開始，暫停與續玩排除等待，中文與英文速度分開計算', () => {
  const originalPerformance = globalThis.performance;
  let now = 0;
  globalThis.performance = { now: () => now };
  try {
    const engine = new TypingEngine();
    engine.loadWord({ text: '天人', bopomofo: ['ㄊㄧㄢ', 'ㄖㄣˊ'] });
    now = 60000;
    assert.equal(engine.getProgress().elapsedMs, 0);
    engine.processSymbolInput('ㄊ');
    now += 60000;
    for (const symbol of ['ㄧ', 'ㄢ', '␣']) engine.processSymbolInput(symbol);
    assert.equal(engine.getStats().wpm, 1);
    assert.equal(engine.getStats().speedUnit, '字／分');
    engine.setPaused(true);
    now += 300000;
    assert.equal(engine.processSymbolInput('ㄖ'), false);
    assert.equal(engine.getProgress().elapsedMs, 60000);
    engine.setPaused(false);
    assert.equal(engine.getStats().wpm, 1);
    const progress = engine.getProgress();
    const resumed = new TypingEngine();
    resumed.loadWord(progress.word);
    now += 600000;
    assert.equal(resumed.restoreProgress(progress), true);
    assert.equal(resumed.getProgress().elapsedMs, 60000);
    const english = new TypingEngine();
    english.loadWord({ text: 'water', mode: 'english' });
    english.processSymbolInput('w');
    now += 60000;
    for (const char of 'ater') english.processSymbolInput(char);
    assert.equal(english.getStats().wpm, 1);
    assert.equal(english.getStats().speedUnit, 'WPM');
    const blank = new TypingEngine();
    blank.loadWord(progress.word);
    const untouched = blank.getProgress();
    now += 600000;
    blank.restoreProgress(untouched);
    assert.equal(blank.getProgress().elapsedMs, 0);
  } finally { globalThis.performance = originalPerformance; }
});

test('38. 輕量索引保留官方全部字音、語境例詞，啟動模組不再靜態匯入完整字典', () => {
  for (const [character,,,, reading] of MOE_MINI_SHEETS[0].rows.slice(1)) {
    assert.ok(getCharacterReadings(character).includes(reading), `${character} ${reading}`);
  }
  assert.deepEqual(getDictionaryUsage('鵝', 'ㄜˊ'), []); // 原條目沒有例詞，不捏造字典內容。
  assert.ok(getDictionaryUsage('行', 'ㄏㄤˊ').includes('銀行'));
  const module = readFileSync(new URL('../src/data/moeDictionary.js', import.meta.url), 'utf8');
  assert.doesNotMatch(module, /import\s*\{[^}]*\}\s*from\s*['"]\.\/moeMiniRecords/);
});

test('39. 戰鬥背景 WebP 載入失敗會退回 PNG，完成後釋放高優先計數', async () => {
  const originalImage = globalThis.Image;
  const requested = [];
  globalThis.Image = class {
    set src(value) {
      requested.push(value);
      queueMicrotask(() => value.endsWith('.webp') ? this.onerror() : this.onload());
    }
  };
  try {
    const scene = Object.create(CanvasBattleScene.prototype);
    scene.imageCache = new Map([['bg_test', { src: 'test.webp', fallbackSrc: 'test.png', retries: 0 }]]);
    scene.highPriorityPending = 0;
    scene.pumpBackgroundPrefetch = () => {};
    const image = await scene.loadAsset('bg_test', 'high');
    assert.ok(image);
    assert.deepEqual(requested, ['test.webp', 'test.png']);
    assert.equal(scene.imageCache.get('bg_test').loaded, true);
    assert.equal(scene.highPriorityPending, 0);
  } finally { globalThis.Image = originalImage; }
});

test('25. 年級進度獨立，舊進度保留，預覽不切換，財產共用且可重新載入', () => {
  let raw = null;
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  try {
    const store = new StorageEngine();
    store.state.coins = 370;
    store.state.unlockedDifficulties = ['easy', 'medium', 'hard'];
    store.state.savedSession.clearedWordsCount = 6;
    store.save();
    assert.deepEqual(store.getPracticeProfile('grade-1').unlockedDifficulties, ['easy']);
    assert.equal(store.state.savedSession.clearedWordsCount, 6);
    store.activatePracticeProfile('grade-1', PRACTICE_CHOICES.find(c => c.key === 'grade-1').source);
    store.state.stageProgress.easy.maxUnlockedStage = 4;
    store.state.savedSession.clearedWordsCount = 3;
    store.save();
    store.activatePracticeProfile('grade-2');
    assert.equal(store.state.stageProgress.easy.maxUnlockedStage, 1);
    assert.equal(store.state.savedSession.clearedWordsCount, 0);
    assert.equal(store.state.coins, 370);
    store.activatePracticeProfile('grade-1');
    const loaded = new StorageEngine();
    assert.equal(loaded.state.savedSession.clearedWordsCount, 3);
    assert.equal(loaded.state.stageProgress.easy.maxUnlockedStage, 4);
    loaded.activatePracticeProfile('jianghu');
    assert.equal(loaded.state.savedSession.clearedWordsCount, 6);
    assert.deepEqual(loaded.state.unlockedDifficulties, ['easy', 'medium', 'hard']);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});

test('26. 六年級題本有唯一識別，英文三境界實際出英文且保留十題通關', () => {
  assert.equal(PRACTICE_CHOICES.filter(c => c.key.startsWith('grade-')).length, 6);
  assert.equal(new Set(PRACTICE_CHOICES.map(c => c.key)).size, PRACTICE_CHOICES.length);
  for (const diff of ['easy', 'medium', 'hard']) {
    assert.ok(ENGLISH_PRACTICE_BANKS[diff].length >= 20);
    const app = makeGame();
    app.storage.activatePracticeProfile('english', PRACTICE_CHOICES.find(c => c.key === 'english').source);
    app.startStage(diff, 1);
    assert.ok(app.questionPool.every(q => q.mode === 'english'));
    completeCurrentQuestion(app);
    assert.equal(app.clearedWordsCount, 1);
    assert.equal(app.stageGoal, 10);
    clearTimeout(app.nextQuestionTimer);
  }
});

test('28. 修煉入口僅六年級與英文，各年級混入符合字典的常用字', () => {
  assert.deepEqual(MAIN_PRACTICE_CHOICES.map(choice => choice.key),
    ['grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6', 'english']);
  for (let grade = 1; grade <= 6; grade++) {
    const words = getGradeMixedWords(grade).filter(word => word.sourceKind === 'dictionary-practice');
    assert.ok(words.length >= 30);
    for (const word of words) assert.ok(isDictionaryReading(word.text, word.bopomofo[0]));
  }
});

test('29. 英文以完整單字顯示，空白仍可輸入，全部國小程度題目可完成', () => {
  for (let index = 0; index < 5; index++) {
    assert.deepEqual(getQuestionPage(index, 'water', 'english'), { start: 0, end: 5, page: 1, total: 1 });
  }
  const phrase = 'drink some water';
  const spans = [[0, 6], [6, 11], [11, 16]];
  spans.forEach(([start, end], index) => {
    for (let cursor = start; cursor < end; cursor++) {
      assert.deepEqual(getQuestionPage(cursor, phrase, 'english'), { start, end, page: index + 1, total: 3 });
    }
  });
  for (const word of Object.values(ENGLISH_PRACTICE_BANKS).flat()) {
    const engine = new TypingEngine();
    engine.active = true;
    engine.loadWord(word);
    let strokes = 0;
    while (engine.getExpectedSymbol() && strokes++ < 100) engine.processSymbolInput(engine.getExpectedSymbol());
    assert.equal(engine.completedWords, 1, word.text);
  }
});

// 以真實控制器、輸入及存檔邏輯測試，僅替換音效、畫面及瀏覽器事件介面。
function makeGame(savedState = null) {
  const app = Object.create(WuxiaGameApp.prototype);
  app.storage = new StorageEngine();
  if (savedState) app.storage.state = structuredClone(savedState);
  app.typing = new TypingEngine();
  app.audio = new Proxy({}, { get: () => () => {} });
  app.battleScene = null;
  app.qiOrbs = 0;
  app.questionQueue = [];
  app.questionCursor = 0;
  app.isStageClearing = false;
  for (const method of ['renderQuestionDOM', 'updateHUD', 'updateComboBanner',
    'refreshBattleVisuals', 'showSkillFloatingBanner']) app[method] = () => {};
  const previousWindow = globalThis.window;
  globalThis.window = { addEventListener() {} };
  try { app.bindTypingEvents(); } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
  return app;
}

function completeCurrentQuestion(app) {
  while (app.typing.active && app.typing.getExpectedSymbol()) {
    app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  }
}

test('1. 微軟新注音狀態下 (e.key === "Process") 仍可透過 e.code 免選字完成「橋 (ㄑㄧㄠˊ)」，且整字完成 Combo+1', () => {
  const engine = new TypingEngine({ requireSpaceForFirstTone: false });
  engine.active = true;
  engine.loadWord({
    text: '橋',
    bopomofo: ['ㄑㄧㄠˊ'],
    mode: 'bopomofo'
  });

  let wordCompleted = false;
  engine.on('wordComplete', () => {
    wordCompleted = true;
  });

  const codes = ['KeyF', 'KeyU', 'KeyL', 'Digit6'];
  for (const code of codes) {
    const ok = engine.handleKeyDown({
      code,
      key: 'Process',
      cancelable: true,
      preventDefault() {}
    });
    assert.equal(ok, true);
  }

  assert.equal(wordCompleted, true);
  assert.equal(engine.combo, 1);
  assert.equal(engine.totalMisses, 0);
});

test('2. 敲錯鍵 (Miss) 原地按正確鍵推進，一聲空白鍵緩衝，切字時游標先推進', () => {
  const engine = new TypingEngine({ requireSpaceForFirstTone: false });
  engine.active = true;
  engine.loadWord({
    text: '高山',
    bopomofo: ['ㄍㄠ', 'ㄕㄢ'],
    mode: 'bopomofo'
  });

  // 打完「高」
  engine.handleKeyDown({ code: 'KeyE', key: 'e' });
  engine.handleKeyDown({ code: 'KeyL', key: 'l' });
  assert.equal(engine.charIndex, 1); // 游標已正確推進至「山」
  assert.equal(engine.getExpectedSymbol(), 'ㄕ'); // 立即等待「ㄕ」
  assert.equal(engine.combo, 1);

  // 空白鍵智慧吸收
  engine.handleKeyDown({ code: 'Space', key: ' ' });
  assert.equal(engine.totalMisses, 0);

  // 故意打錯
  engine.handleKeyDown({ code: 'KeyA', key: 'a' });
  assert.equal(engine.combo, 0);
  assert.equal(engine.totalMisses, 1);

  // 直接按正確鍵
  engine.handleKeyDown({ code: 'KeyG', key: 'g' });
  engine.handleKeyDown({ code: 'Digit0', key: '0' });
  assert.equal(engine.completedWords, 1);
  assert.equal(engine.combo, 1);
});

test('3. 暗黑破壞神式三大境界各 10 關首領與每關 10 題目題庫完整性驗證', () => {
  // 驗證三境界配置
  assert.ok(DIFFICULTY_CONFIG.easy);
  assert.ok(DIFFICULTY_CONFIG.medium);
  assert.ok(DIFFICULTY_CONFIG.hard);

  // 驗證三境界皆各有 10 關
  assert.equal(DIABLO_STAGES.easy.length, 10);
  assert.equal(DIABLO_STAGES.medium.length, 10);
  assert.equal(DIABLO_STAGES.hard.length, 10);

  // 驗證三境界題庫每關皆有 10 題
  for (let i = 1; i <= 10; i++) {
    const key = `stage_${i}`;
    assert.equal(DIFFICULTY_BANKS.easy[key].length, 10, `easy ${key} 應有 10 題`);
    assert.equal(DIFFICULTY_BANKS.medium[key].length, 10, `medium ${key} 應有 10 題`);
    assert.equal(DIFFICULTY_BANKS.hard[key].length, 10, `hard ${key} 應有 10 題`);
  }

  // 驗證出版社題庫與自訂解析
  assert.ok(TEXTBOOK_CATALOG.knsh);
  const parsed = parseCustomVocabularyInput('小橋, 流水, 勤學好問');
  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed[0].bopomofo, ['ㄒㄧㄠˇ', 'ㄑㄧㄠˊ']);
});

test('4. 錯題墨寶閣 (StorageEngine mistakes) 記錄、累計錯誤次數與特訓題庫轉換', async () => {
  const { StorageEngine } = await import('../src/engine/StorageEngine.js');
  const storage = new StorageEngine();
  storage.clearAllMistakes();

  assert.equal(storage.getMistakes().length, 0);

  // 模擬打錯「俠」與「義」
  storage.recordMistake({ char: '俠', symbols: ['ㄒ', 'ㄧ', 'ㄚˊ'] });
  storage.recordMistake({ char: '俠', symbols: ['ㄒ', 'ㄧ', 'ㄚˊ'] });
  storage.recordMistake({ char: '義', symbols: ['ㄧˋ'] });

  const list = storage.getMistakes();
  assert.equal(list.length, 2);
  assert.equal(list[0].char, '俠'); // 錯誤 2 次排在最前面
  assert.equal(list[0].count, 2);
  assert.equal(list[1].char, '義');
  assert.equal(list[1].count, 1);

  // 模擬除名
  storage.removeMistake('俠');
  assert.equal(storage.getMistakes().length, 1);
  assert.equal(storage.getMistakes()[0].char, '義');
});

test('5. 關卡內題數與內力進度保存 (saveSessionProgress)、通關自動調息回血與第 10 關突破新境界', async () => {
  const { StorageEngine, MAX_HERO_HP_CAP } = await import('../src/engine/StorageEngine.js');
  const storage = new StorageEngine();

  assert.equal(MAX_HERO_HP_CAP, 250);

  // 模擬第 2 關打到第 6 題且受過傷 (HP 65/100)
  storage.state.currentHp = 65;
  storage.saveSessionProgress({
    difficulty: 'easy',
    stageIndex: 2,
    clearedWordsCount: 6,
    questionCursor: 6,
    qiOrbs: 3
  });

  assert.equal(storage.state.savedSession.stageIndex, 2);
  assert.equal(storage.state.savedSession.clearedWordsCount, 6);
  assert.equal(storage.state.savedSession.qiOrbs, 3);

  // 通關第 2 關後：自動回滿血 (100/100)、解鎖第 3 關、savedSession 重置指向第 3 關第 0 題
  storage.recordStageVictory('easy', 2, { stars: 3, wpm: 45, accuracy: 96, rewardCoins: 40 });
  assert.equal(storage.state.currentHp, storage.state.maxHp);
  assert.equal(storage.state.stageProgress.easy.maxUnlockedStage, 3);
  assert.equal(storage.state.stageProgress.easy.currentStageIndex, 3);
  assert.equal(storage.state.savedSession.stageIndex, 3);
  assert.equal(storage.state.savedSession.clearedWordsCount, 0);

  // 通關 easy 第 10 關後：自動解鎖 medium 境界
  storage.recordStageVictory('easy', 10, { stars: 3, wpm: 50, accuracy: 98, rewardCoins: 200 });
  assert.equal(storage.state.unlockedDifficulties.includes('medium'), true);
});

test('6. 預設啟用一聲空白鍵 (␣) 且全題庫無非法雙介音（如「胸」為 ㄒㄩㄥ + ␣）', () => {
  const engine = new TypingEngine();
  assert.equal(engine.requireSpaceForFirstTone, true);

  // 載入「胸有成竹」驗證第一字「胸」拆解為 ['ㄒ', 'ㄩ', 'ㄥ', '␣']
  const xiongWord = DIFFICULTY_BANKS.medium.stage_3.find(w => w.text === '胸有成竹');
  assert.ok(xiongWord, '應存在「胸有成竹」題目');
  assert.deepEqual(xiongWord.bopomofo, ['ㄒㄩㄥ', 'ㄧㄡˇ', 'ㄔㄥˊ', 'ㄓㄨˊ']);

  engine.active = true;
  engine.loadWord(xiongWord);
  assert.deepEqual(engine.characters[0].symbols, ['ㄒ', 'ㄩ', 'ㄥ', '␣']);

  // 依序按下 ㄒ(KeyV)、ㄩ(KeyM)、ㄥ(Slash) 後，仍須按空白鍵 (Space) 才算完成「胸」字
  engine.handleKeyDown({ code: 'KeyV', key: 'v' });
  engine.handleKeyDown({ code: 'KeyM', key: 'm' });
  engine.handleKeyDown({ code: 'Slash', key: '/' });
  assert.equal(engine.charIndex, 0, '尚未按一聲空白鍵前應停留在第 0 字「胸」');
  assert.equal(engine.getExpectedSymbol(), '␣');

  engine.handleKeyDown({ code: 'Space', key: ' ' });
  assert.equal(engine.charIndex, 1, '按下空白鍵後應推進至第 1 字「有」');

  // 掃描三大難度 30 關與全版本課本題庫，確認無非法雙介音 (ㄧㄨ, ㄧㄩ, ㄨㄧ)
  const invalidMedialPattern = /(ㄧㄨ|ㄧㄩ|ㄨㄧ|ㄩㄧ|ㄩㄨ)/;
  for (const [diff, stages] of Object.entries(DIFFICULTY_BANKS)) {
    for (const [stageKey, words] of Object.entries(stages)) {
      for (const item of words) {
        if (!Array.isArray(item.bopomofo)) continue;
        for (const zy of item.bopomofo) {
          assert.equal(
            invalidMedialPattern.test(zy),
            false,
            `${diff}.${stageKey}「${item.text}」出現非法注音組合: ${zy}`
          );
        }
      }
    }
  }
});

test('7. 第五題滿氣保留，主動流雲劍訣可使用；結算過渡不可重複施招', () => {
  const app = makeGame();
  app.startStage('easy', 3);
  for (let i = 0; i < 5; i++) {
    completeCurrentQuestion(app);
    app.nextQuestion();
  }
  assert.equal(app.clearedWordsCount, 5);
  assert.equal(app.qiOrbs, 5);
  app.castSkill('r');
  assert.equal(app.qiOrbs, 0);
  assert.equal(app.clearedWordsCount, 6);
  app.castSkill('r');
  assert.equal(app.clearedWordsCount, 6);
  clearTimeout(app.nextQuestionTimer);
});

test('8. 第一題未完成也可逐音續玩，恢復當前題目、一聲等待及氣血', () => {
  const app = makeGame();
  app.storage.state.useCustomVocabulary = true;
  app.storage.state.customVocabularyRaw = '一';
  app.startStage('easy', 3);
  const word = app.typing.currentWord.text;
  app.storage.state.currentHp = 65;
  while (app.typing.getExpectedSymbol() !== '␣') {
    app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  }
  assert.equal(app.clearedWordsCount, 0);
  assert.equal(app.typing.getExpectedSymbol(), '␣');
  const symbolIndex = app.typing.symbolIndex;
  const hits = app.typing.totalHits;
  const saved = JSON.parse(JSON.stringify(app.storage.state));
  const resumed = makeGame(saved);
  resumed.startStage('easy', 3, { resumeSession: true });
  assert.equal(resumed.typing.currentWord.text, word);
  assert.equal(resumed.typing.symbolIndex, symbolIndex);
  assert.equal(resumed.typing.getExpectedSymbol(), '␣');
  assert.equal(resumed.typing.totalHits, hits);
  assert.equal(resumed.storage.state.currentHp, 65);
  resumed.typing.processSymbolInput('␣');
  assert.equal(resumed.clearedWordsCount, 1);
  clearTimeout(resumed.nextQuestionTimer);
});

test('9. 多字與英文題恢復至原字及原音，已完成字不再計分', () => {
  for (const word of [
    { text: '小橋', bopomofo: ['ㄒㄧㄠˇ', 'ㄑㄧㄠˊ'] },
    { text: 'hello world', mode: 'english' }
  ]) {
    const engine = new TypingEngine();
    engine.active = true;
    engine.loadWord(word);
    while (engine.charIndex === 0) engine.processSymbolInput(engine.getExpectedSymbol());
    engine.processSymbolInput(engine.getExpectedSymbol());
    const progress = JSON.parse(JSON.stringify(engine.getProgress()));
    const resumed = new TypingEngine();
    resumed.active = true;
    resumed.loadWord(word);
    assert.equal(resumed.restoreProgress(progress), true);
    assert.equal(resumed.getExpectedSymbol(), engine.getExpectedSymbol());
    assert.equal(resumed.characters[0].completed, true);
    assert.equal(resumed.combo, engine.combo);
    while (resumed.getExpectedSymbol()) resumed.processSymbolInput(resumed.getExpectedSymbol());
    assert.equal(resumed.completedWords, 1);
  }
});

test('10. 青蓮劍氣完成整題，續玩不跳過下一題；舊版題數存檔仍可接續', () => {
  const app = makeGame();
  app.startStage('easy', 3);
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  app.qiOrbs = 2;
  app.castSkill('q');
  assert.equal(app.clearedWordsCount, 1);
  assert.equal(app.storage.state.savedSession.typingProgress, null);
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 3, { resumeSession: true });
  assert.equal(resumed.typing.currentWord.text, app.questionQueue[1].text);
  assert.equal(resumed.clearedWordsCount, 1);
  clearTimeout(app.nextQuestionTimer);
  const legacy = makeGame();
  legacy.storage.saveSessionProgress({ difficulty: 'easy', stageIndex: 3,
    clearedWordsCount: 6, questionCursor: 6, qiOrbs: 3 });
  legacy.startStage('easy', 3, { resumeSession: true });
  assert.equal(legacy.typing.currentWord.text, legacy.questionQueue[6].text);
  assert.equal(legacy.qiOrbs, 3);
});

test('11. 自訂未知字拒絕進入題庫，明確注音可補入，錯誤組數與非法符號被攔截', () => {
  assert.throws(() => parseCustomVocabularyInput('龘'), /未收錄/);
  assert.throws(() => parseCustomVocabularyInput('小橋(ㄒㄧㄠˇ)'), /每個字/);
  assert.throws(() => parseCustomVocabularyInput('小(abc)'), /格式/);
  assert.throws(() => parseCustomVocabularyInput('胸(ㄒㄧㄨㄥ)'), /格式/);
  assert.deepEqual(parseCustomVocabularyInput('龘(ㄉㄚˊ)')[0].bopomofo, ['ㄉㄚˊ']);
  assert.deepEqual(parseCustomVocabularyInput('流水')[0].bopomofo, ['ㄌㄧㄡˊ', 'ㄕㄨㄟˇ']);
  assert.equal(parseCustomVocabularyInput('hello world')[0].mode, 'english');
});

test('12. 普通數字 1～4 仍為注音，不被當成技能；題目更換後拒絕套用舊位置', () => {
  for (const [code, expected] of [['Digit1', 'ㄅ'], ['Digit2', 'ㄉ'], ['Digit3', 'ˇ'], ['Digit4', 'ˋ']]) {
    assert.equal(getSkillShortcut({ code }), null);
    const engine = new TypingEngine();
    engine.active = true;
    engine.loadWord({ text: expected, bopomofo: [expected], isSingleKey: true });
    assert.equal(engine.handleKeyDown({ code, key: 'Process' }), true);
    assert.equal(engine.completedWords, 1);
  }
  const engine = new TypingEngine();
  engine.loadWord({ text: '小', bopomofo: ['ㄒㄧㄠˇ'] });
  const progress = engine.getProgress();
  engine.loadWord({ text: '橋', bopomofo: ['ㄑㄧㄠˊ'] });
  assert.equal(engine.restoreProgress(progress), false);
  for (const [i, skill] of ['q', 'w', 'e', 'r'].entries()) {
    assert.equal(getSkillShortcut({ code: `Digit${i + 1}`, altKey: true }), skill);
    assert.equal(getSkillShortcut({ code: `F${i + 1}` }), skill);
  }
});

test('13. 逐音存檔經 LocalStorage 寫入與重新載入仍可恢復，題庫來源變更則重新開始', () => {
  const previousStorage = globalThis.localStorage;
  let raw = null;
  globalThis.localStorage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  try {
    const app = makeGame();
    app.startStage('easy', 3);
    app.typing.processSymbolInput(app.typing.getExpectedSymbol());
    const resumed = makeGame(new StorageEngine().state);
    resumed.startStage('easy', 3, { resumeSession: true });
    assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
    assert.equal(resumed.typing.symbolIndex, app.typing.symbolIndex);
    const changed = structuredClone(app.storage.state);
    changed.useCustomVocabulary = true;
    changed.customVocabularyRaw = '小橋';
    const switched = makeGame(changed);
    switched.startStage('easy', 3, { resumeSession: true });
    assert.equal(switched.typing.currentWord.text, '小橋');
    assert.equal(switched.typing.symbolIndex, 0);
    assert.equal(switched.clearedWordsCount, 0);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test('14. 洗牌保留全部題目及重複數量，不修改原始題庫', () => {
  const pool = [{ text: '甲' }, { text: '乙' }, { text: '甲' }, { text: '丙' }];
  const before = structuredClone(pool);
  const shuffled = shuffleQuestions(pool, () => 0);
  assert.deepEqual(pool, before);
  assert.notDeepEqual(shuffled, pool);
  assert.deepEqual(shuffled.map((item) => item.text).sort(), pool.map((item) => item.text).sort());
  assert.equal(shuffleQuestions([{ text: '甲' }], () => 0, '甲')[0].text, '甲');
});

test('15. 重新挑戰重新洗牌，續玩保留整份隊列與逐音位置', () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => 0;
    const app = makeGame();
    app.startStage('easy', 3);
    const firstOrder = structuredClone(app.questionQueue);
    app.typing.processSymbolInput(app.typing.getExpectedSymbol());
    Math.random = () => 0.999;
    const resumed = makeGame(app.storage.state);
    resumed.startStage('easy', 3, { resumeSession: true });
    assert.deepEqual(resumed.questionQueue, firstOrder);
    assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
    assert.equal(resumed.typing.symbolIndex, app.typing.symbolIndex);
    app.startStage('easy', 3);
    assert.notDeepEqual(app.questionQueue, firstOrder);
  } finally { Math.random = originalRandom; }
});

test('16. 少量自訂題循環重新洗牌，交界不連續重複同題且可續玩', () => {
  const app = makeGame();
  app.storage.state.useCustomVocabulary = true;
  app.storage.state.customVocabularyRaw = '小,橋';
  app.startStage('easy', 3);
  completeCurrentQuestion(app);
  app.nextQuestion();
  const lastText = app.typing.currentWord.text;
  completeCurrentQuestion(app);
  app.nextQuestion();
  assert.notEqual(app.typing.currentWord.text, lastText);
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 3, { resumeSession: true });
  assert.deepEqual(resumed.questionQueue, app.questionQueue);
  assert.equal(resumed.questionCursor, app.questionCursor);
  assert.equal(resumed.clearedWordsCount, 2);
  assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
});

test('17. 洗牌前的逐音存檔維持原順序，損壞隊列不套入進度', () => {
  const app = makeGame();
  app.startStage('easy', 3);
  app.questionQueue = [...app.questionPool];
  app.questionCursor = 1;
  app.typing.loadWord(app.questionQueue[0]);
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  app.storage.state.savedSession.questionQueue = null;
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 3, { resumeSession: true });
  assert.deepEqual(resumed.questionQueue, app.questionPool);
  assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
  const damaged = structuredClone(app.storage.state);
  damaged.savedSession.questionQueue = [{ text: '假的題目' }];
  damaged.savedSession.clearedWordsCount = 3;
  const recovered = makeGame(damaged);
  recovered.startStage('easy', 3, { resumeSession: true });
  assert.equal(recovered.clearedWordsCount, 0);
  assert.equal(recovered.typing.symbolIndex, 0);
});

test('18. 教育部離線資料完整保存六欄、全數條目及原始檔雜湊', async () => {
  const rows = MOE_MINI_SHEETS[0].rows;
  assert.equal(rows.length - 1, 4719);
  assert.equal(new Set(rows.slice(1).map((row) => row[0])).size, 4311);
  assert.deepEqual(rows[0], ['單字', '部首', '總筆畫數', '部首外筆畫', '注音', '解釋']);
  assert.ok(rows.slice(1).every((row) => row.length === 6 && row.every((value) => typeof value === 'string')));
  const raw = readFileSync(new URL('../data/dictionaries/moe-mini/dict_mini_2019_20260929.xlsx', import.meta.url));
  assert.equal(createHash('sha256').update(raw).digest('hex'), MOE_MINI_METADATA.sha256);
  const entry = (await getDictionaryEntries('橋'))[0];
  const source = rows.find((row) => row[0] === '橋');
  assert.deepEqual(Object.values(entry), source);
  assert.ok(readFileSync(new URL('../data/dictionaries/moe-mini/使用說明.pdf', import.meta.url)).length > 1000);
});

test('19. 官方例詞可消歧，未知語境多音字要求補音，手動錯誤讀音遭攔截', () => {
  assert.deepEqual(getDictionaryExampleReading('銀行'), ['ㄧㄣˊ', 'ㄏㄤˊ']);
  assert.deepEqual(parseCustomVocabularyInput('銀行')[0].bopomofo, ['ㄧㄣˊ', 'ㄏㄤˊ']);
  assert.deepEqual(parseCustomVocabularyInput('學校')[0].bopomofo, ['ㄒㄩㄝˊ', 'ㄒㄧㄠˋ']);
  assert.deepEqual(parseCustomVocabularyInput('好學')[0].bopomofo, ['ㄏㄠˋ', 'ㄒㄩㄝˊ']);
  assert.deepEqual(parseCustomVocabularyInput('勤學好問')[0].bopomofo, ['ㄑㄧㄣˊ', 'ㄒㄩㄝˊ', 'ㄏㄠˋ', 'ㄨㄣˋ']);
  assert.throws(() => parseCustomVocabularyInput('行'), /多音字.*ㄏㄤˊ/);
  assert.deepEqual(parseCustomVocabularyInput('行(ㄒㄧㄥˊ)')[0].bopomofo, ['ㄒㄧㄥˊ']);
  assert.throws(() => parseCustomVocabularyInput('橋(ㄑㄧㄠˇ)'), /不符合國語小字典/);
  assert.ok(getCharacterReadings('行').includes('ㄒㄧㄥˋ'));
  assert.ok(isDictionaryReading('的', 'ㄉㄜ˙'));
  assert.deepEqual(parseCustomVocabularyInput('一躍而起')[0].bopomofo, ['ㄧˊ', 'ㄩㄝˋ', 'ㄦˊ', 'ㄑㄧˇ']);
  assert.deepEqual(parseCustomVocabularyInput('不卑不亢')[0].bopomofo, ['ㄅㄨˋ', 'ㄅㄟ', 'ㄅㄨˊ', 'ㄎㄤˋ']);
  assert.deepEqual(parseCustomVocabularyInput('死不認帳(ㄙˇ ㄅㄨˊ ㄖㄣˋ ㄓㄤˋ)')[0].bopomofo, ['ㄙˇ', 'ㄅㄨˊ', 'ㄖㄣˋ', 'ㄓㄤˋ']);
});

test('20. 教育部常用字題庫可選用、洗牌、完成題目並續玩', () => {
  for (const lesson of TEXTBOOK_CATALOG.moe.grades[0].lessons) {
    assert.ok(lesson.words.length >= 50, `${lesson.title} 應提供足夠多樣的字`);
    assert.equal(new Set(lesson.words.map(word => word.text)).size, lesson.words.length);
    for (const word of lesson.words) {
      const engine = new TypingEngine();
      engine.loadWord(word);
      while (engine.getExpectedSymbol()) engine.processSymbolInput(engine.getExpectedSymbol());
      assert.ok(engine.characters.every(character => character.completed));
      assert.ok(isDictionaryReading(word.text, word.bopomofo[0]));
    }
    const app = makeGame();
    app.storage.state.selectedTextbook = { publisherId: 'moe', gradeId: 'common', lessonId: lesson.lessonId };
    app.startStage('easy', 3);
    assert.equal(new Set(app.questionQueue.slice(0, 10).map(word => word.text)).size, 10);
    assert.ok(lesson.words.some((word) => word.text === app.typing.currentWord.text));
    completeCurrentQuestion(app);
    app.nextQuestion();
    app.typing.processSymbolInput(app.typing.getExpectedSymbol());
    const resumed = makeGame(app.storage.state);
    resumed.startStage('easy', 3, { resumeSession: true });
    assert.equal(resumed.clearedWordsCount, 1);
    assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
    assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
  }
});

test('27. 常用字題庫擴充後，舊十字隊列仍保留已完成題數及逐音位置', () => {
  const choice = PRACTICE_CHOICES.find(c => c.key === 'moe-moe_common_1');
  const app = makeGame();
  app.storage.activatePracticeProfile(choice.key, choice.source);
  app.startStage('easy', 1);
  const oldPool = Array.from('家爸媽朋友手足心口人').map(text => app.questionPool.find(word => word.text === text));
  app.questionPool = oldPool;
  app.questionPoolKey = JSON.stringify(oldPool);
  app.questionQueue = structuredClone(oldPool);
  app.questionCursor = 1;
  app.typing.loadWord(oldPool[0]);
  completeCurrentQuestion(app);
  app.nextQuestion();
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 1, { resumeSession: true });
  assert.equal(resumed.clearedWordsCount, 1);
  assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
  assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
  assert.ok(resumed.questionPool.length > resumed.questionQueue.length);
  clearTimeout(app.nextQuestionTimer);
  clearTimeout(resumed.nextQuestionTimer);
});

test('30. 年級混入常用字後，舊題本仍保留逐音續玩', () => {
  const choice = PRACTICE_CHOICES.find(c => c.key === 'grade-1');
  const app = makeGame();
  app.storage.activatePracticeProfile(choice.key, choice.source);
  app.startStage('easy', 1);
  const oldPool = app.questionPool.filter(word => word.sourceKind !== 'dictionary-practice');
  app.questionPool = oldPool;
  app.questionPoolKey = JSON.stringify(oldPool);
  app.questionQueue = structuredClone(oldPool);
  app.questionCursor = 1;
  app.typing.loadWord(oldPool[0]);
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 1, { resumeSession: true });
  assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
  assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
  assert.ok(resumed.questionPool.length > resumed.questionQueue.length);
});

test('21. 既有題庫字音符合小字典，古詩那得讀音依重編辭典保留', () => {
  const words = [...Object.values(DIFFICULTY_BANKS).flatMap((bank) => Object.values(bank).flat()),
    ...Object.values(TEXTBOOK_CATALOG).flatMap((pub) => pub.grades.flatMap((grade) => grade.lessons.flatMap((lesson) => lesson.words)))];
  for (const word of words) {
    if (!word.bopomofo || word.isSingleKey) continue;
    Array.from(word.text).forEach((character, i) => {
      if (word.text === '問渠那得清如許' && character === '那') {
        assert.equal(word.bopomofo[i], 'ㄋㄚˇ');
        return;
      }
      if (getCharacterReadings(character).length) {
        assert.ok(isDictionaryReading(character, word.bopomofo[i]), `${word.text}：${character} ${word.bopomofo[i]}`);
      }
    });
  }
});

test('22. 同年級混合包含三家已收錄範例及原創散文，不混入其他年級', () => {
  for (let grade = 1; grade <= 6; grade++) {
    const words = getGradeMixedWords(grade);
    assert.equal(new Set(words.map((word) => JSON.stringify([word.text, word.bopomofo]))).size, words.length);
    assert.ok(words.every((word) => word.gradeLevel === grade));
    assert.equal(words.filter((word) => word.sourceKind === 'original').length, 10);
    const publishers = new Set(words.flatMap((word) => word.sourceRefs.map((ref) => ref.publisherId)));
    assert.deepEqual([...publishers].sort(), grade <= 3 ? ['hanlin', 'knsh', 'nani'] : []);
    assert.ok(words.flatMap((word) => word.sourceRefs).every((ref) => ref.gradeId.startsWith(`g${grade}_`)));
  }
});

test('23. 60 個原創散文短句都能完成注音輸入，六年級混合題庫可續玩', () => {
  for (let grade = 1; grade <= 6; grade++) {
    for (const word of getOriginalProseWords(grade)) {
      assert.equal(Array.from(word.text).length, word.bopomofo.length);
      const engine = new TypingEngine();
      engine.active = true;
      engine.loadWord(word);
      let strokes = 0;
      while (engine.getExpectedSymbol() && strokes++ < 300) engine.processSymbolInput(engine.getExpectedSymbol());
      assert.equal(engine.completedWords, 1, word.text);
    }
  }
  const app = makeGame();
  app.storage.state.selectedTextbook = { publisherId: 'mixed', gradeId: 'g6_mix', lessonId: 'mixed_grade_6' };
  app.startStage('easy', 3);
  app.typing.processSymbolInput(app.typing.getExpectedSymbol());
  const resumed = makeGame(app.storage.state);
  resumed.startStage('easy', 3, { resumeSession: true });
  assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
  assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
});

test('31. 六年級三境界均按指定比例抽十題，題目不重複且不修改原題庫', () => {
  for (let grade = 1; grade <= 6; grade++) {
    const pool = getGradeMixedWords(grade);
    const original = structuredClone(pool);
    for (const difficulty of ['easy', 'medium', 'hard']) {
      for (let sample = 0; sample < 20; sample++) {
        const queue = buildGradeQuestionQueue(pool, grade, difficulty);
        assert.equal(queue.length, 10);
        assert.equal(new Set(queue.map(word => word.text)).size, 10);
        assert.deepEqual([0, 1, 2].map(group => queue.filter(word => getQuestionLengthGroup(word) === group).length),
          getGradeQuestionRatio(grade, difficulty));
        assert.ok(queue.every(word => pool.includes(word) && word.gradeLevel === grade));
      }
    }
    assert.deepEqual(pool, original);
    const first = buildGradeQuestionQueue(pool, grade, 'easy', () => 0);
    const second = buildGradeQuestionQueue(pool, grade, 'easy', () => 0.999);
    assert.notDeepEqual(first.map(word => word.text), second.map(word => word.text));
  }
});

test('32. 新編詞句逐字核對字典並可完整輸入，高年級宗師長句平均長於初階', () => {
  for (let grade = 1; grade <= 6; grade++) {
    for (const word of getGradeVocabulary(grade)) {
      assert.equal(Array.from(word.text).length, word.bopomofo.length);
      Array.from(word.text).forEach((character, index) => assert.ok(isDictionaryReading(character, word.bopomofo[index]), word.text));
      const engine = new TypingEngine();
      engine.active = true;
      engine.loadWord(word);
      let strokes = 0;
      while (engine.getExpectedSymbol() && strokes++ < 300) engine.processSymbolInput(engine.getExpectedSymbol());
      assert.equal(engine.completedWords, 1, word.text);
    }
    if (grade >= 5) {
      const averageLength = difficulty => {
        const queue = buildGradeQuestionQueue(getGradeMixedWords(grade), grade, difficulty, () => 0.5);
        const long = queue.filter(word => getQuestionLengthGroup(word) === 2);
        return long.reduce((sum, word) => sum + Array.from(word.text).length, 0) / long.length;
      };
      assert.ok(averageLength('hard') > averageLength('easy'));
    }
  }
});

test('33. 主控制器套用年級比例，重練重新抽題，續玩保留隊列與逐音位置', () => {
  for (let grade = 1; grade <= 6; grade++) {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const app = makeGame();
      app.storage.activatePracticeProfile(`grade-${grade}`, PRACTICE_CHOICES.find(choice => choice.key === `grade-${grade}`).source);
      app.startStage(difficulty, 1);
      assert.equal(app.stageGoal, 10);
      assert.deepEqual([0, 1, 2].map(group => app.questionQueue.filter(word => getQuestionLengthGroup(word) === group).length),
        getGradeQuestionRatio(grade, difficulty));
      const queue = structuredClone(app.questionQueue);
      app.typing.processSymbolInput(app.typing.getExpectedSymbol());
      app.saveCurrentSessionProgress();
      const resumed = makeGame(app.storage.state);
      resumed.startStage(difficulty, 1, { resumeSession: true });
      assert.deepEqual(resumed.questionQueue, queue);
      assert.equal(resumed.typing.currentWord.text, app.typing.currentWord.text);
      assert.equal(resumed.typing.getExpectedSymbol(), app.typing.getExpectedSymbol());
      app.startStage(difficulty, 1, { resumeSession: false });
      assert.notDeepEqual(app.questionQueue, queue);
      clearTimeout(app.nextQuestionTimer);
      clearTimeout(resumed.nextQuestionTimer);
    }
  }
});

test('34. 真實按錯事件收錄中文字音與次數，護身符保護連擊仍記錄錯題', () => {
  const previousDocument = globalThis.document;
  const previousStorage = globalThis.localStorage;
  let raw = null;
  globalThis.document = { getElementById: () => null };
  globalThis.localStorage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  try {
    const app = makeGame();
    app.startStage('easy', 1);
    app.typing.loadWord({ text: '行走', bopomofo: ['ㄒㄧㄥˊ', 'ㄗㄡˇ'] });
    const hp = app.storage.state.currentHp;
    app.typing.handleKeyDown({ code: 'KeyA', key: 'a', preventDefault() {} });
    app.typing.handleKeyDown({ code: 'KeyA', key: 'a', preventDefault() {} });
    assert.equal(app.storage.getMistakes()[0].char, '行');
    assert.equal(app.storage.getMistakes()[0].count, 2);
    assert.equal(app.storage.getMistakes()[0].symbols.join(''), 'ㄒㄧㄥˊ');
    assert.equal(app.storage.state.currentHp, hp);
    assert.equal(app.consecutiveMisses, 2);
    assert.equal(new StorageEngine().getMistakes()[0].count, 2);
    app.storage.state.missShields = 1;
    app.typing.combo = 3;
    app.typing.handleKeyDown({ code: 'KeyA', key: 'a', preventDefault() {} });
    assert.equal(app.typing.combo, 3);
    assert.equal(app.storage.state.missShields, 0);
    assert.equal(app.storage.getMistakes()[0].count, 3);
  } finally {
    globalThis.document = previousDocument;
    globalThis.localStorage = previousStorage;
  }
});

test('35. 英文字母與單音錯題用正確模式特訓，主線存檔不被特訓覆蓋', () => {
  const previousDocument = globalThis.document;
  const previousStorage = globalThis.localStorage;
  let raw = null;
  globalThis.document = { getElementById: () => null };
  globalThis.localStorage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  try {
    const app = makeGame();
    app.startStage('easy', 1);
    app.typing.loadWord({ text: 'cat', mode: 'english' });
    app.typing.handleKeyDown({ code: 'KeyZ', key: 'z', preventDefault() {} });
    assert.equal(app.storage.getMistakes()[0].mode, 'english');
    app.storage.recordMistake({ char: 'ㄅ', symbols: ['ㄅ'], isSingleKey: true });
    app.storage.recordMistake({ char: '水', symbols: ['ㄕ', 'ㄨ', 'ㄟ', 'ˇ'] });
    app.saveCurrentSessionProgress();
    const saved = structuredClone(app.storage.state.savedSession);
    const loaded = new StorageEngine();
    assert.equal(loaded.getMistakes().find(item => item.char === 'c').mode, 'english');
    app.closeAllModals = () => { app.typing.active = true; };
    app.handleMistakeDrillVictory = () => { app.isStageClearing = true; };
    app.startMistakeDrill();
    assert.equal(app.stageGoal, 3);
    assert.equal(app.questionQueue.find(word => word.text === 'c').mode, 'english');
    assert.equal(app.questionQueue.find(word => word.text === 'ㄅ').isSingleKey, true);
    for (let index = 0; index < 3; index++) {
      if (index) app.nextQuestion();
      completeCurrentQuestion(app);
      clearTimeout(app.nextQuestionTimer);
    }
    assert.equal(app.clearedWordsCount, 3);
    assert.equal(app.isStageClearing, true);
    assert.deepEqual(app.storage.state.savedSession, saved);
  } finally {
    globalThis.document = previousDocument;
    globalThis.localStorage = previousStorage;
  }
});

test('36. 錯題超過十題時，結算只清除本批已練習的錯題', () => {
  const previousDocument = globalThis.document;
  const callbacks = {};
  globalThis.document = { getElementById: id => ({
    addEventListener: (_, callback) => { callbacks[id] = callback; },
    innerHTML: '', textContent: ''
  }) };
  try {
    const app = makeGame();
    app.startStage('easy', 1);
    app.closeAllModals = () => { app.typing.active = true; };
    app.openExclusiveModal = () => {};
    app.storage.clearAllMistakes();
    for (const char of 'abcdefghijkl') app.storage.recordMistake({ char, symbols: [char] }, 'english');
    app.startMistakeDrill();
    const trained = [...app.mistakeDrillKeys];
    assert.equal(trained.length, 10);
    for (let index = 0; index < 10; index++) {
      if (index) app.nextQuestion();
      completeCurrentQuestion(app);
      clearTimeout(app.nextQuestionTimer);
    }
    callbacks['btn-drill-clear-return']();
    assert.equal(app.storage.getMistakes().length, 2);
    assert.ok(app.storage.getMistakes().every(item => !trained.includes(item.char)));
  } finally {
    globalThis.document = previousDocument;
  }
});

test('24. 三階武器實際產生不同劍痕、劍氣與殘影，武器不改變破題數', () => {
  const counts = [];
  for (const weapon of WEAPONS) {
    const scene = Object.create(CanvasBattleScene.prototype);
    Object.assign(scene, { weaponConfig: weapon, slashes: [], afterImages: [], heroBaseX: 100,
      heroBaseY: 250, enemyBaseX: 600, enemyBaseY: 250 });
    scene.spawnBurstParticles = () => {};
    scene.spawnFloatingText = () => {};
    scene.playWordFinisher({ wordText: '山', damage: 20, isCrit: false, isParryBreak: false, comboTier: 0 });
    counts.push([scene.slashes.filter((slash) => !slash.isWave).length,
      scene.slashes.filter((slash) => slash.isWave).length, scene.afterImages.length]);
    const app = makeGame();
    app.storage.state.equippedWeaponId = weapon.id;
    app.startStage('easy', 3);
    completeCurrentQuestion(app);
    assert.equal(app.clearedWordsCount, 1);
    assert.equal(app.stageGoal, 10);
    clearTimeout(app.nextQuestionTimer);
  }
  assert.deepEqual(counts, [[1, 0, 1], [2, 1, 3], [3, 2, 5]]);
});
