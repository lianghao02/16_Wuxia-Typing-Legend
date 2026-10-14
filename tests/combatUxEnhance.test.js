import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVENTURE_ARMORS,
  getArmorMaxHp,
  awardStage,
  newAdventure,
  getProfile
} from '../src/engine/AdventureEngine.js';
import { TypingEngine } from '../src/engine/TypingEngine.js';

test('1. 防具 Max HP 上限成長：布衣 100、百草袍 115、赤鱗鎧 130', () => {
  assert.equal(getArmorMaxHp('linen_armor'), 100);
  assert.equal(getArmorMaxHp('herbal_robe'), 115);
  assert.equal(getArmorMaxHp('scale_armor'), 130);

  const mockSave = { armor: 'herbal_robe' };
  assert.equal(getArmorMaxHp(mockSave), 115);
});

test('2. 五關文印自動補滿血 vs 一般關卡過關不補血（氣血延續）', () => {
  const save = newAdventure();
  const profile = getProfile(save);
  save.armor = 'herbal_robe'; // Max HP = 115

  // 第 1 關 (stageId: 0) 通關，剩餘 75 氣血 -> 不補血，保留 75 氣血
  const res0 = awardStage(save, profile, 0, {
    completedWords: 10,
    completedChars: 25,
    accuracy: 95,
    heroEndHp: 75
  }, '2026-10-14');
  assert.equal(res0.isChapterSeal, false);
  assert.equal(res0.adventureHp, 75);
  assert.equal(profile.adventureHp, 75);

  // 第 2 關 (stageId: 1) 通關，剩餘 50 氣血 -> 不補血，保留 50 氣血
  const res1 = awardStage(save, profile, 1, {
    completedWords: 10,
    completedChars: 28,
    accuracy: 92,
    heroEndHp: 50
  }, '2026-10-14');
  assert.equal(res1.isChapterSeal, false);
  assert.equal(res1.adventureHp, 50);
  assert.equal(profile.adventureHp, 50);

  // 第 5 關 (stageId: 4，第一章 Boss) 通關，尋回第一章文印 -> 自動補滿血至 115！
  const res4 = awardStage(save, profile, 4, {
    completedWords: 10,
    completedChars: 30,
    accuracy: 96,
    heroEndHp: 35
  }, '2026-10-14');
  assert.equal(res4.isChapterSeal, true);
  assert.equal(res4.adventureHp, 115);
  assert.equal(profile.adventureHp, 115);
  assert.equal(res4.heroMaxHp, 115);

  // 第 6 關 (stageId: 5，第二章第 1 關) 通關，剩餘 90 氣血 -> 不補血
  const res5 = awardStage(save, profile, 5, {
    completedWords: 10,
    completedChars: 30,
    accuracy: 90,
    heroEndHp: 90
  }, '2026-10-14');
  assert.equal(res5.isChapterSeal, false);
  assert.equal(res5.adventureHp, 90);

  // 第 10 關 (stageId: 9，第二章 Boss) 通關，尋回第二章文印 -> 再次自動補滿血至 115！
  const res9 = awardStage(save, profile, 9, {
    completedWords: 10,
    completedChars: 35,
    accuracy: 98,
    heroEndHp: 40
  }, '2026-10-14');
  assert.equal(res9.isChapterSeal, true);
  assert.equal(res9.adventureHp, 115);
});

test('3. 中文輸入法（微軟新注音 Process / 229 / isComposing）事件偵測', () => {
  const engine = new TypingEngine();
  engine.loadWord({ text: '大', bopomofo: 'ㄉㄚˋ' });
  engine.active = true;

  let imeDetectedCount = 0;
  let imeClearedCount = 0;
  engine.on('imeDetected', () => imeDetectedCount++);
  engine.on('imeCleared', () => imeClearedCount++);

  // 模擬微軟新注音狀態 (key: 'Process', keyCode: 229)
  engine.handleKeyDown({
    code: 'Key2',
    key: 'Process',
    keyCode: 229,
    isComposing: true,
    preventDefault: () => {}
  });
  assert.equal(imeDetectedCount, 1);

  // 模擬正常切換為英數模式後輸入
  engine.handleKeyDown({
    code: 'Key2',
    key: '2',
    keyCode: 50,
    isComposing: false,
    preventDefault: () => {}
  });
  assert.equal(imeClearedCount, 1);
});
