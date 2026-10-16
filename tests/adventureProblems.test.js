import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { battleHarness, section } from './helpers/adventureHarness.js';
import * as rules from '../src/engine/AdventureEngine.js';
import { ADVENTURE_STAGES, CHAPTERS } from '../src/data/adventureWorld.js';
import { recordQuestionHistory, recordQuestionResult } from '../src/data/gradeQuestionMix.js';

function completeWord(ctx) {
  let guard = 0;
  while (ctx.engine.getExpectedSymbol()) {
    ctx.engine.processSymbolInput(ctx.engine.getExpectedSymbol());
    if (++guard > 150) throw new Error('題目未能完成');
    if (ctx.session.cursor > 0) break;
  }
}

test('快速連錯仍累計提示與錯題，戰鬥懲罰只處理一次', () => {
  const c = battleHarness();
  c.engine.processSymbolInput('ㄅ');
  c.now += 200;
  c.engine.processSymbolInput('ㄅ');
  assert.equal(c.misses, 2);
  assert.equal(c.wordMisses, 2);
  assert.equal(c.profile.weak['口'], 2);
  assert.equal(c.profile.weakSymbols['ㄎ'], 2);
  assert.equal(c.session.atb, 8);
  assert.equal(c.session.wordMisses, 2);
});

test('敵人蓄力在 90%、95%、99% 時，錯鍵只能推進且不直接扣血', () => {
  for (const atb of [90, 95, 99]) {
    const c = battleHarness(); c.session.atb = atb;
    c.engine.processSymbolInput('ㄅ');
    assert.equal(c.session.atb, Math.min(100, atb + 8));
    assert.equal(c.session.hp, 100);
  }
});

test('完成有錯題目仍待複習，結算不重複記次或清除錯題', () => {
  const c = battleHarness();
  c.engine.processSymbolInput('ㄅ'); completeWord(c);
  assert.equal(c.profile.practiced['口'], 1);
  assert.equal(c.profile.weak['口'], 1);
  c.session.enemyHp = 0;
  vm.runInContext(section('function finish()', 'function shop('), c);
  c.finish();
  assert.equal(c.profile.practiced['口'], 1);
  assert.equal(c.profile.weak['口'], 1);
});

test('只有後續零失誤作答減少待複習次數，近期紀錄按真正作答順序更新', () => {
  const p = { weak: { 口: 2 }, practiced: {}, recentZh: ['口', '山'], recent: ['口', '山'] };
  recordQuestionHistory(p, '口');
  assert.equal(p.weak['口'], 2);
  assert.deepEqual(p.recentZh, ['山', '口']);
  recordQuestionResult(p, '口', false, true);
  assert.equal(p.weak['口'], 1);
  recordQuestionResult(p, '口', false, true);
  assert.equal(p.weak['口'], undefined);
  assert.equal(p.practiced['口'], 3);
});

test('錯題特訓完成或敗退皆不覆寫主線續玩、不解鎖主線或取得文印', () => {
  for (const fail of [false, true]) {
    const c = battleHarness();
    const mainSession = { stageId: 2, cursor: 3, hp: 73 };
    c.profile.stage = 4; c.profile.session = mainSession;
    c.stage = ADVENTURE_STAGES[4]; c.session.isWeakDrill = true;
    c.engine.processSymbolInput('ㄅ'); completeWord(c);
    assert.equal(c.profile.session, mainSession);
    if (fail) {
      vm.runInContext(section('function failed()', "engine.on('keyHit'"), c);
      c.failed();
    } else {
      c.save.dailyQuests.claimed.q_stage = true;
      const before = c.save.coins;
      c.session.enemyHp = 0;
      vm.runInContext(section('function finish()', 'function shop('), c);
      c.finish();
      assert.equal(c.save.coins, before + 35);
      assert.equal(Object.keys(c.profile.records).length, 0);
      assert.ok(!c.resultHtml.includes('✦ 尋回'));
    }
    assert.equal(c.profile.stage, 4);
    assert.equal(c.profile.session, mainSession);
  }
});

test('異常狀態必須連續完成兩字，中途錯鍵重新計算', () => {
  const c = battleHarness({ text: '口口口', bopomofo: ['ㄎㄡˇ', 'ㄎㄡˇ', 'ㄎㄡˇ'] });
  c.session.status = 'poison'; c.session.statusCureNeed = 2;
  const completeChar = () => {
    const index = c.engine.charIndex;
    while (c.engine.charIndex === index && c.engine.getExpectedSymbol()) c.engine.processSymbolInput(c.engine.getExpectedSymbol());
  };
  completeChar(); assert.equal(c.session.statusCureNeed, 1);
  c.engine.processSymbolInput('ㄅ'); assert.equal(c.session.statusCureNeed, 2);
  completeChar(); assert.equal(c.session.status, 'poison');
  completeChar(); assert.equal(c.session.status, null);
});

test('單字題套用兵器與護腕擊退，多字詞與破綻增傷不中斷集氣', () => {
  for (const word of [{ text: '口', bopomofo: ['ㄎㄡˇ'] }, { text: '口口', bopomofo: ['ㄎㄡˇ', 'ㄎㄡˇ'] }]) {
    const c = battleHarness(word, rules.ADVENTURE_BRACERS[2]);
    c.getLoadout = () => rules.ADVENTURE_WEAPONS[5];
    c.session.atb = 80;
    c.applyPlayerAttack('word', { wordObj: word, isParryBreak: true });
    assert.equal(c.session.atb, word.text.length === 1 ? 46 : 80);
  }
});

test('續玩保留當題錯誤；前題有錯不影響本題明確保存的零失誤', () => {
  for (const misses of [0, 1]) {
    const c = battleHarness();
    const progress = c.engine.getProgress(); progress.stats.totalMisses = 3;
    c.profile.session = { ...c.session, stageId: 0, typing: progress, wordMisses: misses };
    vm.runInContext(section('function begin(', 'function start()'), c);
    c.begin();
    assert.equal(c.wordMisses, misses);
  }
});

test('敵人未倒下即使答滿十題也不能領賞，無效關卡不改存檔', () => {
  const save = rules.newAdventure(), p = rules.getProfile(save), before = JSON.stringify(save);
  for (const stats of [{ completedWords: 10, enemyHp: 100 }, { completedWords: 10 }, { enemyHp: 100, enemyDefeated: true }, { enemyHp: NaN }]) {
    assert.throws(() => rules.awardStage(save, p, 0, stats, 'today'));
  }
  assert.throws(() => rules.awardStage(save, p, 999, { enemyHp: 0 }, 'today'));
  assert.equal(JSON.stringify(save), before);
  assert.ok(rules.awardStage(save, p, 0, { enemyHp: 0, completedWords: 3, accuracy: 100 }, 'today').reward > 0);
});

test('絕招必須滿氣且在戰鬥中，施放一次清氣並依流派提供守護', () => {
  for (const weapon of [rules.ADVENTURE_WEAPONS[0], rules.ADVENTURE_WEAPONS[5]]) {
    const c = battleHarness(); c.getLoadout = () => weapon;
    c.frozenUntil = 0;
    vm.runInContext(section('function ultimate()', 'function failed()'), c);
    c.session.qi = 4;
    const hp = c.session.enemyHp;
    c.ultimate(); assert.equal(c.session.enemyHp, hp); assert.equal(c.session.qi, 4);
    c.session.qi = 5; c.session.hp = 60; c.session.status = 'burn';
    c.ultimate();
    assert.equal(c.session.qi, 0); assert.equal(c.session.shield, 1);
    assert.equal(c.session.status, null); assert.ok(c.session.enemyHp < hp);
    assert.equal(c.frozenUntil - c.battleTime, weapon.style === 'spear' ? 10000 : 8000);
    assert.equal(c.session.hp, weapon.style === 'spear' ? 80 : 60);
    const after = c.session.enemyHp;
    c.ultimate(); assert.equal(c.session.enemyHp, after);
  }
});

test('回春丹滿血無異常不消耗，回血與淨化一次扣一份且不超出上限', () => {
  const c = battleHarness();
  vm.runInContext(section('function useHealPotion(', 'function ultimate()'), c);
  const initial = c.save.potions.heal_potion;
  assert.equal(c.useHealPotion(false), false);
  assert.equal(c.save.potions.heal_potion, initial);
  c.session.hp = 80; c.session.status = 'freeze'; c.session.statusCureNeed = 2;
  assert.equal(c.useHealPotion(false), true);
  assert.equal(c.session.hp, 100); assert.equal(c.session.status, null);
  assert.equal(c.save.potions.heal_potion, initial - 1);
  assert.equal(c.useHealPotion(false), false);
});

test('長句中途施放絕招只能破防，完成當題後才收招通關', () => {
  const word = { text: '口'.repeat(20), bopomofo: Array(20).fill('ㄎㄡˇ') };
  const c = battleHarness(word);
  c.getLoadout = () => rules.ADVENTURE_WEAPONS[5];
  c.session.enemyHp = c.session.enemyMaxHp = 150;
  while (c.engine.completedChars < 15) c.engine.processSymbolInput(c.engine.getExpectedSymbol());
  assert.equal(c.session.qi, 5);
  assert.equal(c.engine.completedWords, 0);
  c.frozenUntil = 0;
  vm.runInContext(section('function finish()', 'function shop('), c);
  vm.runInContext(section('function ultimate()', 'function failed()'), c);
  c.ultimate();
  assert.equal(c.session.enemyHp, 1);
  assert.equal(c.session.pendingFinisher, true);
  assert.equal(c.profile.records[0], undefined);
  assert.equal(c.engine.charIndex, 15);
  completeWord(c);
  assert.equal(c.session.enemyHp, 0);
  assert.equal(c.profile.records[0].words, 1);
  assert.ok(c.resultHtml.includes('實際完成 1 題'));
});

test('英文連擊獎勵只在 20／40／60 字元觸發，字母輸入仍逐字判定', () => {
  const c = battleHarness({ text: 'a'.repeat(61), mode: 'english' });
  c.session.hp = 70;
  const typeUntil = count => { while(c.engine.completedChars < count) c.engine.processSymbolInput(c.engine.getExpectedSymbol()); };
  typeUntil(15); assert.equal(c.engine.combo, 15); assert.equal(c.session.qi, 0);
  typeUntil(20); assert.equal(c.session.qi, 1);
  typeUntil(23); assert.equal(c.session.qi, 1, '不在 21～23 字元重複發獎');
  typeUntil(40); assert.equal(c.session.hp, 80);
  typeUntil(60); assert.equal(c.session.qi, 5); assert.equal(c.session.shield, 1);
});

test('中英混合詞庫共用加權獎勵進度，不因切換語言提早灌滿內力', () => {
  const c = battleHarness({ text: 'a'.repeat(21), mode: 'english' });
  c.session.hp = 70;
  while(c.engine.completedChars < 20) c.engine.processSymbolInput(c.engine.getExpectedSymbol());
  assert.equal(c.session.qi, 1);
  c.engine.loadWord({ text: '口'.repeat(6), bopomofo: Array(6).fill('ㄎㄡˇ') });
  while(c.engine.completedChars < 25) c.engine.processSymbolInput(c.engine.getExpectedSymbol());
  assert.equal(c.engine.combo, 25);
  assert.equal(c.session.qi, 1, '不能把 20 個英文字元當成 20 個中文字發滿氣獎勵');
  assert.equal(c.session.hp, 80);
  c.engine.processSymbolInput('ㄅ');
  assert.ok(c.session.rewardProgress < 10, '錯鍵保留連擊時，獎勵進度也按比例保留');
});

test('新手與高階裝備皆須足夠正確按鍵，錯鍵不算練習量且破防可續玩', () => {
  for (const weapon of [rules.ADVENTURE_WEAPONS[0], rules.ADVENTURE_WEAPONS[5]]) {
    const c = battleHarness(); c.getLoadout = () => weapon;
    c.session.enemyHp = 1;
    c.session.stageId = 0;
    c.engine.totalMisses = 100;
    c.engine.totalHits = rules.CONFIG.minPracticeHits - 1;
    c.applyPlayerAttack('word');
    assert.equal(c.session.enemyHp, 1);
    assert.equal(c.session.pendingFinisher, true);
    c.rememberSession();
    assert.equal(c.profile.session.pendingFinisher, true);
    c.profile.session = JSON.parse(JSON.stringify(c.profile.session));
    vm.runInContext(section('function begin(', 'function start()'), c);
    c.begin();
    assert.equal(c.session.pendingFinisher, true);
    assert.equal(c.engine.totalHits, rules.CONFIG.minPracticeHits - 1);
    c.engine.totalHits++;
    c.applyPlayerAttack('word');
    assert.equal(c.session.enemyHp, 0);
  }
});

test('開選單、切換分頁與失焦都保留定身剩餘時間，回戰鬥後才繼續倒數', () => {
  for (const pausedBy of ['menu', 'hidden', 'blur']) {
    const c = battleHarness();
    Object.assign(c, { now: 0, lastTick: 0, windowFocused: true, frozenUntil: 0,
      statusDotAcc: 0, document: { hidden: false }, requestAnimationFrame() {} });
    vm.runInContext(section('function ultimate()', 'function failed()'), c);
    vm.runInContext(section('function tick(now)', 'keyboard();setupScene();'), c);
    c.session.qi = 5; c.ultimate();
    const step = () => { c.now += 50; c.tick(c.now); };
    for (let i = 0; i < 50; i++) step();
    const remaining = c.frozenUntil - c.battleTime;
    if (pausedBy === 'menu') c.view = 'settings';
    if (pausedBy === 'hidden') c.document.hidden = true;
    if (pausedBy === 'blur') c.windowFocused = false;
    c.now += 20000; c.tick(c.now);
    assert.equal(c.frozenUntil - c.battleTime, remaining);
    c.view = 'battle'; c.document.hidden = false; c.windowFocused = true;
    for (let i = 0; i < 100; i++) step();
    assert.equal(c.session.atb, 0);
    for (let i = 0; i < 11; i++) step();
    assert.ok(c.session.atb > 0, '定身確實結束，敵人恢復蓄力');
  }
});

test('Service Worker 更新只移除本遊戲舊快取，保留同網域其他作品', async () => {
  const handlers = {}, removed = [];
  const ctx = {
    self: { addEventListener: (name, fn) => handlers[name] = fn, clients: { claim() {} } },
    caches: {
      keys: async () => ['wuxia-typing-v1', 'wuxia-typing-v2', 'project-hub-v1', 'other-game-v3'],
      delete: async key => { removed.push(key); return true; }
    }
  };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), ctx);
  let pending;
  handlers.activate({ waitUntil: promise => pending = promise });
  await pending;
  assert.deepEqual(removed, ['wuxia-typing-v1']);
});
