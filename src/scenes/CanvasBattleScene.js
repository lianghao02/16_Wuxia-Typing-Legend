/**
 * 《武俠打字傳》零外部依賴高擬真水墨戰鬥渲染引擎 (CanvasBattleScene.js)
 * 專為內網／離線／無 CDN 環境與高速反應設計：
 * - 六大國風水墨場景（山門雲霧、翠竹林、古驛紅燈籠、古城擂台、月下演武、雲海山巔）
 * - 男女主角（雲清川／蘇映雪）三階外觀（布衣木劍 -> 俠客青鋒 -> 宗師玄鐵披風）
 * - 八階敵人立繪（稻草人 -> 木人樁 -> 小山賊 -> 裝備山賊 -> 中階山賊 -> 大山賊 -> 機關傀儡 -> 山大王黑風盜）
 * - 現代動畫特效：微觀聚氣星芒、中觀弧形劍光 (Slash Line)、巨觀殘影突進 (After Image)、Hit Stop 頓幀、畫面震動与跳字
 */

import { getWeaponEffectProfile } from '../data/weaponEffects.js';

function hexToRgb(hexInt) {
  const r = (hexInt >> 16) & 255;
  const g = (hexInt >> 8) & 255;
  const b = hexInt & 255;
  return `${r}, ${g}, ${b}`;
}

export class CanvasBattleScene {
  constructor(containerId = 'phaser-Stage') {
    this.container = document.getElementById(containerId);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);

    this.heroConfig = null;
    this.weaponConfig = null;
    this.stageConfig = null;
    this.comboTier = 0;
    this.swordIntentActive = false;
    this.enemyDangerAlert = false;

    // 動畫狀態
    this.breathTime = 0;
    this.isHitStop = false;
    this.shakeTime = 0;
    this.shakeIntensity = 0;

    this.heroOffsetX = 0;
    this.heroScaleX = 1;
    this.heroScaleY = 1;
    this.heroTilt = 0;
    this.heroPose = 'idle'; // 'idle' | 'block' | 'hurt'
    this.heroPoseTimer = 0;
    this.enemyOffsetX = 0;
    this.enemyTilt = 0;
    this.enemyHitFxTimer = 0;
    this.enemyHitFxMax = 260;
    this.heroMissFxTimer = 0;
    this.heroMissFxMax = 440;
    this.comboBurstFxTimer = 0;
    this.comboBurstFxMax = 920;
    this.comboBurstFxKey = null;
    this.heroStatus = null; // 'poison' | 'burn' | 'freeze' | null

    // 特效物件池
    this.ambientLeaves = [];
    this.particles = [];
    this.slashes = [];
    this.afterImages = [];
    this.floatingTexts = [];

    // 美術資產圖片快取（支援依當前關卡優先載入、自動重試與閒置背景佇列預載）
    this.imageCache = new Map();
    this.highPriorityPending = 0;
    this.bgPrefetchQueue = [];
    this.isPrefetchingBg = false;
    this.preloadImages();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.lastFrameTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(50, now - this.lastFrameTime);
      this.lastFrameTime = now;
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  preloadImages() {
    const assets = {
      // 雙主角 × 5 大神兵（劍／刀／槍）全身立繪 (1080x1440，優先註冊)
      yun_wood_sword: './assets/characters/yun_wood_idle_v3.png',
      su_wood_sword: './assets/characters/su_wood_idle_v3.png',
      yun_qingfeng_sword: './assets/characters/yun_qingfeng_idle_v3.png',
      su_qingfeng_sword: './assets/characters/su_qingfeng_idle_v3.png',
      yun_flame_saber: './assets/characters/yun_flame_saber_v4.png',
      su_flame_saber: './assets/characters/su_flame_saber_v4.png',
      yun_xuantie_sword: './assets/characters/yun_xuantie_idle_v3.png',
      su_xuantie_sword: './assets/characters/su_xuantie_idle_v3.png',
      yun_thunder_spear: './assets/characters/yun_thunder_spear_v4.png',
      su_thunder_spear: './assets/characters/su_thunder_spear_v4.png',

      // 初階主角專屬格擋／受擊姿態 v4 立繪 (1080x1440，僅限初階布衣＋桃木劍使用)
      yun_wood_hurt: './assets/characters/yun_wood_hurt_v4.png',
      yun_wood_block: './assets/characters/yun_wood_block_v4.png',
      su_wood_hurt: './assets/characters/su_wood_hurt_v4.png',
      su_wood_block: './assets/characters/su_wood_block_v4.png',

      // 10 大代表敵人與首領全身立繪 (1080x1440)
      enemy_straw: './assets/enemies/straw_idle_v3.png',
      enemy_wood: './assets/enemies/wood_dummy_idle_v3.png',
      enemy_bandit_scout: './assets/enemies/bandit_scout_idle_v3.png',
      enemy_bandit_saber: './assets/enemies/bandit_saber_idle_v3.png',
      enemy_bandit_axes: './assets/enemies/bandit_axes_idle_v3.png',
      enemy_wudang: './assets/enemies/wudang_novice_idle_v3.png',
      enemy_protector: './assets/enemies/left_protector_idle_v3.png',
      enemy_arena: './assets/enemies/arena_champion_idle_v3.png',
      enemy_puppet: './assets/enemies/earth_puppet_idle_v3.png',
      enemy_boss: './assets/enemies/blackwind_boss_idle_v3.png',

      // 對手受擊、5/10/15 連擊爆發、失誤偏斜與中毒／灼傷／結冰狀態 v4 視覺特效 (512x512)
      fx_training_debris: './assets/effects/training_debris_v4.png',
      fx_humanoid_hit: './assets/effects/humanoid_hit_flash_v4.png',
      fx_combo_5: './assets/effects/combo_5_breeze_v4.png',
      fx_combo_10: './assets/effects/combo_10_thunder_v4.png',
      fx_combo_15: './assets/effects/combo_15_dragon_v4.png',
      fx_miss_stagger: './assets/effects/miss_stagger_v4.png',
      fx_status_poison: './assets/effects/status_poison_v4.png',
      fx_status_burn: './assets/effects/status_burn_v4.png',
      fx_status_freeze: './assets/effects/status_freeze_v4.png',

      // 6 大水墨戰鬥場景背景 (1920x1080，單檔 4~4.8MB，僅載入當前關卡，其餘排入最低優先閒置預載)
      bg_mountain_gate: './assets/backgrounds/mountain_gate_v3.png',
      bg_bamboo_forest: './assets/backgrounds/bamboo_forest_v3.png',
      bg_ancient_inn: './assets/backgrounds/ancient_inn_v3.png',
      bg_arena: './assets/backgrounds/arena_v3.png',
      bg_moon_dojo: './assets/backgrounds/moon_dojo_v3.png',
      bg_cloud_peak: './assets/backgrounds/cloud_peak_v3.png'
    };

    // 各立繪腳底接地 Y 軸錨點比例與姿態等高縮放係數（由 manifest visibleBounds 精算校正）
    this.spriteAnchors = {
      yun_wood_sword: { x: 0.50, y: 0.794, scale: 1.0 },
      yun_qingfeng_sword: { x: 0.50, y: 0.820, scale: 1.0 },
      yun_flame_saber: { x: 0.50, y: 0.819, scale: 1.0 },
      yun_xuantie_sword: { x: 0.50, y: 0.834, scale: 1.0 },
      yun_thunder_spear: { x: 0.50, y: 0.834, scale: 1.0 },
      su_wood_sword: { x: 0.50, y: 0.781, scale: 1.0 },
      su_qingfeng_sword: { x: 0.50, y: 0.817, scale: 1.0 },
      su_flame_saber: { x: 0.50, y: 0.818, scale: 1.0 },
      su_xuantie_sword: { x: 0.50, y: 0.817, scale: 1.0 },
      su_thunder_spear: { x: 0.50, y: 0.817, scale: 1.0 },
      yun_wood_hurt: { x: 0.50, y: 0.776, scale: 1.08 },
      yun_wood_block: { x: 0.50, y: 0.840, scale: 1.05 },
      su_wood_hurt: { x: 0.50, y: 0.771, scale: 1.06 },
      su_wood_block: { x: 0.50, y: 0.815, scale: 0.96 },
      enemy_straw: { x: 0.50, y: 0.811 },
      enemy_wood: { x: 0.52, y: 0.775 },
      enemy_bandit_scout: { x: 0.50, y: 0.804 },
      enemy_bandit_saber: { x: 0.50, y: 0.767 },
      enemy_bandit_axes: { x: 0.50, y: 0.761 },
      enemy_wudang: { x: 0.52, y: 0.810 },
      enemy_protector: { x: 0.50, y: 0.760 },
      enemy_arena: { x: 0.50, y: 0.792 },
      enemy_puppet: { x: 0.50, y: 0.790 },
      enemy_boss: { x: 0.50, y: 0.805 }
    };

    // 僅先建立快取索引，不一口氣併發 28 個請求阻塞瀏覽器頻寬
    Object.entries(assets).forEach(([key, src]) => {
      this.imageCache.set(key, {
        src: key.startsWith('bg_') ? src.replace(/\.png$/, '.webp') : src,
        fallbackSrc: key.startsWith('bg_') ? src : null,
        img: null,
        loaded: false,
        loading: false,
        failed: false,
        retries: 0,
        promise: null
      });
    });

    // 預先排入背景緩慢預載佇列（人物與敵人優先，大型場景圖殿後）
    this.bgPrefetchQueue = Object.keys(assets);

    // 啟動時立即高優先載入預設主角與第一關敵人
    this.loadAsset('yun_wood_sword', 'high');
    this.loadAsset('enemy_straw', 'high');
    this.loadAsset('bg_mountain_gate', 'auto');
  }

  loadAsset(key, priority = 'auto') {
    const entry = this.imageCache.get(key);
    if (!entry) return Promise.resolve(null);
    if (entry.loaded) return Promise.resolve(entry.img);
    if (entry.loading && entry.promise) return entry.promise;

    const isHigh = priority === 'high';
    if (isHigh) this.highPriorityPending++;

    entry.loading = true;
    entry.failed = false;

    entry.promise = new Promise((resolve) => {
      const attemptLoad = () => {
        const img = new Image();
        img.decoding = 'async';
        if ('fetchPriority' in img) {
          img.fetchPriority = isHigh ? 'high' : 'low';
        }
        img.onload = () => {
          entry.img = img;
          entry.loaded = true;
          entry.loading = false;
          if (isHigh) this.highPriorityPending = Math.max(0, this.highPriorityPending - 1);
          resolve(img);
          this.pumpBackgroundPrefetch();
        };
        img.onerror = () => {
          if (entry.fallbackSrc) {
            entry.src = entry.fallbackSrc;
            entry.fallbackSrc = null;
            attemptLoad();
            return;
          }
          if (entry.retries < 2) {
            entry.retries += 1;
            setTimeout(attemptLoad, 350 * entry.retries);
            return;
          }
          entry.loading = false;
          entry.failed = true;
          if (isHigh) this.highPriorityPending = Math.max(0, this.highPriorityPending - 1);
          resolve(null);
          this.pumpBackgroundPrefetch();
        };
        img.src = entry.src;
      };
      attemptLoad();
    });

    return entry.promise;
  }

  pumpBackgroundPrefetch() {
    if (this.isPrefetchingBg || this.highPriorityPending > 0) return;
    while (this.bgPrefetchQueue.length > 0) {
      const nextKey = this.bgPrefetchQueue.shift();
      const entry = this.imageCache.get(nextKey);
      if (entry && !entry.loaded && !entry.loading && !entry.failed) {
        this.isPrefetchingBg = true;
        this.loadAsset(nextKey, 'low').finally(() => {
          this.isPrefetchingBg = false;
          this.pumpBackgroundPrefetch();
        });
        return;
      }
    }
  }

  getImage(key, priority = 'high') {
    const entry = this.imageCache.get(key);
    if (!entry) return null;
    if (entry.loaded) return entry.img;
    if (!entry.loading && !entry.failed) {
      this.loadAsset(key, priority);
    }
    return null;
  }

  getFighterImageHeight() {
    // 放大立繪，同時依螢幕寬度限制橫向占位。
    return Math.min(560, Math.max(300, this.height * 0.66), this.width * 0.5);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 開闊對峙站位：少俠拉至左側 14%，敵人拉至右側 86%
    // 確保中央 840px 鍵盤與題目安全區零碰撞零遮擋
    const centerHalfWidth = 430;
    const minHeroX = Math.min(this.width * 0.14, (this.width / 2) - centerHalfWidth - 90);
    const maxEnemyX = Math.max(this.width * 0.86, (this.width / 2) + centerHalfWidth + 90);
    this.heroBaseX = Math.max(130, minHeroX);
    this.enemyBaseX = Math.min(this.width - 130, maxEnemyX);
    this.heroBaseY = this.height * 0.73;
    this.enemyBaseY = this.height * 0.73;
  }

  setupBattle({ hero, weapon, stage }) {
    this.heroConfig = hero;
    this.weaponConfig = weapon;
    this.stageConfig = stage;
    this.comboTier = 0;
    this.swordIntentActive = false;
    this.enemyDangerAlert = false;
    this.heroStatus = null;
    const theme = stage?.sceneTheme || 'mountain_gate';
    this.initAmbientParticles(theme);

    // 優先載入當前關卡的「少俠立繪」與「對手立繪」，確保切換關卡或換角時秒開不塞車
    const heroId = hero?.id || 'yun';
    const weaponId = weapon?.id || 'wood_sword';
    const enemyType = stage?.enemy?.visualType || 'straw';
    const heroKey = `${heroId}_${weaponId}`;
    const enemyKey = `enemy_${enemyType}`;
    const bgKey = `bg_${theme}`;
    const fxKey = (enemyType === 'straw' || enemyType === 'wood') ? 'fx_training_debris' : 'fx_humanoid_hit';

    Promise.all([
      this.loadAsset(heroKey, 'high'),
      this.loadAsset(enemyKey, 'high')
    ]).then(() => {
      this.loadAsset(bgKey, 'high');
      this.loadAsset(fxKey, 'auto');
      this.loadAsset('fx_combo_5', 'auto');
      this.loadAsset('fx_combo_10', 'auto');
      this.loadAsset('fx_combo_15', 'auto');
      this.loadAsset('fx_miss_stagger', 'auto');
      this.loadAsset('fx_status_poison', 'auto');
      this.loadAsset('fx_status_burn', 'auto');
      this.loadAsset('fx_status_freeze', 'auto');
      if ((weapon?.tier || 1) === 1) {
        this.loadAsset(`${heroId}_wood_block`, 'auto');
        this.loadAsset(`${heroId}_wood_hurt`, 'auto');
      }
    });
  }

  initAmbientParticles(theme) {
    this.ambientLeaves = [];
    const color =
      theme === 'bamboo_forest'
        ? '149, 213, 178'
        : theme === 'cloud_peak'
        ? '255, 77, 109'
        : theme === 'ancient_inn'
        ? '255, 209, 102'
        : '202, 240, 248';

    for (let i = 0; i < 20; i++) {
      this.ambientLeaves.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.7),
        rx: 3 + Math.random() * 4,
        ry: 1.5 + Math.random() * 2,
        vx: -0.35 - Math.random() * 0.65,
        vy: 0.2 + Math.random() * 0.45,
        angle: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        rgb: color
      });
    }
  }

  setSwordIntentMode(enabled) {
    this.swordIntentActive = Boolean(enabled);
  }

  setEnemyDangerAlert(isDanger) {
    this.enemyDangerAlert = Boolean(isDanger);
  }

  setEnemyHazard(hazardType) {
    this.enemyHazard = hazardType || null;
  }

  /**
   * 設定主角異常狀態視覺（'poison' 碧綠中毒 | 'burn' 赤焰灼傷 | 'freeze' 寒霜結冰 | null 解除）
   */
  setHeroStatus(status, message = '') {
    this.heroStatus = status || null;
    if (status === 'poison') {
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 78, '82, 183, 136', 18);
      if (message) this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 158, message, '#80ed99', 22);
    } else if (status === 'burn') {
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 78, '255, 107, 53', 18);
      if (message) this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 158, message, '#ff9f1c', 22);
    } else if (status === 'freeze') {
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 78, '72, 202, 228', 18);
      if (message) this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 158, message, '#90e0ef', 22);
    } else if (message) {
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 82, '114, 239, 221', 20);
      this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 162, message, '#72efdd', 24);
    }
  }

  /**
   * 1. 微觀演出：每敲對一個注音／字母 -> 劍氣聚氣星芒
   */
  playMicroGather(combo = 1, comboTier = 0) {
    this.comboTier = comboTier;
    this.setSwordIntentMode(comboTier >= 3);

    const colorHex = comboTier >= 3 ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);
    const rgb = hexToRgb(colorHex);

    for (let i = 0; i < 3; i++) {
      const startX = this.heroBaseX + (Math.random() - 0.5) * 110;
      const startY = this.heroBaseY - 65 + (Math.random() - 0.5) * 85;
      this.particles.push({
        x: startX,
        y: startY,
        tx: this.heroBaseX + 48,
        ty: this.heroBaseY - 72,
        r: 3 + Math.min(comboTier * 1.5, 5),
        alpha: 0.95,
        rgb,
        mode: 'gather',
        life: 0,
        maxLife: 210
      });
    }

    this.heroScaleX = 1.05;
    this.heroScaleY = 0.96;
  }

  /**
   * 2. 中觀演出：完成單一國字 -> 快速弧形劍光／刀光／槍芒斬中敵人
   */
  playCharSlash({ charText, damage, isCrit, comboTier }) {
    const profile = getWeaponEffectProfile(this.weaponConfig);
    const rgb = hexToRgb(profile.color);
    const fxLabel = profile.effectName || '劍氣';
    this.emitWeaponSlashes(false, isCrit);

    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, rgb, profile.particles + (isCrit ? 4 : 0));
    this.enemyOffsetX = 18;
    this.enemyHitFxTimer = this.enemyHitFxMax;

    this.spawnFloatingText(
      this.enemyBaseX + (Math.random() - 0.5) * 28,
      this.enemyBaseY - 135,
      `${charText ? `【${charText}】` : ''}${fxLabel} ${damage}`,
      isCrit ? '#ffd166' : profile.style === 'saber' ? '#ff9f1c' : '#90e0ef',
      isCrit ? 22 : 18
    );
  }

  /**
   * 3. 巨觀演出：完成整個詞語／必殺技 -> 殘影突進 + Hit Stop + 兵器專屬大招氣勁貫穿
   */
  playWordFinisher({ wordText, damage, isCrit, isParryBreak, comboTier }) {
    const profile = getWeaponEffectProfile(this.weaponConfig);
    const rgb = hexToRgb(profile.color);
    const fxLabel = profile.effectName || '劍氣';

    // 少俠高速突進殘影
    for (let i = 1; i <= profile.afterImages; i++) {
      this.afterImages.push({
        x: this.heroBaseX + i * (240 / profile.afterImages),
        y: this.heroBaseY,
        rgb,
        alpha: 0.45 - (i / profile.afterImages) * 0.3,
        life: 0,
        maxLife: 280
      });
    }

    this.heroOffsetX = (this.enemyBaseX - this.heroBaseX) * 0.58;

    // 兵器專屬斬擊／刀芒／槍芒
    this.emitWeaponSlashes(true, isCrit);

    // Hit Stop 瞬間頓幀 75ms + 畫面微震
    this.isHitStop = true;
    setTimeout(() => {
      this.isHitStop = false;
    }, 75);
    this.shakeTime = 140;
    this.shakeIntensity = profile.shake + (isCrit ? 1 : 0);

    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, rgb, profile.particles);
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, '20, 24, 28', 12);

    this.enemyOffsetX = 36;
    this.enemyTilt = 0.14;
    this.enemyHitFxTimer = this.enemyHitFxMax;

    const label = `${isParryBreak ? '⚡看破破綻！' : profile.name}・${fxLabel} ${damage}・破題 +1`;
    this.spawnFloatingText(this.enemyBaseX, this.enemyBaseY - 155, label, '#ffd166', 25);
  }

  emitWeaponSlashes(finisher, isCrit = false) {
    const profile = getWeaponEffectProfile(this.weaponConfig);
    const rgb = hexToRgb(profile.color);
    const cuts = finisher ? profile.finisherCuts : profile.charCuts;
    const waves = finisher ? profile.finisherWaves : profile.charWaves;

    if (profile.style === 'spear') {
      // 槍系（龍膽亮銀槍）：長距離直線貫穿雷霆槍芒 + 十字槍花閃電
      const startX = this.heroBaseX + 90;
      const endX = this.enemyBaseX + 95;
      for (let i = 0; i < cuts; i++) {
        const offsetY = (i - (cuts - 1) / 2) * 22;
        this.slashes.push({
          x1: startX,
          y1: this.heroBaseY - 78 + offsetY * 0.4,
          x2: endX,
          y2: this.enemyBaseY - 82 + offsetY,
          rgb,
          secondaryRgb: '202, 240, 248',
          isSpearThrust: true,
          isWave: false,
          thickness: profile.thickness + (isCrit ? 3 : 0),
          life: 0,
          maxLife: profile.lifetime + i * 35
        });
      }
      for (let i = 0; i < waves; i++) {
        this.slashes.push({
          x1: this.enemyBaseX + i * 18,
          y1: this.enemyBaseY - 78,
          rgb,
          secondaryRgb: '255, 255, 255',
          isSpearStar: true,
          isWave: true,
          radius: profile.radius - i * 20,
          life: 0,
          maxLife: profile.lifetime + i * 60
        });
      }
      return;
    }

    if (profile.style === 'saber') {
      // 刀系（赤炎寶刀）：寬刃重劈赤金烈焰弧形刀光
      for (let i = 0; i < cuts; i++) {
        const reverse = i % 2 === 1;
        const offset = (i - (cuts - 1) / 2) * 22;
        this.slashes.push({
          x1: this.enemyBaseX - 95,
          x2: this.enemyBaseX + 95,
          y1: this.enemyBaseY - (reverse ? 20 : 145) + offset,
          y2: this.enemyBaseY - (reverse ? 145 : 20) + offset,
          rgb,
          secondaryRgb: '255, 209, 102',
          isSaberArc: true,
          isWave: false,
          thickness: profile.thickness + (isCrit ? 3 : 1),
          life: 0,
          maxLife: profile.lifetime
        });
      }
      for (let i = 0; i < waves; i++) {
        this.slashes.push({
          x1: this.enemyBaseX + i * 24,
          y1: this.enemyBaseY - 74,
          rgb,
          secondaryRgb: '255, 183, 3',
          isSaberArc: true,
          isWave: true,
          radius: profile.radius + 10 - i * 20,
          life: 0,
          maxLife: profile.lifetime + i * 65
        });
      }
      return;
    }

    // 劍系（桃木短劍／三尺青鋒劍／流雲玄鐵神劍）：經典俐落劍痕與半月劍氣
    for (let i = 0; i < cuts; i++) {
      const reverse = i % 2 === 1;
      const offset = (i - (cuts - 1) / 2) * 18;
      this.slashes.push({
        x1: this.enemyBaseX - 80, x2: this.enemyBaseX + 80,
        y1: this.enemyBaseY - (reverse ? 25 : 135) + offset,
        y2: this.enemyBaseY - (reverse ? 135 : 25) + offset,
        rgb, isWave: false, thickness: profile.thickness + (isCrit ? 2 : 0),
        life: 0, maxLife: profile.lifetime
      });
    }
    for (let i = 0; i < waves; i++) {
      this.slashes.push({ x1: this.enemyBaseX + i * 22, y1: this.enemyBaseY - 72,
        rgb, isWave: true, radius: profile.radius - i * 22,
        life: 0, maxLife: profile.lifetime + i * 60 });
    }
  }

  /**
   * 4.1 武功招式：青蓮劍氣 (消耗 2 內力)
   */
  playSkillSlash({ damage, isCrit = false }) {
    const rgb = isCrit ? '245, 159, 0' : '72, 202, 228';
    this.heroOffsetX = 20;

    // 半月劍氣疾射
    this.slashes.push({
      x1: this.enemyBaseX - 30,
      y1: this.enemyBaseY - 60,
      rgb,
      isWave: true,
      radius: 76,
      life: 0,
      maxLife: 260
    });

    this.enemyOffsetX = 28;
    this.enemyHitFxTimer = this.enemyHitFxMax;
    this.shakeTime = 100;
    this.shakeIntensity = isCrit ? 6 : 3.5;
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 65, rgb, 12);
    this.spawnFloatingText(
      this.enemyBaseX,
      this.enemyBaseY - 140,
      `⚡青蓮劍氣 ${damage}・破題 +1`,
      isCrit ? '#ffd166' : '#72efdd',
      22
    );
  }

  /**
   * 4.2 武功招式：凌波微步 (消耗 2 內力)
   */
  playSkillDodge() {
    const rgb = '114, 239, 221';
    for (let i = 1; i <= 2; i++) {
      this.afterImages.push({
        x: this.heroBaseX - i * 36,
        y: this.heroBaseY,
        rgb,
        alpha: 0.35,
        life: 0,
        maxLife: 320
      });
    }
    this.heroOffsetX = -24;
    this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 50, rgb, 10);
    this.spawnFloatingText(
      this.enemyBaseX,
      this.enemyBaseY - 140,
      '❄️ 凌波微步・定身！',
      '#a8dadc',
      20
    );
  }

  /**
   * 4.3 武功招式：太極回春 (消耗 3 內力)
   */
  playSkillHeal({ healAmount }) {
    const rgb = '82, 183, 136';
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      this.particles.push({
        x: this.heroBaseX + Math.cos(angle) * 35,
        y: this.heroBaseY - 50 + Math.sin(angle) * 35,
        vx: 0,
        vy: -speed,
        r: 3,
        rgb,
        mode: 'burst',
        life: 0,
        maxLife: 380
      });
    }
    this.spawnFloatingText(
      this.heroBaseX,
      this.heroBaseY - 140,
      `🌿 太極回春 +${healAmount} 氣血`,
      '#52b788',
      22
    );
  }

  /**
   * 4.4 武功絕招：隨所持「劍／刀／槍」自動切換三流派絕學大招演出
   */
  playUltimateBurst({ damage, style, ultName }) {
    const activeStyle = style || this.weaponConfig?.style || 'sword';
    const labelName = ultName || this.weaponConfig?.ultName || '流雲劍訣';
    const rgb =
      activeStyle === 'saber'
        ? '255, 89, 94'
        : activeStyle === 'spear'
        ? '0, 180, 216'
        : '255, 183, 3';

    this.swordIntentActive = true;
    setTimeout(() => {
      this.swordIntentActive = false;
    }, 320);

    if (activeStyle === 'spear') {
      // 槍宗絕學：游龍破陣刺（三道貫穿全場的銀藍雷霆龍槍）
      for (let i = -1; i <= 1; i++) {
        this.slashes.push({
          x1: this.heroBaseX + 60,
          y1: this.heroBaseY - 82 + i * 24,
          x2: this.enemyBaseX + 110,
          y2: this.enemyBaseY - 82 + i * 28,
          rgb: '0, 180, 216',
          secondaryRgb: '202, 240, 248',
          isSpearThrust: true,
          thickness: 11 - Math.abs(i) * 2,
          life: 0,
          maxLife: 360
        });
      }
      this.slashes.push({
        x1: this.enemyBaseX,
        y1: this.enemyBaseY - 78,
        rgb: '144, 224, 239',
        isSpearStar: true,
        isWave: true,
        radius: 120,
        life: 0,
        maxLife: 380
      });
    } else if (activeStyle === 'saber') {
      // 霸刀絕學：烈焰焚天斬（巨型赤金雙十字狂刀＋重型烈焰月牙波）
      this.slashes.push(
        {
          x1: this.enemyBaseX - 115,
          y1: this.enemyBaseY - 155,
          x2: this.enemyBaseX + 115,
          y2: this.enemyBaseY - 5,
          rgb: '255, 77, 0',
          secondaryRgb: '255, 209, 102',
          isSaberArc: true,
          thickness: 14,
          life: 0,
          maxLife: 360
        },
        {
          x1: this.enemyBaseX - 20,
          y1: this.enemyBaseY - 78,
          rgb: '255, 107, 53',
          secondaryRgb: '255, 209, 102',
          isSaberArc: true,
          isWave: true,
          radius: 124,
          life: 0,
          maxLife: 380
        }
      );
    } else {
      // 劍宗絕學：水墨縱橫兩道疾光
      this.slashes.push({
        x1: this.enemyBaseX - 90,
        y1: this.enemyBaseY - 130,
        x2: this.enemyBaseX + 90,
        y2: this.enemyBaseY - 10,
        rgb,
        thickness: 10,
        life: 0,
        maxLife: 320
      });
      this.slashes.push({
        x1: this.enemyBaseX + 80,
        y1: this.enemyBaseY - 120,
        x2: this.enemyBaseX - 80,
        y2: this.enemyBaseY - 20,
        rgb: '255, 255, 255',
        thickness: 6,
        life: 0,
        maxLife: 300
      });
    }

    this.isHitStop = true;
    setTimeout(() => {
      this.isHitStop = false;
    }, 75);

    this.shakeTime = 175;
    this.shakeIntensity = 8.5;
    this.enemyOffsetX = 48;
    this.enemyTilt = 0.22;
    this.enemyHitFxTimer = this.enemyHitFxMax;
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 70, rgb, 24);
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 70, '255, 209, 102', 12);
    const icon = activeStyle === 'saber' ? '🔥' : activeStyle === 'spear' ? '⚡' : '☯️';
    const textColor = activeStyle === 'saber' ? '#ff9f1c' : activeStyle === 'spear' ? '#90e0ef' : '#ffb703';
    this.spawnFloatingText(
      this.enemyBaseX,
      this.enemyBaseY - 160,
      `${icon} ${labelName} ${damage}・破題 +1`,
      textColor,
      26
    );
  }

  /**
   * 4. 失誤架招火花（遵守兒童防挫折規則：錯鍵只觸發 block／架招與招式偏斜火花，不直接扣血）
   */
  playMissParry(shieldUsed = false, previousCombo = 0, retainedCombo = 0) {
    this.heroPose = 'block';
    this.heroPoseTimer = 440;
    this.heroTilt = -0.06;
    if (!shieldUsed) {
      this.comboTier = retainedCombo >= 15 ? 3 : retainedCombo >= 10 ? 2 : retainedCombo >= 5 ? 1 : 0;
      this.comboBurstFxTimer = 0;
      this.setSwordIntentMode(this.comboTier >= 3);
      this.heroMissFxTimer = this.heroMissFxMax;
      this.heroOffsetX = -22;
      this.enemyOffsetX = -26;
      this.shakeTime = previousCombo >= 5 ? 140 : 85;
      this.shakeIntensity = previousCombo >= 5 ? 5.5 : 3;
    }
    const rgb = shieldUsed ? '114, 239, 221' : retainedCombo >= 5 ? '72, 202, 228' : previousCombo >= 5 ? '255, 123, 0' : '255, 209, 102';
    this.spawnBurstParticles(this.heroBaseX + 46, this.heroBaseY - 70, rgb, previousCombo >= 5 ? 16 : 10);
    const text = shieldUsed
      ? '🛡️ 守護護印擋下破綻！'
      : retainedCombo >= 5
      ? `🛡️ 劍氣護體！保留 ${retainedCombo} 連字`
      : previousCombo >= 5
      ? `💥 ${previousCombo} 連擊中斷！氣息紊亂`
      : '⚠️ 招式偏斜！（對手逼近）';
    this.spawnFloatingText(
      this.heroBaseX,
      this.heroBaseY - 145,
      text,
      shieldUsed ? '#72efdd' : retainedCombo >= 5 ? '#90e0ef' : previousCombo >= 5 ? '#ff9f1c' : '#ffd166',
      previousCombo >= 5 ? 21 : 17
    );
  }

  /**
   * 4.5 連擊里程碑大特效（連續打對 5 字清風劍氣、10 字驚雷流雲、15+ 字龍鳳宗師劍意）
   */
  playComboMilestone(combo = 5) {
    if (combo >= 15) {
      this.comboTier = 3;
      this.setSwordIntentMode(true);
      this.comboBurstFxKey = 'fx_combo_15';
      this.comboBurstFxMax = 1150;
      this.comboBurstFxTimer = 1150;
      this.shakeTime = 175;
      this.shakeIntensity = 7;
      this.enemyOffsetX = 38;
      this.enemyHitFxTimer = 420;
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 85, '255, 183, 3', 22);
      this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 85, '255, 209, 102', 20);
      this.slashes.push(
        { x1: this.enemyBaseX - 95, y1: this.enemyBaseY - 140, x2: this.enemyBaseX + 95, y2: this.enemyBaseY - 15, rgb: '255, 183, 3', isWave: false, thickness: 9, life: 0, maxLife: 360 },
        { x1: this.enemyBaseX + 95, y1: this.enemyBaseY - 140, x2: this.enemyBaseX - 95, y2: this.enemyBaseY - 15, rgb: '255, 235, 153', isWave: false, thickness: 7, life: 0, maxLife: 360 }
      );
      this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 165, `🐉 ${combo} 連字・龍鳳文印劍意！`, '#ffd166', 26);
    } else if (combo >= 10) {
      this.comboTier = 2;
      this.comboBurstFxKey = 'fx_combo_10';
      this.comboBurstFxMax = 980;
      this.comboBurstFxTimer = 980;
      this.shakeTime = 135;
      this.shakeIntensity = 5;
      this.enemyOffsetX = 28;
      this.enemyHitFxTimer = 340;
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 80, '72, 202, 228', 18);
      this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 80, '144, 224, 239', 16);
      this.slashes.push(
        { x1: this.enemyBaseX - 20, y1: this.enemyBaseY - 75, rgb: '72, 202, 228', isWave: true, radius: 92, life: 0, maxLife: 340 },
        { x1: this.enemyBaseX + 5, y1: this.enemyBaseY - 75, rgb: '202, 240, 248', isWave: true, radius: 68, life: 0, maxLife: 300 }
      );
      this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 160, `⚡ ${combo} 連字・驚雷流雲！`, '#90e0ef', 24);
    } else {
      this.comboTier = 1;
      this.comboBurstFxKey = 'fx_combo_5';
      this.comboBurstFxMax = 860;
      this.comboBurstFxTimer = 860;
      this.shakeTime = 95;
      this.shakeIntensity = 3.5;
      this.enemyOffsetX = 20;
      this.enemyHitFxTimer = 280;
      this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 75, '82, 183, 136', 14);
      this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, '114, 239, 221', 12);
      this.slashes.push(
        { x1: this.enemyBaseX - 15, y1: this.enemyBaseY - 72, rgb: '114, 239, 221', isWave: true, radius: 78, life: 0, maxLife: 300 }
      );
      this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 155, `🌪️ ${combo} 連字・清風劍氣！`, '#72efdd', 22);
    }
  }

  /**
   * 5. 敵人攻擊（真正受擊情境，切換至 hurt 姿態）
   */
  playEnemyAttack(damage) {
    this.enemyOffsetX = -(this.enemyBaseX - this.heroBaseX) * 0.52;
    this.heroPose = 'hurt';
    this.heroPoseTimer = 480;
    this.heroOffsetX = -18;
    this.heroTilt = -0.09;
    this.shakeTime = 130;
    this.shakeIntensity = 6;
    this.spawnBurstParticles(this.heroBaseX, this.heroBaseY - 68, '230, 57, 70', 14);
    this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 140, `-${damage} 氣血`, '#ff6b6b', 20);
  }

  spawnBurstParticles(x, y, rgb, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 5.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2.5 + Math.random() * 4,
        rgb,
        mode: 'burst',
        life: 0,
        maxLife: 240 + Math.random() * 160
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#ffd166', size = 20) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      life: 0,
      maxLife: 680
    });
  }

  update(dt) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }
    if (this.heroPoseTimer > 0) {
      this.heroPoseTimer = Math.max(0, this.heroPoseTimer - dt);
      if (this.heroPoseTimer === 0) {
        this.heroPose = 'idle';
      }
    }
    if (this.enemyHitFxTimer > 0) {
      this.enemyHitFxTimer = Math.max(0, this.enemyHitFxTimer - dt);
    }
    if (this.heroMissFxTimer > 0) {
      this.heroMissFxTimer = Math.max(0, this.heroMissFxTimer - dt);
    }
    if (this.comboBurstFxTimer > 0) {
      this.comboBurstFxTimer = Math.max(0, this.comboBurstFxTimer - dt);
    }

    if (this.isHitStop) return;

    this.breathTime += dt * 0.0038;

    // 彈性歸位
    this.heroOffsetX *= 0.82;
    this.heroTilt *= 0.82;
    this.heroScaleX += (1 - this.heroScaleX) * 0.22;
    this.heroScaleY += (1 - this.heroScaleY) * 0.22;
    this.enemyOffsetX *= 0.82;
    this.enemyTilt *= 0.82;

    // 環境落葉更新
    for (const leaf of this.ambientLeaves) {
      leaf.x += leaf.vx;
      leaf.y += leaf.vy;
      leaf.angle += leaf.vr;
      if (leaf.x < -15) leaf.x = this.width + 15;
      if (leaf.y > this.height * 0.7) leaf.y = -10;
    }

    // 粒子更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.mode === 'gather') {
        p.x += (p.tx - p.x) * 0.22;
        p.y += (p.ty - p.y) * 0.22;
      } else {
        p.x += p.vx;
        p.y += p.vy;
      }
    }

    // 劍光軌跡更新
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life += dt;
      if (this.slashes[i].life >= this.slashes[i].maxLife) {
        this.slashes.splice(i, 1);
      }
    }

    // 殘影更新
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].life += dt;
      if (this.afterImages[i].life >= this.afterImages[i].maxLife) {
        this.afterImages.splice(i, 1);
      }
    }

    // 浮動傷害跳字更新
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      ft.y -= dt * 0.065;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    if (this.shakeTime > 0) {
      const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(dx, dy);
    }

    // 1. 繪製六大主題水墨背景
    this.drawBackdrop(ctx, w, h);

    // 2. 繪製環境落葉與雲氣粒子
    for (const leaf of this.ambientLeaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      ctx.fillStyle = `rgba(${leaf.rgb}, 0.38)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.rx, leaf.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 劍意狀態背景壓暗
    if (this.swordIntentActive) {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.42)';
      ctx.fillRect(0, 0, w, h);
    }

    // 4. 繪製殘影
    for (const ghost of this.afterImages) {
      const ratio = 1 - ghost.life / ghost.maxLife;
      ctx.fillStyle = `rgba(${ghost.rgb}, ${ghost.alpha * ratio})`;
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y - 60, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. 繪製少俠與敵人
    const breathOffset = Math.sin(this.breathTime) * 3.5;
    this.drawHero(
      ctx,
      this.heroBaseX + this.heroOffsetX,
      this.heroBaseY + breathOffset
    );
    this.drawEnemy(
      ctx,
      this.enemyBaseX + this.enemyOffsetX,
      this.enemyBaseY + Math.sin(this.breathTime + 1.2) * 3
    );

    // 6. 繪製劍光斬擊、赤炎刀罡與雷霆槍芒
    for (const s of this.slashes) {
      const alpha = Math.max(0, 1 - s.life / s.maxLife);
      ctx.save();
      if (s.isSpearStar) {
        // 槍系：十字雷霆槍花與破空震波環
        ctx.translate(s.x1, s.y1);
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * 0.78})`;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 5;
        const arm = s.radius * 1.15;
        ctx.beginPath();
        ctx.moveTo(-arm, 0);
        ctx.lineTo(arm, 0);
        ctx.moveTo(0, -arm * 0.85);
        ctx.lineTo(0, arm * 0.85);
        ctx.stroke();
      } else if (s.isSpearThrust) {
        // 槍系：長距離直線貫穿雷霆槍芒 + 槍尖寒星
        ctx.lineCap = 'round';
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * 0.55})`;
        ctx.lineWidth = s.thickness * 3.2;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${s.secondaryRgb || '202, 240, 248'}, ${alpha * 0.9})`;
        ctx.lineWidth = s.thickness * 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x1 + 30, s.y1);
        ctx.lineTo(s.x2 + 12, s.y2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(3, s.thickness * 0.7);
        ctx.beginPath();
        ctx.moveTo(s.x1 + 60, s.y1);
        ctx.lineTo(s.x2 + 24, s.y2);
        ctx.stroke();
      } else if (s.isWave) {
        const shiftX = (s.life / s.maxLife) * (s.isSaberArc ? 58 : 48);
        ctx.translate(s.x1 + shiftX, s.y1);
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * (s.isSaberArc ? 0.82 : 0.65)})`;
        ctx.lineWidth = s.isSaberArc ? 32 : 22;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius, s.isSaberArc ? -1.32 : -1.15, s.isSaberArc ? 1.32 : 1.15);
        ctx.stroke();

        if (s.isSaberArc && s.secondaryRgb) {
          ctx.strokeStyle = `rgba(${s.secondaryRgb}, ${alpha * 0.92})`;
          ctx.lineWidth = 15;
          ctx.beginPath();
          ctx.arc(0, 0, s.radius - 3, -1.24, 1.24);
          ctx.stroke();
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = s.isSaberArc ? 8 : 7;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius - (s.isSaberArc ? 7 : 4), -1.1, 1.1);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * (s.isSaberArc ? 0.78 : 0.6)})`;
        ctx.lineWidth = s.thickness * (s.isSaberArc ? 3.1 : 2.4);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();

        if (s.isSaberArc && s.secondaryRgb) {
          ctx.strokeStyle = `rgba(${s.secondaryRgb}, ${alpha * 0.9})`;
          ctx.lineWidth = s.thickness * 1.75;
          ctx.beginPath();
          ctx.moveTo(s.x1, s.y1);
          ctx.lineTo(s.x2, s.y2);
          ctx.stroke();
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = s.thickness;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 7. 繪製劍氣與水墨粒子
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = `rgba(${p.rgb}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. 繪製浮動傷害跳字
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
      ctx.save();
      ctx.font = `bold ${ft.size}px "Microsoft JhengHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(16, 18, 20, ${alpha})`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }

  drawBackdrop(ctx, w, h) {
    const theme = this.stageConfig?.sceneTheme || 'mountain_gate';
    const bgKey = `bg_${theme}`;

    // 1. 優先使用對應主題的 v3 新國風水墨背景圖 (1920x1080)，並鎖定 Y=0.68 地面線對齊
    const bgImg =
      this.getImage(bgKey, 'auto') ||
      (!this.imageCache.has(bgKey) ? this.getImage('bg_mountain_gate', 'auto') : null);
    if (bgImg) {
      const imgRatio = bgImg.width / bgImg.height;
      const canvasRatio = w / h;
      let dw, dh, dx, dy;
      if (canvasRatio > imgRatio) {
        dw = w;
        dh = w / imgRatio;
        dx = 0;
        // 鎖定 68% 演武台地平線位置，避免寬螢幕上下裁切造成人物浮空
        dy = h * 0.68 - dh * 0.68;
      } else {
        dh = h;
        dw = h * imgRatio;
        dx = (w - dw) * 0.5;
        dy = 0;
      }
      ctx.drawImage(bgImg, dx, dy, dw, dh);

      // 輕微水墨氛圍暗角層，確保前方人物立繪與中央題目卷軸清晰突出
      ctx.fillStyle = 'rgba(10, 14, 22, 0.16)';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // --- 備援降級向量背景繪製 ---
    const palettes = {
      mountain_gate: { top: '#1d2d3a', bottom: '#3b5249', mountain: 'rgba(22, 36, 45, 0.62)', moon: '#f4f0e6' },
      bamboo_forest: { top: '#132a13', bottom: '#2d6a4f', mountain: 'rgba(27, 67, 50, 0.62)', moon: '#d8f3dc' },
      ancient_inn:   { top: '#1a1423', bottom: '#3d2645', mountain: 'rgba(36, 23, 43, 0.65)', moon: '#ffb703' },
      arena:         { top: '#2b2118', bottom: '#5c4033', mountain: 'rgba(31, 22, 16, 0.65)', moon: '#f59f00' },
      moon_dojo:     { top: '#0b132b', bottom: '#1c2541', mountain: 'rgba(20, 30, 56, 0.65)', moon: '#e0fbfc' },
      cloud_peak:    { top: '#190b28', bottom: '#3c1642', mountain: 'rgba(16, 7, 25, 0.68)', moon: '#ffccd5' }
    };
    const pal = palettes[theme] || palettes.mountain_gate;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, pal.top);
    grad.addColorStop(1, pal.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 遠景明月／日輪
    const moonX = w * 0.74;
    const moonY = h * 0.24;
    ctx.fillStyle = pal.moon;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.82;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 遠山層疊山形
    ctx.fillStyle = pal.mountain;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.68);
    ctx.lineTo(w * 0.18, h * 0.37);
    ctx.lineTo(w * 0.37, h * 0.55);
    ctx.lineTo(w * 0.63, h * 0.31);
    ctx.lineTo(w * 0.84, h * 0.49);
    ctx.lineTo(w, h * 0.39);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 竹林或古驛紅燈籠點綴
    if (theme === 'bamboo_forest') {
      ctx.strokeStyle = 'rgba(8, 28, 21, 0.55)';
      ctx.lineWidth = 6;
      [0.08, 0.13, 0.87, 0.92].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(w * rx, 0);
        ctx.lineTo(w * (rx + 0.015), h * 0.72);
        ctx.stroke();
      });
    } else if (theme === 'ancient_inn') {
      [0.14, 0.86].forEach((rx) => {
        ctx.fillStyle = 'rgba(230, 57, 70, 0.9)';
        ctx.beginPath();
        ctx.ellipse(w * rx, h * 0.22, 18, 23, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 地面演武台
    ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    ctx.fillRect(0, h * 0.68, w, h * 0.32);
    ctx.strokeStyle = 'rgba(245, 159, 0, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.68);
    ctx.lineTo(w * 0.94, h * 0.68);
    ctx.stroke();
  }

  drawHero(ctx, x, y) {
    const hero = this.heroConfig || { id: 'yun', name: '雲清川', primaryColor: 0x48cae4, robeColor: 0x1d3557 };
    const weapon = this.weaponConfig || { id: 'wood_sword', tier: 1, name: '桃木短劍', slashColor: 0xe9ecef };
    const tier = weapon.tier || 1;
    const primaryRgb = hexToRgb(hero.primaryColor);
    const swordRgb = hexToRgb(weapon.slashColor);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.heroTilt || 0);
    ctx.scale(this.heroScaleX, this.heroScaleY);

    // 腳下劍氣光陣（若處於中毒／灼傷／結冰狀態則轉為對應元素警示法陣）
    const statusAuraMap = {
      poison: '56, 176, 0',
      burn: '255, 77, 0',
      freeze: '0, 180, 216'
    };
    const auraColors = ['72, 202, 228', '82, 183, 136', '72, 202, 228', '255, 183, 3'];
    const auraRgb =
      (this.heroStatus && statusAuraMap[this.heroStatus]) ||
      (this.comboTier > 0 ? auraColors[Math.min(3, this.comboTier)] : primaryRgb);
    ctx.fillStyle = `rgba(${auraRgb}, ${this.heroStatus ? 0.42 : 0.25 + this.comboTier * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(0, 10, 74 + this.comboTier * 10, 18 + this.comboTier * 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.comboTier >= 1 || this.heroStatus) {
      ctx.strokeStyle = `rgba(${auraRgb}, ${this.heroStatus ? 0.85 : 0.55 + this.comboTier * 0.12})`;
      ctx.lineWidth = this.heroStatus ? 3.5 : 2 + this.comboTier;
      ctx.beginPath();
      ctx.ellipse(0, 10, 86 + this.comboTier * 12, 22 + this.comboTier * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const baseH = this.getFighterImageHeight();

    // 5 / 10 / 15 連擊常駐背後水墨氣場光輪
    if (this.comboTier >= 1) {
      const auraKey = this.comboTier >= 3 ? 'fx_combo_15' : this.comboTier === 2 ? 'fx_combo_10' : 'fx_combo_5';
      const auraImg = this.getImage(auraKey, 'auto');
      if (auraImg) {
        const auraSize = baseH * (0.64 + this.comboTier * 0.06);
        ctx.save();
        ctx.translate(0, -baseH * 0.36);
        ctx.rotate(this.breathTime * (0.4 + this.comboTier * 0.2));
        ctx.globalAlpha = 0.28 + this.comboTier * 0.08;
        ctx.drawImage(auraImg, -auraSize / 2, -auraSize / 2, auraSize, auraSize);
        ctx.restore();
      }
    }

    // 依主角 ID、裝備神兵與當前姿態選擇立繪：
    // 四張 hurt/block v4 圖僅支援初階（tier === 1 布衣＋桃木短劍），中高階維持原階級立繪避免服裝跳回初階
    const baseSpriteKey = `${hero.id}_${weapon.id || 'wood_sword'}`;
    const poseSpriteKey =
      tier === 1 && (this.heroPose === 'block' || this.heroPose === 'hurt')
        ? `${hero.id}_wood_${this.heroPose}`
        : baseSpriteKey;

    const poseImg = poseSpriteKey !== baseSpriteKey ? this.getImage(poseSpriteKey, 'auto') : null;
    const activeSpriteKey = poseImg ? poseImgKey(poseSpriteKey) : baseSpriteKey;
    function poseImgKey(k) { return k; }
    const heroImg =
      poseImg ||
      this.getImage(baseSpriteKey, 'high') ||
      (!this.imageCache.has(baseSpriteKey) ? this.getImage('yun_wood_sword', 'high') : null);

    if (heroImg) {
      // v3/v4 立繪四周含 15% 安全留白，乘上 anchor.scale 確保 idle/block/hurt 切換時頭部與鞋底高度一致
      const anchor = this.spriteAnchors?.[activeSpriteKey] || { x: 0.50, y: 0.80, scale: 1.0 };
      const targetH = baseH * (anchor.scale || 1.0);
      const targetW = targetH * (heroImg.width / heroImg.height);
      const anchorX = anchor.x * targetW;
      const anchorY = anchor.y * targetH;

      ctx.save();
      if (this.heroStatus === 'poison') {
        // 中毒綠綠感：人物全身泛起碧綠毒光與綠暈
        ctx.filter = 'sepia(0.65) hue-rotate(65deg) saturate(2.8) brightness(0.96) drop-shadow(0 0 16px rgba(56, 176, 0, 0.92))';
      } else if (this.heroStatus === 'burn') {
        // 灼傷紅焰感：人物全身泛起赤紅火光與熱浪
        ctx.filter = 'sepia(0.65) hue-rotate(-34deg) saturate(3.1) brightness(1.06) drop-shadow(0 0 18px rgba(255, 77, 0, 0.95))';
      } else if (this.heroStatus === 'freeze') {
        // 結冰凍結感：人物全身泛起寒冰青藍霜光
        ctx.filter = 'sepia(0.55) hue-rotate(155deg) saturate(2.8) brightness(1.12) drop-shadow(0 0 18px rgba(0, 180, 216, 0.95))';
      }
      ctx.drawImage(heroImg, -anchorX, -anchorY + 6, targetW, targetH);
      ctx.restore();
    } else {
      // --- 備援降級向量繪製（無圖時等比放大 1.4 倍） ---
      ctx.save();
      ctx.scale(1.4, 1.4);

      if (tier >= 3) {
        ctx.fillStyle = 'rgba(245, 159, 0, 0.18)';
        ctx.beginPath();
        ctx.arc(0, -56, 68, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1d3557';
        ctx.beginPath();
        ctx.moveTo(-10, -88);
        ctx.lineTo(-68, -6);
        ctx.lineTo(-8, -14);
        ctx.closePath();
        ctx.fill();
      }

      const waveOffset = Math.sin(this.breathTime * 2) * 5;
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.9)`;
      ctx.lineWidth = tier >= 2 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(-8, -108);
      ctx.quadraticCurveTo(-42, -118 + waveOffset, -72, -104 - waveOffset);
      ctx.stroke();

      ctx.fillStyle = tier === 1 ? '#495057' : hero.id === 'su' ? '#2d6a4f' : '#1d3557';
      ctx.beginPath();
      ctx.roundRect(-22, -86, 44, 74, 8);
      ctx.fill();

      ctx.strokeStyle = '#f4f0e6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, -85);
      ctx.lineTo(6, -52);
      ctx.moveTo(12, -85);
      ctx.lineTo(-4, -52);
      ctx.stroke();

      ctx.fillStyle = tier >= 3 ? '#f59f00' : tier === 2 ? `rgb(${primaryRgb})` : '#adb5bd';
      ctx.fillRect(-23, -46, 46, 8);

      ctx.fillStyle = '#ffe5d9';
      ctx.beginPath();
      ctx.arc(0, -104, 17, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1b1f24';
      ctx.beginPath();
      ctx.arc(0, -108, 18, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-6, -124, hero.id === 'su' ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${swordRgb}, 0.32)`;
      ctx.lineWidth = tier >= 2 ? 12 : 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(20, -58);
      ctx.lineTo(88, -88);
      ctx.stroke();

      ctx.strokeStyle = `rgb(${swordRgb})`;
      ctx.lineWidth = tier >= 3 ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(18, -57);
      ctx.lineTo(86, -87);
      ctx.stroke();

      ctx.restore();
    }

    // 角色異常狀態（中毒綠霧／灼傷紅焰／結冰寒霜）水墨前景特效疊加
    if (this.heroStatus) {
      const statusFxKey = `fx_status_${this.heroStatus}`;
      const statusImg = this.getImage(statusFxKey, 'auto');
      if (statusImg) {
        const pulse = 1 + Math.sin(this.breathTime * 2.4) * 0.06;
        const fxSize = baseH * 0.72 * pulse;
        ctx.save();
        ctx.translate(0, -baseH * 0.38);
        ctx.globalAlpha = 0.86;
        ctx.drawImage(statusImg, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 5 / 10 / 15 連擊爆發瞬間前景特效疊加
    if (this.comboBurstFxTimer > 0 && this.comboBurstFxKey) {
      const burstImg = this.getImage(this.comboBurstFxKey, 'auto');
      if (burstImg) {
        const progress = Math.min(1, Math.max(0, this.comboBurstFxTimer / (this.comboBurstFxMax || 900)));
        const scale = 1.18 - progress * 0.32;
        const fxSize = baseH * 0.78 * scale;
        ctx.save();
        ctx.translate(0, -baseH * 0.38);
        ctx.rotate((1 - progress) * 0.45);
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.92;
        ctx.drawImage(burstImg, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 打錯字（Miss）招式偏斜水墨火花疊加
    if (this.heroMissFxTimer > 0) {
      const missImg = this.getImage('fx_miss_stagger', 'auto');
      if (missImg) {
        const progress = Math.min(1, Math.max(0, this.heroMissFxTimer / (this.heroMissFxMax || 440)));
        const fxSize = baseH * 0.56 * (1.12 - progress * 0.18);
        ctx.save();
        ctx.globalAlpha = progress * 0.92;
        ctx.drawImage(missImg, 18 - fxSize / 2, -baseH * 0.42 - fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 角色名牌（含兵器與異常狀態標示）
    const statusBadge =
      this.heroStatus === 'poison'
        ? ' ☠️中毒'
        : this.heroStatus === 'burn'
        ? ' 🔥灼傷'
        : this.heroStatus === 'freeze'
        ? ' ❄️結冰'
        : '';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.heroStatus ? 'rgba(28, 12, 18, 0.82)' : 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(-86, 20, 172, 24);
    ctx.fillStyle =
      this.heroStatus === 'poison'
        ? '#80ed99'
        : this.heroStatus === 'burn'
        ? '#ff9f1c'
        : this.heroStatus === 'freeze'
        ? '#90e0ef'
        : '#f4f0e6';
    ctx.fillText(`${hero.name}｜${weapon.name.split('・')[1] || weapon.name}${statusBadge}`, 0, 36);

    ctx.restore();
  }

  drawEnemy(ctx, x, y) {
    const enemy = this.stageConfig?.enemy || {
      name: '稻草人',
      title: '新手練功靶',
      visualType: 'straw',
      primaryColor: 0xd4a373
    };
    const type = enemy.visualType || 'straw';
    const hazardAuraMap = {
      poison: '56, 176, 0',
      burn: '255, 77, 0',
      freeze: '0, 180, 216'
    };
    const rgb = (this.enemyHazard && hazardAuraMap[this.enemyHazard]) || hexToRgb(enemy.primaryColor || 0xd4a373);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.enemyTilt);

    // 腳下陰影與屬性法陣（毒／火／冰敵人自帶對應元素光陣，蓄力 >75% 時強烈脈動）
    const pulseAlpha = this.enemyDangerAlert ? 0.55 + Math.sin(this.breathTime * 5) * 0.2 : (this.enemyHazard ? 0.36 : 0.28);
    ctx.fillStyle = `rgba(${rgb}, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 10, type === 'boss' ? 88 : 72, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.enemyHazard || this.enemyDangerAlert) {
      ctx.strokeStyle = this.enemyDangerAlert ? `rgba(${this.enemyHazard ? rgb : '255, 42, 85'}, 0.92)` : `rgba(${rgb}, 0.65)`;
      ctx.lineWidth = this.enemyDangerAlert ? 4 : 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 10, (type === 'boss' ? 98 : 82) + (this.enemyDangerAlert ? 6 : 0), 24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 優先使用 10 大代表敵人之 v3 全身立繪
    const enemyKey = `enemy_${type}`;
    const enemyImg =
      this.getImage(enemyKey, 'high') ||
      (!this.imageCache.has(enemyKey) ? this.getImage('enemy_straw', 'high') : null);
    const baseH = this.getFighterImageHeight();
    const targetH = type === 'boss' ? baseH * 1.08 : baseH;

    if (enemyImg) {
      const targetW = targetH * (enemyImg.width / enemyImg.height);
      const anchor = this.spriteAnchors?.[enemyKey] || { x: 0.50, y: 0.80 };
      const anchorX = anchor.x * targetW;
      const anchorY = anchor.y * targetH;

      ctx.save();
      if (this.enemyDangerAlert) {
        if (this.enemyHazard === 'poison') {
          ctx.filter = ' brightness(1.08) drop-shadow(0 0 18px rgba(56, 176, 0, 0.95))';
        } else if (this.enemyHazard === 'burn') {
          ctx.filter = ' brightness(1.1) drop-shadow(0 0 20px rgba(255, 77, 0, 0.95))';
        } else if (this.enemyHazard === 'freeze') {
          ctx.filter = ' brightness(1.12) drop-shadow(0 0 20px rgba(0, 180, 216, 0.95))';
        } else {
          ctx.filter = ' brightness(1.08) drop-shadow(0 0 18px rgba(255, 42, 85, 0.92))';
        }
      } else if (this.enemyHazard) {
        ctx.filter = `drop-shadow(0 0 10px rgba(${rgb}, 0.55))`;
      }
      ctx.drawImage(enemyImg, -anchorX, -anchorY + 6, targetW, targetH);
      ctx.restore();
    } else {
      // --- 備援降級向量繪製（等比放大 1.4 倍） ---
      ctx.save();
      ctx.scale(1.4, 1.4);
      if (type === 'straw') {
        ctx.fillStyle = '#7f5539';
        ctx.fillRect(-5, -96, 10, 106);
        ctx.fillRect(-38, -72, 76, 8);
        ctx.fillStyle = '#e9c46a';
        ctx.beginPath();
        ctx.roundRect(-22, -82, 44, 52, 10);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -98, 16, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'wood') {
        ctx.fillStyle = '#9c6644';
        ctx.beginPath();
        ctx.roundRect(-20, -110, 40, 118, 8);
        ctx.fill();
      } else {
        const isBoss = type === 'boss';
        const bodyW = isBoss ? 56 : 46;
        const bodyH = isBoss ? 82 : 72;
        ctx.fillStyle = '#212529';
        ctx.beginPath();
        ctx.roundRect(-bodyW / 2, -86, bodyW, bodyH, 8);
        ctx.fill();
        ctx.fillStyle = '#f3d5b5';
        ctx.beginPath();
        ctx.arc(0, -105, isBoss ? 19 : 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 敵人蓄力超過 75% 時，周身湧現毒／火／冰出招前兆氣旋
    if (this.enemyDangerAlert && this.enemyHazard) {
      const hazardFxImg = this.getImage(`fx_status_${this.enemyHazard}`, 'auto');
      if (hazardFxImg) {
        const pulse = 0.92 + Math.sin(this.breathTime * 4) * 0.08;
        const fxSize = targetH * 0.68 * pulse;
        ctx.save();
        ctx.translate(0, -targetH * 0.38);
        ctx.globalAlpha = 0.72;
        ctx.drawImage(hazardFxImg, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 受擊特效疊加（v4）：練功靶（稻草人／木人樁）顯示草木碎屑，人型敵人顯示受擊白光
    if (this.enemyHitFxTimer > 0) {
      const fxKey = type === 'straw' || type === 'wood' ? 'fx_training_debris' : 'fx_humanoid_hit';
      const fxImg = this.getImage(fxKey);
      if (fxImg) {
        const progress = Math.min(1, Math.max(0, this.enemyHitFxTimer / (this.enemyHitFxMax || 260)));
        const fxSize = targetH * (type === 'straw' || type === 'wood' ? 0.56 : 0.64) * (1.08 - progress * 0.12);
        ctx.save();
        ctx.globalAlpha = progress * 0.86;
        ctx.drawImage(fxImg, -fxSize / 2, -targetH * 0.44 - fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 5 / 10 / 15 連擊爆發衝擊敵人特效疊加
    if (this.comboBurstFxTimer > 0 && this.comboBurstFxKey) {
      const burstImg = this.getImage(this.comboBurstFxKey, 'auto');
      if (burstImg) {
        const progress = Math.min(1, Math.max(0, this.comboBurstFxTimer / (this.comboBurstFxMax || 900)));
        const fxSize = targetH * 0.72 * (1.15 - progress * 0.25);
        ctx.save();
        ctx.translate(0, -targetH * 0.42);
        ctx.rotate(-(1 - progress) * 0.5);
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.85;
        ctx.drawImage(burstImg, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
        ctx.restore();
      }
    }

    // 敵人名牌（含屬性與蓄力即將出招警示）
    const hazardBadge =
      this.enemyHazard === 'poison'
        ? '☠️毒'
        : this.enemyHazard === 'burn'
        ? '🔥火'
        : this.enemyHazard === 'freeze'
        ? '❄️冰'
        : '';
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.enemyDangerAlert ? 'rgba(92, 16, 24, 0.88)' : 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(-90, 20, 180, 24);
    ctx.fillStyle = this.enemyDangerAlert ? '#ffd166' : '#ffccd5';
    const nameLabel = this.enemyDangerAlert
      ? `⚡即將出招！${enemy.name}${hazardBadge ? `(${hazardBadge})` : ''}`
      : `${enemy.name}（${hazardBadge || enemy.title}）`;
    ctx.fillText(nameLabel, 0, 36);

    ctx.restore();
  }
}
