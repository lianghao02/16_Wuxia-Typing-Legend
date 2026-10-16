import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { battleHarness, section } from '../tests/helpers/adventureHarness.js';
import { ADVENTURE_STAGES } from '../src/data/adventureWorld.js';
import { getGradeMixedWords } from '../src/data/textbooks.js';
import { ENGLISH_PRACTICE_BANKS } from '../src/data/practice.js';
import { buildAdaptiveQuestionBatch } from '../src/data/gradeQuestionMix.js';
import { ADVENTURE_WEAPONS, ADVENTURE_ARMORS, ADVENTURE_BRACERS, CONFIG, getProfile } from '../src/engine/AdventureEngine.js';

// 固定速度只是假設輸入條件，不代表學童實測或各年級標準。
const FRAME_MS = 50, LIMIT_MS = 600000;
function seededRandom(seed = 23) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

export function simulateBattle({ grade, realm, stageId, gear = 0, keysPerSecond = 2, autoUltimate = false, mistakeEvery = 0 }) {
  const pool = grade === 'english' ? ENGLISH_PRACTICE_BANKS[realm] : getGradeMixedWords(Number(grade));
  const random = seededRandom();
  const queue = buildAdaptiveQuestionBatch(pool, grade, realm, { count: 10, random });
  const bracer = ADVENTURE_BRACERS[gear], armor = ADVENTURE_ARMORS[gear];
  const weapon = ADVENTURE_WEAPONS[[0, 1, 5][gear]];
  const c = battleHarness(queue[0], bracer);
  c.save.grade = grade; c.save.weapon = weapon.id;
  c.profile = getProfile(c.save); c.profile.realm = realm;
  c.stage = ADVENTURE_STAGES[stageId];
  Object.assign(c.session, { stageId, queue, realm, enemyHp: c.stage.enemy.maxHp,
    enemyMaxHp: c.stage.enemy.maxHp, shield: armor.startShield || 0 });
  c.getLoadout = () => weapon; c.getArmor = () => armor;
  c.finished = false; c.failedCount = 0; c.enemyAttacks = 0; c.ultimateCount = 0;
  c.now = 0; c.lastTick = 0; c.frozenUntil = 0; c.readUntil = CONFIG.graceMs;
  c.windowFocused = true; c.statusDotAcc = 0;
  c.document = { hidden: false }; c.requestAnimationFrame = () => {};
  c.failed = () => { c.failedCount++; c.view = 'failed'; c.engine.active = false; };
  c.finish = () => { c.finished = true; c.view = 'result'; c.engine.active = false; };
  c.$ = () => ({ textContent: '', value: 0, classList: { add() {}, remove() {} } });
  c.scene = new Proxy({}, { get: (_, key) => key === 'playEnemyAttack'
    ? () => { c.enemyAttacks++; } : () => {} });
  c.makeQueue = (used, count) => buildAdaptiveQuestionBatch(pool, grade, realm, {
    count, random, sessionUsed: used, practicedMap: c.profile.practiced,
    recentList: c.profile.recent, weakMap: c.profile.weak
  });
  vm.runInContext(section('function ensureSessionQueue()', 'function begin('), c);
  vm.runInContext(section('function useHealPotion(', 'function failed()'), c);
  vm.runInContext(section('function tick(now)', 'keyboard();setupScene();'), c);
  let nextKeyAt = CONFIG.graceMs, inputs = 0;
  for (c.now = FRAME_MS; c.now <= LIMIT_MS; c.now += FRAME_MS) {
    c.tick(c.now);
    if (c.finished || c.failedCount) break;
    if (c.now >= nextKeyAt && c.engine.active) {
      inputs++;
      const expected = c.engine.getExpectedSymbol();
      const wrong = c.engine.mode === 'english' ? (expected === 'a' ? 'b' : 'a') : (expected === 'ㄅ' ? 'ㄆ' : 'ㄅ');
      c.engine.processSymbolInput(mistakeEvery && inputs % mistakeEvery === 0 ? wrong : expected);
      nextKeyAt += 1000 / keysPerSecond;
    }
    if (autoUltimate && c.session.qi >= CONFIG.qiMax && !c.finished) {
      c.ultimate(); c.ultimateCount++;
    }
    if (c.finished || c.failedCount) break;
  }
  return { grade, realm, stageId, gear, keysPerSecond, autoUltimate, mistakeEvery,
    result: c.finished ? '通關' : c.failedCount ? '需調息' : '超過十分鐘',
    seconds: Math.round(c.now / 100) / 10, questions: c.session.cursor,
    chars: c.engine.completedChars, inputs, correctHits: c.engine.totalHits, hp: c.session.hp,
    enemyHp: c.session.enemyHp, enemyAttacks: c.enemyAttacks, ultimates: c.ultimateCount,
    misses: c.engine.totalMisses };
}

// 被測試匯入時不執行整批診斷。
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = [];
  for (const grade of ['1', '2', '3', '4', '5', '6', 'english'])
    for (const realm of ['easy', 'medium', 'hard'])
      for (const stageId of [0, 4, 29])
        for (const gear of [0, 1, 2])
          for (const keysPerSecond of [2, 5])
            for (const autoUltimate of [false, true])
              for (const mistakeEvery of [0, 10])
                results.push(simulateBattle({ grade, realm, stageId, gear, keysPerSecond, autoUltimate, mistakeEvery }));
  if (results.some(r => r.result === '通關' && (r.questions < 1 || r.correctHits < CONFIG.minPracticeHits))) {
    throw new Error('發現未完成題目或未達基本練習量的通關情境。');
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(results));
  else {
    console.log('隔離模擬：零錯鍵／每十鍵錯一鍵、每秒 2／5 次按鍵、固定亂數；保留預設丹藥，需調息即停止。非真人測試。');
    for (const realm of ['easy', 'medium', 'hard']) for (const gear of [0, 1, 2]) for (const mistakeEvery of [0, 10]) {
      const rows = results.filter(r => r.realm === realm && r.gear === gear && r.mistakeEvery === mistakeEvery);
      console.log(JSON.stringify({ realm, gear, mistakeEvery, cases: rows.length,
        needsRecovery: rows.filter(r => r.result === '需調息').length,
        fewQuestions: rows.filter(r => r.result === '通關' && r.questions < 3).length,
        incompleteQuestionVictory: rows.filter(r => r.result === '通關' && r.questions === 0).length,
        maxSeconds: Math.max(...rows.map(r => r.seconds)) }));
    }
    console.log('一年級初階、新手裝備、每秒兩鍵、無主動絕招：');
    console.log(JSON.stringify(results.filter(r => r.grade === '1' && r.realm === 'easy' && r.gear === 0 && r.keysPerSecond === 2 && !r.autoUltimate && !r.mistakeEvery)));
    console.log('六年級宗師、新手裝備、每秒兩鍵、無主動絕招：');
    console.log(JSON.stringify(results.filter(r => r.grade === '6' && r.realm === 'hard' && r.gear === 0 && r.keysPerSecond === 2 && !r.autoUltimate && !r.mistakeEvery)));
  }
}
