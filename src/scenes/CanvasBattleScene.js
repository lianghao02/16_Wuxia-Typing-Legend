/**
 * 《武俠打字傳》零外部依賴高擬真水墨戰鬥渲染引擎 (CanvasBattleScene.js)
 * 專為內網／離線／無 CDN 環境與高速反應設計：
 * - 六大國風水墨場景（山門雲霧、翠竹林、古驛紅燈籠、古城擂台、月下演武、雲海山巔）
 * - 男女主角（雲清川／蘇映雪）三階外觀（布衣木劍 -> 俠客青鋒 -> 宗師玄鐵披風）
 * - 八階敵人立繪（稻草人 -> 木人樁 -> 小山賊 -> 裝備山賊 -> 中階山賊 -> 大山賊 -> 機關傀儡 -> 山大王黑風盜）
 * - 現代動畫特效：微觀聚氣星芒、中觀弧形劍光 (Slash Line)、巨觀殘影突進 (After Image)、Hit Stop 頓幀、畫面震動与跳字
 */

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
    this.enemyOffsetX = 0;
    this.enemyTilt = 0;

    // 特效物件池
    this.ambientLeaves = [];
    this.particles = [];
    this.slashes = [];
    this.afterImages = [];
    this.floatingTexts = [];

    // 美術資產圖片快取（支援非同步載入與向量自動降級）
    this.imageCache = new Map();
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
      mountain_gate: './assets/backgrounds/mountain_gate_v1.png',
      yun_wood_sword: './assets/characters/yun_wood_idle_v1.png',
      straw_dummy: './assets/enemies/straw_idle_v1.png'
    };

    Object.entries(assets).forEach(([key, src]) => {
      const img = new Image();
      const entry = { img, loaded: false, failed: false };
      this.imageCache.set(key, entry);
      img.onload = () => {
        entry.loaded = true;
      };
      img.onerror = () => {
        entry.failed = true;
      };
      img.src = src;
    });
  }

  getImage(key) {
    const entry = this.imageCache.get(key);
    return (entry && entry.loaded) ? entry.img : null;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.heroBaseX = this.width * 0.24;
    this.heroBaseY = this.height * 0.66;
    this.enemyBaseX = this.width * 0.76;
    this.enemyBaseY = this.height * 0.66;
  }

  setupBattle({ hero, weapon, stage }) {
    this.heroConfig = hero;
    this.weaponConfig = weapon;
    this.stageConfig = stage;
    this.comboTier = 0;
    this.swordIntentActive = false;
    this.enemyDangerAlert = false;
    this.initAmbientParticles(stage?.sceneTheme || 'mountain_gate');
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

  /**
   * 武功 Q：青蓮劍氣（俐落細直劍芒，0.15 秒瞬消，絕不卡頓）
   */
  playSkillSlash(damage) {
    this.slashes.push({
      x1: this.enemyBaseX - 60,
      y1: this.enemyBaseY - 120,
      x2: this.enemyBaseX + 60,
      y2: this.enemyBaseY - 30,
      rgb: '72, 202, 228',
      isWave: false,
      thickness: 4,
      life: 0,
      maxLife: 150
    });
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, '72, 202, 228', 6);
    this.enemyOffsetX = 12;
    this.spawnFloatingText(this.enemyBaseX, this.enemyBaseY - 140, `⚡青蓮劍氣 -${damage}`, '#48cae4', 18);
  }

  /**
   * 武功 W：凌波微步（少俠腳下水墨漣漪，敵人出招條被凍結）
   */
  playSkillDodge() {
    this.particles.push({
      x: this.heroBaseX,
      y: this.heroBaseY + 10,
      tx: this.heroBaseX,
      ty: this.heroBaseY + 10,
      r: 32,
      rgb: '114, 239, 221',
      mode: 'gather',
      life: 0,
      maxLife: 280
    });
    this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 130, '🌊 凌波微步（敵定身 3秒）', '#72efdd', 16);
  }

  /**
   * 武功 E：太極回春（翠綠微光調息）
   */
  playSkillHeal(healAmount) {
    this.particles.push({
      x: this.heroBaseX,
      y: this.heroBaseY - 60,
      tx: this.heroBaseX,
      ty: this.heroBaseY - 60,
      r: 28,
      rgb: '82, 183, 136',
      mode: 'gather',
      life: 0,
      maxLife: 260
    });
    this.spawnFloatingText(this.heroBaseX, this.heroBaseY - 130, `🌿 太極回春 +${healAmount} HP`, '#52b788', 17);
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
   * 2. 中觀演出：完成單一國字 -> 快速弧形劍光線 (Slash Line) 斬中敵人
   */
  playCharSlash({ charText, damage, isCrit, comboTier }) {
    const slashColor = isCrit ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);
    const rgb = hexToRgb(slashColor);

    this.slashes.push({
      x1: this.enemyBaseX - 80,
      y1: this.enemyBaseY - 135 + (Math.random() - 0.5) * 35,
      x2: this.enemyBaseX + 80,
      y2: this.enemyBaseY - 25 + (Math.random() - 0.5) * 35,
      rgb,
      isWave: false,
      thickness: isCrit ? 8 : 5,
      life: 0,
      maxLife: 220
    });

    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, rgb, isCrit ? 16 : 9);
    this.enemyOffsetX = 18;

    this.spawnFloatingText(
      this.enemyBaseX + (Math.random() - 0.5) * 28,
      this.enemyBaseY - 135,
      `${charText ? `【${charText}】` : ''}-${damage}`,
      isCrit ? '#ffd166' : '#90e0ef',
      isCrit ? 22 : 18
    );
  }

  /**
   * 3. 巨觀演出：完成整個詞語／必殺技 -> 殘影突進 + Hit Stop + 半月大劍氣貫穿
   */
  playWordFinisher({ wordText, damage, isCrit, isParryBreak, comboTier }) {
    const slashColor = comboTier >= 2 || isCrit ? 0xf59f00 : (this.weaponConfig?.slashColor || 0x48cae4);
    const rgb = hexToRgb(slashColor);

    // 少俠高速突進殘影
    for (let i = 1; i <= 3; i++) {
      this.afterImages.push({
        x: this.heroBaseX + i * 85,
        y: this.heroBaseY,
        rgb,
        alpha: 0.42 - i * 0.09,
        life: 0,
        maxLife: 280
      });
    }

    this.heroOffsetX = (this.enemyBaseX - this.heroBaseX) * 0.58;

    // 大範圍半月劍氣波
    this.slashes.push({
      x1: this.enemyBaseX,
      y1: this.enemyBaseY - 72,
      rgb,
      isWave: true,
      radius: 92,
      life: 0,
      maxLife: 340
    });

    // Hit Stop 瞬間頓幀 75ms + 畫面微震
    this.isHitStop = true;
    setTimeout(() => {
      this.isHitStop = false;
    }, 75);
    this.shakeTime = 140;
    this.shakeIntensity = isCrit ? 7 : 4;

    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, rgb, 24);
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 75, '20, 24, 28', 12);

    this.enemyOffsetX = 36;
    this.enemyTilt = 0.14;

    const label = isParryBreak ? `⚡看破破綻！-${damage}` : `劍訣・${wordText} -${damage}`;
    this.spawnFloatingText(this.enemyBaseX, this.enemyBaseY - 155, label, '#ffd166', 25);
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
    this.shakeTime = 100;
    this.shakeIntensity = isCrit ? 6 : 3.5;
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 65, rgb, 12);
    this.spawnFloatingText(
      this.enemyBaseX,
      this.enemyBaseY - 140,
      `⚡青蓮劍氣 -${damage}`,
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
   * 4.4 武功招式：流雲劍訣 (消耗 5 內力)
   */
  playUltimateBurst({ damage }) {
    const rgb = '255, 183, 3';
    this.swordIntentActive = true;
    setTimeout(() => {
      this.swordIntentActive = false;
    }, 280);

    // 水墨縱橫兩道疾光
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

    this.isHitStop = true;
    setTimeout(() => {
      this.isHitStop = false;
    }, 70);

    this.shakeTime = 160;
    this.shakeIntensity = 8;
    this.enemyOffsetX = 45;
    this.enemyTilt = 0.2;
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 70, rgb, 20);
    this.spawnBurstParticles(this.enemyBaseX, this.enemyBaseY - 70, '30, 30, 30', 10);
    this.spawnFloatingText(
      this.enemyBaseX,
      this.enemyBaseY - 160,
      `🔥 流雲一刀斬 -${damage}！`,
      '#ffb703',
      26
    );
  }

  /**
   * 4. 失誤架招火花（不將全畫面變紅）
   */
  playMissParry(shieldUsed = false) {
    const rgb = shieldUsed ? '114, 239, 221' : '255, 209, 102';
    this.spawnBurstParticles(this.heroBaseX + 46, this.heroBaseY - 70, rgb, 8);
    const text = shieldUsed ? '🛡️ 靜心符護體（不斷連）' : '鏗！（架招格擋）';
    this.spawnFloatingText(
      this.heroBaseX,
      this.heroBaseY - 140,
      text,
      shieldUsed ? '#72efdd' : '#ffd166',
      16
    );
  }

  /**
   * 5. 敵人攻擊
   */
  playEnemyAttack(damage) {
    this.enemyOffsetX = -(this.enemyBaseX - this.heroBaseX) * 0.52;
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

    if (this.isHitStop) return;

    this.breathTime += dt * 0.0038;

    // 彈性歸位
    this.heroOffsetX *= 0.82;
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

    // 6. 繪製劍光斬擊與半月劍氣
    for (const s of this.slashes) {
      const alpha = Math.max(0, 1 - s.life / s.maxLife);
      ctx.save();
      if (s.isWave) {
        const shiftX = (s.life / s.maxLife) * 48;
        ctx.translate(s.x1 + shiftX, s.y1);
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * 0.65})`;
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius, -1.15, 1.15);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(0, 0, s.radius - 4, -1.1, 1.1);
        ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(${s.rgb}, ${alpha * 0.6})`;
        ctx.lineWidth = s.thickness * 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();

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

    // 1. 若當前為山門演武場且有實體背景圖，以 cover 演算法填滿繪製
    if (theme === 'mountain_gate') {
      const bgImg = this.getImage('mountain_gate');
      if (bgImg) {
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = w / h;
        let dw, dh, dx, dy;
        if (canvasRatio > imgRatio) {
          dw = w;
          dh = w / imgRatio;
          dx = 0;
          dy = (h - dh) * 0.5;
        } else {
          dh = h;
          dw = h * imgRatio;
          dx = (w - dw) * 0.5;
          dy = 0;
        }
        ctx.drawImage(bgImg, dx, dy, dw, dh);

        // 柔和暗角薄層，凸顯前方少俠與敵人
        ctx.fillStyle = 'rgba(8, 12, 18, 0.22)';
        ctx.fillRect(0, 0, w, h);
        return;
      }
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
    const weapon = this.weaponConfig || { tier: 1, name: '桃木短劍', slashColor: 0xe9ecef };
    const tier = weapon.tier || 1;
    const primaryRgb = hexToRgb(hero.primaryColor);
    const swordRgb = hexToRgb(weapon.slashColor);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.heroScaleX, this.heroScaleY);

    // 腳下劍氣光陣
    ctx.fillStyle = `rgba(${primaryRgb}, 0.22)`;
    ctx.beginPath();
    ctx.ellipse(0, 10, 52, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 檢查是否有第一組 PoC 雲清川初階立繪（布衣桃木劍）
    const heroImg = (hero.id === 'yun' && (weapon.id === 'wood_sword' || tier === 1))
      ? this.getImage('yun_wood_sword')
      : null;

    if (heroImg) {
      // 依交接規格渲染單張待機立繪
      // 原始尺寸 1086 x 1448，長寬比約 0.75
      // 腳底 anchor 約 (0.48, 0.981)，腳底對齊地面
      const targetH = 220;
      const targetW = targetH * (heroImg.width / heroImg.height);
      const anchorX = 0.48 * targetW;
      const anchorY = 0.981 * targetH;
      ctx.drawImage(heroImg, -anchorX, -anchorY + 10, targetW, targetH);
    } else {
      // --- 備援降級向量繪製（無圖或換角/換高階神兵時） ---
      // 宗師階級（Tier 3）流雲披風與金色氣場
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

      // 隨風飄帶
      const waveOffset = Math.sin(this.breathTime * 2) * 5;
      ctx.strokeStyle = `rgba(${primaryRgb}, 0.9)`;
      ctx.lineWidth = tier >= 2 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(-8, -108);
      ctx.quadraticCurveTo(-42, -118 + waveOffset, -72, -104 - waveOffset);
      ctx.stroke();

      // 俠客身軀
      ctx.fillStyle = tier === 1 ? '#495057' : hero.id === 'su' ? '#2d6a4f' : '#1d3557';
      ctx.beginPath();
      ctx.roundRect(-22, -86, 44, 74, 8);
      ctx.fill();

      // 中式交領白邊
      ctx.strokeStyle = '#f4f0e6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-12, -85);
      ctx.lineTo(6, -52);
      ctx.moveTo(12, -85);
      ctx.lineTo(-4, -52);
      ctx.stroke();

      // 腰封
      ctx.fillStyle = tier >= 3 ? '#f59f00' : tier === 2 ? `rgb(${primaryRgb})` : '#adb5bd';
      ctx.fillRect(-23, -46, 46, 8);

      // 頭部與半束髮
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

      // 寶劍
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
    }

    // 角色名牌
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.fillRect(-68, 18, 136, 22);
    ctx.fillStyle = '#f4f0e6';
    ctx.fillText(`${hero.name}｜${weapon.name.split('・')[1] || weapon.name}`, 0, 34);

    ctx.restore();
  }

  drawEnemy(ctx, x, y) {
    const enemy = this.stageConfig?.enemy || {
      name: '稻草人',
      title: '新手練功靶',
      visualType: 'straw',
      primaryColor: 0xd4a373
    };
    const type = enemy.visualType;
    const rgb = hexToRgb(enemy.primaryColor || 0xd4a373);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.enemyTilt);

    // 敵人紅光破綻警示環
    if (this.enemyDangerAlert) {
      ctx.strokeStyle = 'rgba(255, 42, 85, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -70, 62, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 腳下陰影
    ctx.fillStyle = `rgba(${rgb}, 0.24)`;
    ctx.beginPath();
    ctx.ellipse(0, 10, type === 'boss' ? 62 : 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === 'straw') {
      // 1. 稻草人（優先使用 PoC 立繪圖片）
      const strawImg = this.getImage('straw_dummy');
      if (strawImg) {
        // 原始尺寸 1086 x 1448，木柱底部 anchor 約 (0.58, 0.990)
        const targetH = 210;
        const targetW = targetH * (strawImg.width / strawImg.height);
        const anchorX = 0.58 * targetW;
        const anchorY = 0.990 * targetH;
        ctx.drawImage(strawImg, -anchorX, -anchorY + 12, targetW, targetH);
      } else {
        // 向量備援繪製稻草人
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
        // 斗笠
        ctx.fillStyle = '#d4a373';
        ctx.beginPath();
        ctx.moveTo(-36, -104);
        ctx.lineTo(36, -104);
        ctx.lineTo(0, -126);
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === 'wood') {
      // 2. 少林木人樁
      ctx.fillStyle = '#9c6644';
      ctx.beginPath();
      ctx.roundRect(-20, -110, 40, 118, 8);
      ctx.fill();
      ctx.fillStyle = '#7f5539';
      ctx.fillRect(-48, -82, 34, 9);
      ctx.fillRect(-44, -62, 30, 9);
      ctx.fillRect(-40, -40, 26, 9);
    } else {
      // 山賊系列 / 機關傀儡 / 山大王黑風盜
      const isBoss = type === 'boss';
      const bodyW = isBoss ? 56 : type === 'bandit_high' || type === 'bandit_mid' ? 50 : 42;
      const bodyH = isBoss ? 82 : 72;

      if (isBoss || type === 'bandit_high') {
        ctx.fillStyle = isBoss ? '#800f2f' : '#590d22';
        ctx.beginPath();
        ctx.moveTo(8, -92);
        ctx.lineTo(68, -6);
        ctx.lineTo(12, -10);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = type === 'puppet' ? '#2b2d42' : '#212529';
      ctx.beginPath();
      ctx.roundRect(-bodyW / 2, -86, bodyW, bodyH, 8);
      ctx.fill();

      ctx.fillStyle = type === 'puppet' ? '#8d99ae' : '#f3d5b5';
      ctx.beginPath();
      ctx.arc(0, -105, isBoss ? 19 : 16, 0, Math.PI * 2);
      ctx.fill();

      // 武器與頭飾
      ctx.lineCap = 'round';
      if (isBoss) {
        ctx.fillStyle = '#d90429';
        ctx.fillRect(-20, -98, 40, 12);
        ctx.fillStyle = '#111111';
        ctx.fillRect(-16, -106, 32, 10);
        ctx.strokeStyle = '#ef233c';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-18, -58);
        ctx.lineTo(-88, -94);
        ctx.stroke();
      } else if (type === 'bandit_equip') {
        ctx.fillStyle = '#343a40';
        ctx.beginPath();
        ctx.moveTo(-34, -108);
        ctx.lineTo(34, -108);
        ctx.lineTo(0, -128);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-16, -55);
        ctx.lineTo(-68, -78);
        ctx.stroke();
      } else if (type === 'puppet') {
        ctx.fillStyle = '#00f5d4';
        ctx.fillRect(-10, -108, 16, 4);
        ctx.strokeStyle = '#00bbf9';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-18, -56);
        ctx.lineTo(-80, -82);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ced4da';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-16, -55);
        ctx.lineTo(-66, -82);
        ctx.stroke();
      }
    }

    // 敵人名牌
    ctx.font = 'bold 13px "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
    ctx.fillRect(-76, 18, 152, 22);
    ctx.fillStyle = '#ffccd5';
    ctx.fillText(`${enemy.name}（${enemy.title}）`, 0, 34);

    ctx.restore();
  }
}
