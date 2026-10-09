import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { ADVENTURE_STAGES, CHAPTERS } from '../src/data/adventureWorld.js';
import { newAdventure, getProfile, awardStage, attackDuration, buyWeapon } from '../src/engine/AdventureEngine.js';
import { TypingEngine } from '../src/engine/TypingEngine.js';
import { AudioEngine } from '../src/engine/AudioEngine.js';
import { getGradeMixedWords } from '../src/data/textbooks.js';
import { buildGradeQuestionQueue } from '../src/data/gradeQuestionMix.js';
import { ENGLISH_PRACTICE_BANKS } from '../src/data/practice.js';
import { WEAPONS } from '../src/data/enemies.js';
import { sentenceWindow } from '../src/engine/sentenceLayout.js';
import { battleLayout, FIGHTER_VISIBLE_WIDTH } from '../src/engine/battleLayout.js';

test('中央操作區與角色可見圖框分離，窄直式使用中間演出帶',()=>{
  for(const [width,height] of [[1920,1080],[1536,864],[1280,720],[1366,650],[1093,614],[1024,561],[911,512],[768,540],[730,540],[911,433]]){
    const layout=battleLayout(width,height);
    assert.ok((width-layout.center)/2>=layout.side+11);
    assert.ok(layout.fighterHeight*FIGHTER_VISIBLE_WIDTH+24<=layout.side+.01);
    assert.ok(layout.baseline-layout.fighterHeight*1.08*.65>=96);
    const controlsTop=height-57,questionBottom=Math.min(height*.48,291);
    const maxAttackY=controlsTop-50;
    const attackH=Math.min(layout.fighterHeight,Math.max(1,(maxAttackY-questionBottom-8)/.68));
    const attackY=Math.min(maxAttackY,Math.max(layout.baseline,questionBottom+8+attackH*.68));
    assert.ok(attackY-attackH*.65>=questionBottom+7.9);
    assert.ok(attackY+44<=controlsTop-5.9);
  }
  for(const [width,height,top,bottom] of [[390,844,260,530],[360,540,190,340]]){
    const layout=battleLayout(width,height,top,bottom);
    assert.ok(layout.stacked);
    assert.ok(layout.baseline-layout.fighterHeight*.70>=top-.01);
    assert.ok(top+layout.fighterHeight*.80<=bottom-48+.01);
  }
  assert.deepEqual(sentenceWindow(21,12,9,1),{left:9,right:18});
});

test('收起鍵盤將中央寬度還給角色，桌面可見人物維持較大比例',()=>{
  const shown=battleLayout(1100,870),hidden=battleLayout(1100,870,0,870,false);
  assert.ok(hidden.center<shown.center);
  assert.ok(hidden.fighterHeight>shown.fighterHeight);
  assert.ok(shown.fighterHeight*.64>=300);
  assert.ok(hidden.fighterHeight*.64>=340);
});

test('長句兩行依可用寬度分段，當前字永遠可見，縮放後仍能定位',()=>{
  for(const length of [5,21,50])for(const columns of [4,12,16,24])for(let index=0;index<length;index++){
    const {left,right}=sentenceWindow(length,index,columns);
    assert.ok(index>=left&&index<right);
    assert.ok(right-left<=columns*2);
  }
  assert.deepEqual(sentenceWindow(21,0,16),{left:0,right:21});
  assert.deepEqual(sentenceWindow(50,25,12),{left:24,right:48});
});

test('六章三十關有起承轉合與六個文印',()=>{
  assert.equal(ADVENTURE_STAGES.length,30); assert.equal(new Set(CHAPTERS.map(c=>c.seal)).size,6);
  ADVENTURE_STAGES.forEach((s,i)=>{assert.equal(s.id,i);assert.ok(s.intro&&s.outro);});
  assert.equal(ADVENTURE_STAGES.filter(s=>s.kind==='boss').length,6);
});
test('六章場景與人物均對應現有渲染器及實際素材',()=>{
  const renderer=readFileSync(new URL('../src/scenes/CanvasBattleScene.js',import.meta.url),'utf8');
  for(const stage of ADVENTURE_STAGES){
    assert.ok(renderer.includes(`bg_${stage.sceneTheme}:`),stage.sceneTheme);
    assert.ok(renderer.includes(`enemy_${stage.enemy.visualType}:`),stage.enemy.visualType);
  }
  for(const match of renderer.matchAll(/'\.\/(assets\/[^']+)'/g))assert.ok(existsSync(new URL('../'+match[1],import.meta.url)),match[1]);
});
test('每個年級三境界都以真實輸入完成三十關，英文同樣可完結',()=>{
  for(const grade of ['1','2','3','4','5','6','english'])for(const realm of ['easy','medium','hard']){
    const save=newAdventure();save.grade=grade;const p=getProfile(save);p.realm=realm;
    for(let stage=0;stage<30;stage++){
      const queue=grade==='english'?ENGLISH_PRACTICE_BANKS[realm].slice(0,10):buildGradeQuestionQueue(getGradeMixedWords(Number(grade)),Number(grade),realm);
      const engine=new TypingEngine();engine.active=true;
      for(const word of queue){engine.loadWord(word);let guard=0;while(engine.getExpectedSymbol()){
        const key=engine.getExpectedKeyInfo();assert.ok(key,`${word.text} 的輸入鍵存在`);
        engine.handleKeyDown({code:key.code,key:key.en,preventDefault(){}});
        assert.ok(++guard<500,'輸入能向前推進');
      }}
      const result=awardStage(save,p,stage,engine.getStats(),'2026-10-07');assert.equal(result.ending,stage===29);
    }
    assert.equal(p.stage,30);assert.equal(Object.keys(p.records).length,30);
  }
});
test('九題不能通關或領獎，每日獎勵只發一次',()=>{
  const save=newAdventure();const p=getProfile(save);const coins=save.coins;
  assert.throws(()=>awardStage(save,p,0,{completedWords:9},'today'));assert.equal(save.coins,coins);
  const stats={completedWords:10,completedChars:10,accuracy:100};
  assert.equal(awardStage(save,p,0,stats,'today').dailyBonus,20);
  assert.equal(awardStage(save,p,1,stats,'today').dailyBonus,0);
});
test('通關後重遊不倒退主線、不誤報結局，記錄本局境界',()=>{
  const save=newAdventure(),p=getProfile(save);p.stage=30;p.records[0]={accuracy:100};p.realm='hard';
  const result=awardStage(save,p,0,{completedWords:10,completedChars:10,accuracy:100,realm:'easy'},'today');
  assert.equal(p.stage,30);assert.equal(result.ending,false);assert.equal(p.records[0].realm,'easy');
});
test('年級進度分離、舊財產單向複製且不修改舊物件',()=>{
  assert.equal(newAdventure({coins:0}).coins,0);
  const legacy={coins:200,heroId:'su',ownedWeapons:['qingfeng_sword'],equippedWeaponId:'qingfeng_sword'};
  const save=newAdventure(legacy);getProfile(save).stage=10;save.grade='2';assert.equal(getProfile(save).stage,0);
  save.owned.push('xuantie_sword');assert.deepEqual(legacy.ownedWeapons,['qingfeng_sword']);
});
test('不同難度與關卡類型攻擊速度有別，長句給更長回擊時間，購買不能透支',()=>{
  const easyMs=attackDuration({text:'家'},'1','easy','duel');
  const mediumMs=attackDuration({text:'家'},'1','medium','duel');
  const hardMs=attackDuration({text:'家'},'1','hard','duel');
  assert.ok(Number.isFinite(easyMs)&&easyMs>mediumMs&&mediumMs>hardMs);
  assert.ok(attackDuration({text:'家'},'1','hard','training')>hardMs);
  assert.ok(attackDuration({text:'家'},'1','hard','boss')<hardMs);
  assert.ok(attackDuration({text:'大家一起守護江湖'},'6','hard','boss')>attackDuration({text:'家'},'6','hard','boss'));
  const renderer=readFileSync(new URL('../src/scenes/CanvasBattleScene.js',import.meta.url),'utf8');
  for(const key of ['fx_combo_5','fx_combo_10','fx_combo_15','fx_miss_stagger'])assert.ok(renderer.includes(`${key}:`),key);
  const engine=new TypingEngine();
  assert.equal(engine.getComboTier(4),0);
  assert.equal(engine.getComboTier(5),1);
  assert.equal(engine.getComboTier(10),2);
  assert.equal(engine.getComboTier(15),3);
  const audio=new AudioEngine();
  assert.equal(audio.speechEnabled,true);
  assert.equal(audio.setSpeechEnabled(false),false);
  assert.equal(audio.speakText('江湖','zh-TW'),false);
  const save=newAdventure();assert.equal(buyWeapon(save,WEAPONS[2]),false);assert.equal(save.coins,80);
  save.coins=400;assert.equal(buyWeapon(save,WEAPONS[2]),true);assert.equal(save.coins,40);
  assert.equal(buyWeapon(save,WEAPONS[2]),true);assert.equal(save.coins,40);
});

test('四大裝備部位（劍／刀／槍、護腕、防具、丹藥）與敵人毒火冰屬性皆具備對應立繪、圖示與特效', async () => {
  const {
    ADVENTURE_WEAPONS, ADVENTURE_BRACERS, ADVENTURE_ARMORS, ADVENTURE_POTIONS,
    stageHazard, buyGear, buyPotion
  } = await import('../src/engine/AdventureEngine.js');
  const { getWeaponEffectProfile } = await import('../src/data/weaponEffects.js');
  const renderer = readFileSync(new URL('../src/scenes/CanvasBattleScene.js', import.meta.url), 'utf8');

  // 驗證新持刀／持槍立繪與三種異常狀態特效皆已註冊且檔案存在
  for (const key of [
    'yun_flame_saber', 'su_flame_saber', 'yun_thunder_spear', 'su_thunder_spear',
    'fx_status_poison', 'fx_status_burn', 'fx_status_freeze'
  ]) {
    assert.ok(renderer.includes(`${key}:`), `缺少渲染資源註冊: ${key}`);
  }

  // 驗證所有新裝備與丹藥圖示檔案存在
  for (const item of [...ADVENTURE_WEAPONS, ...ADVENTURE_BRACERS, ...ADVENTURE_ARMORS, ...ADVENTURE_POTIONS]) {
    const rel = item.icon.replace(/^\.\//, '');
    assert.ok(existsSync(new URL('../' + rel, import.meta.url)), `缺少圖示檔案: ${rel}`);
  }

  // 驗證劍、刀、槍對應不同攻擊特效設定與絕招名稱
  const saberProfile = getWeaponEffectProfile(ADVENTURE_WEAPONS.find(w => w.id === 'flame_saber'));
  const spearProfile = getWeaponEffectProfile(ADVENTURE_WEAPONS.find(w => w.id === 'thunder_spear'));
  assert.equal(saberProfile.style, 'saber');
  assert.equal(saberProfile.effectName, '刀罡');
  assert.equal(spearProfile.style, 'spear');
  assert.equal(spearProfile.effectName, '槍芒');

  // 驗證四大裝備購買、穿戴與丹藥堆疊上限
  const save = newAdventure();
  save.coins = 1200;
  const saber = ADVENTURE_WEAPONS.find(w => w.id === 'flame_saber');
  const bracer = ADVENTURE_BRACERS.find(b => b.id === 'jade_bracer');
  const armor = ADVENTURE_ARMORS.find(a => a.id === 'scale_armor');
  const healPotion = ADVENTURE_POTIONS.find(p => p.id === 'heal_potion');
  assert.equal(buyGear(save, 'weapon', saber), true);
  assert.equal(save.weapon, 'flame_saber');
  assert.equal(buyGear(save, 'bracer', bracer), true);
  assert.equal(save.bracer, 'jade_bracer');
  assert.equal(buyGear(save, 'armor', armor), true);
  assert.equal(save.armor, 'scale_armor');
  assert.equal(buyPotion(save, healPotion), true);
  assert.equal(save.potions.heal_potion, 2);

  // 驗證關卡元素屬性涵蓋 poison / burn / freeze
  const hazards = new Set(ADVENTURE_STAGES.map(s => stageHazard(s)?.type).filter(Boolean));
  assert.ok(hazards.has('poison'));
  assert.ok(hazards.has('burn'));
  assert.ok(hazards.has('freeze'));

  // 驗證每一章內部 5 關敵人立繪 visualType 皆不重複
  for (let ch = 0; ch < CHAPTERS.length; ch++) {
    const chStages = ADVENTURE_STAGES.slice(ch * 5, ch * 5 + 5);
    const visuals = new Set(chStages.map(s => s.enemy.visualType));
    assert.equal(visuals.size, 5, `第 ${ch + 1} 章內部 5 關敵人外觀應互不重複`);
  }
});

test('v2.1.0 RPG 血量與傷害系統、長度平方根公平曲線、Boss 三階段與流派差異', async () => {
  const {
    ADVENTURE_WEAPONS, SPIRIT_BEASTS, calculateAttackDamage, bossPhaseForHp, advanceBossPhase, awardStage, newAdventure, getProfile
  } = await import('../src/engine/AdventureEngine.js');

  const duelStage = ADVENTURE_STAGES.find(s => s.kind === 'duel');
  const bossStage = ADVENTURE_STAGES.find(s => s.kind === 'boss');
  const sword = ADVENTURE_WEAPONS.find(w => w.id === 'qingfeng_sword');
  const saber = ADVENTURE_WEAPONS.find(w => w.id === 'flame_saber');
  const spear = ADVENTURE_WEAPONS.find(w => w.id === 'thunder_spear');

  // 1. 戰鬥關卡可於敵人 HP 歸零時獲勝（不強制滿 10 題）
  const save = newAdventure();
  const p = getProfile(save);
  const combatReward = awardStage(save, p, duelStage.id, { completedWords: 4, completedChars: 12, accuracy: 96, enemyHp: 0 }, '2026-10-09');
  assert.ok(combatReward.reward > 0);

  // 2. 題目長度平方根公平曲線：長句傷害高於單字，但上限受控（<= 2.5x 比例）
  const shortDmg = calculateAttackDamage({
    actionType: 'word',
    wordObj: { text: '風', bopomofo: ['ㄈㄥ'] },
    combo: 0,
    grade: '3',
    loadout: sword,
    stage: duelStage
  });
  const longDmg = calculateAttackDamage({
    actionType: 'word',
    wordObj: { text: '清風徐來水波不興萬里無雲', bopomofo: Array(12).fill('ㄈㄥ') },
    combo: 0,
    grade: '3',
    loadout: sword,
    stage: duelStage
  });
  assert.ok(longDmg.finalDamage > shortDmg.finalDamage);
  assert.ok(longDmg.lengthBonus <= 2.5);

  // 3. 武器流派差異：刀系完成詞語具爆發加成、槍系具破防與蓄力擊退加成、劍系隨 Combo 穩定增傷
  const word4 = { text: '行俠仗義', bopomofo: ['ㄒㄧㄥˊ', 'ㄒㄧㄚˊ', 'ㄓㄤˋ', 'ㄧˋ'] };
  const swordHit = calculateAttackDamage({ actionType: 'word', wordObj: word4, combo: 15, grade: '4', loadout: sword, stage: bossStage });
  const saberHit = calculateAttackDamage({ actionType: 'word', wordObj: word4, combo: 2, grade: '4', loadout: saber, stage: bossStage });
  const spearHit = calculateAttackDamage({ actionType: 'word', wordObj: word4, combo: 2, grade: '4', loadout: spear, stage: bossStage });
  assert.ok(swordHit.comboMultiplier > saberHit.comboMultiplier);
  assert.ok(saberHit.schoolBonus >= 1.28);
  assert.ok(spearHit.defenseFactor > swordHit.defenseFactor);
  assert.ok(spearHit.atbBreak > swordHit.atbBreak);

  // 4. Boss HP 三階段：100%~70% 試探、70%~30% 破防、30% 以下決勝，大招跨階段直接進入最終階段
  assert.equal(bossPhaseForHp(400, 420, 0).name, '試探');
  assert.equal(bossPhaseForHp(200, 420, 0).name, '破防');
  assert.equal(bossPhaseForHp(80, 420, 0).name, '決勝');
  const jump = advanceBossPhase(0, 80, 420);
  assert.equal(jump.changed, true);
  assert.equal(jump.index, 2);
  assert.equal(jump.skippedIntermediate, true);

  // 5. 馴獸師四種靈獸：毒蟾對 Boss 毒傷單次上限 35，蒼狼高連擊觸發多段攻擊
  const toad = SPIRIT_BEASTS.find(b => b.id === 'beast_toad');
  const wolf = SPIRIT_BEASTS.find(b => b.id === 'beast_wolf');
  const toadHit = calculateAttackDamage({
    actionType: 'word',
    wordObj: word4,
    combo: 5,
    grade: '5',
    loadout: toad,
    stage: bossStage,
    enemyHp: 800,
    enemyMaxHp: 880
  });
  assert.equal(toadHit.applyPoison, true);
  assert.ok(toadHit.poisonDamage <= 35);

  const wolfHit = calculateAttackDamage({
    actionType: 'word',
    wordObj: word4,
    combo: 12,
    grade: '5',
    loadout: wolf,
    stage: bossStage
  });
  assert.equal(wolfHit.multiHitCount, 3);
});

test('v2.1.0 動態補題與四層防重、馴獸師裝備切換、音訊四開關與舊版存檔無損遷移', async () => {
  const {
    SPIRIT_BEASTS, newAdventure, migrateAdventureSave, getProfile, getActiveLoadout, buyGear
  } = await import('../src/engine/AdventureEngine.js');
  const { buildAdaptiveQuestionBatch, recordQuestionHistory } = await import('../src/data/gradeQuestionMix.js');
  const { HEROES } = await import('../src/data/enemies.js');

  // 1. 驗證第三角色「馴獸師・林牧風」與四靈獸皆已註冊並有對應素材
  assert.ok(HEROES.mu);
  assert.equal(HEROES.mu.school, 'beast');
  assert.equal(SPIRIT_BEASTS.length, 4);
  for (const beast of SPIRIT_BEASTS) {
    const rel = beast.icon.replace(/^\.\//, '');
    assert.ok(existsSync(new URL('../' + rel, import.meta.url)), `缺少靈獸圖示: ${rel}`);
  }

  // 2. 驗證舊版 v2.0.0 存檔無損遷移（保留銅錢、武器、通關紀錄，自動補齊靈獸與音訊設定）
  const v2Save = {
    version: 1,
    grade: '3',
    hero: 'yun',
    coins: 520,
    weapon: 'qingfeng_sword',
    owned: ['wood_sword', 'qingfeng_sword'],
    profiles: {
      '3': { stage: 12, realm: 'medium', records: { 0: { accuracy: 98 } }, recent: ['江湖', '朋友'], weak: { 朋友: 2 }, session: null }
    }
  };
  const migrated = migrateAdventureSave(v2Save);
  assert.equal(migrated.coins, 520);
  assert.equal(migrated.weapon, 'qingfeng_sword');
  assert.equal(migrated.beast, 'beast_dog');
  assert.ok(migrated.ownedBeasts.includes('beast_dog'));
  assert.deepEqual(migrated.profiles['3'].recentZh, ['江湖', '朋友']);
  assert.equal(migrated.profiles['3'].stage, 12);

  // 3. 驗證切換為馴獸師時，出戰配置自動切換為靈獸，且可用銅錢結契新靈獸
  migrated.hero = 'mu';
  assert.equal(getActiveLoadout(migrated).id, 'beast_dog');
  const eagle = SPIRIT_BEASTS.find(b => b.id === 'beast_eagle');
  assert.equal(buyGear(migrated, 'beast', eagle), true);
  assert.equal(migrated.beast, 'beast_eagle');
  assert.equal(getActiveLoadout(migrated).id, 'beast_eagle');

  // 4. 驗證四層防重與動態補題（同場不重複、錯題複習標記 isReview、中英分池）
  const pool = getGradeMixedWords(3);
  const prof = getProfile(migrated);
  recordQuestionHistory(prof, pool[0].text, false);
  const batch1 = buildAdaptiveQuestionBatch(pool, '3', 'medium', {
    sessionUsed: [],
    recentList: prof.recentZh,
    practicedMap: prof.practiced,
    weakMap: { [pool[5].text]: 3 },
    count: 10
  });
  assert.equal(batch1.length, 10);
  assert.equal(new Set(batch1.map(w => w.text)).size, 10);
  assert.ok(batch1.filter(w => w.isReview).length <= 2);

  const batch2 = buildAdaptiveQuestionBatch(pool, '3', 'medium', {
    sessionUsed: batch1.map(w => w.text),
    recentList: prof.recentZh,
    practicedMap: prof.practiced,
    weakMap: prof.weak,
    count: 8
  });
  assert.equal(batch2.length, 8);
  for (const w of batch2) {
    assert.ok(!batch1.some(b => b.text === w.text), '同一場戰鬥動態補題不應與已出題目重複');
  }

  // 5. 驗證 AudioEngine 四項設定與情境 BGM 切換
  const audio = new AudioEngine();
  audio.applySettings({ bgm: true, sfx: true, speech: true, muted: false });
  assert.equal(audio.bgmEnabled, true);
  assert.equal(audio.sfxEnabled, true);
  assert.equal(audio.setBgmEnabled(false), false);
  assert.equal(audio.setSfxEnabled(false), false);
});

test('v2.1.0 教育部離線字典例詞與成語入庫、英文 300 題擴充與完整題庫循環防重', async () => {
  const { buildAdaptiveQuestionBatch, recordQuestionHistory, getQuestionLengthGroup } = await import('../src/data/gradeQuestionMix.js');
  const { isDictionaryReading } = await import('../src/data/moeDictionary.js');

  // 1. 驗證 1～6 年級皆已從教育部離線字典 (moeMiniIndex.js) 匯入例詞與成語，且單字、詞語、短句題量充足
  for (let grade = 1; grade <= 6; grade++) {
    const words = getGradeMixedWords(grade);
    const dictExamples = words.filter(w => w.sourceKind === 'dictionary-example');
    const g0 = words.filter(w => getQuestionLengthGroup(w) === 0);
    const g1 = words.filter(w => getQuestionLengthGroup(w) === 1);
    const g2 = words.filter(w => getQuestionLengthGroup(w) === 2);

    assert.ok(dictExamples.length >= 60, `${grade} 年級應包含至少 60 個教育部字典例詞／成語`);
    assert.ok(g0.length >= 60, `${grade} 年級單字題庫應至少 60 題`);
    assert.ok(g1.length >= 90, `${grade} 年級 2～4 字詞語與成語題庫應至少 90 題`);
    assert.ok(g2.length >= 22, `${grade} 年級 5 字以上短句題庫應至少 22 題`);

    for (const item of dictExamples) {
      const chars = Array.from(item.text);
      assert.equal(chars.length, item.bopomofo.length);
      chars.forEach((ch, idx) => {
        assert.ok(isDictionaryReading(ch, item.bopomofo[idx]), `${item.text} 的 ${ch}(${item.bopomofo[idx]}) 應符合教育部小字典讀音`);
      });
    }
  }

  // 2. 驗證英文題庫由 90 題擴充至 300 題（初階 120、中階 100、高階 80）
  assert.equal(ENGLISH_PRACTICE_BANKS.easy.length, 120);
  assert.equal(ENGLISH_PRACTICE_BANKS.medium.length, 100);
  assert.equal(ENGLISH_PRACTICE_BANKS.hard.length, 80);

  // 3. 驗證完整題庫循環防重：120 題英文初階題庫連續進行 12 場（每場 10 題），120 題全數出完一輪前 0 重複
  const profile = { recent: [], recentEn: [], practiced: {}, weak: {} };
  const drawnCycle1 = [];
  for (let round = 0; round < 12; round++) {
    const batch = buildAdaptiveQuestionBatch(ENGLISH_PRACTICE_BANKS.easy, 'english', 'easy', {
      sessionUsed: [],
      recentList: profile.recentEn,
      practicedMap: profile.practiced,
      weakMap: profile.weak,
      count: 10
    });
    assert.equal(batch.length, 10);
    drawnCycle1.push(...batch.map(w => w.text));
    recordQuestionHistory(profile, batch, true);
  }
  assert.equal(drawnCycle1.length, 120);
  assert.equal(new Set(drawnCycle1).size, 120, '完整題庫 120 題未全部用完一輪前，不應出現任何重複題目');

  // 第 13 場進入第二輪循環時，仍優先排除第一輪最後 60 題近期題目
  const tail60 = new Set(drawnCycle1.slice(-60));
  const round13 = buildAdaptiveQuestionBatch(ENGLISH_PRACTICE_BANKS.easy, 'english', 'easy', {
    sessionUsed: [],
    recentList: profile.recentEn,
    practicedMap: profile.practiced,
    weakMap: profile.weak,
    count: 10
  });
  for (const w of round13) {
    assert.ok(!tail60.has(w.text), '進入第二輪循環時應優先排除第一輪末尾 60 道近期題目');
  }
});
