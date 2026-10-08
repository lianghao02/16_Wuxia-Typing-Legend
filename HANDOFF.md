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