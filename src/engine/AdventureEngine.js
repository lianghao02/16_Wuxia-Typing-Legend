import { ADVENTURE_STAGES } from '../data/adventureWorld.js';
export const ADVENTURE_KEY = 'wuxia_adventure_v1';
export const CONFIG = {
  questions: 10,
  qiMax: 5,
  freezeMs: 8000,
  damage: 15,
  hp: 100,
  bossPoisonCap: 35,
  intervals: { easy: 6800, medium: 4500, hard: 2800 },
  perCharMs: { easy: 1400, medium: 950, hard: 600 },
  englishCharMs: { easy: 380, medium: 260, hard: 170 },
  kindMultipliers: { training: 1.2, journey: 1.15, event: 1.15, duel: 1, boss: 0.85 },
  graceMs: 700,
  knockbackAtb: 25
};

export const GRADE_DAMAGE_SCALE = {
  '1': 1.25,
  '2': 1.20,
  '3': 1.12,
  '4': 1.05,
  '5': 1.00,
  '6': 1.00,
  english: 1.08,
  all: 1.05
};

export const ADVENTURE_WEAPONS = [
  {
    id: 'wood_sword',
    rank: 1,
    tier: 1,
    style: 'sword',
    atk: 16,
    comboRate: 0.018,
    comboCap: 0.65,
    wordBurstMult: 1.0,
    armorPen: 0,
    effectName: '木劍單斬',
    name: '一階・桃木短劍',
    spriteWeaponId: 'wood_sword',
    price: 0,
    bonus: 1.0,
    knockbackBonus: 0,
    healPerWord: 0,
    slashColor: 0xe9ecef,
    ultName: '太極守護陣',
    icon: './assets/icons/wood_sword_v3.png',
    desc: '【第 1 階 · 攻擊力 16】劍系連擊型（每連字＋1.8%）· 絕招【太極守護陣】（重創＋凍結 8 秒＋護印）'
  },
  {
    id: 'qingfeng_sword',
    rank: 2,
    tier: 2,
    style: 'sword',
    atk: 20,
    comboRate: 0.02,
    comboCap: 0.70,
    wordBurstMult: 1.0,
    armorPen: 0,
    effectName: '青鋒雙影',
    name: '二階・三尺青鋒劍',
    spriteWeaponId: 'qingfeng_sword',
    price: 140,
    bonus: 1.2,
    knockbackBonus: 5,
    healPerWord: 0,
    slashColor: 0x48cae4,
    ultName: '青蓮流雲陣',
    icon: './assets/icons/qingfeng_sword_v3.png',
    desc: '【第 2 階 · 攻擊力 20】劍系連擊型（每連字＋2.0%）· 雙道青色劍氣 · 銅錢＋20% · 擊退蓄力＋5%'
  },
  {
    id: 'iron_spear',
    rank: 3,
    tier: 2,
    style: 'spear',
    atk: 24,
    comboRate: 0.014,
    comboCap: 0.50,
    wordBurstMult: 1.0,
    armorPen: 1.0,
    effectName: '破甲寒槍',
    name: '三階・百鍊破甲槍',
    spriteWeaponId: 'thunder_spear',
    price: 210,
    bonus: 1.3,
    knockbackBonus: 16,
    healPerWord: 1,
    slashColor: 0x90e0ef,
    ultName: '破軍穿雲刺',
    icon: './assets/icons/thunder_spear_v4.png',
    desc: '【第 3 階 · 攻擊力 24】槍系破防型（無視敵方護體減傷）· 擊退蓄力＋16% · 每題回血＋1 · 銅錢＋30%'
  },
  {
    id: 'flame_saber',
    rank: 4,
    tier: 2,
    style: 'saber',
    atk: 28,
    comboRate: 0.012,
    comboCap: 0.45,
    wordBurstMult: 1.28,
    armorPen: 0,
    effectName: '赤炎烈焰斬',
    name: '四階・赤炎寶刀',
    spriteWeaponId: 'flame_saber',
    price: 280,
    bonus: 1.4,
    knockbackBonus: 14,
    healPerWord: 1,
    slashColor: 0xff5a1f,
    ultName: '烈焰焚天斬',
    icon: './assets/icons/flame_saber_v4.png',
    desc: '【第 4 階 · 攻擊力 28】刀系爆發型（多字詞爆發傷害＋28%）· 擊退蓄力＋14% · 銅錢＋40%'
  },
  {
    id: 'xuantie_sword',
    rank: 5,
    tier: 3,
    style: 'sword',
    atk: 34,
    comboRate: 0.022,
    comboCap: 0.75,
    wordBurstMult: 1.05,
    armorPen: 0.3,
    effectName: '玄鐵流雲',
    name: '五階・流雲玄鐵神劍',
    spriteWeaponId: 'xuantie_sword',
    price: 360,
    bonus: 1.5,
    knockbackBonus: 10,
    healPerWord: 2,
    slashColor: 0xf59f00,
    ultName: '流雲萬劍訣',
    icon: './assets/icons/xuantie_sword_v3.png',
    desc: '【第 5 階 · 攻擊力 34】劍系宗師神兵（每連字＋2.2%，上限＋75%）· 每題回血＋2 · 銅錢＋50%'
  },
  {
    id: 'thunder_spear',
    rank: 6,
    tier: 3,
    style: 'spear',
    atk: 40,
    comboRate: 0.016,
    comboCap: 0.55,
    wordBurstMult: 1.08,
    armorPen: 1.0,
    effectName: '龍膽雷霆槍',
    name: '六階・龍膽亮銀槍',
    spriteWeaponId: 'thunder_spear',
    price: 440,
    bonus: 1.6,
    knockbackBonus: 20,
    healPerWord: 4,
    slashColor: 0x00d2ff,
    ultName: '雷霆破陣槍',
    icon: './assets/icons/thunder_spear_v4.png',
    desc: '【第 6 階 · 攻擊力 40】槍系傳說神兵（完全無視減傷＋擊退蓄力＋20%）· 每題回血＋4 · 銅錢＋60%'
  }
];

export const SPIRIT_BEASTS = [
  {
    id: 'beast_dog',
    rank: 1,
    tier: 1,
    style: 'beast',
    atk: 16,
    charBonusDmg: 0,
    comboRate: 0.018,
    comboCap: 0.65,
    wordBurstMult: 1.0,
    armorPen: 0,
    effectName: '疾風撲咬',
    name: '一階・追風靈犬',
    spriteKey: 'beast_dog',
    price: 0,
    bonus: 1.0,
    knockbackBonus: 4,
    healPerWord: 0,
    slashColor: 0xf4a261,
    ultName: '疾風連撲',
    icon: './assets/icons/beast_dog_icon_v5.png',
    desc: '【第 1 階 · 攻擊力 16】靈敏連擊型（每連字＋1.8%，對應一階桃木短劍）· 絕招【疾風連撲】'
  },
  {
    id: 'beast_eagle',
    rank: 2,
    tier: 2,
    style: 'beast',
    atk: 20,
    charBonusDmg: 0,
    comboRate: 0.02,
    comboCap: 0.70,
    wordBurstMult: 1.0,
    armorPen: 0,
    effectName: '穿雲俯衝',
    name: '二階・穿雲靈鷹',
    spriteKey: 'beast_eagle',
    price: 140,
    bonus: 1.2,
    knockbackBonus: 8,
    healPerWord: 0,
    slashColor: 0x2a9d8f,
    ultName: '九霄穿雲擊',
    icon: './assets/icons/beast_eagle_icon_v5.png',
    desc: '【第 2 階 · 攻擊力 20】疾速連擊型（每連字＋2.0%，對應二階青鋒劍）· 銅錢＋20% · 擊退蓄力＋8%'
  },
  {
    id: 'beast_toad',
    rank: 3,
    tier: 2,
    style: 'beast',
    atk: 24,
    charBonusDmg: 0,
    comboRate: 0.014,
    comboCap: 0.50,
    wordBurstMult: 0.82,
    armorPen: 1.0,
    poisonTurns: 3,
    poisonDirectShare: 0.18,
    bossPoisonCap: 35,
    enemySlowRatio: 0.15,
    effectName: '碧玉毒霧',
    name: '三階・碧玉毒蟾',
    spriteKey: 'beast_toad',
    price: 210,
    bonus: 1.3,
    knockbackBonus: 12,
    healPerWord: 1,
    slashColor: 0x52b788,
    ultName: '萬毒碧霧陣',
    icon: './assets/icons/beast_toad_icon_v5.png',
    desc: '【第 3 階 · 攻擊力 24】破防奇毒型（82% 直擊＋18% 碧玉毒傷，總傷對應三階破甲槍）· 每題回血＋1 · 銅錢＋30%'
  },
  {
    id: 'beast_wolf',
    rank: 4,
    tier: 2,
    style: 'beast',
    atk: 28,
    charBonusDmg: 0,
    comboRate: 0.012,
    comboCap: 0.45,
    wordBurstMult: 1.0,
    armorPen: 0,
    multiHitComboStep: 10,
    multiHitWordLen: 4,
    multiHitRatio: 0.28,
    effectName: '嘯月連爪',
    name: '四階・嘯月蒼狼',
    spriteKey: 'beast_wolf',
    price: 280,
    bonus: 1.4,
    knockbackBonus: 14,
    healPerWord: 1,
    slashColor: 0x48cae4,
    ultName: '蒼狼嘯月斬',
    icon: './assets/icons/beast_wolf_icon_v5.png',
    desc: '【第 4 階 · 攻擊力 28】連爪爆發型（滿 10 連擊或 4 字詞追加＋28% 二連爪，對應四階赤炎寶刀）· 銅錢＋40%'
  },
  {
    id: 'beast_flame_dog',
    rank: 5,
    tier: 3,
    style: 'beast',
    atk: 34,
    charBonusDmg: 0,
    comboRate: 0.022,
    comboCap: 0.75,
    wordBurstMult: 1.05,
    armorPen: 0.3,
    effectName: '赤焰猛撲',
    name: '五階・赤焰靈獒',
    spriteKey: 'beast_dog',
    price: 360,
    bonus: 1.5,
    knockbackBonus: 10,
    healPerWord: 2,
    slashColor: 0xf59f00,
    ultName: '烈焰天犬陣',
    icon: './assets/icons/beast_dog_icon_v5.png',
    desc: '【第 5 階 · 攻擊力 34】宗師護主靈獸（每連字＋2.2%，對應五階玄鐵神劍）· 每題回血＋2 · 銅錢＋50%'
  },
  {
    id: 'beast_sky_wolf',
    rank: 6,
    tier: 3,
    style: 'beast',
    atk: 40,
    charBonusDmg: 0,
    comboRate: 0.016,
    comboCap: 0.55,
    wordBurstMult: 1.08,
    armorPen: 1.0,
    effectName: '九霄雷爪',
    name: '六階・九霄天狼',
    spriteKey: 'beast_wolf',
    price: 440,
    bonus: 1.6,
    knockbackBonus: 20,
    healPerWord: 4,
    slashColor: 0x00d2ff,
    ultName: '九霄天狼破',
    icon: './assets/icons/beast_wolf_icon_v5.png',
    desc: '【第 6 階 · 攻擊力 40】傳說破防神獸（完全無視減傷＋擊退蓄力＋20%，對應六階龍膽亮銀槍）· 每題回血＋4 · 銅錢＋60%'
  }
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

export const DAILY_QUEST_DEFS = [
  { id: 'q_stage', title: '勤學初試', desc: '今日完成 1 場關卡', field: 'stages', target: 1, reward: 25 },
  { id: 'q_words', title: '劍氣連綿', desc: '今日累計打完 15 題', field: 'words', target: 15, reward: 35 },
  { id: 'q_perfect', title: '行雲流水', desc: '今日達成 5 次零失誤破題', field: 'perfects', target: 5, reward: 40 }
];

export const BEAST_BOND_TITLES = {
  1: '初識靈伴',
  2: '同行夥伴',
  3: '默契靈獸',
  4: '生死相隨',
  5: '護主神獸'
};

export function getBeastBond(save, beastId = save?.beast || 'beast_dog') {
  const map = save?.beastBonds || {};
  const entry = map[beastId] || { level: 1, exp: 0 };
  const level = Math.min(5, Math.max(1, Number(entry.level) || 1));
  const exp = Math.max(0, Number(entry.exp) || 0);
  const nextExp = level >= 5 ? 0 : level * 50;
  const atkBonusFlat = Math.max(0, level - 1);
  const atkBonusRatio = Number(((level - 1) * 0.02).toFixed(2));
  const mult = Number((1 + atkBonusRatio).toFixed(2));
  return {
    beastId,
    level,
    exp,
    nextExp,
    title: BEAST_BOND_TITLES[level] || '初識靈伴',
    atkBonusFlat,
    atkBonusRatio,
    mult
  };
}

export function addBeastBondExp(save, beastId = save?.beast || 'beast_dog', expGain = 12) {
  if (!save || !beastId) return { leveledUp: false, level: 1, title: BEAST_BOND_TITLES[1] };
  save.beastBonds ||= {};
  const cur = getBeastBond(save, beastId);
  if (cur.level >= 5) {
    save.beastBonds[beastId] = { level: 5, exp: 0 };
    return { leveledUp: false, level: 5, title: BEAST_BOND_TITLES[5] };
  }
  let level = cur.level;
  let exp = cur.exp + Math.max(0, Number(expGain) || 0);
  let leveledUp = false;
  while (level < 5 && exp >= level * 50) {
    exp -= level * 50;
    level++;
    leveledUp = true;
  }
  if (level >= 5) exp = 0;
  save.beastBonds[beastId] = { level, exp };
  return { leveledUp, level, exp, title: BEAST_BOND_TITLES[level] };
}

export function feedSpiritBeast(save, beastId = save?.beast || 'beast_dog', cost = 60) {
  if (!save || !beastId) return { ok: false };
  const cur = getBeastBond(save, beastId);
  if (cur.level >= 5 || (save.coins || 0) < cost) return { ok: false, bond: cur };
  save.coins -= cost;
  addBeastBondExp(save, beastId, cur.level * 50);
  return { ok: true, bond: getBeastBond(save, beastId) };
}

export function getSealForStats(stats = {}) {
  const acc = Number(stats.accuracy) ?? 100;
  const combo = Number(stats.maxCombo) ?? 0;
  if (acc >= 95 && combo >= 10) return '神乎其技';
  if (acc >= 85) return '爐火純青';
  return '勤學苦練';
}

const SEAL_RANK = { 勤學苦練: 1, 爐火純青: 2, 神乎其技: 3 };

export function pickBetterSeal(prevSeal, nextSeal) {
  if (!prevSeal) return nextSeal || '勤學苦練';
  return (SEAL_RANK[nextSeal] || 0) >= (SEAL_RANK[prevSeal] || 0) ? nextSeal : prevSeal;
}

function isNextCalendarDay(prevDateStr, curDateStr) {
  if (!prevDateStr || !curDateStr || prevDateStr === curDateStr) return false;
  const p = prevDateStr.split('-').map(Number);
  const c = curDateStr.split('-').map(Number);
  if (p.length !== 3 || c.length !== 3) return false;
  const d1 = Date.UTC(p[0], p[1] - 1, p[2]);
  const d2 = Date.UTC(c[0], c[1] - 1, c[2]);
  return Math.round((d2 - d1) / 86400000) === 1;
}

export function ensureDailyState(save, dateStr) {
  save.streak ||= { count: 0, lastDate: '' };
  save.dailyQuests ||= { date: dateStr || '', progress: { stages: 0, words: 0, perfects: 0 }, claimed: {} };
  if (dateStr && save.dailyQuests.date !== dateStr) {
    save.dailyQuests = {
      date: dateStr,
      progress: { stages: 0, words: 0, perfects: 0 },
      claimed: {}
    };
  }
  return save.dailyQuests;
}

export function recordDailyProgress(save, dateStr, opts = {}) {
  if (!save) return [];
  const dq = ensureDailyState(save, dateStr);
  if (dateStr && save.streak.lastDate !== dateStr) {
    if (isNextCalendarDay(save.streak.lastDate, dateStr)) {
      save.streak.count = (save.streak.count || 0) + 1;
    } else {
      save.streak.count = 1;
    }
    save.streak.lastDate = dateStr;
  } else if (!save.streak.count) {
    save.streak.count = 1;
    save.streak.lastDate = dateStr || 'today';
  }
  const sDelta = opts.stagesDelta ?? opts.stages ?? 0;
  const wDelta = opts.wordsDelta ?? opts.words ?? 0;
  const pDelta = opts.perfectsDelta ?? opts.perfectWords ?? 0;
  dq.progress.stages = (dq.progress.stages || 0) + Math.max(0, Number(sDelta) || 0);
  dq.progress.words = (dq.progress.words || 0) + Math.max(0, Number(wDelta) || 0);
  dq.progress.perfects = (dq.progress.perfects || 0) + Math.max(0, Number(pDelta) || 0);
  const newlyClaimed = [];
  for (const def of DAILY_QUEST_DEFS) {
    if (!dq.claimed[def.id] && (dq.progress[def.field] || 0) >= def.target) {
      dq.claimed[def.id] = true;
      save.coins = (save.coins || 0) + def.reward;
      newlyClaimed.push(def);
    }
  }
  return newlyClaimed;
}

export function newAdventure(legacy = {}) {
  const rawHero = legacy.hero || legacy.heroId;
  const hero = ['yun', 'su', 'mu'].includes(rawHero) ? rawHero : 'yun';
  const muted = Boolean(legacy.muted ?? legacy.audioSettings?.muted ?? false);
  const speech = legacy.speech !== undefined ? Boolean(legacy.speech) : (legacy.audioSettings?.speech ?? true);
  const bgm = legacy.bgm !== undefined ? Boolean(legacy.bgm) : (legacy.audioSettings?.bgm ?? true);
  const sfx = legacy.sfx !== undefined ? Boolean(legacy.sfx) : (legacy.audioSettings?.sfx ?? true);
  return {
    version: 1,
    schemaVersion: 2,
    grade: legacy.grade || '1',
    hero,
    coins: Number.isFinite(Number(legacy.coins)) ? Math.max(0, Number(legacy.coins)) : 80,
    weapon: legacy.weapon || legacy.equippedWeaponId || 'wood_sword',
    beast: legacy.beast || legacy.equippedBeastId || 'beast_dog',
    owned: [...new Set(['wood_sword', 'linen_armor', ...(legacy.owned || legacy.ownedWeapons || [])])],
    ownedBeasts: [...new Set(['beast_dog', ...(legacy.ownedBeasts || [])])],
    beastBonds: legacy.beastBonds && typeof legacy.beastBonds === 'object'
      ? { ...legacy.beastBonds }
      : { beast_dog: { level: 1, exp: 0 }, beast_eagle: { level: 1, exp: 0 }, beast_toad: { level: 1, exp: 0 }, beast_wolf: { level: 1, exp: 0 }, beast_flame_dog: { level: 1, exp: 0 }, beast_sky_wolf: { level: 1, exp: 0 } },
    bracer: legacy.bracer || null,
    armor: legacy.armor || 'linen_armor',
    potions: legacy.potions ? { ...legacy.potions } : { heal_potion: 1, antidote_potion: 1 },
    customRaw: legacy.customRaw || legacy.customVocabularyRaw || '小橋, 流水, 行俠仗義, 自強不息, 見義勇為, 一氣呵成',
    streak: legacy.streak && typeof legacy.streak === 'object' ? { ...legacy.streak } : { count: 0, lastDate: '' },
    dailyQuests: legacy.dailyQuests && typeof legacy.dailyQuests === 'object'
      ? { ...legacy.dailyQuests }
      : { date: '', progress: { stages: 0, words: 0, perfects: 0 }, claimed: {} },
    keyboard: legacy.keyboard !== false,
    muted,
    speech,
    bgm,
    sfx,
    audioSettings: { bgm, sfx, speech, muted },
    profiles: legacy.profiles && typeof legacy.profiles === 'object' ? legacy.profiles : {}
  };
}

export function migrateAdventureSave(raw) {
  if (!raw || typeof raw !== 'object') return newAdventure();
  const base = newAdventure(raw);
  if (base.weapon === 'dragon_saber') {
    base.weapon = 'thunder_spear';
    if (!base.owned.includes('thunder_spear')) base.owned.push('thunder_spear');
  }
  for (const id of ['wood_sword', 'cloth_bracer', 'linen_armor']) {
    if (!base.owned.includes(id)) base.owned.push(id);
  }
  if (!base.ownedBeasts.includes('beast_dog')) base.ownedBeasts.push('beast_dog');
  base.bracer ||= 'cloth_bracer';
  base.armor ||= 'linen_armor';
  base.beast ||= 'beast_dog';
  base.potions ||= { heal_potion: 1, antidote_potion: 1 };
  base.customRaw ||= '小橋, 流水, 行俠仗義, 自強不息, 見義勇為, 一氣呵成';
  base.beastBonds ||= { beast_dog: { level: 1, exp: 0 }, beast_eagle: { level: 1, exp: 0 }, beast_toad: { level: 1, exp: 0 }, beast_wolf: { level: 1, exp: 0 }, beast_flame_dog: { level: 1, exp: 0 }, beast_sky_wolf: { level: 1, exp: 0 } };
  base.streak ||= { count: 0, lastDate: '' };
  base.dailyQuests ||= { date: '', progress: { stages: 0, words: 0, perfects: 0 }, claimed: {} };
  if (base.profiles && typeof base.profiles === 'object') {
    for (const [gradeKey, prof] of Object.entries(base.profiles)) {
      if (!prof || typeof prof !== 'object') continue;
      prof.records ||= {};
      prof.recent ||= [];
      prof.recentZh ||= gradeKey === 'english' ? [] : [...prof.recent];
      prof.recentEn ||= gradeKey === 'english' ? [...prof.recent] : [];
      prof.practiced ||= {};
      prof.weak ||= {};
      prof.weakSymbols ||= {};
      prof.daily ||= {};
    }
  }
  return base;
}

export function getProfile(save) {
  const p = save.profiles[save.grade] ||= {
    stage: 0,
    realm: 'easy',
    records: {},
    recent: [],
    recentZh: [],
    recentEn: [],
    practiced: {},
    weak: {},
    weakSymbols: {},
    session: null,
    daily: {}
  };
  p.records ||= {};
  p.recent ||= [];
  p.recentZh ||= save.grade === 'english' ? [] : [...p.recent];
  p.recentEn ||= save.grade === 'english' ? [...p.recent] : [];
  p.practiced ||= {};
  p.weak ||= {};
  p.weakSymbols ||= {};
  p.daily ||= {};
  return p;
}

export function getActiveLoadout(save) {
  if (save?.hero === 'mu') {
    const beast = SPIRIT_BEASTS.find(b => b.id === save.beast) || SPIRIT_BEASTS[0];
    const bond = getBeastBond(save, beast.id);
    return {
      ...beast,
      baseAtk: beast.atk,
      atk: beast.atk + (bond.atkBonusFlat || 0),
      bondLevel: bond.level,
      bondTitle: bond.title
    };
  }
  return ADVENTURE_WEAPONS.find(w => w.id === save?.weapon) || ADVENTURE_WEAPONS[0];
}

/**
 * 依據 Boss 剩餘氣血比例判定三階段（試探 100%~70% -> 破防 70%~30% -> 決勝 <=30%）
 */
export function bossPhaseForHp(enemyHp, enemyMaxHp = 100) {
  const max = Math.max(1, Number(enemyMaxHp) || 100);
  const cur = Math.max(0, Number(enemyHp) ?? max);
  const ratio = cur / max;
  if (ratio > 0.70) {
    return { index: 0, name: '試探', ratio, speedMult: 1.15, speedMultiplier: 1.15, defenseBonus: 0.00 };
  }
  if (ratio > 0.30) {
    return { index: 1, name: '破防', ratio, speedMult: 1.00, speedMultiplier: 1.00, defenseBonus: 0.10 };
  }
  return { index: 2, name: '決勝', ratio, speedMult: 0.85, speedMultiplier: 0.85, defenseBonus: 0.15 };
}

/**
 * 支援單次大招跨階段直接跳轉至最終階段，不強迫逐段重播中間階段
 */
export function advanceBossPhase(previousPhaseIndex = 0, enemyHp = 100, enemyMaxHp = 100) {
  const target = bossPhaseForHp(enemyHp, enemyMaxHp);
  const prev = Number(previousPhaseIndex) || 0;
  const nextIndex = Math.max(prev, target.index);
  const names = ['試探', '破防', '決勝'];
  const phaseName = names[nextIndex] || '決勝';
  const changed = nextIndex > prev;
  return {
    index: nextIndex,
    phaseIndex: nextIndex,
    name: phaseName,
    phaseName,
    changed,
    transitioned: changed,
    skippedIntermediate: nextIndex - prev > 1
  };
}

/**
 * 相容舊呼叫 phaseFor(cursor) 與新呼叫 phaseFor(enemyHp, enemyMaxHp)
 */
export function phaseFor(countOrHp, enemyMaxHp = null) {
  if (Number.isFinite(enemyMaxHp) && enemyMaxHp > 0) {
    return bossPhaseForHp(countOrHp, enemyMaxHp).name;
  }
  return countOrHp < 3 ? '試探' : countOrHp < 7 ? '破防' : '決勝';
}

/**
 * 統一可追蹤 RPG 傷害計算管線
 * 正確輸入 -> 基本傷害 -> 武器／靈獸能力 -> Combo 加成 -> 屬性／技能加成 -> 敵方減傷 -> 最終傷害
 */
export function calculateAttackDamage({
  actionType,
  triggerType = 'word',
  wordObj = null,
  charObj = null,
  wordText = '',
  charIndexInWord = 0,
  isEnglish = false,
  combo = 0,
  grade = '1',
  loadout = ADVENTURE_WEAPONS[0],
  bracer = ADVENTURE_BRACERS[0],
  stage = null,
  enemyHp = 100,
  enemyMaxHp = 100,
  enemyPoisonTurns = 0,
  enemyPoisoned = false,
  isParryBreak = false,
  isPerfectWord = false
} = {}) {
  const mode = actionType || triggerType || 'word';
  const resolvedText = wordObj?.text ?? wordText ?? charObj?.char ?? '';
  const resolvedEn = isEnglish || String(grade) === 'english';
  const item = loadout || ADVENTURE_WEAPONS[0];
  const atk = Number(item.atk) || 16;
  const gradeScale = GRADE_DAMAGE_SCALE[String(grade)] || 1.0;

  if (mode === 'key') {
    return {
      finalDamage: 0,
      totalDamage: 0,
      atbBreak: 1.5,
      knockbackAtb: 1.5,
      applyPoison: false,
      poisonTriggered: false,
      poisonDamage: 0,
      isCrit: false,
      isMultiHit: false,
      multiHitCount: 1,
      multiHitDamage: 0,
      lengthBonus: 1,
      lengthMultiplier: 1,
      comboMultiplier: 1,
      schoolBonus: 1,
      defenseFactor: 1,
      breakdown: { base: 0, weaponBonus: 0, comboBonus: 0, schoolBonus: 0, beastBonus: 0, defenseReduced: 0, final: 0 }
    };
  }

  // Boss 階段額外減傷與基礎防禦
  const baseDef = Number(stage?.enemy?.defense) || 0;
  const bossPhase = stage?.kind === 'boss' ? bossPhaseForHp(enemyHp, enemyMaxHp) : null;
  const rawDef = Math.min(0.45, baseDef + (bossPhase?.defenseBonus || 0));
  const armorPen = Math.min(1, Math.max(0, Number(item.armorPen) || 0));
  const effectiveDef = rawDef * (1 - armorPen);
  const defenseFactor = Number((1 - effectiveDef).toFixed(3));

  // Combo 增傷倍率（依流派有不同成長率與上限）
  const comboRate = Number(item.comboRate) || 0.012;
  const comboCap = Number(item.comboCap) || 0.45;
  const comboMult = Number((1 + Math.min(comboCap, Math.max(0, combo) * comboRate)).toFixed(3));

  if (mode === 'char') {
    // 單字完成：主要用於聚氣與擊退敵方蓄力，實際氣血傷害統一於整題完成時結算
    const diminish = 1 / Math.sqrt(Math.max(1, charIndexInWord + 1));
    const base = (4 + atk * 0.24) * diminish;
    const preDef = base * comboMult * gradeScale;
    const totalDamage = Math.max(1, Math.round(preDef * (1 - effectiveDef)));
    const knockbackAtb = 18 + (bracer?.knockbackBonus || 0) + (item.id === 'beast_dog' ? 4 : 0);
    return {
      finalDamage: totalDamage,
      totalDamage,
      atbBreak: knockbackAtb,
      knockbackAtb,
      applyPoison: false,
      poisonTriggered: false,
      poisonDamage: 0,
      isCrit: combo >= 10,
      isMultiHit: false,
      multiHitCount: 1,
      multiHitDamage: 0,
      lengthBonus: 1,
      lengthMultiplier: 1,
      comboMultiplier: comboMult,
      schoolBonus: 1,
      defenseFactor,
      breakdown: {
        base: Math.round(base),
        weaponBonus: Math.round(atk * 0.24 * diminish),
        comboBonus: Math.round((preDef - base * gradeScale)),
        schoolBonus: 0,
        beastBonus: 0,
        defenseReduced: Math.max(0, Math.round(preDef - totalDamage)),
        final: totalDamage
      }
    };
  }

  if (mode === 'ult' || mode === 'ultimate') {
    const ultMult = (item.style === 'saber' || item.id === 'beast_wolf') ? 1.28 : 1.18;
    const base = (42 + atk * 1.95) * ultMult * gradeScale;
    const totalDamage = Math.max(15, Math.round(base * (1 - effectiveDef * 0.5)));
    const knockbackAtb = item.style === 'spear' || item.id === 'beast_eagle' || item.id === 'beast_sky_wolf' ? 65 : 100;
    const isMultiHit = item.id === 'beast_wolf' || item.id === 'beast_sky_wolf' || item.style === 'sword';
    return {
      finalDamage: totalDamage,
      totalDamage,
      atbBreak: knockbackAtb,
      knockbackAtb,
      applyPoison: item.id === 'beast_toad',
      poisonTriggered: item.id === 'beast_toad',
      poisonTurns: item.id === 'beast_toad' ? 4 : 0,
      poisonDamage: 0,
      isCrit: true,
      isMultiHit,
      multiHitCount: isMultiHit ? 3 : 1,
      multiHitDamage: 0,
      lengthBonus: 1,
      lengthMultiplier: 1,
      comboMultiplier: comboMult,
      schoolBonus: ultMult,
      defenseFactor,
      breakdown: {
        base: Math.round(base),
        weaponBonus: Math.round(atk * 1.95),
        comboBonus: 0,
        schoolBonus: Math.round(base * (ultMult - 1)),
        beastBonus: 0,
        defenseReduced: Math.max(0, Math.round(base - totalDamage)),
        final: totalDamage
      }
    };
  }

  // mode === 'word'（完成整個單字／詞語／成語／長句，統一結算總傷害）
  // 確保同階層武器與靈獸具備完全對稱的基礎傷害底數（移除早期額外疊加的 charBonusTotal）
  const rawLen = Math.max(1, Array.from(String(resolvedText || '')).length);
  const effectiveChars = resolvedEn ? Math.max(1, rawLen / 3.5) : rawLen;
  // 開根號飽和長度曲線（上限 2.50x）
  const lengthMultiplier = Math.min(2.50, 1.0 + 0.45 * Math.sqrt(Math.max(0, effectiveChars - 1)));
  const baseWord = (18 + atk * 0.85) * lengthMultiplier;

  // 流派係數：刀系詞語爆發 1.28x；毒蟾直擊佔 0.82x（另 0.18x 由毒傷補齊，使總傷與同階破甲槍一致）
  const schoolMult = item.id === 'beast_toad'
    ? (item.wordBurstMult || 0.82)
    : (effectiveChars >= 2 && item.wordBurstMult ? item.wordBurstMult : 1.0);
  // 看破破綻（敵人蓄力 >=75% 危急瞬間完成整題 -> 1.35x）與行雲流水（多字詞零失誤 -> 1.15x）
  const parryMult = isParryBreak ? 1.35 : 1.0;
  const perfectMult = isPerfectWord && rawLen >= 2 ? 1.15 : 1.0;
  const preCombo = baseWord * schoolMult * parryMult * perfectMult;
  const withCombo = preCombo * comboMult * gradeScale;
  const primaryDamage = Math.max(1, Math.round(withCombo * (1 - effectiveDef)));

  // 四階蒼狼多段連爪加成（滿 10 連擊或 4 字以上題目追加 +28% 二連爪，與四階赤炎寶刀 +28% 詞語爆發精準對齊）
  let isMultiHit = false;
  let multiHitDamage = 0;
  if (item.id === 'beast_wolf' && ((combo >= (item.multiHitComboStep || 10)) || effectiveChars >= (item.multiHitWordLen || 4))) {
    isMultiHit = true;
    multiHitDamage = Math.max(1, Math.round(primaryDamage * (item.multiHitRatio || 0.28)));
  }

  // 三階毒蟾持續毒傷結算（82% 直擊 + 18% 碧玉毒傷 = 100% 同階武器總傷害，對 Boss 單跳上限 35 點）
  let poisonDamage = 0;
  const activePoisonTurns = item.id === 'beast_toad' ? Math.max(enemyPoisonTurns, item.poisonTurns || 3) : (enemyPoisoned ? Math.max(1, enemyPoisonTurns) : enemyPoisonTurns);
  if (activePoisonTurns > 0) {
    const fullEquivalent = Math.round(baseWord * parryMult * perfectMult * comboMult * gradeScale * (1 - effectiveDef));
    const rawPoison = item.poisonDirectShare
      ? Math.max(2, fullEquivalent - primaryDamage)
      : Math.round(enemyMaxHp * (item.poisonMaxHpRatio || 0.03));
    const cap = stage?.kind === 'boss' ? (item.bossPoisonCap || CONFIG.bossPoisonCap || 35) : 999;
    poisonDamage = Math.max(2, Math.min(cap, rawPoison));
  }

  const totalDamage = primaryDamage + multiHitDamage + poisonDamage;
  const knockbackAtb = isParryBreak ? 100 : (CONFIG.knockbackAtb + 15 + (item.knockbackBonus || 0) + (bracer?.knockbackBonus || 0) * 2);
  const lenFixed = Number(lengthMultiplier.toFixed(2));

  return {
    finalDamage: totalDamage,
    totalDamage,
    primaryDamage,
    atbBreak: knockbackAtb,
    knockbackAtb,
    isParryBreak: Boolean(isParryBreak),
    isPerfectWord: Boolean(isPerfectWord && rawLen >= 2),
    applyPoison: item.id === 'beast_toad',
    poisonTriggered: item.id === 'beast_toad',
    poisonTurns: item.id === 'beast_toad' ? (item.poisonTurns || 3) : Math.max(0, activePoisonTurns - 1),
    poisonDamage,
    isCrit: combo >= 10 || isMultiHit || Boolean(isParryBreak),
    isMultiHit,
    multiHitCount: isMultiHit ? 3 : 1,
    multiHitDamage,
    lengthBonus: lenFixed,
    lengthMultiplier: lenFixed,
    comboMultiplier: comboMult,
    schoolBonus: schoolMult,
    defenseFactor,
    breakdown: {
      base: Math.round(baseWord),
      weaponBonus: Math.round(atk * 0.72 * lengthMultiplier),
      comboBonus: Math.round(preCombo * (comboMult - 1) * gradeScale),
      schoolBonus: Math.round(baseWord * (schoolMult - 1)),
      beastBonus: multiHitDamage + poisonDamage,
      defenseReduced: Math.max(0, Math.round(withCombo - primaryDamage)),
      final: totalDamage
    }
  };
}

export function attackDuration(word, grade, realm, kind = 'duel') {
  const length = Array.from(word?.text || '').length || 1;
  const base = CONFIG.intervals[realm] ?? CONFIG.intervals.easy;
  const charStep = grade === 'english'
    ? (CONFIG.englishCharMs[realm] ?? 450)
    : (CONFIG.perCharMs[realm] ?? 1800) * (Number(grade) <= 2 ? 1.25 : 1);
  const kindFactor = CONFIG.kindMultipliers[kind] ?? 1;
  // 依境界顯著區分出招速度，長句與低年級按字數給予作答時間。
  return Math.round((base + length * charStep) * kindFactor);
}

export function awardStage(save, profile, stageId, stats, date) {
  const stage = ADVENTURE_STAGES[stageId];
  const isCombat = Boolean(stage?.isCombat);
  const defeatedByHp = stats?.enemyDefeated === true || (typeof stats?.enemyHp === 'number' && stats.enemyHp <= 0);
  const completedTen = (stats?.completedWords ?? 0) >= CONFIG.questions;

  if (isCombat) {
    if (!defeatedByHp && !completedTen) {
      throw new Error('必須擊敗對手或完成十題才能通關。');
    }
  } else if (!completedTen) {
    throw new Error('必須實際完成十題才能通關。');
  }

  profile.records ||= {};
  profile.daily ||= {};
  const first = !profile.records[stageId];
  const prevRec = profile.records[stageId] || {};
  const seal = pickBetterSeal(prevRec.seal, getSealForStats(stats));
  const loadout = getActiveLoadout(save);
  const bonus = loadout ? loadout.bonus : (save.weapon === 'xuantie_sword' ? 1.5 : save.weapon === 'qingfeng_sword' ? 1.25 : 1);
  const reward = Math.round(stage.reward * bonus);
  save.coins += reward;
  profile.records[stageId] = {
    accuracy: Math.max(Number(prevRec.accuracy) || 0, Number(stats.accuracy) || 0),
    chars: stats.completedChars,
    words: stats.completedWords,
    realm: stats.realm || profile.realm,
    seal
  };
  if (first) profile.stage = Math.max(profile.stage, Math.min(ADVENTURE_STAGES.length, stageId + 1));
  profile.session = null;
  const dailyBonus = !profile.daily[date] ? 20 : 0;
  profile.daily[date] = true;
  save.coins += dailyBonus;
  return { reward, dailyBonus, first, seal, ending: stageId === ADVENTURE_STAGES.length - 1 && profile.stage === ADVENTURE_STAGES.length };
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

export function buyBeast(save, beast) {
  if (!beast) return false;
  save.ownedBeasts ||= ['beast_dog'];
  if (!save.ownedBeasts.includes(beast.id)) {
    if (save.coins < beast.price) return false;
    save.coins -= beast.price;
    save.ownedBeasts.push(beast.id);
  }
  save.beast = beast.id;
  return true;
}

export function buyGear(save, slot, item) {
  if (!item) return false;
  if (slot === 'beast') return buyBeast(save, item);
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
  const maxStack = potion.maxStack || 5;
  save.potions = save.potions || { heal_potion: 0, antidote_potion: 0 };
  if ((save.potions[potion.id] || 0) >= maxStack) return false;
  save.coins -= potion.price;
  save.potions[potion.id] = (save.potions[potion.id] || 0) + 1;
  return true;
}

export function favorFresh(pool, recent, random = Math.random) {
  return [...pool]
    .map(word => ({ word, score: random() + (recent.includes(word.text) ? 2 : 0) }))
    .sort((a, b) => a.score - b.score)
    .map(x => x.word);
}
