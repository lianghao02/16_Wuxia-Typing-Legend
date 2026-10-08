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


