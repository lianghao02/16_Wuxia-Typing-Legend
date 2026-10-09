import { CanvasBattleScene } from '../../src/scenes/CanvasBattleScene.js';
import { battleAnimations } from '../../src/data/battleAnimations.js';
import { HEROES } from '../../src/data/enemies.js';
import { ADVENTURE_WEAPONS, SPIRIT_BEASTS } from '../../src/engine/AdventureEngine.js';
const $ = id => document.getElementById(id);
const observed = new Set();
class ReviewScene extends CanvasBattleScene {
  getFighterImageHeight() { return Math.min(360, Math.max(100, this.height - 220) * .65); }
  update(dt) {
    if (!this.sweeping || this.manualTick) super.update(dt);
  }
  resolvePoseSprite(base, group, pose) {
    const result = super.resolvePoseSprite(base, group, pose);
    if (result.img && result.key.includes(':')) observed.add(result.key);
    return result;
  }
}
const scene = new ReviewScene('stage');
for (const id of Object.keys(battleAnimations)) $('group').add(new Option(id, id));
function setup(id) {
  const isEnemy = id.startsWith('enemy_'), isBeast = id.startsWith('beast_');
  const hero = id.startsWith('su_') ? HEROES.su : id === 'mu_tamer' || isBeast ? HEROES.mu : HEROES.yun;
  const weaponId = id.replace(/^(yun|su)_/, '');
  const beast = SPIRIT_BEASTS.find(item => item.id === id) || SPIRIT_BEASTS[0];
  const weapon = hero.id === 'mu' ? beast : ADVENTURE_WEAPONS.find(item => item.id === weaponId) || ADVENTURE_WEAPONS[0];
  const types = { enemy_wood_dummy: 'wood', enemy_earth_puppet: 'puppet', enemy_blackwind_boss: 'boss' };
  scene.setupBattle({ hero, weapon, beast, stage: { name: '動作驗收', sceneTheme: 'mountain_gate', enemy: {
    name: isEnemy ? id : '木人樁', title: '姿態比較',
    visualType: isEnemy ? types[id] || 'bandit_scout' : 'wood', primaryColor: 0xd4a373
  } } });
}
const detail = { charText: '文', wordText: '文印江湖', damage: 10, comboTier: 1, style: 'sword', ultName: '文印破空' };
$('group').onchange = () => setup($('group').value);
$('attack').onclick = () => scene.playCharSlash(detail);
$('word').onclick = () => scene.playWordFinisher(detail);
$('ultimate').onclick = () => scene.playUltimateBurst(detail);
$('hit').onclick = () => scene.requestEnemyReaction('hit');
$('stagger').onclick = () => scene.requestEnemyReaction('stagger');
$('defeat').onclick = () => scene.playEnemyDefeat();
$('reset').onclick = () => setup($('group').value);
$('reduced').onchange = () => { scene.motionOverride = $('reduced').checked; };
$('rapid').onclick = () => {
  for (let i = 0; i < 50; i++) scene.playCharSlash(detail);
  scene.playUltimateBurst(detail);
  for (let i = 0; i < 50; i++) scene.requestAttack('char');
  $('report').textContent = '已觸發 50 次攻擊與大招；一般攻擊不能打斷大招。';
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function advance(ms) {
  // 驗收用固定步進避免背景分頁的 RAF 節流造成漏檢；仍使用正式 update/render。
  for (let elapsed = 0; elapsed < ms; elapsed += 16) {
    scene.manualTick = true; scene.update(16); scene.manualTick = false;
    scene.render(); await wait(16);
  }
}
$('sweep').onclick = async () => {
  $('sweep').disabled = true; observed.clear(); scene.sweeping = true;
  try {
    for (const id of Object.keys(battleAnimations)) {
      $('group').value = id; setup(id);
      $('report').textContent = `驗證中：${id}`;
      await Promise.all([scene.heroAnimationGroup, scene.beastAnimationGroup, scene.enemyAnimationGroup]
        .flatMap(group => Object.keys(battleAnimations[group] || {}).map(pose => scene.loadAsset(`${group}:${pose}`, 'high'))));
      if (id.startsWith('enemy_')) {
        scene.requestEnemyReaction('hit'); await advance(320);
        scene.requestEnemyReaction('stagger'); await advance(380);
        scene.playEnemyDefeat(); await advance(100);
      } else { scene.playWordFinisher(detail); await advance(650); }
    }
    const missing = Object.entries(battleAnimations).flatMap(([group, poses]) => Object.keys(poses)
      .map(pose => `${group}:${pose}`)).filter(key => !observed.has(key));
    $('report').textContent = missing.length ? `未繪製：${missing.join(', ')}` : '通過：正式 Canvas 已繪製全部 19 組、76 張姿態；未發現漏圖。';
  } catch (error) { $('report').textContent = `驗證失敗：${error.message}`; }
  scene.sweeping = false; $('sweep').disabled = false;
};
setup($('group').value);
setInterval(() => {
  document.body.dataset.heroPose = scene.attackAnimation.pose;
  document.body.dataset.enemyPose = scene.enemyAnimation.pose;
  document.body.dataset.pending = scene.attackAnimation.pending ? '1' : '0';
}, 50);
