import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { battleHarness, section } from './helpers/adventureHarness.js';
import { recordQuestionHistory } from '../src/data/gradeQuestionMix.js';
import { newAdventure, getProfile, awardStage, calculateAttackDamage, ADVENTURE_WEAPONS, ADVENTURE_BRACERS, rollBossEnchantedWeapon, getBossWeaponDropRate } from '../src/engine/AdventureEngine.js';

const english = () => battleHarness({text:'ab',mode:'english'});

test('錯題不因記錄歷史消失，重練移到最近作答末端',()=>{
 const p={weak:{甲:2},recentZh:['甲','乙'],recent:['甲','乙']};
 recordQuestionHistory(p,'甲'); assert.equal(p.weak.甲,2);assert.deepEqual(p.recentZh,['乙','甲']);
});
test('快速連錯均記錄，但只套用一次戰鬥懲罰；98 蓄力不倒退',()=>{
 const c=english();c.session.atb=98;c.engine.processSymbolInput('z');
 assert.equal(c.session.atb,100);c.now+=100;c.engine.processSymbolInput('z');
 assert.equal(c.wordMisses,2);assert.equal(c.profile.weak.ab,2);assert.equal(c.session.atb,100);
});
test('錯題完成仍保留，後續零失誤才降低一次，作答只記一次',()=>{
 const c=english();c.engine.processSymbolInput('z');c.engine.processSymbolInput('a');c.engine.processSymbolInput('b');
 assert.equal(c.profile.weak.ab,1);assert.equal(c.profile.practiced.ab,1);
 c.engine.processSymbolInput('a');c.engine.processSymbolInput('b');
 assert.equal(c.profile.weak.ab,undefined);assert.equal(c.profile.practiced.ab,2);
});
test('續玩保存逐題錯鍵數，重進後不算零失誤',()=>{
 const c=english();c.session.stageId=0;c.engine.processSymbolInput('z');c.rememberSession();
 assert.equal(c.profile.session.wordMisses,1);
 c.makeQueue=()=>c.session.queue;vm.runInContext(section('function begin(', 'function start()'),c);c.begin();
 assert.equal(c.wordMisses,1);
});
test('特訓暫停與失敗不覆寫主線續玩位置',()=>{
 const c=english(),main={stageId:7};c.profile.session=main;c.session.isWeakDrill=true;c.rememberSession();
 assert.equal(c.profile.session,main);
 vm.runInContext(section('function failed()', "engine.on('keyHit'"),c);c.failed();assert.equal(c.profile.session,main);
});
test('特訓結算不推進主線、改印章、回血或發主線獎勵',()=>{
 const c=english(),main={stageId:7};c.profile.session=main;c.profile.stage=4;c.profile.adventureHp=63;
 c.session.isWeakDrill=true;c.session.enemyHp=0;c.session.cursor=1;c.engine.completedWords=1;
 c.profile.weak.ab=2;const coins=c.save.coins;c.pause=()=>{};c.modal=()=>{};
 vm.runInContext(section('function finish()', 'function shop('),c);c.finish();
 assert.equal(c.profile.session,main);assert.equal(c.profile.stage,4);assert.equal(c.profile.adventureHp,63);
 assert.equal(c.profile.weak.ab,2);assert.equal(c.save.coins-coins,35);assert.equal(Object.keys(c.profile.records).length,0);
});
test('戰鬥結算不重複增加已完成題目練習次數',()=>{
 const c=english();c.engine.processSymbolInput('a');c.engine.processSymbolInput('b');
 const count=c.profile.practiced.ab;c.session.enemyHp=0;c.pause=()=>{};c.modal=()=>{};
 vm.runInContext(section('function finish()', 'function shop('),c);c.finish();assert.equal(c.profile.practiced.ab,count);
});
test('敵人未倒下，即使十題也不得領獎，矛盾旗標不能繞過血量',()=>{
 const s=newAdventure(),p=getProfile(s),coins=s.coins;
 for(const hp of [100,NaN,Infinity])assert.throws(()=>awardStage(s,p,0,{completedWords:10,enemyHp:hp,enemyDefeated:true},'today'));
 assert.equal(s.coins,coins);assert.equal(p.stage,0);
});
test('開選單、分頁隱藏或失焦不消耗定身，受傷無敵仍保留',()=>{
 for(const mode of ['menu','hidden','blur']){
  const c=english();Object.assign(c,{lastTick:0,view:'battle',document:{hidden:false},windowFocused:true,readUntil:0,frozenUntil:8000,battleTime:0,statusDotAcc:0,requestAnimationFrame(){}});
  vm.runInContext(section('function tick(now)', 'keyboard();setupScene();'),c);
  if(mode==='menu')c.view='settings';if(mode==='hidden')c.document.hidden=true;if(mode==='blur')c.windowFocused=false;
  c.now=20000;c.tick(c.now);c.view='battle';c.document.hidden=false;c.windowFocused=true;c.now+=50;c.tick(c.now);
  assert.equal(c.session.atb,0);
  c.frozenUntil=0;c.hurtInvincibleUntil=c.now+1000;c.now+=50;c.tick(c.now);assert.equal(c.session.atb,0);
  c.hurtInvincibleUntil=0;c.frozenUntil=c.battleTime+100;
  for(let i=0;i<4;i++){c.now+=50;c.tick(c.now);}assert.ok(c.session.atb>0);
 }
});
test('單字題套用普通與附魔裝備擊退，多字題保留敵人蓄力',()=>{
 const c=english();c.engine.loadWord({text:'a',mode:'english'});c.session.atb=90;
 const enchanted=rollBossEnchantedWeapon(4,'yun',()=>0.1);c.getLoadout=()=>enchanted;c.getBracer=()=>ADVENTURE_BRACERS[2];
 const hit=c.applyPlayerAttack('word');assert.equal(c.session.atb,90-hit.atbBreak);assert.ok(hit.atbBreak>10);
 c.session.atb=90;c.engine.loadWord({text:'ab',mode:'english'});c.applyPlayerAttack('word');assert.equal(c.session.atb,90);
 const normal=calculateAttackDamage({actionType:'word',wordObj:{text:'字'},loadout:ADVENTURE_WEAPONS[0]});
 const geared=calculateAttackDamage({actionType:'word',wordObj:{text:'字'},loadout:enchanted,bracer:ADVENTURE_BRACERS[2]});assert.ok(geared.atbBreak>normal.atbBreak);
 assert.equal(getBossWeaponDropRate(4),0.2);
});

test('從特訓開始主線時，以明確模式建立新題庫，不沿用舊特訓旗標',()=>{
 const c=english();c.session.isWeakDrill=true;c.profile.weak.ab=2;c.getBasePool=()=>[{text:'ab',mode:'english'},{text:'cd',mode:'english'}];
 c.buildAdaptiveQuestionBatch=()=>[{text:'cd',mode:'english'}];
 vm.runInContext(section('function makeQueue(', 'function ensureSessionQueue('),c);
 assert.equal(c.makeQueue([],1,false)[0].text,'cd');
 assert.equal(c.makeQueue([],1)[0].text,'ab');
});

for (const sample of [
 {name:'中文聲母',word:{text:'天',bopomofo:['ㄊㄧㄢ']},typed:[],label:'ㄊ'},
 {name:'一聲空白鍵',word:{text:'天',bopomofo:['ㄊㄧㄢ']},typed:['ㄊ','ㄧ','ㄢ'],label:'␣ (一聲)'},
 {name:'輕聲',word:{text:'嗎',bopomofo:['ㄇㄚ˙']},typed:['ㄇ','ㄚ'],label:'˙ (輕聲)'},
 {name:'二聲',word:{text:'人',bopomofo:['ㄖㄣˊ']},typed:['ㄖ','ㄣ'],label:'ˊ'},
 {name:'英文',word:{text:'ab',mode:'english'},typed:[],label:'按 <kbd>A</kbd>'}
]) test(`完整戰鬥畫面可渲染${sample.name}提示與後續血量`,()=>{
 const c=battleHarness(sample.word);
 for(const symbol of sample.typed)c.engine.processSymbolInput(symbol);
 const nodes=new Map();
 c.$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',dataset:{},classList:{toggle(){}},querySelectorAll:()=>[]});return nodes.get(id);};
 c.gradeLabel=()=> '測試';c.REALMS={easy:'初出茅廬'};c.HEROES={yun:{name:'雲清川'}};c.getWordUsageHint=()=>'';
 vm.runInContext(section('function render()', 'function applyPlayerAttack('),c);
 assert.doesNotThrow(()=>c.render());
 assert.ok(nodes.get('next-key').innerHTML.includes(sample.label),nodes.get('next-key').innerHTML);
 assert.ok(nodes.get('hero-detail').textContent.includes('氣血'));
 assert.ok(nodes.get('enemy-detail').textContent.includes('氣血'));
});


test('異常狀態須連續完成兩字，中途錯鍵重新計數',()=>{
 for(const status of ['poison','burn','freeze']){
  const c=battleHarness({text:'口口口',bopomofo:['ㄎㄡˇ','ㄎㄡˇ','ㄎㄡˇ']});
  c.session.status=status;c.session.statusCureNeed=2;
  const completeChar=()=>{
   const index=c.engine.charIndex;
   while(c.engine.charIndex===index&&c.engine.getExpectedSymbol())c.engine.processSymbolInput(c.engine.getExpectedSymbol());
  };
  completeChar();assert.equal(c.session.statusCureNeed,1);
  c.engine.processSymbolInput('ㄅ');assert.equal(c.session.statusCureNeed,2);
  completeChar();assert.equal(c.session.status,status);
  completeChar();assert.equal(c.session.status,null);assert.equal(c.session.statusCureNeed,0);
 }
});

test('絕招僅能在戰鬥且滿氣時施放，清氣後不可重複造成傷害',()=>{
 for(const weapon of [ADVENTURE_WEAPONS[0],ADVENTURE_WEAPONS[5]]){
  const c=english();c.getLoadout=()=>weapon;c.frozenUntil=0;
  vm.runInContext(section('function ultimate()', 'function failed()'),c);
  const hp=c.session.enemyHp;
  c.session.qi=5;c.view='settings';c.ultimate();
  assert.equal(c.session.enemyHp,hp);assert.equal(c.session.qi,5);
  c.view='battle';c.session.qi=4;c.ultimate();
  assert.equal(c.session.enemyHp,hp);assert.equal(c.session.qi,4);
  c.session.qi=5;c.session.hp=60;c.session.status='burn';c.session.statusCureNeed=2;
  c.ultimate();
  assert.equal(c.session.qi,0);assert.equal(c.session.shield,1);
  assert.equal(c.session.status,null);assert.equal(c.session.statusCureNeed,0);
  assert.ok(c.session.enemyHp<hp);
  assert.equal(c.frozenUntil-c.battleTime,weapon.style==='spear'?10000:8000);
  assert.equal(c.session.hp,weapon.style==='spear'?80:60);
  const after=c.session.enemyHp;c.ultimate();assert.equal(c.session.enemyHp,after);
 }
});

test('回春丹依裝備血量上限補血，滿血無異常不消耗且淨化只扣一份',()=>{
 for(const maxHp of [100,115,130]){
  const c=english();c.session.maxHp=maxHp;c.session.hp=maxHp;
  vm.runInContext(section('function useHealPotion(', 'function ultimate()'),c);
  const initial=c.save.potions.heal_potion;assert.ok(initial>0);
  assert.equal(c.useHealPotion(false),false);assert.equal(c.save.potions.heal_potion,initial);
  c.session.hp=maxHp-20;c.session.status='freeze';c.session.statusCureNeed=2;
  assert.equal(c.useHealPotion(false),true);assert.equal(c.session.hp,maxHp);
  assert.equal(c.session.status,null);assert.equal(c.session.statusCureNeed,0);
  assert.equal(c.save.potions.heal_potion,initial-1);
  assert.equal(c.useHealPotion(false),false);assert.equal(c.save.potions.heal_potion,initial-1);
  c.save.potions.heal_potion=0;c.session.hp=10;c.session.status='poison';
  assert.equal(c.useHealPotion(false),false);assert.equal(c.session.hp,10);assert.equal(c.session.status,'poison');
 }
});
