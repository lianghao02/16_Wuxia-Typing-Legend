import test from 'node:test';
import assert from 'node:assert/strict';
import { TypingEngine } from '../src/engine/TypingEngine.js';
import { parseCustomVocabularyInput, DIFFICULTY_BANKS } from '../src/data/vocabulary.js';
import { DIFFICULTY_CONFIG, DIABLO_STAGES } from '../src/data/enemies.js';
import { TEXTBOOK_CATALOG } from '../src/data/textbooks.js';

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
