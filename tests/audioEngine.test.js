import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AudioEngine, SFX_FILES, BGM_FILES } from '../src/engine/AudioEngine.js';
import { getBossWeaponDropRate } from '../src/engine/AdventureEngine.js';

test('1. SFX 打擊與冷兵器實體檔案存在性與有效性斷言', () => {
  const expectedKeys = ['key_hit', 'char_slash', 'word_complete', 'miss', 'hurt', 'shield', 'coins', 'combo_milestone'];
  for (const k of expectedKeys) {
    assert.ok(SFX_FILES[k], `SFX_FILES 必須包含 ${k}`);
    const filePath = path.resolve(SFX_FILES[k]);
    assert.ok(fs.existsSync(filePath), `實體檔案必須存在: ${filePath}`);
    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 1000, `實體檔案大小必須大於 1KB: ${stats.size} bytes`);
  }
});

test('2. BGM 六章風格、首領戰、首頁、客棧實體音樂檔案存在性斷言', () => {
  const expectedThemes = ['title', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'boss', 'inn'];
  for (const t of expectedThemes) {
    assert.ok(BGM_FILES[t], `BGM_FILES 必須包含 ${t}`);
    const filePath = path.resolve(BGM_FILES[t]);
    assert.ok(fs.existsSync(filePath), `BGM 實體檔案必須存在: ${filePath}`);
    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 200000, `BGM 檔案大小必須大於 200KB（高品質實錄）: ${stats.size} bytes`);
  }
});

test('3. AudioEngine 在無音訊或 Node 環境下呼叫保證零崩潰（安全雙軌制）', () => {
  const audio = new AudioEngine();
  audio.init();
  assert.doesNotThrow(() => audio.playKeyHit(1));
  assert.doesNotThrow(() => audio.playKeyHit(10));
  assert.doesNotThrow(() => audio.playCharSlash(1));
  assert.doesNotThrow(() => audio.playWordComplete(1));
  assert.doesNotThrow(() => audio.playMiss(6));
  assert.doesNotThrow(() => audio.playPlayerHurt());
  assert.doesNotThrow(() => audio.playShieldBlock());
  assert.doesNotThrow(() => audio.playCoin());
  assert.doesNotThrow(() => audio.startBgm('title'));
  assert.doesNotThrow(() => audio.switchBgm('ch2'));
  assert.doesNotThrow(() => audio.switchBgm('boss'));
  assert.doesNotThrow(() => audio.stopBgm());
});

test('4. 首領關卡掉落率確認：僅在每五關首領關卡掉落且掉落率為 20%', () => {
  // 第 5, 10, 15, 20, 25, 30 關（stageId: 4, 9, 14, 19, 24, 29）掉落率為 20%
  for (const sId of [4, 9, 14, 19, 24, 29]) {
    assert.equal(getBossWeaponDropRate(sId), 0.20, `關卡 ${sId + 1} 掉落率必須為 20%`);
  }
  // 其餘一般關卡（第 1, 2, 3, 4, 6... 關）掉落率為 0
  for (const sId of [0, 1, 2, 3, 5, 6, 7, 8]) {
    assert.equal(getBossWeaponDropRate(sId), 0, `關卡 ${sId + 1} 掉落率必須為 0%`);
  }
});
