import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BattlePoseAnimation } from '../src/scenes/BattlePoseAnimation.js';
import { CanvasBattleScene } from '../src/scenes/CanvasBattleScene.js';
import { battleAnimations, animationAliases } from '../src/data/battleAnimations.js';

const steps = ['windup', 'attack', 'impact', 'recover'].map(pose => ({ pose, durationMs: 100 }));
test('四姿態依序播放並有限時間歸位', () => {
  const clock = new BattlePoseAnimation(); clock.request(steps);
  for (const pose of ['windup', 'attack', 'impact', 'recover']) {
    assert.equal(clock.pose, pose); clock.tick(100);
  }
  assert.equal(clock.pose, 'idle');
});
test('快速輸入只合併最新演出，停止後不累積長佇列', () => {
  const clock = new BattlePoseAnimation();
  for (let i = 0; i < 200; i++) { clock.request(steps); clock.tick(10); }
  clock.tick(1000); assert.equal(clock.pose, 'idle'); assert.equal(clock.pending, null);
});
test('大招可打斷一般攻擊，一般攻擊不能打斷大招', () => {
  const clock = new BattlePoseAnimation(); clock.request(steps);
  clock.tick(150); clock.request(steps, 3); assert.equal(clock.pose, 'windup');
  clock.tick(100); clock.request(steps, 0); assert.equal(clock.pose, 'attack');
  assert.equal(clock.pending, null); clock.tick(300); assert.equal(clock.pose, 'idle');
});
test('受擊與僵直可歸位，敗退保持到下一場重設', () => {
  const clock = new BattlePoseAnimation();
  clock.request([{ pose: 'hit', durationMs: 110 }, { pose: 'recover', durationMs: 150 }]);
  clock.tick(300); assert.equal(clock.pose, 'idle');
  clock.request([{ pose: 'defeat', durationMs: 480 }], 10, true);
  clock.tick(10000); clock.request(steps, 3); assert.equal(clock.pose, 'defeat');
  clock.reset(); assert.equal(clock.pose, 'idle');
});
test('漏圖僅回到同裝備正式圖，成功載入使用對應姿態錨點', () => {
  const scene = Object.create(CanvasBattleScene.prototype);
  const base = {}; const pose = {};
  scene.getImage = key => key === 'su_thunder_spear' ? base : null;
  assert.deepEqual(scene.resolvePoseSprite('su_thunder_spear', 'su_thunder_spear', 'attack'),
    { key: 'su_thunder_spear', img: base });
  scene.getImage = key => key.endsWith(':attack') ? pose : base;
  assert.deepEqual(scene.resolvePoseSprite('su_thunder_spear', 'su_thunder_spear', 'attack'),
    { key: 'su_thunder_spear:attack', img: pose });
});
test('減少動態仍播放真正姿態，換裝清除前場攻擊', () => {
  const scene = Object.create(CanvasBattleScene.prototype);
  scene.motionOverride = true; scene.heroAnimationGroup = 'yun_wood_sword';
  scene.attackAnimation = new BattlePoseAnimation(); scene.heroPose = 'idle';
  scene.requestAttack('word'); assert.equal(scene.attackAnimation.pose, 'windup');
  scene.attackAnimation.tick(250); assert.equal(scene.attackAnimation.pose, 'idle');
  scene.requestAttack('ultimate'); scene.attackAnimation.reset();
  assert.equal(scene.attackAnimation.pending, null);
});
test('正式索引與已驗收 manifest 的 76 張姿態一致', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/animations/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.phaseAApproved, true);
  let count = 0;
  for (const group of manifest.groups) {
    for (const [pose, frame] of Object.entries(group.frames)) {
      assert.equal(frame.approved, true);
      assert.equal(battleAnimations[group.id][pose].path, frame.path);
      assert.deepEqual(battleAnimations[group.id][pose].anchor, frame.anchor);
      count++;
    }
  }
  assert.equal(count, 76);
  assert.equal(animationAliases.yun_iron_spear, 'yun_thunder_spear');
});
test('整組武器及人物輪廓保持在筆電、桌面與窄視窗內', () => {
  const scene = Object.create(CanvasBattleScene.prototype);
  for (const width of [730, 1366, 1920]) {
    scene.width = width;
    const height = Math.min(460, width * .4);
    for (const [group, poses] of Object.entries(battleAnimations)) {
      const x = scene.clampPoseX(group.startsWith('enemy_') ? width - 100 : 100, group, height);
      for (const frame of Object.values(poses)) {
        const factor = height * frame.anchor.scale / frame.size[1];
        const origin = x - frame.anchor.x * frame.size[0] * factor;
        assert.ok(origin + frame.visibleBounds[0] * factor >= 6 - .001, group);
        assert.ok(origin + frame.visibleBounds[2] * factor <= width - 6 + .001, group);
      }
    }
  }
});
