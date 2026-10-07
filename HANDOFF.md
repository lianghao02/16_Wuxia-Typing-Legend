# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：77636e2（含文件重整 `7420c81`、立繪優先載入 `6652d4a`、展開鍵盤血量框定位修正 `77636e2`）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / IMPROVE / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
可交付，且已推送至 `origin/master`（GitHub Pages 線上版已同步）。30/30 自動化單元測試全數通過。

## 本輪目標
1. 驗證 GitHub Pages 公開網址部署後的各項功能正常運作。
2. 解決線上版首次開啟或切換關卡時「人物與敵人立繪載入過慢（先顯示向量替身）」問題。
3. 解決「叫出虛擬鍵盤時，左右血量狀態框（`.fighter-card`）上移至 `bottom: 330px` 遮擋人物立繪」問題。
4. 完整撰寫 `README.md` 與 `CHANGELOG.md`（涵蓋專案概念、完整遊戲方法、三大境界 30 關與 7 大題本配置、五大階段開發歷程），並連動上架至 `13_Project-Hub`。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 公開網址 `https://lianghao02.github.io/16_Wuxia-Typing-Legend/` 已上線。
- 61 件新國風素材（第一批 37 件 `_v3.png` ＋ 第二批 24 件 `_v4.png`）SHA-256 均保持不變，未改動任何原始圖檔。
- 工作目錄中 `assets/ART_RULES_V2_HANDOFF.md` 為先前其他工作階段留存之未提交修改，依憲法保護未覆寫亦未混入提交。

## 已完成 (Completed)
1. **立繪秒開優先載入器（Commit `6652d4a`）**：
   - **問題根因**：原 `CanvasBattleScene.js` 的 `preloadImages()` 一啟動即同時發出全部 28 張圖請求，且排在最前面的 6 張水墨場景背景圖（單張 4.1～4.8 MB，合計 25.8 MB）與 `index.html` 隱藏彈窗的江湖地圖（5.22 MB）占滿瀏覽器併發連線池，導致僅約 650 KB 的主角與敵人立繪排在第 7～26 順位才下載。
   - **修正內容**：
     - 重構 `src/scenes/CanvasBattleScene.js`：啟動與 `setupBattle({ hero, weapon, stage })` 時，以 `fetchPriority = 'high'` **第一優先載入當前關卡的「主角立繪（`heroKey`）」與「對手立繪（`enemyKey`）」**，完成後再載入當前關卡背景（`bgKey`）與受擊／格擋姿態。
     - 新增 `pumpBackgroundPrefetch()`：僅當高優先請求歸零（`highPriorityPending === 0`）時，才於背景以低優先權（`low`）單線程逐張預載其餘資產，並支援網路瞬斷自動重試（最多 2 次）。
     - 修正 `drawBackdrop`、`drawHero`、`drawEnemy` 的 `getImage()` 呼叫邏輯，避免特定關卡立繪載入期間誤觸發其他關卡大圖或顯示錯誤替身（如黑風左護法載入時誤顯示稻草人）。
     - 於 `index.html` 為隱藏彈窗內的大圖（`jianghu_map_v3.png`、`shopkeeper_idle_v3.png`、`copper_coins_v3.png`）加上 `loading="lazy" decoding="async"`，並將 `src/main.js` 與 `CanvasBattleScene.js` 快取版本更新為 `?v=20261007_fastload`。
2. **展開鍵盤時血量框遮擋人物修正（Commit `77636e2`）**：
   - **問題根因**：原 `css/style.css` 在 `#dom-overlay:has(.vk-panel:not(.hidden)) .fighter-card` 設定 `bottom: 330px;`，叫出鍵盤時會將左下／右下血量框抬升至角色胸口高度，直接擋住少俠與對手立繪。
   - **修正內容**：
     - 修改 `css/style.css`：在桌機與寬螢幕（`> 1360px`）叫出鍵盤時，`.fighter-card` **維持固定於角色腳下角落 `bottom: 12px`**（寬度 `min(315px, calc((100vw - 860px) / 2))`），與中央 `820px` 虛擬鍵盤互不重疊且完全不遮擋角色。
     - 在較窄螢幕（`@media (max-width: 1360px)`）叫出鍵盤時，將 `.fighter-card` 移至**角色頭頂上方的天空角落 `top: 12px; bottom: auto;`**（寬度 `min(295px, calc((100vw - 480px) / 2))`），避開角色立繪與底部鍵盤。
     - 更新 `index.html` 樣式表快取版本為 `./css/style.css?v=20261007_vk_hud`。
3. **完整重整 `README.md` 與 `CHANGELOG.md`（Commit `7420c81`）**：
   - 補齊專案概念、四步驟完整遊戲方法、四色國風鍵帽指法、三大境界 30 關與 7 大修煉題本配置、以及 Phase 1 ～ Phase 5 五大階段開發歷程。
4. **連動上架至 `13_Project-Hub`（Commit `12a3db5`）**：
   - 於 `13_Project-Hub` 新增「武俠打字傳｜新國風注音與英打闖關」卡片、封面圖 `images/banner_Wuxia-Typing-Legend.png`、專屬說明頁 `wuxia_typing.html`（含完整玩法與開發歷程）並同步 `FALLBACK_PROJECTS`。

## 異動檔案 (Changed Files)
- `src/scenes/CanvasBattleScene.js`
- `src/main.js`
- `css/style.css`
- `index.html`
- `README.md`
- `CHANGELOG.md`
- `HANDOFF.md`

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 未修改任何 PNG 圖檔二進位內容（保持 61 件素材 SHA-256 一致）。
- 未修改打字引擎、題庫、字典或存檔結構。
- 未動到其他工作階段留存之 `assets/ART_RULES_V2_HANDOFF.md`。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：正式出版社教材授權核對與跨裝置／窄螢幕實機體驗巡檢。

## 驗證結果 (Validation)
### 已執行測試與結果
- `node --check src/scenes/CanvasBattleScene.js`、`node --check src/main.js`：語法檢查通過。
- `node --test tests/typingEngine.test.js`：**30/30 passed**。
- GitHub Pages 線上端點確認：`index.html` 已指向 `style.css?v=20261007_vk_hud` 與 `src/main.js?v=20261007_fastload`。

## Git 狀態
- Commit：已提交並推送至 `origin/master`
- Push：是
- Working Tree：僅保留既有未提交之 `assets/ART_RULES_V2_HANDOFF.md`
- Branch：master

## 下一步建議動作 (Next Recommended Action)
Codex 接手時可直接讀取本 `HANDOFF.md` 與最新 Commit Diff（`7420c81..head`），無須重新掃描全專案。
