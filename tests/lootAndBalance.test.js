import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVENTURE_WEAPONS,
  SPIRIT_BEASTS,
  ADVENTURE_ARMORS,
  ADVENTURE_BRACERS,
  newAdventure,
  getProfile,
  getActiveLoadout,
  buyGear,
  awardStage,
  rollCombatInstantDrop,
  rollSettlementSpoils,
  getBossWeaponDropRate,
  rollBossEnchantedWeapon,
  advanceComboReward,
  recordQuestionResult
} from '../src/engine/AdventureEngine.js';

test('1. 客棧裝備進度鎖（Progression Lock）：無法跨關卡階梯提前購買高階神兵與防具', () => {
  const save = newAdventure({ coins: 9999 });
  const profile = getProfile(save);
  profile.stage = 1; // 剛通過第 1 關，目前在第 2 關

  const woodSword = ADVENTURE_WEAPONS.find(w => w.id === 'wood_sword');
  const qingfengSword = ADVENTURE_WEAPONS.find(w => w.id === 'qingfeng_sword'); // requiredStage: 3
  const thunderSpear = ADVENTURE_WEAPONS.find(w => w.id === 'thunder_spear'); // requiredStage: 24
  const scaleArmor = ADVENTURE_ARMORS.find(a => a.id === 'scale_armor'); // requiredStage: 15

  // 初階裝備 0 關即可購買
  assert.equal(woodSword.requiredStage, 0);

  // 尚未通過第 3 關前，拒絕購買二階三尺青鋒劍
  assert.equal(buyGear(save, 'weapon', qingfengSword, profile), false);
  assert.notEqual(save.weapon, 'qingfeng_sword');

  // 通過第 3 關後（profile.stage >= 3），成功購買二階三尺青鋒劍
  profile.stage = 3;
  assert.equal(buyGear(save, 'weapon', qingfengSword, profile), true);
  assert.equal(save.weapon, 'qingfeng_sword');

  // 未通關第 24 關前，即使腰纏萬貫也無法購買六階龍膽亮銀槍
  assert.equal(buyGear(save, 'weapon', thunderSpear, profile), false);

  // 未通關第 15 關前，無法購買赤鱗宗師鎧
  assert.equal(buyGear(save, 'armor', scaleArmor, profile), false);

  // 馴獸師靈獸同樣具備嚴格對稱進度鎖
  const skyWolf = SPIRIT_BEASTS.find(b => b.id === 'beast_sky_wolf');
  assert.equal(skyWolf.requiredStage, 24);
  assert.equal(buyGear(save, 'beast', skyWolf, profile), false);
});

test('2. 重複刷關收益遞減（Diminishing Returns）：首次 100% 獎勵 vs 重遊 40% 收益', () => {
  const save = newAdventure({ coins: 0 });
  const profile = getProfile(save);

  // 首次通關第 1 關（stageId: 0，基本獎勵 30 銅錢 + 每日首勝 20 銅錢 = 50 銅錢）
  const stats = { completedWords: 10, completedChars: 20, accuracy: 100, enemyHp: 0 };
  const firstClear = awardStage(save, profile, 0, stats, '2026-10-16');
  assert.equal(firstClear.first, true);
  assert.equal(firstClear.repeatFactor, 1.0);
  assert.equal(firstClear.reward, 30);
  assert.equal(save.coins, 50);

  // 再次通關第 1 關（重複重遊，無每日首勝，獎勵按 40% 遞減）
  const replayCoinsBefore = save.coins;
  const replayClear = awardStage(save, profile, 0, stats, '2026-10-16');
  assert.equal(replayClear.first, false);
  assert.equal(replayClear.repeatFactor, 0.40);
  assert.equal(replayClear.reward, Math.round(30 * 0.40)); // 12 銅錢
  assert.equal(save.coins, replayCoinsBefore + 12);
});

test('3. A 方案戰中即時掉落（Combat Instant Drops）：止血草與定心符即時吸收', () => {
  // 模擬必定觸發掉落
  const dropParry = rollCombatInstantDrop({ isParryBreak: true, random: () => 0.05 });
  assert.ok(dropParry);
  assert.ok(['herb_heal', 'serenity_rune'].includes(dropParry.id));
  if (dropParry.id === 'herb_heal') {
    assert.equal(dropParry.value, 20);
    assert.equal(dropParry.type, 'heal');
  } else {
    assert.equal(dropParry.value, 1);
    assert.equal(dropParry.type, 'shield');
  }

  // 隨機數高於閾值時不掉落
  const noDrop = rollCombatInstantDrop({ random: () => 0.99 });
  assert.equal(noDrop, null);
});

test('4. B 方案通關戰利品搜刮折現（Settlement Spoils）：隨機掉落雜物自動換錢', () => {
  // 一般關卡產出 1~2 件物品
  const normalSpoils = rollSettlementSpoils(0, false, () => 0.5);
  assert.ok(normalSpoils.items.length >= 1);
  assert.ok(normalSpoils.totalCoins > 0);

  // 首領關必定產出 2 件戰利品，且有機會包含高額美玉
  const bossSpoils = rollSettlementSpoils(4, true, () => 0.9);
  assert.equal(bossSpoils.items.length, 2);
  assert.ok(bossSpoils.totalCoins >= 30);
});

test('5. C 方案每五關首領戰附魔神兵掉落率（20%）與屬性生成', () => {
  // 每五關首領關卡（第 5、10、15、20 關等）掉落率為 20%
  assert.equal(getBossWeaponDropRate(4), 0.20);
  assert.equal(getBossWeaponDropRate(9), 0.20);
  assert.equal(getBossWeaponDropRate(14), 0.20);
  assert.equal(getBossWeaponDropRate(19), 0.20);

  // 一般關卡（如第 1 關 stageId: 0）掉落率為 0%
  assert.equal(getBossWeaponDropRate(0), 0);
  assert.equal(getBossWeaponDropRate(2), 0);

  // 驗證劍客/刀客附魔神兵生成品質
  const enchantedSword = rollBossEnchantedWeapon(4, 'yun', () => 0.1);
  assert.ok(enchantedSword.isEnchanted);
  assert.ok(['thunder', 'flame', 'freeze'].includes(enchantedSword.element));
  assert.ok(enchantedSword.name.startsWith('⚡') || enchantedSword.name.startsWith('🔥') || enchantedSword.name.startsWith('❄️'));
  assert.ok(enchantedSword.atk > 20); // 附魔攻擊力大幅高於初階
  assert.ok(enchantedSword.sellPrice >= 150); // 就地折讓現領高額銅錢

  // 驗證馴獸師靈獸附魔生成品質
  const enchantedBeast = rollBossEnchantedWeapon(9, 'mu', () => 0.4);
  assert.ok(enchantedBeast.isEnchanted);
  assert.ok(enchantedBeast.name.includes('靈犬') || enchantedBeast.name.includes('靈鷹') || enchantedBeast.name.includes('毒蟾') || enchantedBeast.name.includes('蒼狼') || enchantedBeast.name.includes('靈獒') || enchantedBeast.name.includes('天狼'));
  assert.ok(enchantedBeast.sellPrice >= 150);

  // 驗證 getActiveLoadout 優先取用裝備中的附魔神兵
  const save = newAdventure();
  save.weapon = enchantedSword.id;
  save.enchantedWeapon = enchantedSword;
  const loadout = getActiveLoadout(save);
  assert.equal(loadout.id, enchantedSword.id);
  assert.equal(loadout.element, enchantedSword.element);
  assert.equal(loadout.isEnchanted, true);
});

test('6. 教學心法：英文 4:1 連擊平衡與錯題墨寶閣零失誤安全消去機制', () => {
  // 英文模式 4:1 累積獎勵進度
  const step1 = advanceComboReward(0, true);
  assert.equal(step1.progress, 0.25);
  const step4 = advanceComboReward(0.75, true);
  assert.equal(step4.progress, 1.0);

  // 中文模式 1:1 累積獎勵進度
  const zhStep = advanceComboReward(0, false);
  assert.equal(zhStep.progress, 1.0);

  // 錯題零失誤消去
  const profile = { weak: { '江湖': 2, '俠客': 1 } };
  recordQuestionResult(profile, '江湖', 0); // 0 失誤完成，計數 -1
  assert.equal(profile.weak['江湖'], 1);

  recordQuestionResult(profile, '俠客', 0); // 0 失誤完成，歸零後安全刪除 key
  assert.equal(profile.weak['俠客'], undefined);

  recordQuestionResult(profile, '新錯詞', 1); // 發生失誤，累計 +1
  assert.equal(profile.weak['新錯詞'], 1);
});
