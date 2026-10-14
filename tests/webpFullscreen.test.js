import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('全螢幕切換按鈕存在，且渲染器全量素材優先使用 WebP 輕量版本並具備 PNG 回退', () => {
  // 1. 驗證 index.html 存在全螢幕懸浮與控制列按鈕
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('id="fullscreen-btn"'), 'index.html 應具備右上角全螢幕懸浮按鈕');
  assert.ok(html.includes('id="fullscreen-control-btn"'), 'index.html controls 導覽列應具備全螢幕按鈕');

  // 2. 驗證 CanvasBattleScene 啟用 WebP 優先與 PNG 回退機制
  const renderer = readFileSync(new URL('../src/scenes/CanvasBattleScene.js', import.meta.url), 'utf8');
  assert.ok(renderer.includes(".replace(/\\.png$/, '.webp')"), '立繪、敵人與特效素材應優先載入 WebP');
  assert.ok(renderer.includes('fallbackSrc: isPng ? src : null'), '一般資產應具備 PNG 安全回退機制');
  assert.ok(renderer.includes('fallbackSrc: isPng ? rawPath : null'), '戰鬥姿態動畫應具備 PNG 安全回退機制');

  // 3. 抽樣驗證關鍵素材的 .webp 實體檔案已成功生成在磁碟上
  const sampleWebpFiles = [
    '../assets/backgrounds/mountain_gate_v3.webp',
    '../assets/characters/yun_wood_idle_v3.webp',
    '../assets/enemies/straw_idle_v3.webp',
    '../assets/animations/poses/yun_wood_sword/attack_v1.webp',
    '../assets/effects/humanoid_hit_flash_v4.webp',
    '../assets/ui/title_logo_v4.webp'
  ];
  for (const rel of sampleWebpFiles) {
    assert.ok(existsSync(new URL(rel, import.meta.url)), `WebP 實體檔案應存在：${rel}`);
  }
});
