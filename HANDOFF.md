# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：feat/jianghu-adventure
- **Commit SHA**：本輪基準 9fd93ed；最新提交以 Git 歷史為準
- **Skill Version**：v1.0.0
- **Task Type**：IMPROVE / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
新版 2.0.0-alpha.1 已完成三輪測試與修復，可交付試玩。原版入口與公開 master 維持既有版本。

## 本輪目標
建立獨立分支，完成具完整世界觀與故事收束的打字闖關新版，減少選項並改善小螢幕體驗。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 以 master 92be4ba 為基準，新入口 adventure.html。
- 使用現有字音、年級題庫、美術與 Canvas，不新增相依套件。
- 新存檔 wuxia_adventure_v1；舊財產初次單向複製，保留零銅錢，不改寫原版存檔。

## 已完成 (Completed)
- 文印江湖六章三十關、六枚文印、完整引言／結算／結局與足跡重遊。
- 六年級與英文各自進度；三境界控制回擊壓力，每關實際輸入十題。
- 新手先選年級與人物，之後直接續行；單一絕招凍結與抵擋，不代答。
- 商店換裝、銅錢加成、每日首關獎勵、逐音續玩與錯字回練。
- 小螢幕中央上下題目與鍵盤，左右人物保留；取消常駐四技能列，放大店小二。
- 三輪驗證與修復完成，README、CHANGELOG、規劃及世界觀／驗證文件更新。

## 異動檔案 (Changed Files)
- adventure.html、css/adventure.css、src/adventure.js。
- src/data/adventureWorld.js、src/engine/AdventureEngine.js、tests/adventure.test.js。
- TypingEngine.js 修正英文空白提示；package.json 納入新版測試。
- README、CHANGELOG、IMPLEMENTATION_PLAN、HANDOFF、docs/ADVENTURE_WORLD.md、docs/adventure-validation.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 其他工作階段的 assets/ART_RULES_V2_HANDOFF.md 及先前評估 project-scorecard.md 排除本輪提交。
- 不改原 PNG、官方字典來源及原版玩法，不合併到 master 或切換正式站。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：實際學童試玩回饋與數值調整；經試玩再決定正式替換入口。

## 驗證結果 (Validation)
### 已執行測試與結果
- npm test：46／46 通過；七題本三境界共 6,300 題逐鍵輸入驗證。
- Browser 完成三十關三百題、完整結局，另重遊首關十題；逐音續玩、換裝、絕招、回擊與連錯提示正常。
- 768×540、1024×561、1366×650 版面實測；題目與鍵盤保持間距，兩側人物可見。
- 新版模組語法、差異格式通過；Browser 最終 Console error 0。
- 三輪發現及修復細節見 docs/adventure-validation.md。
### 尚未驗證項目
真實學童學習成效、長期黏著度、各校網路及中文輸入法完整組合。
### 已知風險 (Known Risks)
alpha 試玩版；自動與開發者測試不能代替兒童使用研究。存檔仍限定相同瀏覽器與網站來源。

## Git 狀態
- Commit：b74d848 新版功能；交接文件另行提交。
- Push：交接提交後同步 origin/feat/jianghu-adventure。
- Working Tree：交接提交後僅保留兩份排除文件。
- Branch：feat/jianghu-adventure。

## 下一步建議動作 (Next Recommended Action)
讓學童實玩新版，觀察首次操作、每關時間、提示依賴與失敗率；再決定調整數值與正式入口。

## 發布狀態 (Release Status)
可發布分支試玩；公開原版維持 https://lianghao02.github.io/16_Wuxia-Typing-Legend/ 。

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