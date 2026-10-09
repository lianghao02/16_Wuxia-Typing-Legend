import { TypingEngine } from './engine/TypingEngine.js';
import { sentenceWindow } from './engine/sentenceLayout.js';
import { battleLayout, FIGHTER_VISIBLE_WIDTH } from './engine/battleLayout.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { CanvasBattleScene } from './scenes/CanvasBattleScene.js';
import { HEROES } from './data/enemies.js';
import { KEYBOARD_ROWS, BOPOMOFO_TO_KEY_INFO, EN_TO_KEY_INFO } from './data/daqianLayout.js';
import { getGradeMixedWords } from './data/textbooks.js';
import { ENGLISH_PRACTICE_BANKS } from './data/practice.js';
import { parseAdventureCustomWords } from './data/vocabulary.js';
import { buildGradeQuestionQueue, buildAdaptiveQuestionBatch, recordQuestionHistory } from './data/gradeQuestionMix.js';
import { getDictionaryUsage, getWordUsageHint, getCharacterReadings } from './data/moeDictionary.js';
import { ADVENTURE_STAGES, CHAPTERS, REALMS } from './data/adventureWorld.js';
import {
  ADVENTURE_KEY, CONFIG, ADVENTURE_WEAPONS, SPIRIT_BEASTS, ADVENTURE_BRACERS, ADVENTURE_ARMORS, ADVENTURE_POTIONS,
  DAILY_QUEST_DEFS, getBeastBond, addBeastBondExp, feedSpiritBeast, getSealForStats, ensureDailyState, recordDailyProgress,
  newAdventure, migrateAdventureSave, getProfile, getActiveLoadout, phaseFor, bossPhaseForHp, advanceBossPhase,
  calculateAttackDamage, stageHazard, attackDuration, awardStage, buyGear, buyPotion, favorFresh
} from './engine/AdventureEngine.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const gradeLabel = (g = save?.grade) => g === 'english' ? '英文' : g === 'custom' ? '自訂聯絡簿' : `${g} 年級`;
let save, firstVisit = false, storageFailed = false;
try {
  const raw = localStorage.getItem(ADVENTURE_KEY);
  const parsed = raw ? JSON.parse(raw) : newAdventure(JSON.parse(localStorage.getItem('wuxia_typing_legend_save_v2') || '{}'));
  if (!parsed || typeof parsed !== 'object' || !parsed.profiles || !Array.isArray(parsed.owned)) throw new Error('存檔格式不符');
  save = migrateAdventureSave(parsed);
  firstVisit = !raw;
} catch { save = newAdventure(); firstVisit = true; storageFailed = true; }
const getWeapon = () => ADVENTURE_WEAPONS.find(w => w.id === save.weapon) || ADVENTURE_WEAPONS[0];
const getBeast = () => SPIRIT_BEASTS.find(b => b.id === save.beast) || SPIRIT_BEASTS[0];
const getLoadout = () => getActiveLoadout(save);
const getBracer = () => ADVENTURE_BRACERS.find(b => b.id === save.bracer) || ADVENTURE_BRACERS[0];
const getArmor = () => ADVENTURE_ARMORS.find(a => a.id === save.armor) || ADVENTURE_ARMORS[0];
let profile = getProfile(save), stage, session, view = 'home', misses = 0, wordMisses = 0, frozenUntil = 0, shopTab = 'weapon';
let readUntil = 0, noticeTimer, lastTick = performance.now(), resumeView = 'home', statusDotAcc = 0;
let windowFocused = true, lastMissAt = 0, lastMissCharIndex = -1, lastRetainedCombo = 0, wrongKeyCode = '', wrongKeyTimer = null;
const engine = new TypingEngine();
const audio = new AudioEngine();
audio.applySettings(save.audioSettings || { bgm: save.bgm !== false, sfx: save.sfx !== false, speech: save.speech !== false, muted: Boolean(save.muted) });
class AdventureScene extends CanvasBattleScene {
  constructor(id) {
    super(id);
    this.attackCanvas=document.createElement('canvas');
    this.attackCanvas.id='attack-overlay';
    this.attackCanvas.setAttribute('aria-hidden','true');
    document.body.append(this.attackCanvas);
    this.attackUntil=0;
    this.enemyAttackUntil=0;
  }
  playWordFinisher(detail) {
    super.playWordFinisher(detail);
    this.attackReduced=this.reducedMotion;
    this.attackDuration=this.attackReduced?180:450;
    this.attackUntil=performance.now()+this.attackDuration;
  }
  playEnemyAttack(damage) {
    super.playEnemyAttack(damage);
    this.enemyAttackReduced=this.reducedMotion;
    this.enemyAttackDuration=this.enemyAttackReduced?180:420;
    this.enemyAttackUntil=performance.now()+this.enemyAttackDuration;
  }
  setupBattle(config) {
    this.attackUntil=0;
    this.enemyAttackUntil=0;
    super.setupBattle(config);
  }
  hasForegroundAttack() {
    return this.attackCanvas && performance.now()<this.attackUntil && !$('battle').hidden && !$('panel').open;
  }
  hasForegroundEnemyAttack() {
    return this.attackCanvas && performance.now()<this.enemyAttackUntil && !$('battle').hidden && !$('panel').open;
  }
  render() {
    if(this.width!==window.innerWidth||this.height!==window.innerHeight)this.resize();
    super.render();
    if(!this.attackCanvas)return;
    const canvas=this.attackCanvas;
    if(canvas.width!==this.width||canvas.height!==this.height){canvas.width=this.width;canvas.height=this.height;}
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,this.width,this.height);
    const heroAttack=this.hasForegroundAttack(),enemyAttack=this.hasForegroundEnemyAttack();
    if(!heroAttack&&!enemyAttack)return;
    // 透明演出層僅畫人物與劍氣／刀罡／槍芒；題目保持在這一層上方。
    const questionBottom=$('question').getBoundingClientRect().bottom;
    const maxAttackY=this.layout.stacked?this.heroBaseY:$('controls').getBoundingClientRect().top-50;
    this.attackDrawHeight=this.layout.stacked?this.layout.fighterHeight:Math.min(this.layout.fighterHeight,Math.max(1,(maxAttackY-questionBottom-8)/.68));
    const attackY=this.layout.stacked?this.heroBaseY:Math.min(maxAttackY,Math.max(this.heroBaseY,questionBottom+8+this.attackDrawHeight*.68));
    if(heroAttack){
      const progress=1-(this.attackUntil-performance.now())/this.attackDuration;
      const advance=(this.enemyBaseX-this.heroBaseX)*.58*(this.attackReduced?0:Math.sin(Math.PI*progress));
      if(this.layout.stacked){ctx.save();ctx.beginPath();ctx.rect(0,0,this.width,attackY+18);ctx.clip();}
      super.drawHero(ctx,this.heroBaseX+advance,attackY);
      if(this.layout.stacked)ctx.restore();
    }
    if(enemyAttack){
      const progress=1-(this.enemyAttackUntil-performance.now())/this.enemyAttackDuration;
      const advance=(this.enemyBaseX-this.heroBaseX)*.55*(this.enemyAttackReduced?0:Math.sin(Math.PI*progress));
      if(this.layout.stacked){ctx.save();ctx.beginPath();ctx.rect(0,0,this.width,attackY+18);ctx.clip();}
      super.drawEnemy(ctx,this.enemyBaseX-advance,attackY);
      if(this.layout.stacked)ctx.restore();
    }
    this.attackDrawHeight=null;
    for(const s of this.slashes){
      const alpha=Math.max(0,1-s.life/s.maxLife);
      ctx.save();
      if(s.isSpearStar){
        ctx.translate(s.x1,s.y1);
        ctx.strokeStyle=`rgba(${s.rgb},${alpha*.85})`;ctx.lineWidth=14;ctx.beginPath();ctx.arc(0,0,s.radius*.72,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=5;const arm=s.radius*1.15;
        ctx.beginPath();ctx.moveTo(-arm,0);ctx.lineTo(arm,0);ctx.moveTo(0,-arm*.85);ctx.lineTo(0,arm*.85);ctx.stroke();
      }else if(s.isSpearThrust){
        ctx.lineCap='round';ctx.strokeStyle=`rgba(${s.rgb},${alpha*.7})`;ctx.lineWidth=s.thickness*3;
        ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
        ctx.strokeStyle=`rgba(255,255,255,${alpha})`;ctx.lineWidth=Math.max(3,s.thickness*.8);
        ctx.beginPath();ctx.moveTo(s.x1+45,s.y1);ctx.lineTo(s.x2+20,s.y2);ctx.stroke();
      }else{
        ctx.strokeStyle=`rgba(${s.rgb},${alpha})`;ctx.lineWidth=s.isWave?(s.isSaberArc?24:12):s.thickness*(s.isSaberArc?2.2:1);ctx.lineCap='round';ctx.beginPath();
        if(s.isWave){ctx.arc(s.x1+(s.life/s.maxLife)*(s.isSaberArc?56:48),s.y1,s.radius,s.isSaberArc?-1.3: -1.15,s.isSaberArc?1.3:1.15);}
        else{ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);}
        ctx.stroke();
        if(s.isSaberArc&&s.secondaryRgb){
          ctx.strokeStyle=`rgba(${s.secondaryRgb},${alpha*.9})`;ctx.lineWidth=s.isWave?10:s.thickness;ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  spawnFloatingText(x,y,text,color,size) {
    const label=String(text)
      .replace(/劍氣 0/g,'劍意')
      .replace(/刀罡 0/g,'烈焰刀罡')
      .replace(/槍芒 0/g,'雷霆槍芒')
      .replace(/ 0・/g,'・')
      .replace(/・破題 \+1/g,'・出招成功')
      .replace(/傷害 0/g,'守護');
    super.spawnFloatingText(x,y,label,color,size);
  }
  resize() {
    super.resize();
    this.layoutBattle();
  }
  layoutBattle() {
    const q=$('question').getBoundingClientRect(),k=$('keyboard').getBoundingClientRect();
    this.layout=battleLayout(this.width,this.height,q.bottom+12,$('keyboard').hidden?this.height-70:k.top-12,!$('keyboard').hidden);
    document.body.style.setProperty('--battle-center',`${this.layout.center}px`);
    document.body.style.setProperty('--battle-side',`${this.layout.side}px`);
    this.heroBaseX=this.layout.heroX;this.enemyBaseX=this.layout.enemyX;
    this.heroBaseY=this.enemyBaseY=this.layout.baseline;
    if(this.layout.stacked)document.body.style.setProperty('--fighter-status-top',`${($('keyboard').hidden?this.height-70:k.top-12)-48}px`);
  }
  getFighterImageHeight() { return this.attackDrawHeight || this.layout?.fighterHeight || 200; }
  drawHero(ctx,x,y) {
    if(this.hasForegroundAttack())return;
    const margin=this.getFighterImageHeight()*FIGHTER_VISIBLE_WIDTH/2;
    const low=this.layout.stacked?0:12,high=this.layout.stacked?this.width*.44:this.layout.side-12;
    if(this.layout.stacked){ctx.save();ctx.beginPath();ctx.rect(0,0,this.width,y+18);ctx.clip();}
    super.drawHero(ctx,Math.max(low+margin,Math.min(high-margin,x)),y);
    if(this.layout.stacked)ctx.restore();
  }
  drawEnemy(ctx,x,y) {
    if(this.hasForegroundEnemyAttack())return;
    const margin=this.getFighterImageHeight()*FIGHTER_VISIBLE_WIDTH/2;
    const low=this.layout.stacked?this.width*.56:this.width-this.layout.side+12,high=this.width-12;
    if(this.layout.stacked){ctx.save();ctx.beginPath();ctx.rect(0,0,this.width,y+18);ctx.clip();}
    super.drawEnemy(ctx,Math.max(low+margin,Math.min(high-margin,x)),y);
    if(this.layout.stacked)ctx.restore();
  }
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
function setupScene() {
  const curStage = stage || ADVENTURE_STAGES[0];
  scene.setupBattle({
    hero: HEROES[save.hero] || HEROES.yun,
    weapon: getWeapon(),
    beast: save.hero === 'mu' ? getBeast() : null,
    stage: curStage
  });
  scene.setEnemyHazard(stageHazard(curStage)?.type || null);
  scene.setEnemyPoisoned(Boolean(session?.enemyPoisonTurns > 0));
  if (session?.status) scene.setHeroStatus(session.status);
}
function rememberSession() {
  if (!session || view !== 'battle') return;
  session.typing = engine.getProgress(); profile.session = session; persist();
}
function pause() { rememberSession(); engine.active = false; engine.setPaused(true); }
function modal(html, nextView) {
  pause(); view = nextView; $('panel-content').innerHTML = html;
  if (!$('panel').open) $('panel').showModal();
  $('panel-content').querySelector('button.primary, .actions button, button')?.focus();
}
function closePanel() {
  $('panel').close(); view = 'battle'; engine.active = true; engine.setPaused(document.hidden);
  lastTick = performance.now(); render();
  $('battle').focus();
}
function datestring() { const now = new Date(); return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`; }
function home() {
  ensureDailyState(save, datestring());
  persist();
  const loadout = getLoadout(), b = getBracer(), a = getArmor();
  const weakCount = Object.keys(profile.weak || {}).length;
  const dq = save.dailyQuests || { progress: {}, claimed: {} };
  const streakCount = typeof save.streak === 'object' ? (save.streak?.count || 0) : (Number(save.streak) || 0);
  const dailyHtml = `<div class="daily-bar">
    <span class="streak-chip">🔥 連續修煉 <strong>${streakCount}</strong> 天</span>
    <div class="quest-list">${DAILY_QUEST_DEFS.map(q => {
      const cur = Math.min(q.target, dq.progress?.[q.field] || 0);
      const done = Boolean(dq.claimed?.[q.id]);
      return `<span class="quest-chip ${done ? 'done' : ''}" title="${escape(q.desc)}">${done ? '✅' : '📜'} ${escape(q.title)} ${cur}／${q.target} <small>+${q.reward}銅錢</small></span>`;
    }).join('')}</div>
  </div>`;
  audio.switchBgm('title');
  modal(`<span class="eyebrow">武俠打字傳 · 文印江湖</span><h1>以字為劍，找回江湖的記憶</h1>
    <p>六枚文印散落各地，書信失去了文字。與雲清川、蘇映雪、林牧風一起穿越六處江湖，讓朋友們重新讀懂彼此的故事。</p>
    ${dailyHtml}
    <div class="chapter-list">${CHAPTERS.map((c,i)=>`<div class="${profile.records[i*5+4]?'earned':''}">${profile.records[i*5+4]?'✦':'◇'} ${c.name}<br>${profile.records[i*5+4]?c.seal+'文印已尋回':`第 ${i*5+1}～${i*5+5} 關`}</div>`).join('')}</div>
    <p class="muted">${gradeLabel(save.grade)} · ${REALMS[profile.realm]} · 已完成 ${Object.keys(profile.records).length}／30 關<br>同行：${(HEROES[save.hero]||HEROES.yun).name}｜${loadout.name.split('・')[1]||loadout.name}${save.hero==='mu'&&loadout.bondTitle?`（羈絆 Lv.${loadout.bondLevel}・${loadout.bondTitle}）`:''}｜${b.name}｜${a.name} · 空白鍵完成一聲，Tab 開關鍵盤，Alt＋1 施放${loadout.ultName||'守護絕招'}。</p>
    <div class="actions">
      <button class="primary" data-action="continue">${profile.stage===30?'重遊江湖':profile.session?'繼續上次冒險':'繼續冒險'} · Enter</button>
      <button data-action="footprints">🗺️ 選關（${Object.keys(profile.records).length}／30）</button>
      <button data-action="weak-dojo">📖 錯題墨寶閣${weakCount?`（${weakCount}）`:''}</button>
      <button data-action="custom-words">📜 聯絡簿自訂</button>
      <button data-action="shop">🏮 客棧</button>
      <button data-action="settings">⚙️ 設定</button>
    </div>
    <p class="muted">${storageFailed?'目前無法儲存進度。':'冒險進度自動儲存在此瀏覽器。'} <a href="./classic.html">原版修煉入口</a></p>`, 'home');
  $('battle').hidden = true; $('journey-hud').hidden = true; $('controls').hidden = true;
}
function getBasePool() {
  if (save.grade === 'english') return ENGLISH_PRACTICE_BANKS[profile.realm];
  if (save.grade === 'custom') {
    const parsed = parseAdventureCustomWords(save.customRaw || '');
    if (parsed.words.length > 0) return parsed.words;
  }
  return getGradeMixedWords(Number(save.grade) || 3);
}
function makeQueue(sessionUsed = [], count = 10, forceWeakDrill = false) {
  const isEn = save.grade === 'english';
  const pool = getBasePool();
  const isDrill = forceWeakDrill || Boolean(session?.isWeakDrill);
  if (isDrill) {
    const weakEntries = Object.entries(profile.weak || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
    const weakTexts = weakEntries.map(([t]) => t);
    const matched = [];
    for (const text of weakTexts) {
      const found = pool.find(w => w.text === text) || parseAdventureCustomWords(text).words[0];
      if (found) matched.push({ ...found, isReview: true });
    }
    if (matched.length > 0) {
      const result = [];
      for (let i = 0; i < count; i++) {
        result.push({ ...matched[i % matched.length], isReview: true });
      }
      return result;
    }
  }
  const effectiveGrade = save.grade === 'custom' ? '3' : save.grade;
  const batch = buildAdaptiveQuestionBatch(pool, effectiveGrade, profile.realm, {
    sessionUsed,
    recentList: isEn ? (profile.recentEn || []) : (profile.recentZh || profile.recent || []),
    practicedMap: profile.practiced || {},
    weakMap: profile.weak || {},
    count
  });
  if (save.grade === 'custom' && pool.length > 0 && batch.length < count) {
    while (batch.length < count) {
      batch.push({ ...pool[batch.length % pool.length] });
    }
  }
  return batch;
}
function ensureSessionQueue() {
  if (!session || !stage?.isCombat || session.enemyHp <= 0) return;
  if (session.queue.length - session.cursor < 4) {
    const used = session.queue.map(w => w.text);
    const extra = makeQueue(used, 8, session.isWeakDrill);
    session.queue.push(...extra);
  }
}
function begin(resume = true, replayId = null, weakDrill = false) {
  const savedSession = profile.session;
  const savedStage = savedSession && Number.isInteger(savedSession.stageId) ? ADVENTURE_STAGES[savedSession.stageId] : null;
  const valid = Boolean(
    !weakDrill &&
    savedStage &&
    Array.isArray(savedSession.queue) &&
    savedSession.queue.length > savedSession.cursor &&
    (savedStage.isCombat ? (savedSession.enemyHp === undefined || savedSession.enemyHp > 0) : savedSession.cursor < (savedStage.targetWords || 10))
  );
  const targetStageId = resume && valid ? savedSession.stageId : (replayId ?? Math.min(profile.stage, 29));
  stage = ADVENTURE_STAGES[targetStageId] || ADVENTURE_STAGES[0];
  const maxHp = weakDrill ? 95 : (stage.enemy?.maxHp || 100);
  session = resume && valid ? savedSession : {
    stageId: stage.id,
    realm: profile.realm,
    isWeakDrill: Boolean(weakDrill),
    queue: makeQueue([], 10, weakDrill),
    cursor: 0,
    hp: 100,
    enemyMaxHp: maxHp,
    enemyHp: maxHp,
    bossPhaseIndex: 0,
    enemyPoisonTurns: 0,
    qi: 0,
    atb: 0,
    shield: getArmor().startShield || 0,
    status: null,
    statusCureNeed: 0,
    mistakeNotes: [],
    typing: null
  };
  session.realm = profile.realm;
  session.enemyMaxHp ||= maxHp;
  if (typeof session.enemyHp !== 'number') {
    session.enemyHp = Math.max(10, Math.round(session.enemyMaxHp * (1 - (session.cursor || 0) / 10)));
  }
  session.bossPhaseIndex = bossPhaseForHp(session.enemyHp, session.enemyMaxHp, session.bossPhaseIndex || 0).index;
  session.enemyPoisonTurns ||= 0;
  session.status ||= null;
  session.statusCureNeed ||= 0;
  session.mistakeNotes ||= [];
  ensureSessionQueue();
  setupScene(); engine.resetStats();
  wordMisses = 0;
  engine.loadWord(session.queue[session.cursor]);
  if (session.typing) engine.restoreProgress(session.typing);
  if (session.cursor > 0 && engine.completedWords < session.cursor) {
    engine.completedWords = session.cursor;
    engine.completedChars = Math.max(engine.completedChars, session.queue.slice(0, session.cursor).reduce((sum, w) => sum + Array.from(w.text || '').length, 0));
  }
  misses=0; frozenUntil=0; statusDotAcc=0; readUntil=performance.now()+CONFIG.graceMs;
  audio.switchBgm('story');
  const loadout = getLoadout();
  const hazard = stageHazard(stage);
  const hazardTip = hazard ? `<br>${hazard.icon} 本關對手招式帶有「<strong>${hazard.label}</strong>」，若受擊染上狀態，<strong>連續打對 2 個字</strong>即可運功化解！` : '';
  const chapterIntro = !session.isWeakDrill && session.cursor===0 && !session.typing && stage.id%5===0 ? CHAPTERS[stage.chapter].intro : '';
  const victoryTip = `氣血對決（對手氣血 ${session.enemyHp}／${session.enemyMaxHp}）：每完整打完一道題目，即可依字數、連擊、${save.hero==='mu'?'靈獸戰技':'兵器流派'}施展招式削減對手氣血，歸零即獲勝！`;
  modal(`<span class="eyebrow">${session.isWeakDrill ? '📖 錯題墨寶閣 · 掃除特訓' : `第 ${stage.chapter+1} 章 · ${stage.chapterName}`}</span><h2>${session.isWeakDrill ? `${stage.name}（錯題掃除戰）` : stage.name}</h2>
    ${chapterIntro?`<p>${escape(chapterIntro)}</p>`:''}<p class="story">${session.isWeakDrill ? '集中演練近期曾按錯的字詞與注音，擊破對手即可消去錯題紀錄並獲贈勤學特訓賞金 ＋35 銅錢！' : stage.intro}</p>
    <p class="muted">${stage.kind==='boss'?'首領三階切磋（100%～70% 試探 → 70%～30% 破防 → 30% 以下決勝），攻勢隨血量變化。':'打完每個單字可壓制對手蓄力，整題打完即出招造成傷害；在對手「⚡即將出招」瞬間完成整題可觸發【看破破綻】反擊！'}${hazardTip}<br>${victoryTip} 絕招滿五點後可施展${loadout.ultName||'守護絕招'}。</p>
    <button class="primary" data-action="start">${session.cursor||session.typing?'接續交手':'踏入江湖'} · Enter</button>`, 'intro');
}
function start() {
  $('battle').hidden=false; $('journey-hud').hidden=false; $('controls').hidden=false;
  readUntil=performance.now()+CONFIG.graceMs;
  audio.switchBgm(stage?.kind === 'boss' ? 'boss' : 'battle');
  closePanel();
  if(session.hp<=0){failed();return;}
  rememberSession();
}
function render() {
  if (!stage || !session) return;
  $('stage-name').textContent = `${stage.chapterName} · ${stage.name}${session.isWeakDrill ? '（錯題特訓）' : ''}`;
  const isReviewWord = Boolean(engine.currentWord?.isReview);
  const reviewTag = isReviewWord ? ' · 🔁錯題複習' : '';
  const enemyPct = Math.max(0, Math.min(100, Math.round((session.enemyHp / (session.enemyMaxHp || 100)) * 100)));
  const doneDots = Math.min(10, Math.max(0, Math.floor((100 - enemyPct) / 10)));
  $('progress').textContent = `${gradeLabel(save.grade)} · ${REALMS[session.realm||profile.realm]} · 已出招 ${session.cursor} 題 · 對手剩餘 ${enemyPct}% 氣血${reviewTag}`;
  $('route').innerHTML = Array.from({length:10},(_,i)=>`<i class="${i<doneDots?'done':''}"></i>`).join('');
  const bossPhase = stage.kind === 'boss' ? bossPhaseForHp(session.enemyHp, session.enemyMaxHp, session.bossPhaseIndex || 0) : null;
  const phaseLabel = stage.kind === 'boss'
    ? `首領切磋 · ${bossPhase.name}階段`
    : {training:'練功切磋 · 擊破機關靶',journey:'江湖歷練 · 擊退攔路對手',event:'俠義委託 · 化解眼前危機',duel:'正面交手 · 擊敗眼前對手'}[stage.kind];
  $('phase').innerHTML=`<span>${escape(phaseLabel)}${isReviewWord?' <strong class="review-badge">🔁 錯題複習</strong>':''}</span><span class="speak-hint">🔊 點題目聽發音</span>`;
  const english=engine.mode==='english';
  $('keyboard').classList.toggle('english-keys',english);
  $('keyboard-label').textContent=english?'英文鍵盤 · F／J 定位點':'大千注音 · F／J 定位點';
  const length=engine.characters.length;
  let left=english?Math.floor(engine.charIndex/12)*12:Math.floor(engine.charIndex/4)*4;
  let right=Math.min(length,left+(english?12:4));
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
    const rows=parseInt(getComputedStyle($('question')).getPropertyValue('--sentence-rows'))||2;
    ({left,right}=sentenceWindow(length,engine.charIndex,columns,rows));
    const current=engine.characters[engine.charIndex];
    $('context').innerHTML=`<span class="sounds" aria-label="目前字的注音">${current?sounds(current,true):''}</span>${length>right||left>0?`<small class="sentence-range">${left+1}～${right}／${length} 字</small>`:''}`;
    $('characters').innerHTML=engine.characters.slice(left,right).map((ch,i)=>`<span class="sentence-char ${ch.completed?'done':''} ${left+i===engine.charIndex?'current':''}" ${left+i===engine.charIndex?'aria-current="true"':''}>${escape(ch.char)}</span>`).join('');
  } else {
    $('context').textContent=length>(english?12:4)?`${engine.currentWord.text} · ${left+1}～${right} 字`:'';
    $('characters').innerHTML=engine.characters.slice(left,right).map((ch,i)=>`<div class="char ${ch.completed?'done':''} ${left+i===engine.charIndex?'current':''}"><div class="sounds">${sounds(ch,left+i===engine.charIndex)}</div><strong>${escape(ch.char===' '?'␣':ch.char)}</strong></div>`).join('');
  }
  const word=engine.currentWord;
  $('usage').textContent=english?(word.meaning||''):(getWordUsageHint(word)||'');
  const info=engine.getExpectedKeyInfo();
  $('next-key').classList.toggle('help',misses>=2);
  const symbol=engine.getExpectedSymbol();
  const symLabel=symbol==='˙'?'˙ (輕聲)':symbol==='␣'?'␣ (一聲)':symbol;
  $('next-key').innerHTML=info?`${misses>=2?'慢慢來，':''}${english?'':escape(symLabel)+' → '}按 <kbd>${escape(info.en==='Space'?'空白鍵':info.en)}</kbd> · ${escape(info.finger)}`:'完成！';
  $('keyboard').hidden=!save.keyboard;
  $('show-keyboard').hidden=save.keyboard;
  for(const key of $('keys').querySelectorAll('.key')){
    key.classList.toggle('active',key.dataset.code===info?.code);
    key.classList.toggle('wrong',Boolean(wrongKeyCode)&&key.dataset.code===wrongKeyCode&&key.dataset.code!==info?.code);
  }
  const loadout = getLoadout();
  const statusLabels = { poison: `☠️中毒(再對${session.statusCureNeed||1}字解毒)`, burn: `🔥灼傷(再對${session.statusCureNeed||1}字滅火)`, freeze: `❄️結冰(再對${session.statusCureNeed||1}字破冰)` };
  const statusText = session.status ? ` · ${statusLabels[session.status]}` : '';
  const healCnt = save.potions?.heal_potion || 0;
  const antiCnt = save.potions?.antidote_potion || 0;
  const heroObj = HEROES[save.hero] || HEROES.yun;
  $('hero-name').textContent=`${heroObj.name} · ${loadout.name.split('・')[1]||loadout.name}`;
  $('hp').value=session.hp;
  const tier=engine.getComboTier();
  const comboBadge=tier===3?'🐉龍鳳劍意':tier===2?'⚡驚雷流雲':tier===1?'🌪️清風劍氣':'';
  $('hero-status').dataset.comboTier=String(tier);
  $('hero-status').dataset.status=session.status||'';
  $('question').dataset.comboTier=String(tier);
  $('hero-detail').textContent=`氣血 ${session.hp}／100${statusText} · 連擊 ${engine.combo}${comboBadge?` (${comboBadge})`:''} · 銅錢 ${save.coins} · 🧪回春×${healCnt}(Alt+2)·清心×${antiCnt}`;
  const hazard = stageHazard(stage);
  const hazardBadge = hazard ? ` · ${hazard.icon}${hazard.label}` : '';
  const isDanger = session.atb > 75;
  scene.setEnemyDangerAlert(isDanger);
  const baseEnemyName = stage.name;
  $('enemy-name').textContent = isDanger ? `⚡即將出招！${baseEnemyName}` : baseEnemyName;
  const maxHp = session.enemyMaxHp || stage.enemy?.maxHp || 100;
  const poisonTag = session.enemyPoisonTurns > 0 ? ` · ☠️中毒(${session.enemyPoisonTurns})` : '';
  $('enemy-hp').value = Math.max(0, Math.min(100, Math.round((session.enemyHp / maxHp) * 100)));
  $('enemy-detail').textContent = `氣血 ${session.enemyHp}／${maxHp}${poisonTag} · ${stage.kind==='boss'?bossPhase.name:(stage.enemy?.title||'正面交手')}${hazardBadge}`;
  $('atb').value=session.atb;
  $('atb').hidden=false;
  $('ultimate').disabled=session.qi<5;
  const ultTitle = loadout.ultName || '守護劍陣';
  $('ultimate').textContent=session.qi>=5?`${ultTitle} · Alt＋1`:`${ultTitle} ${session.qi}／5 · Alt＋1`;
  scene.layoutBattle();
}
function applyPlayerAttack(actionType, extra = {}) {
  const loadout = getLoadout();
  if (!stage?.isCombat) {
    return { finalDamage: 0, isCrit: false, multiHitCount: 1, atbBreak: 0, applyPoison: false, poisonDamage: 0, loadout };
  }
  const dmgResult = calculateAttackDamage({
    actionType,
    wordObj: extra.wordObj || engine.currentWord,
    charObj: extra.charObj || engine.characters[engine.charIndex],
    combo: extra.combo ?? engine.combo,
    grade: save.grade,
    loadout,
    stage,
    enemyHp: session.enemyHp,
    enemyMaxHp: session.enemyMaxHp,
    enemyPoisoned: session.enemyPoisonTurns > 0,
    isParryBreak: Boolean(extra.isParryBreak),
    isPerfectWord: Boolean(extra.isPerfectWord)
  });
  const totalDmg = dmgResult.finalDamage;
  if (actionType === 'word' && (dmgResult.applyPoison || session.enemyPoisonTurns > 0)) {
    if (dmgResult.applyPoison) {
      session.enemyPoisonTurns = Math.max(session.enemyPoisonTurns || 0, dmgResult.poisonTurns || 3);
      scene.setEnemyPoisoned(true);
    }
    if (session.enemyPoisonTurns > 0) {
      session.enemyPoisonTurns = Math.max(0, session.enemyPoisonTurns - 1);
      if (session.enemyPoisonTurns === 0) scene.setEnemyPoisoned(false);
    }
  }
  session.enemyHp = Math.max(0, session.enemyHp - totalDmg);
  if ((actionType === 'ultimate' || actionType === 'ult') && dmgResult.atbBreak > 0) {
    session.atb = Math.max(0, session.atb - dmgResult.atbBreak);
  }
  if (stage.kind === 'boss') {
    const phaseCheck = advanceBossPhase(session.bossPhaseIndex || 0, session.enemyHp, session.enemyMaxHp);
    if (phaseCheck.changed) {
      session.bossPhaseIndex = phaseCheck.index;
      notify(`⚔️ 首領進入【${phaseCheck.name}】階段！攻勢與招式產生變化！`);
    }
  }
  return { ...dmgResult, finalDamage: totalDmg, loadout };
}
function finish() {
  pause();
  scene.playEnemyDefeat();
  const mistakeNotes = session?.mistakeNotes ? [...session.mistakeNotes] : [];
  const wasWeakDrill = Boolean(session?.isWeakDrill);
  if (session) {
    session.status = null;
    session.statusCureNeed = 0;
    session.enemyPoisonTurns = 0;
    scene.setHeroStatus(null);
    scene.setEnemyPoisoned(false);
  }
  audio.switchBgm('story');
  audio.playVictory();
  const stats={
    ...engine.getStats(),
    completedWords: Math.max(1, engine.completedWords || session?.cursor || 1),
    enemyHp: stage?.isCombat ? 0 : undefined,
    realm: session?.realm || profile.realm
  };
  const today = datestring();
  const reward=awardStage(save,profile,stage.id,stats,today);
  const newlyQuests = recordDailyProgress(save, today, { stages: 1 });
  const answered = session.queue.slice(0, Math.max(1, session.cursor)).map(w => w.text);
  const isEn = save.grade === 'english';
  for (const text of answered) recordQuestionHistory(profile, text, isEn);
  // 江湖奇遇掉寶：首領關或達成 10+ 連字時，贈送未滿丹藥或額外紅包
  let lootHtml = '';
  if (stage.kind === 'boss' || stats.maxCombo >= 10) {
    save.potions ||= { heal_potion: 0, antidote_potion: 0 };
    if ((save.potions.heal_potion || 0) < 2) {
      save.potions.heal_potion = (save.potions.heal_potion || 0) + 1;
      lootHtml = `<div class="bonus-loot">🎁 江湖奇遇掉寶：獲贈【九轉回春丹 ×1】！（目前持有 ${save.potions.heal_potion}／2）</div>`;
    } else if ((save.potions.antidote_potion || 0) < 2) {
      save.potions.antidote_potion = (save.potions.antidote_potion || 0) + 1;
      lootHtml = `<div class="bonus-loot">🎁 江湖奇遇掉寶：獲贈【清心淨化散 ×1】！（目前持有 ${save.potions.antidote_potion}／2）</div>`;
    } else {
      save.coins += 25;
      lootHtml = `<div class="bonus-loot">🎁 江湖奇遇賞金：丹藥已滿，額外獲贈【奇遇紅包 ＋25 銅錢】！</div>`;
    }
  }
  if (wasWeakDrill) {
    for (const text of new Set(answered)) {
      if (profile.weak?.[text]) {
        profile.weak[text] -= 2;
        if (profile.weak[text] <= 0) delete profile.weak[text];
      }
    }
    save.coins += 35;
    lootHtml += `<div class="bonus-loot">🎓 錯題掃除特訓圓滿：已掃除本輪演練錯字，額外獲贈【勤學特訓賞金 ＋35 銅錢】！</div>`;
  }
  if (newlyQuests.length > 0) {
    lootHtml += `<div class="bonus-loot">📅 達成今日江湖懸賞：${newlyQuests.map(q => `【${escape(q.title)} ＋${q.reward} 銅錢】`).join('、')}！</div>`;
  }
  const sealGrade = getSealForStats(stats);
  const notesHtml = mistakeNotes.length
    ? `<div class="mistake-notes"><strong>📖 本關練功小錦囊（點擊可聽發音）：</strong><div class="mistake-list">${mistakeNotes.map(n => `<button type="button" class="mistake-chip" data-speak="${escape(n.char)}" data-lang="${escape(n.lang || 'zh-TW')}">${escape(n.char)} <small>${escape(n.reading)}</small> 🔊</button>`).join('')}</div></div>`
    : '';
  const gearPool = save.hero === 'mu'
    ? [...SPIRIT_BEASTS, ...ADVENTURE_BRACERS, ...ADVENTURE_ARMORS]
    : [...ADVENTURE_WEAPONS, ...ADVENTURE_BRACERS, ...ADVENTURE_ARMORS];
  const ownedList = save.hero === 'mu' ? [...(save.ownedBeasts || []), ...save.owned] : save.owned;
  const affordableGear = gearPool.find(
    g => g.price > 0 && !ownedList.includes(g.id) && save.coins >= g.price
  );
  const shopBtnLabel = affordableGear
    ? `✨ 前往客棧（可買【${affordableGear.name.split('・')[1] || affordableGear.name}】！）`
    : '前往客棧';
  const seal=stage.id%5===4?`<p>✦ 尋回「${CHAPTERS[stage.chapter].seal}」文印</p><p>${CHAPTERS[stage.chapter].end}</p>`:'';
  persist();
  view='result';
  modal(`<span class="eyebrow">${reward.ending?'六印重聚 · 主線完結':wasWeakDrill?'錯題墨寶閣 · 掃除捷報':'江湖捷報'}</span>
    <div class="result-head"><h2>${stage.name} · ${wasWeakDrill?'特訓完成':'任務完成'}</h2><span class="result-seal">${sealGrade}</span></div>
    <p class="story">${stage.outro}</p>${seal}${lootHtml}${notesHtml}
    <div class="stats"><span>實際完成 ${stats.completedWords} 題</span><span>${stats.completedChars} 字</span><span>正確率 ${stats.accuracy}%</span></div>
    <p>銅錢 ＋${reward.reward}${reward.dailyBonus?' · 今日首次冒險 ＋20':''} · 最長連擊 ${stats.maxCombo} · 現有銅錢 ${save.coins}</p>
    <p class="muted">${profile.stage===30?'你已完成整段故事。可以隨時點選「選關」重遊任一關卡，或在設定選擇更高境界。':`下一站：${ADVENTURE_STAGES[profile.stage].name}`}</p>
    <div class="actions"><button class="primary" data-action="continue">${profile.stage===30?'查看江湖足跡':'繼續冒險'} · Enter</button><button class="${affordableGear?'shop-glow':''}" data-action="shop">${escape(shopBtnLabel)}</button><button data-action="footprints">🗺️ 選關</button><button data-action="home">休息一下</button></div>`, 'result');
}
function shop(tab = shopTab) {
  shopTab = tab;
  if (!['shop', 'battle', 'result', 'home'].includes(view)) resumeView = 'home';
  else if (view !== 'shop') resumeView = view;
  audio.switchBgm('inn');
  const isTamer = save.hero === 'mu';
  const loadout = getLoadout(), b = getBracer(), a = getArmor();
  const healCnt = save.potions?.heal_potion || 0;
  const antiCnt = save.potions?.antidote_potion || 0;
  let listHtml = '';
  if (shopTab === 'weapon') {
    if (isTamer) {
      listHtml = SPIRIT_BEASTS.map(item => {
        const owned = (save.ownedBeasts || []).includes(item.id);
        const active = save.beast === item.id;
        const bond = getBeastBond(save, item.id);
        const bondFlat = bond.atkBonusFlat || 0;
        const bondInfo = `<small class="bond-tag">🐾 羈絆 Lv.${bond.level}・${bond.title}${bond.nextExp ? `（經驗 ${bond.exp}／${bond.nextExp}）` : '（滿階）'}${bondFlat > 0 ? ` · 親密攻擊 ＋${bondFlat}` : ''}</small>`;
        const feedBtn = owned && bond.level < 5
          ? `<button type="button" data-feed-beast="${item.id}" ${save.coins < 60 ? 'disabled' : ''}>${save.coins < 60 ? '靈果 60 銅錢' : '🍖 餵食靈果 (60)'}</button>`
          : '';
        return `<div class="item"><img src="${item.icon}" alt=""><div><strong>${item.name}</strong><p>${item.desc}</p>${bondInfo}</div><div class="item-actions"><button data-buy-slot="beast" data-buy-id="${item.id}" ${active?'disabled':''}>${active?'已隨行':owned?'出戰':save.coins<item.price?`還差 ${item.price-save.coins}`:`${item.price} 銅錢結契`}</button>${feedBtn}</div></div>`;
      }).join('');
    } else {
      listHtml = ADVENTURE_WEAPONS.map(item => `<div class="item"><img src="${item.icon}" alt=""><div><strong>${item.name}</strong><p>${item.desc}</p></div><button data-buy-slot="weapon" data-buy-id="${item.id}" ${save.weapon===item.id?'disabled':''}>${save.weapon===item.id?'已裝備':save.owned.includes(item.id)?'裝備':save.coins<item.price?`還差 ${item.price-save.coins}`:`${item.price} 銅錢購買`}</button></div>`).join('');
    }
  } else if (shopTab === 'bracer') {
    listHtml = ADVENTURE_BRACERS.map(item => `<div class="item"><img src="${item.icon}" alt=""><div><strong>${item.name}</strong><p>${item.desc}</p></div><button data-buy-slot="bracer" data-buy-id="${item.id}" ${save.bracer===item.id?'disabled':''}>${save.bracer===item.id?'已穿戴':save.owned.includes(item.id)?'穿戴':save.coins<item.price?`還差 ${item.price-save.coins}`:`${item.price} 銅錢購買`}</button></div>`).join('');
  } else if (shopTab === 'armor') {
    listHtml = ADVENTURE_ARMORS.map(item => `<div class="item"><img src="${item.icon}" alt=""><div><strong>${item.name}</strong><p>${item.desc}</p></div><button data-buy-slot="armor" data-buy-id="${item.id}" ${save.armor===item.id?'disabled':''}>${save.armor===item.id?'已穿戴':save.owned.includes(item.id)?'穿戴':save.coins<item.price?`還差 ${item.price-save.coins}`:`${item.price} 銅錢購買`}</button></div>`).join('');
  } else {
    listHtml = ADVENTURE_POTIONS.map(item => {
      const cnt = save.potions?.[item.id] || 0;
      return `<div class="item"><img src="${item.icon}" alt=""><div><strong>${item.name}（持有 ${cnt}／${item.maxStack}）</strong><p>${item.desc}</p></div><button data-buy-potion="${item.id}" ${cnt>=item.maxStack?'disabled':''}>${cnt>=item.maxStack?'已帶滿':save.coins<item.price?`還差 ${item.price-save.coins}`:`${item.price} 銅錢添購`}</button></div>`;
    }).join('');
  }
  modal(`<h2>古驛客棧 · 銅錢 ${save.coins}</h2>
    <div class="gear-summary">目前穿戴：${isTamer?'🐾':'⚔️'} ${loadout.name.split('・')[1]||loadout.name}（攻擊力 ${loadout.atk}）${isTamer&&loadout.bondTitle?` · Lv.${loadout.bondLevel} ${loadout.bondTitle}`:''} ｜ 🧤 ${b.name} ｜ 🛡️ ${a.name} ｜ 🧪 回春丹×${healCnt}・清心散×${antiCnt}</div>
    <div class="shop-tabs">
      <button class="${shopTab==='weapon'?'active':''}" data-shop-tab="weapon">${isTamer?'🐾 靈獸（馴獸與餵養）':'⚔️ 兵器（劍／刀／槍）'}</button>
      <button class="${shopTab==='bracer'?'active':''}" data-shop-tab="bracer">🧤 護腕（打字輔助）</button>
      <button class="${shopTab==='armor'?'active':''}" data-shop-tab="armor">🛡️ 防具（毒火冰抗性）</button>
      <button class="${shopTab==='potion'?'active':''}" data-shop-tab="potion">🧪 隨身丹藥</button>
    </div>
    <div class="shop-layout"><div class="shop-portrait"><img src="./assets/characters/shopkeeper_idle_v3.png" alt="店小二端茶迎客"></div><div>${listHtml}</div></div>
    <div class="actions"><button class="primary" data-action="return">返回 · Esc</button></div>`, 'shop');
}
function settings() {
  resumeView=view==='battle'?'battle':'home';
  const audioCfg = save.audioSettings || { bgm: save.bgm !== false, sfx: save.sfx !== false, speech: save.speech !== false, muted: Boolean(save.muted) };
  modal(`<h2>設定</h2><label>練習內容 <select id="grade-select">${['1','2','3','4','5','6','english','custom'].map(g=>`<option value="${g}" ${save.grade===g?'selected':''}>${gradeLabel(g)}</option>`).join('')}</select></label>
    <label>同行少俠 <select id="hero-select"><option value="yun" ${save.hero==='yun'?'selected':''}>雲清川（劍・刀・槍）</option><option value="su" ${save.hero==='su'?'selected':''}>蘇映雪（劍・刀・槍）</option><option value="mu" ${save.hero==='mu'?'selected':''}>林牧風（馴獸師・靈獸同伴）</option></select></label>
    <label>挑戰境界 <select id="realm-select">${Object.entries(REALMS).map(([key,name])=>`<option value="${key}" ${profile.realm===key?'selected':''}>${name}</option>`).join('')}</select></label>
    <p class="muted">年級、英文與自訂聯絡簿各自保存冒險進度。挑戰境界會立即改變對手強度與出招節奏（初出茅廬較慢、名震江湖適中、一代宗師最快）。</p>
    <label><input id="keyboard-select" type="checkbox" ${save.keyboard?'checked':''}> 顯示指法鍵盤（Tab）</label>
    <label><input id="bgm-select" type="checkbox" ${audioCfg.bgm!==false?'checked':''}> 開啟情境背景音樂（BGM）</label>
    <label><input id="sound-select" type="checkbox" ${audioCfg.sfx!==false?'checked':''}> 開啟戰鬥音效（刀劍／靈獸）</label>
    <label><input id="speech-select" type="checkbox" ${audioCfg.speech!==false?'checked':''}> 自動朗讀字詞（長句改手動點擊題目重聽）</label>
    <label><input id="mute-select" type="checkbox" ${audioCfg.muted?'checked':''}> 總靜音</label>
    <details><summary>題庫與資料來源</summary><p>沿用六個年級常用字、自編詞句、原創散文與國小程度英文。出版社分類範例尚待核對，並非出版社完整教材。中文字音使用教育部國語小字典。</p><p><a href="https://dict.mini.moe.edu.tw/" target="_blank" rel="noopener">教育部國語小字典</a> · CC BY-ND 3.0 TW</p></details>
    <div class="actions"><button class="primary" data-action="save-settings">儲存並返回</button><button type="button" data-action="custom-words">📜 編輯自訂聯絡簿詞庫</button></div>`, 'settings');
}
function footprints() {
  const maxUnlocked = Math.min(29, profile.stage || 0);
  modal(`<h2>🗺️ 江湖足跡 · 自由選關</h2><p>隨時選擇已解鎖的關卡重遊切磋，挑戰「神乎其技」最高評價印章（正確率 ≥95% 且連擊 ≥10）。</p><div class="chapter-list">${ADVENTURE_STAGES.map(s => {
    const rec = profile.records?.[s.id];
    const unlocked = s.id <= maxUnlocked || Boolean(rec);
    const seal = rec ? (rec.seal || getSealForStats(rec)) : '';
    const sealBadge = rec ? `<small class="seal-tag ${seal==='神乎其技'?'top':''}">${seal==='神乎其技'?'🏅':seal==='爐火純青'?'✦':'◇'}${seal} (${rec.accuracy}%)</small>` : unlocked ? `<small class="seal-tag">⚔️ 可挑戰</small>` : `<small class="seal-tag">🔒 待解鎖</small>`;
    return `<button data-replay="${s.id}" ${unlocked ? '' : 'disabled'}><span>${s.id+1}. ${escape(s.name)}</span>${sealBadge}</button>`;
  }).join('')}</div><div class="actions"><button class="primary" data-action="home">返回首頁</button></div>`, 'footprints');
}
function customWordsModal() {
  const parsed = parseAdventureCustomWords(save.customRaw || '');
  modal(`<h2>📜 聯絡簿自訂詞庫（爸媽／老師自訂祕笈）</h2>
    <p class="muted">直接貼上學校聯絡簿生字、成語或英文單字（以換行、空白或逗號分隔）。系統會透過內建教育部國語小字典自動標註標準注音！亦可手動指定破音字讀音（如：<code>樂=ㄌㄜˋ</code> 或 <code>小橋(ㄒㄧㄠˇ ㄑㄧㄠˊ)</code>）與英文翻譯（如：<code>apple=蘋果</code>）。</p>
    <div class="custom-editor">
      <textarea id="custom-raw-input" rows="4" placeholder="範例：春風、瀑布、行雲流水、樂=ㄌㄜˋ、apple=蘋果">${escape(save.customRaw || '')}</textarea>
      <div class="dict-lookup-row">
        <input id="dict-lookup-input" type="text" maxlength="4" placeholder="單字讀音速查（如：行、樂、載）">
        <button type="button" data-action="dict-lookup">🔍 查教育部字音</button>
      </div>
      <div id="dict-lookup-result" class="muted">目前詞庫已收錄 <strong>${parsed.words.length}</strong> 組有效題目${parsed.skipped.length ? `（需補注音：${escape(parsed.skipped.slice(0, 3).join('；'))}）` : ''}。</div>
    </div>
    <div class="actions">
      <button class="primary" data-action="save-custom-play">⚔️ 儲存並以聯絡簿詞庫出戰</button>
      <button type="button" data-action="save-custom-only">💾 僅儲存詞庫</button>
      <button type="button" data-action="home">返回首頁</button>
    </div>`, 'custom-words');
}
function weakDojoModal() {
  const symEntries = Object.entries(profile.weakSymbols || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const weakEntries = Object.entries(profile.weak || {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const symHtml = symEntries.length
    ? symEntries.map(([sym, cnt]) => {
        const info = BOPOMOFO_TO_KEY_INFO[sym] || EN_TO_KEY_INFO[String(sym).toLowerCase()];
        const keyDesc = info ? `按 <kbd>${escape(info.en === 'Space' ? '空白鍵' : info.en)}</kbd>（${escape(info.finger)}）` : '留意鍵位';
        return `<span class="quest-chip">🎯 符號「<strong>${escape(sym === '␣' ? '一聲空白' : sym)}</strong>」${keyDesc} · 偏斜 ${cnt} 次</span>`;
      }).join('')
    : '<span class="muted">✨ 目前指法相當穩健，尚無明顯易錯鍵位紀錄！</span>';
  const wordsHtml = weakEntries.length
    ? weakEntries.map(([text, cnt]) => {
        const isEn = /^[a-zA-Z\s'-]+$/.test(text);
        return `<button type="button" class="mistake-chip" data-speak="${escape(text)}" data-lang="${isEn ? 'en-US' : 'zh-TW'}">${escape(text)} <small>曾錯 ${cnt} 次</small> 🔊</button>`;
      }).join('')
    : '<span class="muted">🎉 太棒了！目前錯題本已全數掃除乾淨！</span>';
  modal(`<h2>📖 錯題墨寶閣 · 指法診斷與掃除特訓</h2>
    <p class="muted">自動記錄闖關時曾按錯的注音符號、英文字母與字詞。點擊字詞可聽發音，啟動「錯題掃除特訓」過關即可消去錯字紀錄並獲贈 ＋35 銅錢勤學賞金！</p>
    <div class="mistake-notes"><strong>🎹 易錯鍵位與指法提醒：</strong><div class="quest-list">${symHtml}</div></div>
    <div class="mistake-notes"><strong>📝 待掃除錯字名單（點擊可聽發音）：</strong><div class="mistake-list">${wordsHtml}</div></div>
    <div class="actions">
      <button class="primary" data-action="start-weak-drill" ${weakEntries.length ? '' : 'disabled'}>⚔️ 啟動錯題掃除特訓（完成 ＋35 銅錢）</button>
      <button type="button" data-action="clear-weak-log" ${weakEntries.length || symEntries.length ? '' : 'disabled'}>🧹 清空錯題紀錄</button>
      <button type="button" data-action="home">返回首頁</button>
    </div>`, 'weak-dojo');
}
function useHealPotion(autoTriggered = false) {
  if (!session || (save.potions?.heal_potion || 0) <= 0) return false;
  if (!autoTriggered && session.hp >= 100 && !session.status) {
    notify('目前氣血充沛且無異常狀態，無需飲用九轉回春丹。');
    return false;
  }
  save.potions.heal_potion--;
  session.hp = Math.min(100, session.hp + 50);
  session.status = null;
  session.statusCureNeed = 0;
  scene.setHeroStatus(null, '🧪 九轉回春丹 +50 氣血');
  scene.playSkillHeal({ healAmount: 50 });
  persist();
  notify(`${autoTriggered ? '🧪 氣血偏低，自動飲用' : '🧪 飲用'}九轉回春丹！回復 50 氣血並淨化狀態（剩餘 ${save.potions.heal_potion} 份）`);
  render();
  return true;
}
function ultimate() {
  if(view!=='battle'||session.qi<5) return;
  const loadout = getLoadout();
  session.qi=0; session.atb=0; session.shield=1;
  if (session.status) {
    session.status = null;
    session.statusCureNeed = 0;
    scene.setHeroStatus(null);
  }
  const freezeDuration = loadout.style === 'spear' ? CONFIG.freezeMs + 2000 : CONFIG.freezeMs;
  frozenUntil = performance.now() + freezeDuration;
  if (loadout.style === 'spear' || loadout.id === 'beast_toad') {
    session.hp = Math.min(100, session.hp + 20);
  } else if (loadout.style === 'saber' || loadout.id === 'beast_wolf') {
    save.coins += 10;
  }
  const atk = applyPlayerAttack('ultimate', { combo: engine.combo });
  scene.playUltimateBurst({ damage: atk.finalDamage, style: loadout.style, ultName: loadout.ultName });
  audio.playUltimateBurst();
  if (stage?.isCombat && session.enemyHp <= 0) {
    finish();
    return;
  }
  notify(
    loadout.style === 'beast'
      ? `🐾 喚出靈獸絕技【${loadout.ultName}】！造成 ${atk.finalDamage} 傷害、震懾對手八秒並張開護印！`
      : loadout.style === 'saber'
      ? `🔥 施展【${loadout.ultName}】！造成 ${atk.finalDamage} 傷害、震懾對手八秒，再獲銅錢＋10！`
      : loadout.style === 'spear'
      ? `⚡ 施展【${loadout.ultName}】！造成 ${atk.finalDamage} 傷害、定住對手十秒，並回復 20 氣血！`
      : `☯️ 施展【${loadout.ultName}】！造成 ${atk.finalDamage} 傷害、對手停招八秒並抵擋一次回擊！`
  );
  render(); rememberSession();
}
function failed() {
  pause();
  if (session) { session.status = null; session.statusCureNeed = 0; scene.setHeroStatus(null); }
  profile.session=session; persist();
  modal(`<h2>先調息，再出發</h2><p>你已完成 ${session.cursor} 題，對手剩餘氣血與進度皆已保留。調息後從目前這一字接著練習。</p><p class="muted">回擊會放慢，找鍵提示持續陪著你。擊敗對手或完成任務即可領取賞金。</p><button class="primary" data-action="recover">調息續戰 · Enter</button><button data-action="home">回到首頁</button>`, 'failed');
}
engine.on('keyHit',()=>{
  misses=0; wrongKeyCode=''; $('question')?.classList.remove('miss-focus');
  audio.playKeyHit(engine.combo);scene.playMicroGather(engine.combo,engine.getComboTier());
});
engine.on('charComplete',event=>{
  if (!event.isLastChar) {
    scene.playMicroGather(event.combo, event.comboTier);
  }
  // 若處於中毒／灼傷／結冰狀態，連續打對 2 個字即可運功逼毒／滅火／破冰！
  if (session.status) {
    session.statusCureNeed = Math.max(0, (session.statusCureNeed || 2) - 1);
    if (session.statusCureNeed === 0) {
      const cured = session.status;
      session.status = null;
      if (cured === 'poison') {
        session.hp = Math.min(100, session.hp + 8);
        scene.setHeroStatus(null, '🌿 運功逼毒！氣血 +8');
        notify('🌿 連打 2 字運功逼毒成功！綠毒消散，氣血＋8！');
      } else if (cured === 'burn') {
        session.qi = Math.min(5, session.qi + 1);
        scene.setHeroStatus(null, '💨 刀劍生風滅火！內力 +1');
        notify('💨 連打 2 字劍風滅火成功！灼傷解除，內力＋1！');
      } else {
        scene.setHeroStatus(null, '⚡ 真氣破冰而出！');
        notify('⚡ 連打 2 字真氣破冰而出！寒霜震碎！');
      }
    }
  }
  if(event.combo>=5&&event.combo%5===0){
    audio.playComboMilestone(event.combo);
    scene.playComboMilestone(event.combo);
    if(event.combo>=15){
      session.shield=1;session.qi=5;save.coins+=10;
      notify(`🐉 連續 ${event.combo} 字・龍鳳文印劍意！（銅錢＋10・內力滿・護印加持）`);
    }else if(event.combo===10){
      session.hp=Math.min(100,session.hp+10);save.coins+=5;
      notify('⚡ 連續 10 字・驚雷流雲！（氣血＋10・銅錢＋5）');
    }else{
      session.qi=Math.min(5,session.qi+1);
      notify('🌪️ 連續 5 字・清風劍氣！（內力＋1）');
    }
  }
  render(); rememberSession();
});
engine.on('miss',event=>{
  const now=performance.now();
  const rapidFollowup=(now-lastMissAt<550)&&(event?.charIndex===lastMissCharIndex);
  lastMissAt=now; lastMissCharIndex=event?.charIndex??-1;
  wrongKeyCode=event?.actualCode||'';
  clearTimeout(wrongKeyTimer);
  wrongKeyTimer=setTimeout(()=>{wrongKeyCode='';render();},650);
  const qEl=$('question');
  if(qEl){qEl.classList.remove('miss-shake');void qEl.offsetWidth;qEl.classList.add('miss-shake','miss-focus');}
  if(rapidFollowup){
    engine.combo=lastRetainedCombo;
    render();rememberSession();
    return;
  }
  misses++;
  wordMisses++;
  const expectedSym = engine.getExpectedSymbol();
  if (expectedSym) {
    profile.weakSymbols ||= {};
    profile.weakSymbols[expectedSym] = (profile.weakSymbols[expectedSym] || 0) + 1;
  }
  const curCharObj = engine.characters[engine.charIndex];
  if (curCharObj && session) {
    session.mistakeNotes ||= [];
    const isEn = engine.mode === 'english';
    const noteChar = isEn ? engine.currentWord.text : curCharObj.char;
    const noteReading = isEn ? (engine.currentWord.meaning || '') : curCharObj.symbols.join('');
    if (noteChar && !session.mistakeNotes.some(n => n.char === noteChar) && session.mistakeNotes.length < 4) {
      session.mistakeNotes.push({ char: noteChar, reading: noteReading, lang: isEn ? 'en-US' : 'zh-TW' });
    }
  }
  const bracer = getBracer();
  const prev=event?.previousCombo||0;
  const baseRetained=prev>=15?10:prev>=10?5:0;
  const retained=prev>=5?Math.min(prev,baseRetained+(bracer.comboGuard||0)):0;
  lastRetainedCombo=retained;
  engine.combo=retained;
  audio.playMiss(prev);
  const text=engine.currentWord.text;
  profile.weak[text]=(profile.weak[text]||0)+1;
  session.atb=Math.min(95,(session.atb||0)+(bracer.missAtbPenalty||8));
  scene.playMissParry(false,prev,retained);
  notify(retained>0?`🛡️ 護腕與劍氣護體！保留 ${retained} 連字（注意看橘色高亮注音）`:prev>=5?`💥 招式偏斜！${prev} 連字中斷，對手趁隙逼近！`:'⚠️ 按錯鍵招式偏斜，對手蓄力加快！');
  render();rememberSession();
});
engine.on('wordComplete',event=>{
  const loadout = getLoadout(), bracer = getBracer();
  engine.active=false; session.cursor++;
  const wordLen = Array.from(event.word?.text || '').length;
  const isMultiChar = wordLen >= 2;
  const isParryBreak = session.atb >= 75;
  const isZeroMissWord = wordMisses === 0;
  const isPerfectWord = isZeroMissWord && isMultiChar;
  wordMisses = 0;
  const qiDelta = Math.max(1, (bracer.qiGain || 1) + (loadout.qiGainMod || 0) + (isParryBreak ? 1 : 0));
  session.qi=Math.min(5,session.qi+qiDelta);
  if(loadout.healPerWord) session.hp=Math.min(100,session.hp+loadout.healPerWord);
  // 打 2 個字以上的詞語或長句時，完全不打斷敵人集氣攻擊（僅單字題小幅壓制蓄力）
  if (!isMultiChar) {
    session.atb = Math.max(0, session.atb - 10);
  }
  const atk = applyPlayerAttack('word', { wordObj: event.word, combo: engine.combo, isParryBreak, isPerfectWord });
  audio.playWeaponAttack(loadout.style === 'beast' ? (loadout.spriteKey || loadout.id) : loadout.style, true);
  audio.playWordComplete(engine.getComboTier());
  audio.speakText?.(event.word.text,engine.mode==='english'?'en-US':'zh-TW',{manual:false});
  scene.playWordFinisher({wordText:event.word.text,damage:atk.finalDamage,isCrit:atk.isCrit||atk.multiHitCount>1||isParryBreak,isParryBreak:isParryBreak||stage.kind==='boss',comboTier:engine.getComboTier()});
  if (isParryBreak) {
    scene.spawnFloatingText(scene.enemyBaseX, scene.enemyBaseY - 175, `⚡ 看破破綻！反擊 -${atk.finalDamage}`, '#ffd166', 22);
  } else if (isPerfectWord) {
    scene.spawnFloatingText(scene.heroBaseX, scene.heroBaseY - 155, '✨ 行雲流水 +15%', '#72efdd', 19);
  }
  recordQuestionHistory(profile, event.word.text, engine.mode === 'english');
  recordDailyProgress(save, datestring(), { words: 1, perfectWords: isZeroMissWord ? 1 : 0 });
  if (save.hero === 'mu') {
    const bondRes = addBeastBondExp(save, save.beast, 12);
    if (bondRes.leveledUp) {
      notify(`🐾 靈獸【${getBeast().name}】與你心意相通，羈絆升至 Lv.${bondRes.level}（${bondRes.title}）！`);
    }
  }
  if (session.enemyHp <= 0) {
    finish();
    return;
  }
  ensureSessionQueue();
  engine.loadWord(session.queue[session.cursor]); session.typing=null; readUntil=performance.now()+(isMultiChar?0:220);
  engine.active=true; render(); rememberSession();
  if(!(event.combo>=5&&event.combo%5===0)){
    const phaseName = stage.kind === 'boss' ? `${bossPhaseForHp(session.enemyHp, session.enemyMaxHp, session.bossPhaseIndex || 0).name} · ` : '';
    const bonusLabel = isParryBreak ? '⚡看破破綻反擊！' : isPerfectWord ? '✨行雲流水！' : '';
    notify(`${bonusLabel}${phaseName}造成 ${atk.finalDamage} 傷害（對手剩餘 ${session.enemyHp} 氣血）`);
  }
});
for(const event of ['nextChar','nextSymbol']) engine.on(event,()=>{render();rememberSession();});
function keyboard() {
  $('keys').innerHTML=KEYBOARD_ROWS.map(row=>`<div class="key-row">${row.map(k=>`<div class="key ${k.finger.startsWith('右')?'right':''} ${k.isTone?'tone':''} ${['KeyF','KeyJ'].includes(k.code)?'home-key':''} ${k.code==='Space'?'space':''}" data-code="${k.code}"><small>${escape(k.en)}</small><span class="zy">${escape(k.code==='Space'?'一聲／空白鍵':k.zy)}</span><span class="en">${escape(k.code==='Space'?'空白鍵':k.en)}</span></div>`).join('')}</div>`).join('');
}
document.addEventListener('click',event=>{
  audio.init(); if(audio.bgmEnabled&&!audio.muted&&!audio.bgmRunning)audio.startBgm(audio.currentBgmTheme);
  if(!windowFocused){windowFocused=true;engine.setPaused(document.hidden||view!=='battle');lastTick=performance.now();}
  const button=event.target.closest('button'); if(!button)return;
  if(button.dataset.speak){
    audio.speakText?.(button.dataset.speak,button.dataset.lang||'zh-TW',{manual:true});
    return;
  }
  if(button.dataset.shopTab){shop(button.dataset.shopTab);return;}
  if(button.dataset.feedBeast){
    const res = feedSpiritBeast(save, button.dataset.feedBeast, 60);
    if (res.ok) {
      persist(); setupScene();
      const back = resumeView; shop(shopTab); resumeView = back;
      notify(`🍖 餵食靈果成功！靈獸羈絆升至 Lv.${res.bond.level}（${res.bond.title}）！`);
    } else {
      notify('銅錢不足或靈獸已達最高羈絆等級。');
    }
    return;
  }
  if(button.dataset.buySlot){
    const slot=button.dataset.buySlot,id=button.dataset.buyId;
    const pool=slot==='beast'?SPIRIT_BEASTS:slot==='weapon'?ADVENTURE_WEAPONS:slot==='bracer'?ADVENTURE_BRACERS:ADVENTURE_ARMORS;
    const item=pool.find(x=>x.id===id);
    if(buyGear(save,slot,item)){persist();setupScene();const back=resumeView;shop(shopTab);resumeView=back;notify(`已裝備【${item.name}】！`);}
    else notify('銅錢還不夠，完成冒險再回來。');
    return;
  }
  if(button.dataset.buyPotion){
    const item=ADVENTURE_POTIONS.find(x=>x.id===button.dataset.buyPotion);
    if(buyPotion(save,item)){persist();const back=resumeView;shop('potion');resumeView=back;notify(`已添購【${item.name}】！`);}
    else notify('銅錢不足或已達攜帶上限。');
    return;
  }
  if(button.dataset.replay){begin(false,Number(button.dataset.replay));return;}
  const action=button.dataset.action;
  if(action==='continue'){if(profile.stage===30&&!profile.session)footprints();else begin();}
  if(action==='start')start();
  if(action==='home')home();
  if(action==='footprints')footprints();
  if(action==='custom-words')customWordsModal();
  if(action==='weak-dojo')weakDojoModal();
  if(action==='dict-lookup'){
    const q = ($('dict-lookup-input')?.value || '').trim();
    const out = $('dict-lookup-result');
    if (!out) return;
    if (!q) { out.textContent = '請先輸入欲查詢的國字（如：樂、行）。'; return; }
    const chars = Array.from(q);
    const lines = chars.map(ch => {
      const readings = getCharacterReadings(ch);
      if (!readings.length) return `「${escape(ch)}」：查無字典讀音`;
      return `「<strong>${escape(ch)}</strong>」→ ` + readings.map(rd => {
        const ex = getDictionaryUsage(ch, rd);
        return `<code>${escape(ch)}=${escape(rd)}</code>${ex.length ? `（${escape(ex.slice(0, 3).join('、'))}）` : ''}`;
      }).join(' ｜ ');
    });
    out.innerHTML = lines.join('<br>');
    return;
  }
  if(action==='save-custom-only'||action==='save-custom-play'){
    const rawVal = ($('custom-raw-input')?.value || '').trim();
    const parsed = parseAdventureCustomWords(rawVal);
    if (parsed.words.length === 0) {
      notify(parsed.skipped.length ? `需補注音：${parsed.skipped[0]}` : '請至少輸入 1 個有效的中文字詞或英文單字！');
      return;
    }
    save.customRaw = rawVal;
    if (action === 'save-custom-play') {
      save.grade = 'custom';
      profile = getProfile(save);
      profile.session = null;
      persist();
      notify(`📜 已載入 ${parsed.words.length} 組自訂聯絡簿詞庫，準備出戰！`);
      begin(false);
    } else {
      if (save.grade === 'custom') profile.session = null;
      persist();
      notify(`💾 已儲存 ${parsed.words.length} 組自訂聯絡簿詞庫！`);
      customWordsModal();
    }
    return;
  }
  if(action==='start-weak-drill'){
    begin(false, Math.min(profile.stage || 0, 29), true);
    return;
  }
  if(action==='clear-weak-log'){
    profile.weak = {};
    profile.weakSymbols = {};
    persist();
    notify('🧹 已清空錯題與易錯鍵位紀錄！');
    weakDojoModal();
    return;
  }
  if(action==='shop')shop(shopTab);
  if(action==='settings')settings();
  if(action==='return'){if(resumeView==='battle'){audio.switchBgm(stage?.kind==='boss'?'boss':'battle');closePanel();}else home();}
  if(action==='recover'){session.hp=100;session.atb=0;session.status=null;session.statusCureNeed=0;scene.setHeroStatus(null);session.slow=(session.slow||1)*1.25;readUntil=performance.now()+4000;audio.switchBgm(stage?.kind==='boss'?'boss':'battle');closePanel();rememberSession();}
  if(action==='save-settings'){
    const changed=save.grade!==$('grade-select').value;
    save.grade=$('grade-select').value;save.hero=$('hero-select').value;save.keyboard=$('keyboard-select').checked;
    const bgmChecked=$('bgm-select')?$('bgm-select').checked:true;
    const sfxChecked=$('sound-select')?$('sound-select').checked:true;
    const speechChecked=$('speech-select')?$('speech-select').checked:true;
    const muteChecked=$('mute-select')?$('mute-select').checked:false;
    save.bgm=bgmChecked;save.sfx=sfxChecked;save.speech=speechChecked;save.muted=muteChecked;
    save.audioSettings={bgm:bgmChecked,sfx:sfxChecked,speech:speechChecked,muted:muteChecked};
    audio.applySettings(save.audioSettings);
    profile=getProfile(save);profile.realm=$('realm-select').value;if(session&&!changed)session.realm=profile.realm;persist();setupScene();
    if(changed||resumeView!=='battle')home();else{audio.switchBgm(stage?.kind==='boss'?'boss':'battle');closePanel();}
  }
});
$('home').onclick=home; $('shop').onclick=()=>shop(shopTab); $('settings').onclick=settings; $('ultimate').onclick=ultimate;
$('hero-status').onclick=()=>{if(view==='battle')useHealPotion(false);};
$('question').onclick=()=>{
  if(view!=='battle'||!engine.currentWord)return;
  const isEn=engine.mode==='english';
  audio.speakText?.(engine.currentWord.text,isEn?'en-US':'zh-TW',{manual:true});
};
function toggleKeyboard(){save.keyboard=!save.keyboard;persist();render();}
$('hide-keyboard').onclick=toggleKeyboard; $('show-keyboard').onclick=toggleKeyboard;
$('panel').addEventListener('cancel',event=>{event.preventDefault();if(view==='shop'&&resumeView==='battle'){audio.switchBgm(stage?.kind==='boss'?'boss':'battle');closePanel();}else home();});
document.addEventListener('keydown',event=>{
  audio.init(); if(audio.bgmEnabled&&!audio.muted&&!audio.bgmRunning)audio.startBgm(audio.currentBgmTheme);
  if(!windowFocused){windowFocused=true;engine.setPaused(document.hidden||view!=='battle');lastTick=performance.now();}
  if(event.repeat)return;
  if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
  if(view==='shop'&&['Digit1','Digit2','Digit3','Digit4'].includes(event.code)){
    event.preventDefault();
    shop({Digit1:'weapon',Digit2:'bracer',Digit3:'armor',Digit4:'potion'}[event.code]);
    return;
  }
  if(event.code==='Enter'&&view!=='battle'){event.preventDefault();$('panel-content').querySelector('.primary')?.click();return;}
  if(event.code==='Escape'&&view==='battle'){event.preventDefault();settings();return;}
  if(view!=='battle'||document.hidden)return;
  if(event.code==='Tab'){event.preventDefault();toggleKeyboard();return;}
  if(event.altKey&&event.code==='Digit1'){event.preventDefault();ultimate();return;}
  if(event.altKey&&event.code==='Digit2'){event.preventDefault();useHealPotion(false);return;}
  engine.handleKeyDown(event);
},true);
document.addEventListener('keyup',event=>{if(event.code==='Space'&&view!=='battle')event.preventDefault();},true);
document.addEventListener('compositionupdate',event=>{if(view==='battle')engine.handleCompositionUpdate(event);});
document.addEventListener('visibilitychange',()=>{engine.setPaused(document.hidden||!windowFocused||view!=='battle');lastTick=performance.now();});
window.addEventListener('blur',()=>{windowFocused=false;engine.setPaused(true);rememberSession();});
window.addEventListener('focus',()=>{windowFocused=true;engine.setPaused(document.hidden||view!=='battle');lastTick=performance.now();});
window.addEventListener('pagehide',rememberSession);
window.addEventListener('resize',()=>{if(view==='battle')render();});
function tick(now){
  const dt=Math.min(100,now-lastTick);lastTick=now;
  if(view==='battle'&&!document.hidden&&windowFocused&&now>readUntil&&now>frozenUntil){
    const bossPhase = stage.kind === 'boss' ? bossPhaseForHp(session.enemyHp, session.enemyMaxHp, session.bossPhaseIndex || 0) : null;
    const phaseMultiplier = bossPhase ? bossPhase.speedMult : 1;
    const statusSpeedMult=session.status==='freeze'?.82:session.status==='burn'?.85:1;
    const duration=attackDuration(engine.currentWord,save.grade,session.realm||profile.realm,stage.kind)*phaseMultiplier*(session.slow||1)*(misses>=2?1.5:1)*statusSpeedMult;
    const wasDanger=session.atb>75;
    session.atb=Math.min(100,session.atb+dt/duration*100);
    const isDanger=session.atb>75;
    scene.setEnemyDangerAlert(isDanger);
    if(isDanger!==wasDanger){
      const baseEnemyName=stage.name;
      $('enemy-name').textContent=isDanger?`⚡即將出招！${baseEnemyName}`:baseEnemyName;
    }
    // 中毒與灼傷持續微幅耗損氣血（保底 15 點不致死）
    if(session.status==='poison'||session.status==='burn'){
      statusDotAcc+=dt;
      if(statusDotAcc>=2600){
        statusDotAcc=0;
        if(session.hp>15){
          session.hp=Math.max(15,session.hp-2);
          render();
        }
      }
    }else{
      statusDotAcc=0;
    }
    if(session.atb>=100){
      session.atb=0;
      if(session.shield){
        session.shield=0;
        scene.playMissParry(true);
        notify('🛡️ 守護護印擋住了對手回擊！');
      }else{
        const armor=getArmor();
        const dmg=Math.max(8,CONFIG.damage-(armor.dmgReduce||0));
        session.hp=Math.max(0,session.hp-dmg);
        scene.playEnemyAttack(dmg);
        audio.playPlayerHurt();
        const hazard=stageHazard(stage);
        if(session.hp>0&&hazard){
          if(armor.resist?.includes(hazard.type)){
            scene.spawnFloatingText(scene.heroBaseX,scene.heroBaseY-155,`🛡️ ${armor.name}免疫${hazard.label}！`,'#72efdd',20);
            notify(`🛡️ 【${armor.name}】發動，免疫對手的${hazard.label}！`);
          }else if((save.potions?.antidote_potion||0)>0){
            save.potions.antidote_potion--;
            session.hp=Math.min(100,session.hp+15);
            scene.setHeroStatus(null,`🍵 清心散化${hazard.label} +15`);
            notify(`🍵 自動服用清心淨化散！化解${hazard.label}並回復 15 氣血（剩餘 ${save.potions.antidote_potion} 份）`);
          }else{
            session.status=hazard.type;
            session.statusCureNeed=2;
            scene.setHeroStatus(hazard.type,`${hazard.icon} 遭受${hazard.label}！連對 2 字化解`);
            notify(`${hazard.icon} 遭受對手【${hazard.label}】！連打對 2 個字即可運功逼毒／滅火／破冰！`);
          }
        }
        if(session.hp>0&&session.hp<=45&&(save.potions?.heal_potion||0)>0){
          useHealPotion(true);
        }
        if(!session.hp)failed();
      }
      render();rememberSession();
    }
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
  if($('bgm-select'))$('bgm-select').closest('label').hidden=true;
  $('sound-select').closest('label').hidden=true;
  $('speech-select').closest('label').hidden=true;
  if($('mute-select'))$('mute-select').closest('label').hidden=true;
  $('panel-content').querySelector('.muted').hidden=true;
}
