import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { TypingEngine } from '../../src/engine/TypingEngine.js';
import * as rules from '../../src/engine/AdventureEngine.js';
import { ADVENTURE_STAGES, CHAPTERS } from '../../src/data/adventureWorld.js';
import { recordQuestionResult } from '../../src/data/gradeQuestionMix.js';

const source = readFileSync(new URL('../../src/adventure.js', import.meta.url), 'utf8');
export function section(from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, `找得到正式流程：${from}`);
  return source.slice(start, end);
}

// 執行正式事件處理器，僅替換畫面、聲音、時鐘與儲存，避免污染玩家存檔。
export function battleHarness(word = { text: '口', bopomofo: ['ㄎㄡˇ'] }, bracer = rules.ADVENTURE_BRACERS[0]) {
  const save = rules.newAdventure(), profile = rules.getProfile(save);
  const engine = new TypingEngine();
  const element = { classList: { add() {}, remove() {} }, offsetWidth: 0 };
  const effects = new Proxy({}, { get: () => () => {} });
  const ctx = {
    ...rules, ADVENTURE_STAGES, CHAPTERS, recordQuestionResult,
    engine, save, profile, stage: ADVENTURE_STAGES[0], view: 'battle',
    session: { queue: [word, word, word], cursor: 0, qi: 0, hp: 100, atb: 0,
      enemyHp: 10000, enemyMaxHp: 10000, enemyPoisonTurns: 0, mistakeNotes: [] },
    wordMisses: 0, misses: 0, now: 1000, battleTime: 0, lastMissAt: -Infinity, lastMissCharIndex: -1,
    lastRetainedCombo: 0, wrongKeyCode: '', wrongKeyTimer: 0, readUntil: 0,
    audio: effects, scene: effects,
    $: () => element, clearTimeout() {}, setTimeout: () => 0,
    getBracer: () => bracer, getLoadout: () => rules.ADVENTURE_WEAPONS[0],
    getArmor: () => rules.ADVENTURE_ARMORS[0], getBeast: () => rules.SPIRIT_BEASTS[0],
    datestring: () => '2026-10-16', escape: value => String(value ?? ''),
    setupScene() {}, render() {}, notify(text) { ctx.lastNotice = text; }, ensureSessionQueue() {},
    persist() {}, pause() { engine.active = false; },
    modal(html) { ctx.resultHtml = html; }, finish() { ctx.finished = true; }
  };
  ctx.performance = { now: () => ctx.now };
  vm.createContext(ctx);
  vm.runInContext(section('function rememberSession()', 'function pause()'), ctx);
  vm.runInContext(section('function applyPlayerAttack(', 'function finish()'), ctx);
  vm.runInContext(section("engine.on('keyHit'", 'function keyboard()'), ctx);
  engine.loadWord(word); engine.active = true;
  return ctx;
}
