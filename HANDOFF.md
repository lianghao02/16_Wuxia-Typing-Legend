# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：836bf62（發布前基準；最新提交以 Git 歷史為準）
- **Skill Version**：v1.0.0
- **Task Type**：RELEASE / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
可交付並已正式發布 `v2.0.0`（文印江湖六章冒險、刀槍劍三流派與屬性狀態正式版）。已將新版「文印江湖」設為預設首頁 `index.html`（同時保留 `adventure.html` 相容入口，原版 v1.0 移至 `classic.html`），並將 `feat/jianghu-adventure` 合併至 `master` 主分支發布至 GitHub Pages 及 GitHub Release `v2.0.0`。

## 本輪目標
將 `feat/jianghu-adventure` 新分支升版為正式版 `v2.0.0`，設為預設首頁 `index.html`，合併至 `master` 主分支並建立 GitHub Release，同時連動更新 `13_Project-Hub` 展示卡片與說明專頁。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 預設首頁 `index.html` 與相容入口 `adventure.html` 皆指向 `v2.0.0` 文印江湖新版；原版 v1.0 保留於 `classic.html`。
- 使用現有字音、年級題庫、美術與 Canvas，不新增外部套件。
- 新存檔 `wuxia_adventure_v1`；舊財產初次單向複製，保留零銅錢，不改寫原版存檔。

## 已完成 (Completed)
- 文印江湖六章三十關、六枚文印、完整引言／結算／結局與足跡重遊。
- 四大裝備部位（劍／刀／槍三流派兵器、護腕、防具、丹藥）與持刀／持槍全身立繪、刀罡／槍芒特效及專屬絕招。
- 敵人毒／火／冰三屬性氣場、主角狀態全身染色與連對 2 字運功化解機制。
- Web Speech 零體積中英發音朗讀、5／10／15 連擊水墨特效、過關朱紅印章、奇遇掉寶與本關練功小錦囊。
- 跨螢幕響應式版面（小筆電與 125%／150% 縮放零遮擋）與 450ms 跨鍵盤前景出招演出。
- 將新版設為預設首頁 `index.html`（原版移至 `classic.html`），更新 `package.json`、`CHANGELOG.md`、`README.md`、`docs/ADVENTURE_WORLD.md` 為 `v2.0.0`。

## 異動檔案 (Changed Files)
- `index.html`、`adventure.html`、`classic.html`（原 `index.html` 移轉）、`css/adventure.css`、`src/adventure.js`。
- `src/data/adventureWorld.js`、`src/data/weaponEffects.js`、`src/engine/AdventureEngine.js`、`src/scenes/CanvasBattleScene.js`、`tests/adventure.test.js`。
- `package.json`、`README.md`、`CHANGELOG.md`、`HANDOFF.md`、`docs/ADVENTURE_WORLD.md`、`docs/adventure-validation.md`。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 不改動教育部官方字典原始資料與原版（`classic.html`）既有玩法與存檔結構。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：持續收集實際學童遊玩回饋。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：50／50 單元測試全數通過（含七題本三境界共 6,300 題逐鍵輸入驗證、11 組視窗尺寸與縮放淨空、四大裝備部位與毒火冰屬性特效驗證）。
- `git diff --check`：通過（零空白與格式錯誤）。
### 尚未驗證項目
真實學童長期學習成效追蹤。
### 已知風險 (Known Risks)
存檔保存在相同瀏覽器與網站來源之 `localStorage`。

## Git 狀態
- Commit：已提交 `v2.0.0` 正式版並合併至 `master`。
- Push：已同步推送 `origin/master`、`origin/feat/jianghu-adventure` 與 Tag `v2.0.0`。
- Working Tree：Clean。
- Branch：master。

## 下一步建議動作 (Next Recommended Action)
直接透過正式網址 https://lianghao02.github.io/16_Wuxia-Typing-Legend/ 遊玩 `v2.0.0` 文印江湖正式版。

## 發布狀態 (Release Status)
已發布 `v2.0.0` 正式版（GitHub Pages & GitHub Release：`v2.0.0`）。

## 最新修復斷點：長句閱讀（2026-10-08）
- 新版長句改同字級整句、朱紅當前字、獨立目前注音；原版不變。
- 五個尺寸診斷無題目／鍵盤重疊；47／47測試、獨立來源實機游標推進通過。
- 細節見 docs/adventure-validation.md；待使用者自行重新整理載入。

## 最新交接斷點：角色演出區保護（2026-10-08）
- 本輪 FIX：題目與鍵盤共用中央寬度，左右角色尺寸、位置及出招位移共用 battleLayout 計算；窄直式角色放於題目與鍵盤之間。
- 異動：css/adventure.css、src/adventure.js、src/engine/battleLayout.js、src/engine/sentenceLayout.js、tests/adventure.test.js 與核心說明文件。
- 驗證：48／48 測試、八種獨立尺寸診斷、1280×720 真實逐鍵完成一題、Console error 0；詳細證據見 docs/adventure-validation.md。
- 使用者試玩頁未重新整理、未改視窗或存檔，載入修正須使用者自行重新整理。原版與 master 未修改。
- assets/ART_RULES_V2_HANDOFF.md 與 project-scorecard.md 既有修改仍排除提交。暫時診斷頁測後移除。
- 提交 5734ca3 已完成；GitHub 推送因 DNS 無法解析 github.com 失敗。連線恢復後推送 feat/jianghu-adventure，不合併 master。

## 最新斷點：提示與前景出招（2026-10-08）
- 基準 86bc87a，維持 feat/jianghu-adventure；精簡下一鍵、完成整題跨鍵盤透明演出 450ms，題目保持上層，遵循減少動態效果偏好。
- 獨立 localhost 中英文實測、提示同步、Tab 收起、連錯單鍵帽、動畫跨鍵盤與返回通過，Console error 0；48 項測試通過。完整證據見 docs/adventure-validation.md。
- 公開原版與使用者存檔未修改；本機新版 adventure.html 載入修正須自行重新整理。
- 排除既有 assets/ART_RULES_V2_HANDOFF.md、project-scorecard.md。GitHub 前次 DNS 失敗，本輪提交後再重試推送；以實際推送結果為準。
## 最新斷點：角色放大與出招可見性（2026-10-08）
- 基準 12a8c83 已推送。此次修正 battleLayout 素材透明邊界計算，縮小中央上限、收鍵盤增加角色區；一般出招 450ms、減少動態效果定點刺擊 180ms，鍵盤收起仍能演出，出招避開題目頭部遮擋。
- 49 項測試通過，獨立 localhost 實測 1280×720 與 1453×792；詳細證據見 docs/adventure-validation.md。使用者試玩頁與存檔未改寫，需自行重新整理載入。
- 定時監測仍為 PAUSED，未因本次修復恢復。公開 master 與原版維持原狀；兩份既有修改排除。

## 最新斷點：小螢幕與 125%／150% 縮放遮擋驗證、敵人各難度攻擊速度修正（2026-10-08）
- 基準 `106e8b1`（`feat/jianghu-adventure`）。使用隔離無頭 Chromium 完成 11 組視窗尺寸與 125%／150% 縮放（含 `1366×650` 小筆電、`1093×614` [1366@125%]、`911×512` [1366@150%]、`1536×864` [1080p@125%]、`1280×720` [1080p@150%]、`730×540`、`390×844`、`360×540`）之四字詞、21 字長句＋連錯提示、展開鍵盤與前景出招峰值實測，並修復敵人不攻擊問題。
- 修正項目：
  1. `src/engine/AdventureEngine.js`、`src/adventure.js`：全關卡啟用敵人蓄力條（`#atb`），移除 `wordStartTime !== null` 限制（進入戰鬥過 `0.7s` 準備時間即自動蓄力），依挑戰境界（`初出茅廬 easy`／`名震江湖 medium`／`一代宗師 hard`）與關卡類型（`training 1.2x`／`journey・event 1.15x`／`duel 1.0x`／`boss 0.85x`）顯著區分出招速度；完成一題改為擊退敵人 25% 蓄力條而非歸零，確保敵人在戰鬥中能累積蓄力並由右向左跨前景發動攻擊（扣 15 氣血或消耗護印抵擋）；切換挑戰境界時即時同步 `session.realm`。
  2. `css/adventure.css`：非窄直式狀態框固定於上角 `top: 12px`（消除 `1280×720` 狀態框遮擋放大角色）；對齊 `700px` 斷點（消除 `701～760px` 題目碰撞鍵盤）；擴充 `max-height: 600px`／`550px` 緊湊題目與鍵盤高度及窄直式 `#journey-hud` 間距。
  3. `src/adventure.js`：前景出招 `maxAttackY` 改為 `controls.top - 50`（預留 `attackY + 44` 名牌高度，消除小筆電與低高度視窗出招名牌壓到 `#controls`）；窄直式裁切腳底以下重複 Canvas 名牌；每幀同步 `window.innerWidth / innerHeight` 全版重繪。
  4. `assets/effects/*_v4.png`、`src/scenes/CanvasBattleScene.js`、`src/engine/AudioEngine.js`、`src/engine/TypingEngine.js`：新增 4 張 `512×512` 透明 RGBA 水墨特效（5 連清風、10 連驚雷、15 連龍鳳、失誤偏斜火花）與專屬合成音效／外部音檔掛載介面，實作 5／10／15 連字階段獎勵（內力、回血、銅錢、護印、擊退蓄力）與打錯字偏斜懲罰（火花特效、題目框搖晃、對手推進 8% 蓄力）。
  5. `tests/adventure.test.js`：擴充 10 組橫向與縮放尺寸之狀態框淨空、前景出招頭頂／名牌邊界、三難度／關卡類型攻擊速度排序，以及 5／10／15 連擊階層與新特效素材註冊斷言。
- 驗證：49／49 測試通過；11 組尺寸 × 2 模式（22 組）無重疊，三難度蓄力速率、敵人前景出招扣血與 5／10／15 連擊及失誤特效實測通過，Page error 0。

## 最新斷點：四大裝備部位（劍／刀／槍／護腕／防具／丹藥）、毒／火／冰屬性狀態、語音朗讀與結算錦囊（2026-10-08）
- 實作項目：
  1. **四大裝備部位與三流派兵器（劍／刀／槍）**：擴充 `src/engine/AdventureEngine.js`、`src/data/weaponEffects.js`、`src/scenes/CanvasBattleScene.js` 與 `src/adventure.js`，新增男女主角持刀／持槍全身立繪（`assets/characters/*_{flame_saber,thunder_spear}_v4.png`）與 4 張裝備圖示（`assets/icons/*_v4.png`）；揮砍與破題時繪製對應劍痕、烈焰弧形刀罡、雷霆貫穿槍芒與十字槍花；`Alt+1` 絕招依所持兵器自動切換三流派大招。
  2. **敵人毒／火／冰屬性氣場与主角狀態全身染色＋連對 2 字運功化解**：新增 `assets/effects/status_{poison,burn,freeze}_v4.png`；敵人常駐屬性法陣且蓄力 `>75%` 時全身泛起對應屬性強光與危險氣旋、名牌顯示 `⚡即將出招！`；主角受擊染上狀態時透過離屏 Canvas `source-atop` 全身染上毒綠／紅焰／寒霜，連續打對 2 字即可運功逼毒／滅火／破冰。
  3. **Web Speech 零體積語音朗讀與 5 項監測體驗優化**：整合 `window.speechSynthesis` 中英發音朗讀、題目框 `🔊 點題目聽發音` 標籤、視窗失焦自動暫停、同字 `0.55s` 防連坐、10+ 連字護體降階緩衝、輕聲／一聲清晰標示、虛擬鍵盤按錯鍵紅光閃爍。
  4. **過關結算朱紅印章、奇遇掉寶、本關練功小錦囊與客棧金光提醒**：結算面板新增朱紅印章評價、`🎁 江湖奇遇掉寶`、`📖 本關練功小錦囊`（錯字複習＋點擊聽發音）與可買新裝備客棧金光按鈕；左上角整合隨身丹藥存量 `🧪回春×N(Alt+2)·清心×N`；優化第 4、6 章敵人 `visualType` 使每章 5 關敵人立繪 100% 不重複。
- 驗證：50／50 單元測試全數通過；Playwright 無頭實測截圖驗證通過。`assets/ART_RULES_V2_HANDOFF.md` 與 `project-scorecard.md` 維持排除不入版控。