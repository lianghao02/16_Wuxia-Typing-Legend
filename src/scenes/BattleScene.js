/**
 * 《武俠打字傳》Phaser 3 戰鬥場景 (BattleScene.js)
 * 職責：
 * - 完全不碰輸入法與文字排版（由 TypingEngine 與 DOMOverlay 處理）
 * - 專注呈現「新國風仙俠 × 現代動畫戰鬥節奏」：
 *   1. 六大水墨意境場景（遠山雲霧、翠竹落葉、古驛紅燈籠、月下演武、雲海山巔）
 *   2. 雲清川／蘇映雪三階外觀成長（布衣木劍 -> 俠客青鋒 -> 宗師玄鐵披風）
 *   3. 八階敵人造型與動態蓄力紅光警示
 *   4. Hit Stop（0.07s 頓幀）、Slash Line（弧形劍氣）、After Image（殘影突進）、水墨粒子與劍意狀態
 */

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    this.heroConfig = null;
    this.weaponConfig = null;
    this.stageConfig = null;
    this.comboTier = 0;
    this.isHitStop = false;
    this.ambientLeaves = [];
    this.qiOrbs = [];
  }

  create() {
    const { width, height } = this.scale;

    // 背景圖層
    this.bgGraphics = this.add.graphics();
    this.swordIntentOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x080c14, 0)
      .setDepth(5);

    // 遠景環境粒子（雲霧／竹葉／火星）
    this.ambientContainer = this.add.container(0, 0).setDepth(3);

    // 地面演武台線條
    this.floorGraphics = this.add.graphics().setDepth(6);

    // 少俠與敵人容器
    this.heroBaseX = width * 0.25;
    this.heroBaseY = height * 0.62;
    this.enemyBaseX = width * 0.75;
    this.enemyBaseY = height * 0.62;

    this.heroContainer = this.add.container(this.heroBaseX, this.heroBaseY).setDepth(15);
    this.enemyContainer = this.add.container(this.enemyBaseX, this.enemyBaseY).setDepth(14);
    this.fxContainer = this.add.container(0, 0).setDepth(25);

    // 繪製初始場景
    this.drawBackdrop('mountain_gate');
    this.initAmbientParticles('mountain_gate');

    // 呼吸律動計時
    this.breathTime = 0;

    // 視窗尺寸自適應
    this.scale.on('resize', (gameSize) => {
      this.relayout(gameSize.width, gameSize.height);
    });

    if (window.__wuxiaApp && window.__wuxiaApp.onPhaserReady) {
      window.__wuxiaApp.onPhaserReady(this);
    }
  }

  relayout(width, height) {
    this.heroBaseX = width * 0.25;
    this.heroBaseY = height * 0.63;
    this.enemyBaseX = width * 0.75;
    this.enemyBaseY = height * 0.63;
    if (this.swordIntentOverlay) {
      this.swordIntentOverlay.setPosition(width / 2, height / 2);
      this.swordIntentOverlay.setSize(width, height);
    }
    if (this.stageConfig) {
      this.drawBackdrop(this.stageConfig.sceneTheme);
    }
    if (this.heroContainer) {
      this.heroContainer.setPosition(this.heroBaseX, this.heroBaseY);
    }
    if (this.enemyContainer) {
      this.enemyContainer.setPosition(this.enemyBaseX, this.enemyBaseY);
    }
  }

  /**
   * 設定關卡、主角與武器外觀
   */
  setupBattle({ hero, weapon, stage }) {
    this.heroConfig = hero;
    this.weaponConfig = weapon;
    this.stageConfig = stage;
    this.comboTier = 0;

    this.drawBackdrop(stage.sceneTheme);
    this.initAmbientParticles(stage.sceneTheme);
    this.buildHeroSprite(hero, weapon);
    this.buildEnemySprite(stage.enemy);
    this.setSwordIntentMode(false);
  }

  /**
   * 繪製六大水墨國風背景
   */
  drawBackdrop(theme = 'mountain_gate') {
    const { width, height } = this.scale;
    const g = this.bgGraphics;
    g.clear();

    // 依主題設定天地漸層色調
    const palettes = {
      mountain_gate: { top: 0x1d2d3a, bottom: 0x3b5249,mountain: 0x16242d, moon: 0xf4f0e6 },
      bamboo_forest: { top: 0x132a13, bottom: 0x2d6a4f, mountain: 0x1b4332, moon: 0xd8f3dc },
      ancient_inn:   { top: 0x1a1423, bottom: 0x3d2645, mountain: 0x24172b, moon: 0xffb703 },
      arena:         { top: 0x2b2118, bottom: 0x5c4033, mountain: 0x1f1610, moon: 0xf59f00 },
      moon_dojo:     { top: 0x0b132b, bottom: 0x1c2541, mountain: 0x141e38, moon: 0xe0fbfc },
      cloud_peak:    { top: 0x190b28, bottom: 0x3c1642, mountain: 0x100719, moon: 0xffccd5 }
    };
    const pal = palettes[theme] || palettes.mountain_gate;

    // 天空底色
    g.fillGradientStyle(pal.top, pal.top, pal.bottom, pal.bottom, 1);
    g.fillRect(0, 0, width, height);

    // 遠方圓月或日輪（宣紙水墨光暈）
    const moonX = width * 0.72;
    const moonY = height * 0.24;
    g.fillStyle(pal.moon, 0.12);
    g.fillCircle(moonX, moonY, 95);
    g.fillStyle(pal.moon, 0.82);
    g.fillCircle(moonX, moonY, 52);

    // 遠山層疊水墨山形
    g.fillStyle(pal.mountain, 0.55);
    g.beginPath();
    g.moveTo(0, height * 0.65);
    g.lineTo(width * 0.18, height * 0.36);
    g.lineTo(width * 0.38, height * 0.54);
    g.lineTo(width * 0.62, height * 0.30);
    g.lineTo(width * 0.85, height * 0.48);
    g.lineTo(width, height * 0.38);
    g.lineTo(width, height);
    g.lineTo(0, height);
    g.closePath();
    g.fillPath();

    // 主題特色裝飾（竹林竹竿／客棧紅燈籠／山門牌樓）
    if (theme === 'bamboo_forest') {
      g.lineStyle(5, 0x081c15, 0.55);
      [0.08, 0.14, 0.86, 0.92].forEach((rx) => {
        g.strokeLineShape(new Phaser.Geom.Line(width * rx, 0, width * (rx + 0.02), height * 0.75));
      });
    } else if (theme === 'ancient_inn') {
      // 客棧紅燈籠高掛
      [0.16, 0.84].forEach((rx) => {
        g.lineStyle(2, 0x111111, 0.8);
        g.strokeLineShape(new Phaser.Geom.Line(width * rx, 0, width * rx, height * 0.18));
        g.fillStyle(0xe63946, 0.9);
        g.fillEllipse(width * rx, height * 0.21, 34, 42);
        g.fillStyle(0xffd166, 0.45);
        g.fillCircle(width * rx, height * 0.21, 28);
      });
    }

    // 繪製比武地面與水墨橫線
    const fg = this.floorGraphics;
    fg.clear();
    fg.fillStyle(0x0f1318, 0.82);
    fg.fillRect(0, height * 0.68, width, height * 0.32);
    fg.lineStyle(2, 0xf59f00, 0.35);
    fg.strokeLineShape(new Phaser.Geom.Line(width * 0.08, height * 0.68, width * 0.92, height * 0.68));
  }

  initAmbientParticles(theme) {
    this.ambientContainer.removeAll(true);
    this.ambientLeaves = [];
    const { width, height } = this.scale;
    const color = theme === 'bamboo_forest' ? 0x95d5b2 : theme === 'cloud_peak' ? 0xff4d6d : 0xcaf0f8;

    for (let i = 0; i < 16; i++) {
      const dot = this.add.ellipse(
         Math.random() * width,
        Math.random() * (height * 0.68),
        8,
        4,
        color,
        0.35
      );
      dot.vx = -0.35 - Math.random() * 0.6;
      dot.vy = 0.2 + Math.random() * 0.4;
      dot.vr = (Math.random() - 0.5) * 0.03;
      this.ambientContainer.add(dot);
      this.ambientLeaves.push(dot);
    }
  }

  /**
   * 繪製少俠立繪（依武器階級反映三階外觀：布衣 -> 俠客服 -> 宗師披肩）
   */
  buildHeroSprite(hero, weapon) {
    this.heroContainer.removeAll(true);
    this.qiOrbs = [];

    const g = this.add.graphics();
    const tier = weapon ? weapon.tier : 1;
    const isFemale = hero.id === 'su';

    // 腳下水墨光圈
    g.fillStyle(hero.primaryColor, 0.18);
    g.fillEllipse(0, 12, 96, 24);

    // 後期（Tier 3）專屬流雲宗師披風與金色氣場
    if (tier >= 3) {
      g.fillStyle(0xf59f00, 0.22);
      g.fillCircle(0, -55, 72);
      g.fillStyle(0x1d3557, 0.92);
      g.fillTriangle(-12, -88, -68, -5, -8, -12);
    }

    // 飄帶（髮帶隨風向後飄）
    g.lineStyle(tier >= 2 ? 5 : 3, hero.primaryColor, 0.85);
    g.beginPath();
    g.moveTo(-8, -108);
    g.lineTo(-48, -118);
    g.lineTo(-74, -106);
    g.strokePath();

    // 身軀（交領武俠服）
    const robeMain = tier === 1 ? 0x495057 : hero.robeColor;
    g.fillStyle(robeMain, 1);
    g.fillRoundedRect(-22, -85, 44, 72, 8);

    // 中式交領白色內襯與腰帶
    g.lineStyle(3, 0xf4f0e6, 0.95);
    g.strokeLineShape(new Phaser.Geom.Line(-12, -84, 6, -52));
    g.strokeLineShape(new Phaser.Geom.Line(12, -84, -4, -52));

    // 腰封（依武器階級變色）
    const beltColor = tier >= 3 ? 0xf59f00 : tier === 2 ? hero.primaryColor : 0xadb5bd;
    g.fillStyle(beltColor, 1);
    g.fillRect(-23, -46, 46, 8);

    // 頭部與半束長髮
    g.fillStyle(0xffe5d9, 1);
    g.fillCircle(0, -104, 17);
    g.fillStyle(0x1b1f24, 1);
    g.fillArc(0, -107, 18, Phaser.Math.DegToRad(170), Phaser.Math.DegToRad(370), false);
    // 髮髻
    g.fillCircle(-6, -124, isFemale ? 8 : 6);
    if (tier >= 2) {
      // 玉冠／金冠點綴
      g.fillStyle(beltColor, 1);
      g.fillRect(-10, -121, 10, 4);
    }

    // 手臂與手中寶劍
    const swordColor = weapon ? weapon.slashColor : 0xe9ecef;
    const hiltColor = tier >= 3 ? 0xf59f00 : tier === 2 ? 0x48cae4 : 0x8d6e63;

    // 劍柄與護手
    g.lineStyle(4, hiltColor, 1);
    g.strokeLineShape(new Phaser.Geom.Line(14, -56, 26, -62));
    // 劍身
    g.lineStyle(tier >= 3 ? 6 : 4, swordColor, 1);
    g.strokeLineShape(new Phaser.Geom.Line(24, -61, 86, -88));
    if (tier >= 2) {
      g.lineStyle(10, swordColor, 0.25);
      g.strokeLineShape(new Phaser.Geom.Line(24, -61, 88, -89));
    }

    // 角色名牌
    const nameLabel = this.add.text(0, 22, `${hero.name}｜${weapon.name.split('・')[1] || weapon.name}`, {
      fontFamily: '"Microsoft JhengHei", sans-serif',
      fontSize: '13px',
      color: '#f4f0e6',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5, 0);

    this.heroContainer.add([g, nameLabel]);
  }

  /**
   * 繪製八階敵人造型（稻草人 -> 木人樁 -> 小山賊 -> 裝備山賊 -> 中階刀斧 -> 大山賊 -> 機關傀儡 -> 黑風盜）
   */
  buildEnemySprite(enemy) {
    this.enemyContainer.removeAll(true);
    const g = this.add.graphics();
    const type = enemy.visualType;

    // 腳下陰影與氣場
    g.fillStyle(enemy.primaryColor, type === 'boss' ? 0.32 : 0.16);
    g.fillEllipse(0, 12, type === 'boss' ? 116 : 86, 24);

    if (type === 'straw') {
      // 1. 稻草人：木樁十字架 + 稻草身 + 斗笠
      g.fillStyle(0x7f5539, 1);
      g.fillRect(-5, -95, 10, 105);
      g.fillRect(-38, -72, 76, 8);
      g.fillStyle(0xe9c46a, 1);
      g.fillRoundedRect(-22, -82, 44, 52, 10);
      g.fillCircle(0, -98, 16);
      // 斗笠
      g.fillStyle(0xd4a373, 1);
      g.fillTriangle(-36, -104, 36, -104, 0, -126);
    } else if (type === 'wood') {
      // 2. 少林木人樁：厚實圓木 + 三根橫向木臂
      g.fillStyle(0x9c6644, 1);
      g.fillRoundedRect(-20, -110, 40, 118, 8);
      g.fillStyle(0x7f5539, 1);
      g.fillRect(-48, -82, 34, 9);
      g.fillRect(-44, -62, 30, 9);
      g.fillRect(-40, -40, 26, 9);
      g.lineStyle(2, 0x582f0e, 0.8);
      g.strokeRect(-20, -110, 40, 118);
    } else {
      // 山賊系列 / 傀儡 / 山大王 Boss
      const isBoss = type === 'boss';
      const bodyW = isBoss ? 56 : type === 'bandit_high' || type === 'bandit_mid' ? 50 : 42;
      const bodyH = isBoss ? 82 : 72;

      // 披風（大山賊與山大王專屬）
      if (isBoss || type === 'bandit_high') {
        g.fillStyle(isBoss ? 0x800f2f : 0x590d22, 0.9);
        g.fillTriangle(8, -92, 68, -6, 12, -10);
      }

      // 軀幹
      g.fillStyle(type === 'puppet' ? 0x2b2d42 : 0x212529, 1);
      g.fillRoundedRect(-bodyW / 2, -86, bodyW, bodyH, 8);

      // 頭部
      g.fillStyle(type === 'puppet' ? 0x8d99ae : 0xf3d5b5, 1);
      g.fillCircle(0, -105, isBoss ? 19 : 16);

      // 蒙面紅巾／斗笠／傀儡發光眼
      if (isBoss) {
        // 黑風盜：紅圍巾＋黑面罩＋霸氣黑紅重刀
        g.fillStyle(0xd90429, 1);
        g.fillRect(-20, -98, 40, 12);
        g.fillTriangle(12, -95, 58, -82, 22, -82);
        g.fillStyle(0x111111, 1);
        g.fillRect(-16, -106, 32, 10);
        // 霸氣暗紅重刀
        g.lineStyle(8, 0xef233c, 0.95);
        g.strokeLineShape(new Phaser.Geom.Line(-18, -58, -88, -94));
        g.lineStyle(16, 0xd90429, 0.25);
        g.strokeLineShape(new Phaser.Geom.Line(-18, -58, -90, -95));
      } else if (type === 'bandit_equip') {
        // 斗笠＋鋼刀
        g.fillStyle(0x343a40, 1);
        g.fillTriangle(-34, -108, 34, -108, 0, -128);
        g.lineStyle(5, 0xadb5bd, 1);
        g.strokeLineShape(new Phaser.Geom.Line(-16, -55, -68, -78));
      } else if (type === 'bandit_mid' || type === 'bandit_high') {
        // 戰斧／長柄大刀
        g.lineStyle(5, 0xced4da, 1);
        g.strokeLineShape(new Phaser.Geom.Line(-16, -52, -74, -88));
        g.fillStyle(enemy.primaryColor, 1);
        g.fillTriangle(-74, -88, -56, -106, -50, -72);
      } else if (type === 'puppet') {
        // 機關傀儡藍光眼與玄鐵巨劍
        g.fillStyle(0x00f5d4, 1);
        g.fillRect(-10, -108, 16, 4);
        g.lineStyle(6, 0x00bbf9, 0.9);
        g.strokeLineShape(new Phaser.Geom.Line(-18, -56, -80, -82));
      } else {
        // 小山賊木棒
        g.lineStyle(6, 0x8d6e63, 1);
        g.strokeLineShape(new Phaser.Geom.Line(-16, -55, -60, -80));
      }
    }

    // 敵人頭頂蓄力破綻光環（80% 蓄力時閃爍紅光）
    this.enemyWarningRing = this.add.circle(0, -105, 36, 0xff0000, 0);
    this.enemyWarningRing.setStrokeStyle(3, 0xff4d6d, 0);

    const nameLabel = this.add.text(0, 22, `${enemy.name}（${enemy.title}）`, {
      fontFamily: '"Microsoft JhengHei", sans-serif',
      fontSize: '13px',
      color: '#ffccd5',
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 8, y: 3 }
    }).setOrigin(0.5, 0);

    this.enemyContainer.add([this.enemyWarningRing, g, nameLabel]);
  }

  /**
   * 切換 Combo >= 20 的「劍意狀態」視覺強化
   */
  setSwordIntentMode(enabled) {
    this.tweens.add({
      targets: this.swordIntentOverlay,
      alpha: enabled ? 0.42 : 0,
      duration: 280
    });
  }

  /**
   * 微觀演出：每敲對一個注音符號／字母 -> 劍氣聚氣星芒
   */
  playMicroGather(combo = 1, comboTier = 0) {
    this.comboTier = comboTier;
    this.setSwordIntentMode(comboTier >= 3);

    const color = comboTier >= 3 ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);
    const orb = this.add.circle(
      this.heroBaseX + (Math.random() - 0.5) * 90,
      this.heroBaseY - 60 + (Math.random() - 0.5) * 70,
      4 + Math.min(comboTier * 2, 6),
      color,
      0.9
    );
    this.fxContainer.add(orb);

    this.tweens.add({
      targets: orb,
      x: this.heroBaseX + 45,
      y: this.heroBaseY - 72,
      scale: 0.2,
      alpha: 0,
      duration: 220,
      onComplete: () => orb.destroy()
    });

    // 少俠微幅蓄力前傾
    this.tweens.add({
      targets: this.heroContainer,
      scaleX: 1.04,
      scaleY: 0.97,
      duration: 60,
      yoyo: true
    });
  }

  /**
   * 中觀演出：完成單一國字 -> 快速弧形劍光線 (Slash Line) 斬中敵人
   */
  playCharSlash({ charText, damage, isCrit, comboTier }) {
    const slashColor = isCrit ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);

    // 繪製劍光軌跡線 (Slash Line)
    const slash = this.add.graphics();
    slash.lineStyle(isCrit ? 7 : 4, 0xffffff, 1);
    const startX = this.enemyBaseX - 75;
    const startY = this.enemyBaseY - 125 + (Math.random() - 0.5) * 30;
    const endX = this.enemyBaseX + 75;
    const endY = this.enemyBaseY - 25 + (Math.random() - 0.5) * 30;

    slash.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
    slash.lineStyle(isCrit ? 18 : 11, slashColor, 0.55);
    slash.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
    this.fxContainer.add(slash);

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 210,
      onComplete: () => slash.destroy()
    });

    // 水墨與劍氣粒子噴濺
    this.spawnHitParticles(this.enemyBaseX, this.enemyBaseY - 70, slashColor, isCrit ? 14 : 8);

    // 敵人受擊微退
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.enemyBaseX + 14,
      duration: 55,
      yoyo: true
    });

    this.spawnFloatingDamage(this.enemyBaseX, this.enemyBaseY - 125, `-${damage}`, isCrit, charText);
  }

  /**
   * 巨觀演出：完成整個詞語／必殺技 -> 殘影突進 + Hit Stop 頓幀 + 大範圍劍氣貫穿
   */
  playWordFinisher({ wordText, damage, isCrit, isParryBreak, comboTier }) {
    const slashColor = comboTier >= 2 || isCrit ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);

    // 1. 產生少俠高速突進殘影 (After Image)
    for (let i = 1; i <= 3; i++) {
      const ghost = this.add.circle(
        this.heroBaseX + i * 75,
        this.heroBaseY - 60,
        28,
        slashColor,
        0.35 - i * 0.08
      );
      this.fxContainer.add(ghost);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        scale: 1.5,
        duration: 260,
        onComplete: () => ghost.destroy()
      });
    }

    // 2. 少俠向前瞬移斬擊再歸位
    this.tweens.add({
      targets: this.heroContainer,
      x: this.enemyBaseX - 110,
      duration: 95,
      ease: 'Power2',
      yoyo: true,
      hold: 75
    });

    // 3. 大範圍半月劍氣波與水墨軌跡
    const wave = this.add.graphics();
    wave.lineStyle(8, 0xffffff, 1);
    wave.beginPath();
    wave.arc(this.enemyBaseX, this.enemyBaseY - 68, 86, Phaser.Math.DegToRad(-65), Phaser.Math.DegToRad(65), false);
    wave.strokePath();
    wave.lineStyle(22, slashColor, 0.65);
    wave.beginPath();
    wave.arc(this.enemyBaseX, this.enemyBaseY - 68, 92, Phaser.Math.DegToRad(-70), Phaser.Math.DegToRad(70), false);
    wave.strokePath();
    this.fxContainer.add(wave);

    this.tweens.add({
      targets: wave,
      x: 45,
      alpha: 0,
      duration: 340,
      onComplete: () => wave.destroy()
    });

    // 4. Hit Stop（0.075 秒瞬間頓幀）+ 輕微鏡頭震動（不影響閱讀）
    this.isHitStop = true;
    setTimeout(() => { this.isHitStop = false; }, 75);
    this.cameras.main.shake(120, isCrit ? 0.009 : 0.005);

    // 5. 水墨墨滴與金色粒子爆發
    this.spawnHitParticles(this.enemyBaseX, this.enemyBaseY - 70, slashColor, 22);
    this.spawnHitParticles(this.enemyBaseX, this.enemyBaseY - 70, 0x111111, 10);

    // 6. 敵人大幅度受創後仰
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.enemyBaseX + 32,
      angle: 8,
      duration: 90,
      yoyo: true
    });

    const label = isParryBreak ? `⚡看破破綻！-${damage}` : `劍訣・${wordText} -${damage}`;
    this.spawnFloatingDamage(this.enemyBaseX, this.enemyBaseY - 150, label, true);
  }

  /**
   * 失誤演出：少俠舉劍格擋火花（不染紅全畫面）
   */
  playMissParry(shieldUsed = false) {
    const color = shieldUsed ? 0x48cae4 : 0xffd166;
    this.spawnHitParticles(this.heroBaseX + 42, this.heroBaseY - 68, color, 6);

    const text = shieldUsed ? '🛡️ 靜心符護體（不斷連）' : '鏗！（格擋）';
    const floatText = this.add.text(this.heroBaseX, this.heroBaseY - 135, text, {
      fontFamily: '"Microsoft JhengHei", sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: shieldUsed ? '#72efdd' : '#ffd166'
    }).setOrigin(0.5);
    this.fxContainer.add(floatText);

    this.tweens.add({
      targets: floatText,
      y: floatText.y - 28,
      alpha: 0,
      duration: 550,
      onComplete: () => floatText.destroy()
    });
  }

  /**
   * 敵人蓄力紅光警告狀態更新
   */
  setEnemyDangerAlert(isDanger) {
    if (!this.enemyWarningRing) return;
    this.enemyWarningRing.setStrokeStyle(4, 0xff2a55, isDanger ? 0.85 : 0);
  }

  /**
   * 敵人發動攻擊（少俠受擊）
   */
  playEnemyAttack(damage) {
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.heroBaseX + 95,
      duration: 110,
      yoyo: true
    });

    this.cameras.main.shake(110, 0.006);
    this.spawnHitParticles(this.heroBaseX, this.heroBaseY - 65, 0xe63946, 12);

    const dmgText = this.add.text(this.heroBaseX, this.heroBaseY - 135, `-${damage} 氣血`, {
      fontFamily: '"Microsoft JhengHei", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ff6b6b'
    }).setOrigin(0.5);
    this.fxContainer.add(dmgText);

    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 36,
      alpha: 0,
      duration: 650,
      onComplete: () => dmgText.destroy()
    });
  }

  spawnHitParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 115;
      const p = this.add.circle(x, y, 2 + Math.random() * 4, color, 0.9);
      this.fxContainer.add(p);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        scale: 0.1,
        alpha: 0,
        duration: 240 + Math.random() * 180,
        onComplete: () => p.destroy()
      });
    }
  }

  spawnFloatingDamage(x, y, text, isCrit = false) {
    const label = this.add.text(x + (Math.random() - 0.5) * 30, y, text, {
      fontFamily: '"Microsoft JhengHei", sans-serif',
      fontSize: isCrit ? '24px' : '18px',
      fontStyle: 'bold',
      color: isCrit ? '#ffd166' : '#90e0ef',
      stroke: '#111111',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.fxContainer.add(label);

    this.tweens.add({
      targets: label,
      y: y - 46,
      scale: isCrit ? 1.18 : 1.0,
      alpha: 0,
      duration: 680,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }

  update(time, delta) {
    if (this.isHitStop) return;

    this.breathTime += delta * 0.0035;
    if (this.heroContainer) {
      this.heroContainer.y = this.heroBaseY + Math.sin(this.breathTime) * 3.5;
    }
    if (this.enemyContainer) {
      this.enemyContainer.y = this.enemyBaseY + Math.sin(this.breathTime + 1.2) * 3.0;
    }

    const { width, height } = this.scale;
    for (const leaf of this.ambientLeaves) {
      leaf.x += leaf.vx;
      leaf.y += leaf.vy;
      leaf.rotation += leaf.vr;
      if (leaf.x < -10) leaf.x = width + 10;
      if (leaf.y > height * 0.68) leaf.y = -5;
    }
  }
}
