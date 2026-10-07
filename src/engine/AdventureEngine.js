import { ADVENTURE_STAGES } from '../data/adventureWorld.js';
export const ADVENTURE_KEY = 'wuxia_adventure_v1';
export const CONFIG = { questions: 10, qiMax: 5, freezeMs: 8000, damage: 15, hp: 100,
  intervals: { easy: 18000, medium: 14000, hard: 11000 }, graceMs: 4000 };
export function newAdventure(legacy = {}) {
  return { version: 1, grade: '1', hero: legacy.heroId === 'su' ? 'su' : 'yun',
    coins: Number.isFinite(Number(legacy.coins)) ? Math.max(0, Number(legacy.coins)) : 80, weapon: legacy.equippedWeaponId || 'wood_sword',
    owned: [...new Set(['wood_sword', ...(legacy.ownedWeapons || [])])], keyboard: true, profiles: {} };
}
export function getProfile(save) {
  return save.profiles[save.grade] ||= { stage: 0, realm: 'easy', records: {}, recent: [], weak: {}, session: null, daily: {} };
}
export function phaseFor(count) { return count < 3 ? '試探' : count < 7 ? '破防' : '決勝'; }
export function attackDuration(word, grade, realm, kind) {
  if (kind !== 'duel' && kind !== 'boss') return Infinity;
  const length = Array.from(word.text).length;
  // 長句與初學者給足作答時間，閱讀寬限另外計算。
  return CONFIG.intervals[realm] + length * (grade === 'english' ? 900 : Number(grade) <= 2 ? 5000 : 3500);
}
export function awardStage(save, profile, stageId, stats, date) {
  if (stats.completedWords !== CONFIG.questions) throw new Error('必須實際完成十題才能通關。');
  const stage = ADVENTURE_STAGES[stageId];
  const first = !profile.records[stageId];
  const bonus = save.weapon === 'xuantie_sword' ? 1.5 : save.weapon === 'qingfeng_sword' ? 1.25 : 1;
  const reward = Math.round(stage.reward * bonus);
  save.coins += reward;
  profile.records[stageId] = { accuracy: stats.accuracy, chars: stats.completedChars, realm: stats.realm || profile.realm };
  if (first) profile.stage = Math.max(profile.stage, Math.min(ADVENTURE_STAGES.length, stageId + 1));
  profile.session = null;
  const dailyBonus = !profile.daily[date] ? 20 : 0;
  profile.daily[date] = true;
  save.coins += dailyBonus;
  return { reward, dailyBonus, first, ending: stageId === ADVENTURE_STAGES.length-1 && profile.stage === ADVENTURE_STAGES.length };
}
export function buyWeapon(save, weapon) {
  if (!save.owned.includes(weapon.id)) {
    if (save.coins < weapon.price) return false;
    save.coins -= weapon.price;
    save.owned.push(weapon.id);
  }
  save.weapon = weapon.id;
  return true;
}
export function favorFresh(pool, recent, random = Math.random) {
  return [...pool].map(word => ({word, score: random() + (recent.includes(word.text) ? 2 : 0)}))
    .sort((a,b) => a.score - b.score).map(x => x.word);
}
