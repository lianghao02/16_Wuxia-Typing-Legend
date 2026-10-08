import { TypingEngine } from './engine/TypingEngine.js';
import { sentenceWindow } from './engine/sentenceLayout.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { CanvasBattleScene } from './scenes/CanvasBattleScene.js';
import { HEROES, WEAPONS } from './data/enemies.js';
import { KEYBOARD_ROWS } from './data/daqianLayout.js';
import { getGradeMixedWords } from './data/textbooks.js';
import { ENGLISH_PRACTICE_BANKS } from './data/practice.js';
import { buildGradeQuestionQueue } from './data/gradeQuestionMix.js';
import { getDictionaryUsage } from './data/moeDictionary.js';
import { ADVENTURE_STAGES, CHAPTERS, REALMS } from './data/adventureWorld.js';
import { ADVENTURE_KEY, CONFIG, newAdventure, getProfile, phaseFor, attackDuration, awardStage, buyWeapon, favorFresh } from './engine/AdventureEngine.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let save, firstVisit = false, storageFailed = false;
try {
  const raw = localStorage.getItem(ADVENTURE_KEY);
  save = raw ? JSON.parse(raw) : newAdventure(JSON.parse(localStorage.getItem('wuxia_typing_legend_save_v2') || '{}'));
  if (save.version !== 1 || !save.profiles || !Array.isArray(save.owned)) throw new Error('存檔格式不符');
  firstVisit = !raw;
} catch { save = newAdventure(); firstVisit = true; storageFailed = true; }
let profile = getProfile(save), stage, session, view = 'home', misses = 0, frozenUntil = 0;
let readUntil = 0, noticeTimer, lastTick = performance.now(), resumeView = 'home';
const engine = new TypingEngine();
const audio = new AudioEngine(); audio.setMuted(Boolean(save.muted));
class AdventureScene extends CanvasBattleScene {
  spawnFloatingText(x,y,text,color,size) {
    const label=String(text).replace(/劍氣 0/g,'劍意').replace(/・破題 \+1/g,'・出招成功').replace(/傷害 0/g,'守護');
    super.spawnFloatingText(x,y,label,color,size);
  }
  resize() {
    super.resize();
    this.heroBaseX = this.width * .13;
    this.enemyBaseX = this.width * .87;
    this.heroBaseY = this.enemyBaseY = this.height * .79;
  }
  getFighterImageHeight() { return Math.min(490, this.height * .6, this.width * .4); }
}
const scene = new AdventureScene('adventure-stage');
function persist() {
  try { localStorage.setItem(ADVENTURE_KEY, JSON.stringify(save)); }
  catch { storageFailed = true; $('notice').textContent = '此瀏覽器無法儲存，請保持頁面開啟。'; }
}
function notify(text) {
  clearTimeout(noticeTimer); $('notice').textContent = text;
  noticeTimer = setTimeout(() => { $('notice').textContent = ''; }, 2800);
}
function setupScene() { scene.setupBattle({hero:HEROES[save.hero] || HEROES.yun,
  weapon: WEAPONS.find(w => w.id === save.weapon) || WEAPONS[0], stage: stage || ADVENTURE_STAGES[0]}); }
function rememberSession() {
  if (!session || view !== 'battle') return;
  session.typing = engine.getProgress(); profile.session = session; persist();
}
function pause() { rememberSession(); engine.active = false; engine.setPaused(true); }
function modal(html, nextView) {
  pause(); view = nextView; $('panel-content').innerHTML = html;
  if (!$('panel').open) $('panel').showModal();
  $('panel-content').querySelector('button')?.focus();
}
function closePanel() {
  $('panel').close(); view = 'battle'; engine.active = true; engine.setPaused(document.hidden);
  lastTick = performance.now(); render();
  $('battle').focus();
}
function datestring() { const now = new Date(); return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`; }
function home() {
  modal(`<span class="eyebrow">武俠打字傳 · 文印江湖</span><h1>以字為劍，找回江湖的記憶</h1>
    <p>六枚文印散落各地，書信失去了文字。與雲清川、蘇映雪一起穿越六處江湖，讓朋友們重新讀懂彼此的故事。</p>
    <div class="chapter-list">${CHAPTERS.map((c,i)=>`<div class="${profile.records[i*5+4]?'earned':''}">${profile.records[i*5+4]?'✦':'◇'} ${c.name}<br>${profile.records[i*5+4]?c.seal+'文印已尋回':`第 ${i*5+1}～${i*5+5} 關`}</div>`).join('')}</div>
    <p class="muted">${save.grade==='english'?'英文':save.grade+' 年級'} · ${REALMS[profile.realm]} · 已完成 ${Object.keys(profile.records).length}／30 關<br>每關十題，按錯免退格。空白鍵完成一聲，Tab 開關鍵盤，Alt＋1 施放守護絕招。</p>
    <div class="actions"><button class="primary" data-action="continue">${profile.stage===30?'重遊江湖':profile.session?'繼續上次冒險':'繼續冒險'} · Enter</button><button data-action="shop">客棧</button><button data-action="settings">設定</button></div>
    <p class="muted">${storageFailed?'目前無法儲存進度。':'冒險進度自動儲存在此瀏覽器。'} <a href="./index.html">原版修煉入口</a></p>`, 'home');
  $('battle').hidden = true; $('journey-hud').hidden = true; $('controls').hidden = true;
}
function makeQueue() {
  const pool = save.grade === 'english' ? ENGLISH_PRACTICE_BANKS[profile.realm] : getGradeMixedWords(Number(save.grade));
  const fresh = pool.filter(w => !profile.recent.includes(w.text));
  let queue;
  if (save.grade === 'english') queue = favorFresh(pool, profile.recent).slice(0,10);
  else {
    try { queue = buildGradeQuestionQueue(fresh, Number(save.grade), profile.realm); }
    catch { queue = buildGradeQuestionQueue(pool, Number(save.grade), profile.realm); }
  }
  // 一個弱點題回流，同長度替換，保留年級比例及十題互異。
  const weak = Object.entries(profile.weak).sort((a,b)=>b[1]-a[1]).find(([text])=>!queue.some(w=>w.text===text));
  const candidate = weak && pool.find(w=>w.text===weak[0]);
  if (candidate) {
    const group = word => word.text.length===1?0:word.text.length<=4?1:2;
    const index = queue.findIndex(w=>group(w)===group(candidate));
    if (index>=0) queue[index]=candidate;
  }
  return queue;
}
function begin(resume = true, replayId = null) {
  const valid = profile.session && Number.isInteger(profile.session.stageId) && profile.session.queue?.length===10 && profile.session.cursor<10;
  session = resume && valid ? profile.session : { stageId: replayId ?? Math.min(profile.stage,29), realm:profile.realm, queue:makeQueue(), cursor:0, hp:100, qi:0, atb:0, shield:0, typing:null };
  stage = ADVENTURE_STAGES[session.stageId]; setupScene(); engine.resetStats();
  engine.loadWord(session.queue[session.cursor]);
  if (session.typing) engine.restoreProgress(session.typing);
  misses=0; frozenUntil=0; readUntil=performance.now()+CONFIG.graceMs;
  const chapterIntro = session.cursor===0 && !session.typing && stage.id%5===0 ? CHAPTERS[stage.chapter].intro : '';
  modal(`<span class="eyebrow">第 ${stage.chapter+1} 章 · ${stage.chapterName}</span><h2>${stage.name}</h2>
    ${chapterIntro?`<p>${escape(chapterIntro)}</p>`:''}<p class="story">${stage.intro}</p>
    <p class="muted">${stage.kind==='boss'?'十招切磋：試探 → 破防 → 決勝。':stage.kind==='duel'?'完成題目可打斷對手蓄力。':'這一關沒有回擊，按照自己的節奏前進。'}<br>打完十題才通關；閱讀新題目時有準備時間。絕招滿五點後保護你八秒。</p>
    <button class="primary" data-action="start">${session.cursor||session.typing?'接續交手':'踏入江湖'} · Enter</button>`, 'intro');
}
function start() { $('battle').hidden=false; $('journey-hud').hidden=false; $('controls').hidden=false; closePanel(); if(session.hp<=0){failed();return;}rememberSession(); }
function render() {
  if (!stage || !session) return;
  $('stage-name').textContent = `${stage.chapterName} · ${stage.name}`;
  $('progress').textContent = `${save.grade==='english'?'英文':save.grade+' 年級'} · ${REALMS[session.realm||profile.realm]} · 第 ${session.cursor+1}／10 題`;
  $('route').innerHTML=Array.from({length:10},(_,i)=>`<i class="${i<session.cursor?'done':''}"></i>`).join('');
  $('phase').textContent=stage.kind==='boss'?`首領切磋 · ${phaseFor(session.cursor)}`:{training:'練功 · 完成十次出招',journey:'旅程 · 前進十段路',event:'委託 · 補回十段記憶',duel:'交手 · 擊破十道防禦'}[stage.kind];
  const english=engine.mode==='english';
  $('keyboard').classList.toggle('english-keys',english);
  $('keyboard-label').textContent=english?'英文鍵盤 · F／J 定位點':'大千注音 · F／J 定位點';
  const length=engine.characters.length;
  let left=english?Math.floor(engine.charIndex/12)*12:Math.floor(engine.charIndex/4)*4;
  let right=Math.min(length,left+(english?12:4));
  // 英文優先依完整詞呈現，長句才以詞邊界分段。
  if (english) {
    const text=engine.currentWord.text; left=0; right=length;
    if(length>12){ left=text.lastIndexOf(' ',engine.charIndex-1)+1; const space=text.indexOf(' ',engine.charIndex); right=space<0?length:space; if(text[engine.charIndex]===' '){left=engine.charIndex;right=left+1;} }
  }
  $('question').classList.toggle('english',english);
  const sentence=!english&&length>4;
  $('question').classList.toggle('sentence',sentence);
  const sounds=(ch,current)=>ch.symbols.map((sym,j)=>`<b class="${j<ch.typedCount?'typed':current&&j===engine.symbolIndex?'expected':''}">${escape(sym)}</b>`).join(' ');
  if(sentence) {
    const font=parseFloat(getComputedStyle($('characters')).fontSize);
    const padding=parseFloat(getComputedStyle($('question')).paddingLeft)*2;
    const columns=Math.max(1,Math.floor(($('question').clientWidth-padding-2)/(font*1.12)));
    ({left,right}=sentenceWindow(length,engine.charIndex,columns));
    const current=engine.characters[engine.charIndex];
    $('context').innerHTML=`<span class="sounds" aria-label="目前字的注音">${current?sounds(current,true):''}</span>${length>right||left>0?`<small class="sentence-range">${left+1}～${right}／${length} 字</small>`:''}`;
    $('characters').innerHTML=engine.characters.slice(left,right).map((ch,i)=>`<span class="sentence-char ${ch.completed?'done':''} ${left+i===engine.charIndex?'current':''}" ${left+i===engine.charIndex?'aria-current="true"':''}>${escape(ch.char)}</span>`).join('');
  } else {
    $('context').textContent=length>(english?12:4)?`${engine.currentWord.text} · ${left+1}～${right} 字`:'';
    $('characters').innerHTML=engine.characters.slice(left,right).map((ch,i)=>`<div class="char ${ch.completed?'done':''} ${left+i===engine.charIndex?'current':''}"><div class="sounds">${sounds(ch,left+i===engine.charIndex)}</div><strong>${escape(ch.char===' '?'␣':ch.char)}</strong></div>`).join('');
  }
  const word=engine.currentWord;
  const usage=!english&&word.text.length===1?getDictionaryUsage(word.text,word.bopomofo[0]):null;
  $('usage').textContent=usage?.length?`例詞：${usage.join('、')}`:word.meaning || '';
  const info=engine.getExpectedKeyInfo();
  $('next-key').classList.toggle('help',misses>=2);
  $('next-key').innerHTML=info?`${misses>=2?'慢慢來，請按':'下一鍵'} <kbd>${escape(info.en==='Space'?'空白鍵':info.en)}</kbd> ${escape(engine.getExpectedSymbol())} · ${escape(info.finger)}`:'完成！';
  $('keyboard').hidden=!save.keyboard;
  $('show-keyboard').hidden=save.keyboard;
  for(const key of $('keys').querySelectorAll('.key')) key.classList.toggle('active',key.dataset.code===info?.code);
  $('hero-name').textContent=HEROES[save.hero].name;
  $('hp').value=session.hp;
  $('hero-detail').textContent=`氣血 ${session.hp}／100 · 連擊 ${engine.combo} · 銅錢 ${save.coins}`;
  $('enemy-name').textContent=stage.kind==='journey'?'旅途進度':stage.kind==='event'?'委託進度':stage.name;
  $('enemy-hp').value=100-session.cursor*10;
  $('enemy-detail').textContent=`${session.cursor}／10 已完成 · ${stage.kind==='boss'?phaseFor(session.cursor):'以字為劍'}`;
  $('atb').value=session.atb;
  $('atb').hidden=!['boss','duel'].includes(stage.kind);
  $('ultimate').disabled=session.qi<5;
  $('ultimate').textContent=session.qi>=5?'守護劍陣 · Alt＋1':`絕招 ${session.qi}／5 · Alt＋1`;
}
function finish() {
  pause();
  audio.playVictory();
  const stats={...engine.getStats(),realm:session.realm||profile.realm};
  const reward=awardStage(save,profile,stage.id,stats,datestring());
  profile.recent=[...new Set([...profile.recent,...session.queue.map(w=>w.text)])].slice(-60);
  const seal=stage.id%5===4?`<p>✦ 尋回「${CHAPTERS[stage.chapter].seal}」文印</p><p>${CHAPTERS[stage.chapter].end}</p>`:'';
  persist();
  view='result';
  modal(`<span class="eyebrow">${reward.ending?'六印重聚 · 主線完結':'江湖捷報'}</span><h2>${stage.name} · 任務完成</h2><p class="story">${stage.outro}</p>${seal}
    <div class="stats"><span>實際完成 ${stats.completedWords} 題</span><span>${stats.completedChars} 字</span><span>正確率 ${stats.accuracy}%</span></div>
    <p>銅錢 ＋${reward.reward}${reward.dailyBonus?' · 今日首次冒險 ＋20':''} · 最長連擊 ${stats.maxCombo}</p>
    <p class="muted">${profile.stage===30?'你已完成整段故事。可以重遊已完成的關卡，或在設定選擇更高境界。':`下一站：${ADVENTURE_STAGES[profile.stage].name}`}</p>
    <div class="actions"><button class="primary" data-action="continue">${profile.stage===30?'查看江湖足跡':'繼續冒險'} · Enter</button><button data-action="shop">前往客棧</button><button data-action="home">休息一下</button></div>`, 'result');
}
function shop() {
  resumeView=view==='battle'?'battle':view==='result'?'result':'home';
  modal(`<h2>古驛客棧 · 銅錢 ${save.coins}</h2><div class="shop-layout"><div class="shop-portrait"><img src="./assets/characters/shopkeeper_idle_v3.png" alt="店小二端茶迎客"></div><div><p>店小二：少俠辛苦了！換把新劍，繼續你的故事。</p>${WEAPONS.map(w=>`<div class="item"><img src="${w.icon}" alt=""><div><strong>${w.name}</strong><p>${w.tier===1?'桃木劍光':w.tier===2?'青色劍氣 · 銅錢收益＋25%':'金色流雲 · 銅錢收益＋50%'}</p></div><button data-buy="${w.id}" ${save.weapon===w.id?'disabled':''}>${save.weapon===w.id?'已裝備':save.owned.includes(w.id)?'裝備':save.coins<w.price?`還差 ${w.price-save.coins}`:`${w.price} 銅錢購買`}</button></div>`).join('')}</div></div><div class="actions"><button class="primary" data-action="return">返回 · Esc</button></div>`, 'shop');
}
function settings() {
  resumeView=view==='battle'?'battle':'home';
  modal(`<h2>設定</h2><label>練習內容 <select id="grade-select">${['1','2','3','4','5','6','english'].map(g=>`<option value="${g}" ${save.grade===g?'selected':''}>${g==='english'?'英文':g+' 年級'}</option>`).join('')}</select></label>
    <label>同行少俠 <select id="hero-select"><option value="yun" ${save.hero==='yun'?'selected':''}>雲清川</option><option value="su" ${save.hero==='su'?'selected':''}>蘇映雪</option></select></label>
    <label>挑戰境界 <select id="realm-select">${Object.entries(REALMS).map(([key,name])=>`<option value="${key}" ${profile.realm===key?'selected':''}>${name}</option>`).join('')}</select></label>
    <p class="muted">年級與英文各自保存冒險進度。境界改變題目比例與回擊節奏，不要求重跑故事；進行中的十題會保留原隊列，新境界在下一關生效。</p>
    <label><input id="keyboard-select" type="checkbox" ${save.keyboard?'checked':''}> 顯示指法鍵盤（Tab）</label>
    <label><input id="sound-select" type="checkbox" ${!save.muted?'checked':''}> 開啟音效</label>
    <details><summary>題庫與資料來源</summary><p>沿用六個年級常用字、自編詞句、原創散文與國小程度英文。出版社分類範例尚待核對，並非出版社完整教材。中文字音使用教育部國語小字典。</p><p><a href="https://dict.mini.moe.edu.tw/" target="_blank" rel="noopener">教育部國語小字典</a> · CC BY-ND 3.0 TW</p></details>
    <button class="primary" data-action="save-settings">儲存並返回</button>`, 'settings');
}
function footprints() {
  modal(`<h2>江湖足跡</h2><p>六枚文印已尋回。選擇已完成的故事重遊；每次都會重新安排十題。</p><div class="chapter-list">${ADVENTURE_STAGES.map(s=>`<button data-replay="${s.id}">${s.id+1}. ${s.name}</button>`).join('')}</div><button data-action="home">返回首頁</button>`, 'footprints');
}
function ultimate() {
  if(view!=='battle'||session.qi<5) return;
  session.qi=0; session.atb=0; session.shield=1; frozenUntil=performance.now()+CONFIG.freezeMs;
  scene.playUltimateBurst({damage:0}); notify('守護劍陣！八秒內對手停招，再抵擋一次回擊。'); render(); rememberSession();
  audio.playUltimateBurst();
}
function failed() {
  pause(); profile.session=session; persist();
  modal(`<h2>先調息，再出發</h2><p>你已完成 ${session.cursor} 題，進度保留。調息後從目前這一字接著練習。</p><p class="muted">回擊會放慢，找鍵提示持續陪著你。失敗不發放銅錢，完成十題再領獎。</p><button class="primary" data-action="recover">調息續戰 · Enter</button><button data-action="home">回到首頁</button>`, 'failed');
}
engine.on('keyHit',()=>{misses=0; audio.playKeyHit(engine.combo);scene.playMicroGather(engine.combo,engine.getComboTier());});
engine.on('charComplete',event=>{audio.playCharSlash(event.comboTier);scene.playCharSlash({charText:event.charObj.char,damage:0,isCrit:false,comboTier:event.comboTier});});
engine.on('miss',()=>{misses++;audio.playMiss(); const text=engine.currentWord.text; profile.weak[text]=(profile.weak[text]||0)+1; scene.playMissParry(); render(); rememberSession();});
engine.on('wordComplete',event=>{
  engine.active=false; session.cursor++; session.qi=Math.min(5,session.qi+1); session.atb=0;
  audio.playWordComplete(engine.getComboTier());
  scene.playWordFinisher({wordText:event.word.text,damage:0,isCrit:false,isParryBreak:stage.kind==='boss',comboTier:engine.getComboTier()});
  profile.weak[event.word.text]=Math.max(0,(profile.weak[event.word.text]||0)-1);
  if(session.cursor===10){finish();return;}
  engine.loadWord(session.queue[session.cursor]); session.typing=null; readUntil=performance.now()+CONFIG.graceMs;
  engine.active=true; render(); rememberSession();
  notify(stage.kind==='journey'?`前進第 ${session.cursor} 段路`:`${session.cursor}／10 · ${stage.kind==='boss'?phaseFor(session.cursor):'出招成功'}`);
});
for(const event of ['nextChar','nextSymbol']) engine.on(event,()=>{render();rememberSession();});
function keyboard() {
  $('keys').innerHTML=KEYBOARD_ROWS.map(row=>`<div class="key-row">${row.map(k=>`<div class="key ${k.finger.startsWith('右')?'right':''} ${k.isTone?'tone':''} ${['KeyF','KeyJ'].includes(k.code)?'home-key':''} ${k.code==='Space'?'space':''}" data-code="${k.code}"><small>${escape(k.en)}</small><span class="zy">${escape(k.code==='Space'?'一聲／空白鍵':k.zy)}</span><span class="en">${escape(k.code==='Space'?'空白鍵':k.en)}</span></div>`).join('')}</div>`).join('');
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button)return;
  if(button.dataset.buy){const weapon=WEAPONS.find(w=>w.id===button.dataset.buy);if(buyWeapon(save,weapon)){persist();setupScene();const back=resumeView;shop();resumeView=back;}else notify('銅錢還不夠，完成冒險再回來。');return;}
  if(button.dataset.replay){begin(false,Number(button.dataset.replay));return;}
  const action=button.dataset.action;
  if(action==='continue'){if(profile.stage===30&&!profile.session)footprints();else begin();}
  if(action==='start')start();
  if(action==='home')home();
  if(action==='shop')shop();
  if(action==='settings')settings();
  if(action==='return'){if(resumeView==='battle')closePanel();else home();}
  if(action==='recover'){session.hp=100;session.atb=0;session.slow=(session.slow||1)*1.25;readUntil=performance.now()+4000;closePanel();rememberSession();}
  if(action==='save-settings'){
    const changed=save.grade!==$('grade-select').value;
    save.grade=$('grade-select').value;save.hero=$('hero-select').value;save.keyboard=$('keyboard-select').checked;
    save.muted=!$('sound-select').checked;audio.setMuted(save.muted);
    profile=getProfile(save);profile.realm=$('realm-select').value;persist();setupScene();
    if(changed||resumeView!=='battle')home();else closePanel();
  }
});
$('home').onclick=home; $('shop').onclick=shop; $('settings').onclick=settings; $('ultimate').onclick=ultimate;
function toggleKeyboard(){save.keyboard=!save.keyboard;persist();render();}
$('hide-keyboard').onclick=toggleKeyboard; $('show-keyboard').onclick=toggleKeyboard;
$('panel').addEventListener('cancel',event=>{event.preventDefault();if(view==='shop'&&resumeView==='battle')closePanel();else home();});
document.addEventListener('keydown',event=>{
  if(event.repeat)return;
  if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
  if(event.code==='Enter'&&view!=='battle'){event.preventDefault();$('panel-content').querySelector('.primary')?.click();return;}
  if(event.code==='Escape'&&view==='battle'){event.preventDefault();settings();return;}
  if(view!=='battle'||document.hidden)return;
  if(event.code==='Tab'){event.preventDefault();toggleKeyboard();return;}
  if(event.altKey&&event.code==='Digit1'){event.preventDefault();ultimate();return;}
  engine.handleKeyDown(event);
},true);
document.addEventListener('compositionupdate',event=>{if(view==='battle')engine.handleCompositionUpdate(event);});
document.addEventListener('visibilitychange',()=>{engine.setPaused(document.hidden||view!=='battle');lastTick=performance.now();});
window.addEventListener('pagehide',rememberSession);
window.addEventListener('resize',()=>{if(view==='battle')render();});
function tick(now){
  const dt=Math.min(100,now-lastTick);lastTick=now;
  if(view==='battle'&&!document.hidden&&now>readUntil&&now>frozenUntil&&engine.wordStartTime!==null){
    const phaseMultiplier=stage.kind==='boss'?(session.cursor<3?1.2:session.cursor<7?1:.9):1;
    const duration=attackDuration(engine.currentWord,save.grade,session.realm||profile.realm,stage.kind)*phaseMultiplier*(session.slow||1)*(misses>=2?1.5:1);
    session.atb=Math.min(100,session.atb+dt/duration*100);
    scene.setEnemyDangerAlert(session.atb>75);
    if(session.atb>=100){session.atb=0;if(session.shield){session.shield=0;scene.playMissParry(true);notify('守護劍陣擋住了回擊！');}else{session.hp=Math.max(0,session.hp-CONFIG.damage);scene.playEnemyAttack(CONFIG.damage);audio.playPlayerHurt();if(!session.hp)failed();}render();rememberSession();}
    $('atb').value=session.atb;$('hp').value=session.hp;
  }
  requestAnimationFrame(tick);
}
keyboard();setupScene();home();requestAnimationFrame(tick);
if(firstVisit){
  settings();resumeView='home';
  $('panel-content').insertAdjacentHTML('afterbegin','<span class="eyebrow">第一次踏入江湖</span><p>選一次年級與同行少俠，之後直接繼續冒險。</p>');
  $('realm-select').closest('label').hidden=true;
  $('keyboard-select').closest('label').hidden=true;
  $('sound-select').closest('label').hidden=true;
  $('panel-content').querySelector('.muted').hidden=true;
}
