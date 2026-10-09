# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：bc48244（v2.1.0 開發前基準；最新提交以 Git 歷史為準）
- **Skill Version**：v1.0.0
- **Task Type**：IMPROVE / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
已完成 `v2.1.0`「RPG 遊戲深化」全六階段實作、12 張 v5 新國風水墨透明 RGBA 素材生成，以及離線題庫深化（教育部《國語小字典》例詞與成語分年級自動消歧入庫、1～6 年級常用字與短句擴充、英文題庫擴充至 300 題、完整題庫循環防重機制），53／53 單元測試全數通過。

## 本輪目標
依據《武俠打字傳》RPG 遊戲深化修訂計畫（`IMPLEMENTATION_PLAN.md`）與題庫架構診斷建議，在不更換原生 Canvas 2D 架構與不依賴外部即時連網 API 的前提下，完成：
1. 真實 RPG 血量與可追蹤傷害系統（`calculateAttackDamage`、平方根長度公平曲線、Boss 依 HP 比例三階段與跨階段跳轉保護）。
2. 動態題數補題與**完整題庫循環防重**（同場禁重、依累計練習次數 `0 -> 1 -> 2` 結晶分層確保全題庫用完一輪前 0 重複、中英獨立近 60 題排除、20% 錯題複習 `isReview` 標記與小題庫自動降級）。
3. 離線題庫擴充與字典活化：
   - 從已內建的教育部《國語小字典》離線索引（`moeMiniIndex.js` 24,219 筆例詞）結構化提取符合各年級字集且讀音明確的 2～4 字例詞與四字成語（每學年新增約 116～120 詞）。
   - 擴充 1～4 年級 5 字以上短句（每學年由 10 句擴充至 22 句）及 5～6 年級常用單字池，使 1～6 年級總題量提升至 224～700 題／年級。
   - 擴充英文題庫（`src/data/practice.js`）由 90 題提升至 **300 題**（初階 120 單字、中階 100 生活單字、高階 80 短句）。
4. 劍／刀／槍三流派差異化與新兵器擴充（`iron_spear`、`dragon_saber`）。
5. 第三角色「馴獸師・林牧風（`mu`）」與四種靈獸（追風靈犬、穿雲靈鷹、碧玉毒蟾、嘯月蒼狼）及客棧「靈獸」專頁切換。
6. 五大情境 BGM（首頁、一般戰鬥、首領戰、客棧、劇情）、流派／靈獸專屬音效、智慧朗讀優先權（長句不自動硬念、防截斷）與四項獨立音訊設定。
7. 六章三十關敵人血量防禦平衡、年級傷害補償係數與 `v2.0.0` 存檔無損自動遷移（`migrateAdventureSave`）。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 渲染層為原生 HTML5 Canvas 2D（`src/scenes/CanvasBattleScene.js`），已修正 `AGENTS.md` 中過時的 Phaser 3 描述。
- 題庫維持 100% 離線靜態部署架構（零外部 API 依賴），直接活化專案內建之教育部《國語小字典》離線索引。
- 戰鬥關卡（`duel`、`boss`）以敵人 HP 歸零判定勝利；非戰鬥關卡（`training`、`journey`、`event`）維持完成 10 題判定過關。
- 舊版 `wuxia_adventure_v1` 存檔透過 `migrateAdventureSave()` 無損保留銅錢、已購裝備與關卡紀錄，並自動補齊初始靈獸 `beast_dog` 與四項音訊設定。

## 已完成 (Completed)
- 新增 `IMPLEMENTATION_PLAN.md` 完整技術規格與驗收計畫，並同步更新 `AGENTS.md`。
- 完成 12 張 v5 新國風水墨透明 RGBA 素材（`mu_tamer_idle_v5.png`、四靈獸全身圖、頭像與圖示、爪擊／俯衝特效）。
- 實作 `AdventureEngine.js`、`gradeQuestionMix.js`、`AudioEngine.js`、`CanvasBattleScene.js`、`adventureWorld.js`、`weaponEffects.js`、`enemies.js` 與 `adventure.js` 全六階段功能。
- 實作 `moeDictionary.js`（`getGradeDictionaryExampleWords`）、`gradeVocabulary.js`、`textbooks.js`、`practice.js` 與 `gradeQuestionMix.js`（`selectByCycleAndRecency` 完整題庫循環防重）。
- 新增 `v2.1.0` 單元測試，53／53 測試全數通過。

## 異動檔案 (Changed Files)
- `AGENTS.md`、`IMPLEMENTATION_PLAN.md`、`HANDOFF.md`、`package.json`。
- `src/adventure.js`、`src/engine/AdventureEngine.js`、`src/engine/AudioEngine.js`、`src/scenes/CanvasBattleScene.js`。
- `src/data/adventureWorld.js`、`src/data/enemies.js`、`src/data/gradeQuestionMix.js`、`src/data/moeDictionary.js`、`src/data/gradeVocabulary.js`、`src/data/textbooks.js`、`src/data/practice.js`、`src/data/weaponEffects.js`、`tests/adventure.test.js`。
- `assets/characters/*_v5.png`（5 張）、`assets/icons/*_v5.png`（5 張）、`assets/effects/*_v5.png`（2 張）。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 不改動教育部官方字典原始資料檔（`moeMiniIndex.js`、`moeMiniRecords.js`）、`TypingEngine.js` 大千注音核心與原版（`classic.html`）玩法。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：依玩家要求決定是否提交 Commit 或推送至遠端分支。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：53／53 單元測試全數通過（含既有 50 項測試與新增 `v2.1.0` RPG 傷害曲線、Boss 階段跳轉、毒蟾首領毒傷上限、四層防重動態補題、教育部離線字典例詞入庫、英文 300 題與完整題庫循環防重、馴獸師靈獸結契及 `v2.0.0` 存檔無損遷移測試）。
- `git diff --check`：通過。
### 尚未驗證項目
真實學童長期學習成效追蹤。
### 已知風險 (Known Risks)
存檔保存在相同瀏覽器與網站來源之 `localStorage`。

## Git 狀態
- Commit：本輪 `v2.1.0` 變更尚在工作目錄待使用者確認後提交。
- Branch：master。

## 下一步建議動作 (Next Recommended Action)
確認 `v2.1.0` 實機體驗後，可提交 Commit 並發布至 GitHub Pages。

## 發布狀態 (Release Status)
`v2.1.0` 已完成開發與完整測試驗證，待提交發布。

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
---

# HANDOFF｜方案 B 最新斷點（2026-10-09・Antigravity 接手複驗完成）

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：6d0a65d2597a432c3b6195d9c1fb54c5f40c22bc（本輪未提交）
- **Skill Version**：v1.0.0
- **Task Type**：HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
Antigravity 已於同一工作目錄接手並完成方案 B（Phase A／Phase B 美術姿態與 Canvas 動畫）與前輪 `v2.1.0`（RPG 血量傷害、離線字典例詞與成語入庫、英文 300 題、完整循環防重、馴獸師與四靈獸、四大情境音訊）之聯合複驗，61／61 單元測試、117 張素材驗證與瀏覽器實機遊玩全數通過，可交付。未執行 Commit、Push 或 Release。

## 本輪目標
依 `assets/animations/INTEGRATION_GUIDE.md` 與共用 `HANDOFF.md` 接手確認現況，繼承已完成之 19 組 76 張透明姿態與 `BattlePoseAnimation`／`CanvasBattleScene`／`adventure.js` 整合成果，在不覆寫前輪 `v2.1.0` 修改、不重畫合格素材的前提下完成完整實測與交接更新。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 本機同一工作目錄已完整包含前輪 `v2.1.0` 17 個已追蹤異動、12 張 v5 圖片與方案 B 美術動畫整合（`BattlePoseAnimation.js`、`battleAnimations.js`、`tests/battleAnimation.test.js`、`assets/animations/`、`scripts/*.py`），無版本衝突或遺失。
- 實際已有馴獸師與四靈獸；雙主角各五組正式外觀。龍刀／鐵槍透過 `animationAliases` 沿用刀／槍外觀。
- 40 張正式人物、敵人與特效列 A 級保留，原圖 SHA-256 未變；76 張正式姿態全數 `approved: true`。

## 已完成 (Completed)
- 依使用者要求讀取 `assets/animations/INTEGRATION_GUIDE.md`、`assets/animations/PHASE_A_REVIEW.md`、`assets/animations/PHASE_B_REVIEW.md` 與共用 `HANDOFF.md`，確認同一工作目錄現況。
- 繼承並複驗 19 組、76 張透明姿態、純視覺時鐘（`BattlePoseAnimation.js`）、優先權、快速輸入最多一筆合併、角色／靈獸同步、敵人受擊與僵直復原、勝利敗退保持、當前組別預載、同身份回退、輪廓保護與減少動態。
- 完成 `npm test`（61／61）、`python scripts/validate_animation_assets.py`（117 張檢查通過）、`preview.html`、`battle-preview.html`（全部 19 組 76 張姿態掃描、50 次快速攻擊＋大招、減少動態）與 `adventure.html` 正式遊戲實測。

## 異動檔案 (Changed Files)
- 原有檔：`README.md`、`CHANGELOG.md`、`src/scenes/CanvasBattleScene.js`、`src/adventure.js`、`package.json`、`IMPLEMENTATION_PLAN.md`、`AGENTS.md`、前輪 `v2.1.0` 題庫與引擎模組，以及本 `HANDOFF.md` 最新區段。
- 新檔：`src/scenes/BattlePoseAnimation.js`、`src/data/battleAnimations.js`、`tests/battleAnimation.test.js`。
- 美術與工具：`assets/animations/`、`assets/*_v5.png`（12 張）、`scripts/import_animation_sheet.py`、`scripts/render_animation_review.py`、`scripts/validate_animation_assets.py`、`scripts/build_animation_catalog.py`。
- 素材與驗證細節：`assets/animations/PHASE_A_REVIEW.md`、`assets/animations/PHASE_B_REVIEW.md`、`assets/animations/INTEGRATION_GUIDE.md`。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不改 `TypingEngine`、注音判定、RPG 傷害公式、Boss 階段、勝利獎勵、存檔格式、原始正式圖片、無關場景或 UI。不採用早期五張未過關候選，不重畫已驗收合格素材，未執行 `build_animation_catalog.py --approve-reviewed`。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：翻滾及其他美術翻新不在本輪；前輪 v5 的逐張原始提示詞歷史資料可後續補齊，不偽造來源。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：**63／63 通過**（既有 53 項含 `v2.1.0` RPG／題庫循環防重 ＋ 8 項 `tests/battleAnimation.test.js` ＋ 1 項全 30 關統一 RPG 氣血制與整題結算／單字壓制蓄力測試 ＋ 1 項教育性／遊戲性／黏著度六大深化機制整合測試）。`git diff --check` 通過。
- `python scripts/validate_animation_assets.py`（Python 3.13.5 + Pillow 11.2.1）：`checkedFiles: 117`、`fileValidationPassed: true`、`errors: []`、`missingRequiredFrames: []`、`unapprovedFrames: []`、`phaseAApproved: true`。
- 預覽頁實測（Playwright 瀏覽器）：
  - `assets/animations/preview.html`：19 組動作組別與 Canvas（`360×480`）正常載入，JS Runtime Error 0。
  - `assets/animations/battle-preview.html`：執行「驗證全部 76 姿態」回報 `通過：正式 Canvas 已繪製全部 19 組、76 張姿態；未發現漏圖。`；執行「快速 50 次攻擊」與「減少動態（蒼狼組）」均正常運作，JS Runtime Error 0。
- 正式遊戲 `adventure.html` 實測、六大深化機制、公共領域古曲 BGM 與六階層兵器／靈獸平衡：
  - 全部 30 關統一改為 RPG 氣血對決制（`isCombat: true`），四字詞與長句改為「整題完成（`wordComplete`）才一次出招扣除敵人血量」，且 **2 字以上的詞語與句子不會打斷或扣減敵方集氣攻擊**（敵人可持續蓄力至滿氣攻擊，維持真實過招張力）。
  - **教育性**：接入「📜 聯絡簿自訂詞庫」（`parseAdventureCustomWords` 容錯解析＋教育部字典字音速查＋`custom` 獨立進度）、補齊 2～4 字詞語與成語延伸例詞提示（`getWordUsageHint`）、新增「📖 錯題墨寶閣」（易錯注音／字母鍵位與手指提示＋一鍵「⚔️ 錯題掃除特訓」）。
  - **遊戲性與六階層對稱平衡**：新增「⚡ 看破破綻」（`1.35x` 傷害、蓄力歸零、定身 2.2 秒）、「✨ 行雲流水」（`1.15x` 傷害）、隨時開放「🗺️ 選關（江湖足跡）」與最高印章保存；將少俠兵器與馴獸師靈獸統一對齊為 6 個階層（第 1 階～第 6 階：基礎攻擊力 `16 / 20 / 24 / 28 / 34 / 40`、價格 `0 / 140 / 210 / 280 / 360 / 440`、銅錢加成 `1.0x～1.6x` 與實戰單題總傷 1 對 1 對等）；導入五首公共領域傳統古曲 BGM（首領決戰《十面埋伏》`135ms`、一般戰鬥《將軍令》`165ms`、客棧《步步高》`210ms`、敘事《陽春白雪》`230ms`、標題《漁舟唱晚》`240ms`）32 拍琵琶三弦掃弦與堂鼓／板鼓緊湊編曲。
  - **黏著度**：首頁新增「🔥 連續修煉天數」與「📅 今日三項江湖懸賞任務」（自動發放共 `+100 銅錢`），以及馴獸師「🐾 靈獸羈絆養成（Lv.1～Lv.5，出戰累積經驗或於客棧花 60 銅錢餵食靈果升階，每階親密攻擊力 `＋1`）」。
### 尚未驗證項目
沒有逐關人工遊玩全部三十關；全章／年級流程由既有測試覆蓋。
### 已知風險 (Known Risks)
四張離散姿態是方案 B 的有限格數動畫，不是骨架動畫；後續新增素材仍需實際檢視後才可標記核准。不要將早期候選誤接入正式索引。

## Git 狀態
- Commit：已提交並推送至 `origin/master` 與 `origin/feat/jianghu-adventure`。
- Push：是（`origin/master`、`origin/feat/jianghu-adventure`）。
- Working Tree：Clean。
- Branch：master。

## 下一步建議動作 (Next Recommended Action)
重新整理瀏覽器頁面即可體驗「教育性、遊戲性、黏著度」六大深化功能。

## 發布狀態 (Release Status)
`v2.1.0` 與六大深化功能已正式提交並推送至 GitHub。
