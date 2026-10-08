import { ADVENTURE_STAGES } from '../data/adventureWorld.js';
export const ADVENTURE_KEY = 'wuxia_adventure_v1';
export const CONFIG = { questions: 10, qiMax: 5, freezeMs: 8000, damage: 15, hp: 100,
  intervals: { easy: 6800, medium: 4500, hard: 2800 },
  perCharMs: { easy: 1400, medium: 950, hard: 600 },
  englishCharMs: { easy: 380, medium: 260, hard: 170 },
  kindMultipliers: { training: 1.2, journey: 1.15, event: 1.15, duel: 1, boss: .85 },
  graceMs: 700, knockbackAtb: 25 };

export const ADVENTURE_WEAPONS = [
  { id: 'wood_sword', tier: 1, style: 'sword', effectName: '木劍單斬', name: '初階・桃木短劍',
    price: 0, bonus: 1, knockbackBonus: 0, healPerWord: 0, slashColor: 0xe9ecef,
    ultName: '太極守護陣', icon: './assets/icons/wood_sword_v3.png',
    desc: '銀白桃木劍光 · 絕招【太極守護陣】（凍結對手 8 秒＋護印）' },
  { id: 'qingfeng_sword', tier: 2, style: 'sword', effectName: '青鋒雙影', name: '中階・三尺青鋒劍',
    price: 150, bonus: 1.25, knockbackBonus: 5, healPerWord: 0, slashColor: 0x48cae4,
    ultName: '青蓮流雲陣', icon: './assets/icons/qingfeng_sword_v3.png',
    desc: '雙道青色弧形劍氣 · 銅錢收益＋25% · 擊退蓄力＋5%' },
  { id: 'flame_saber', tier: 2, style: 'saber', effectName: '赤炎烈焰斬', name: '中階・赤炎寶刀',
    price: 220, bonus: 1.35, knockbackBonus: 14, healPerWord: 0, slashColor: 0xff5a1f,
    ultName: '烈焰焚天斬', icon: './assets/icons/flame_saber_v4.png',
    desc: '專屬持刀立繪＆赤紅烈焰刀芒 · 銅錢＋35% · 強力擊退蓄力＋14% · 絕招【烈焰焚天斬】' },
  { id: 'xuantie_sword', tier: 3, style: 'sword', effectName: '玄鐵流雲', name: '高階・流雲玄鐵神劍',
    price: 360, bonus: 1.5, knockbackBonus: 8, healPerWord: 2, slashColor: 0xf59f00,
    ultName: '流雲萬劍訣', icon: './assets/icons/xuantie_sword_v3.png',
    desc: '三道金色流雲劍罡 · 銅錢收益＋50% · 每題回血＋2' },
  { id: 'thunder_spear', tier: 3, style: 'spear', effectName: '龍膽雷霆槍', name: '高階・龍膽亮銀槍',
    price: 420, bonus: 1.6, knockbackBonus: 12, healPerWord: 5, slashColor: 0x00d2ff,
    ultName: '雷霆破陣槍', icon: './assets/icons/thunder_spear_v4.png',
    desc: '專屬持槍立繪＆銀藍雷霆貫穿槍芒 · 銅錢＋60% · 每題回血＋5 · 絕招【雷霆破陣槍】' }
];

export const ADVENTURE_BRACERS = [
  { id: 'cloth_bracer', name: '粗布護腕', price: 0, icon: './assets/icons/bracer_leather_v4.png',
    missAtbPenalty: 8, comboProtectThreshold: 10, qiGain: 1, knockbackBonus: 0, comboGuard: 0,
    desc: '入門修煉護腕，10 連字以上享劍氣護體降階保護' },
  { id: 'leather_bracer', name: '流雲護腕', price: 120, icon: './assets/icons/bracer_leather_v4.png',
    missAtbPenalty: 4, comboProtectThreshold: 8, qiGain: 1, knockbackBonus: 2, comboGuard: 2,
    desc: '按錯鍵時對手蓄力懲罰減半（+4%），每字多退蓄力 +2%，8 連字以上即享降階保護' },
  { id: 'jade_bracer', name: '宗師文印護腕', price: 240, icon: './assets/icons/bracer_jade_v4.png',
    missAtbPenalty: 3, comboProtectThreshold: 6, qiGain: 2, knockbackBonus: 4, comboGuard: 5,
    desc: '每完成一題獲 2 點內力（3 題即可放絕招！），失誤多保留 5 連字，每字多退蓄力 +4%' }
];

export const ADVENTURE_ARMORS = [
  { id: 'linen_armor', name: '青竹布衣', price: 0, icon: './assets/icons/linen_outfit_v3.png',
    dmgTaken: 15, dmgReduce: 0, resist: [], startShield: 0,
    desc: '輕便修煉布衣，提供基礎防護' },
  { id: 'herbal_robe', name: '百草辟毒袍', price: 140, icon: './assets/icons/wanderer_outfit_v3.png',
    dmgTaken: 12, dmgReduce: 3, resist: ['poison'], startShield: 0,
    desc: '百草浸染俠客袍 · 完全免疫【☠️ 碧磷中毒】且敵人攻擊傷害減免 20%' },
  { id: 'scale_armor', name: '赤鱗宗師鎧', price: 280, icon: './assets/icons/grandmaster_outfit_v3.png',
    dmgTaken: 10, dmgReduce: 5, resist: ['poison', 'burn', 'freeze'], startShield: 1,
    desc: '宗師金鱗護甲 · 免疫【☠️毒／🔥火／❄️冰】異常狀態、減傷 33%，每關開場自帶 1 層護印' }
];

export const ADVENTURE_POTIONS = [
  { id: 'heal_potion', name: '九轉回春丹', price: 50, maxStack: 5, icon: './assets/icons/restoration_elixir_v3.png',
    desc: '氣血低於 45 時自動飲用（或按 Alt+2 手動飲用），立即回復 50 點氣血並淨化異常狀態' },
  { id: 'antidote_potion', name: '清心淨化散', price: 35, maxStack: 5, icon: './assets/icons/healing_powder_v3.png',
    desc: '受到【☠️中毒／🔥灼傷／❄️結冰】時自動消耗 1 份，立即解除狀態並回復 15 點氣血' }
];

export function stageHazard(stage) {
  if (!stage) return null;
  if (stage.chapter === 1 || (stage.chapter === 2 && stage.kind !== 'boss')) {
    return { type: 'poison', icon: '☠️', label: '碧磷毒功' };
  }
  if (stage.chapter === 3 || (stage.chapter === 2 && stage.kind === 'boss') || (stage.chapter === 5 && stage.kind === 'boss')) {
    return { type: 'burn', icon: '🔥', label: '烈陽火功' };
  }
  if (stage.chapter === 4 || (stage.chapter === 5 && stage.kind !== 'boss')) {
    return { type: 'freeze', icon: '❄️', label: '寒冰凍氣' };
  }
  return null;
}

export function newAdventure(legacy = {}) {
  return { version: 1, grade: '1', hero: legacy.heroId === 'su' ? 'su' : 'yun',
    coins: Number.isFinite(Number(legacy.coins)) ? Math.max(0, Number(legacy.coins)) : 80, weapon: legacy.equippedWeaponId || 'wood_sword',
    owned: [...new Set(['wood_sword', 'linen_armor', ...(legacy.ownedWeapons || [])])],
    bracer: null, armor: 'linen_armor', potions: { heal_potion: 1, antidote_potion: 1 },
    keyboard: true, profiles: {} };
}
export function getProfile(save) {
  const p = save.profiles[save.grade] ||= { stage: 0, realm: 'easy', records: {}, recent: [], weak: {}, session: null, daily: {} };
  p.records ||= {}; p.recent ||= []; p.weak ||= {}; p.daily ||= {};
  return p;
}
export function phaseFor(count) { return count < 3 ? '試探' : count < 7 ? '破防' : '決勝'; }
export function attackDuration(word, grade, realm, kind = 'duel') {
  const length = Array.from(word.text).length;
  const base = CONFIG.intervals[realm] ?? CONFIG.intervals.easy;
  const charStep = grade === 'english'
    ? (CONFIG.englishCharMs[realm] ?? 450)
    : (CONFIG.perCharMs[realm] ?? 1800) * (Number(grade) <= 2 ? 1.25 : 1);
  const kindFactor = CONFIG.kindMultipliers[kind] ?? 1;
  // 依境界顯著區分出招速度，長句與低年級按字數給予作答時間。
  return Math.round((base + length * charStep) * kindFactor);
}
export function awardStage(save, profile, stageId, stats, date) {
  if (stats.completedWords !== CONFIG.questions) throw new Error('必須實際完成十題才能通關。');
  profile.records ||= {}; profile.daily ||= {};
  const stage = ADVENTURE_STAGES[stageId];
  const first = !profile.records[stageId];
  const wObj = ADVENTURE_WEAPONS.find(w => w.id === save.weapon);
  const bonus = wObj ? wObj.bonus : (save.weapon === 'xuantie_sword' ? 1.5 : save.weapon === 'qingfeng_sword' ? 1.25 : 1);
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
export function buyGear(save, slot, item) {
  if (!item) return false;
  if (!save.owned.includes(item.id)) {
    if (save.coins < item.price) return false;
    save.coins -= item.price;
    save.owned.push(item.id);
  }
  save[slot] = item.id;
  return true;
}
export function buyPotion(save, potion) {
  if (!potion || save.coins < potion.price) return false;
  save.coins -= potion.price;
  save.potions = save.potions || { heal_potion: 0, antidote_potion: 0 };
  save.potions[potion.id] = (save.potions[potion.id] || 0) + 1;
  return true;
}
export function favorFresh(pool, recent, random = Math.random) {
  return [...pool].map(word => ({word, score: random() + (recent.includes(word.text) ? 2 : 0)}))
    .sort((a,b) => a.score - b.score).map(x => x.word);
}
