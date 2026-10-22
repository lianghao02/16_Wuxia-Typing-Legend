# 舊 beta 與正式版整合審查（2026-10-22）

## 範圍與結論
以正式 `master` 的 `91c604f`（v2.2.3）、`feat/jianghu-adventure` 的 `4a78588`、備份 `d292c6f` 為固定比較基準。僅依本機 Git 參照與實際程式、測試核對；本輪未重新 fetch、未核對線上部署。19 排除。

採取「保留正式版、挑選驗證、保留未決內容」：不整批合併 beta，不刪除 beta 或備份。正式版已於 `0f53f79` 移入多項 beta 修復；以祖先關係判定尚未合併，不能推論功能尚未整合。

## 功能對照與處置
| beta 內容 | 正式版狀態與證據 | 本輪處置 |
|---|---|---|
| 快速連錯逐次記錄、避免蓄力倒退 | `src/adventure.js` miss 處理器；`tests/desktopRevision.test.js` | 已具備，保留 |
| 錯題後續零失誤才降低、近期順序、結算不重複計數 | `recordQuestionHistory`、`recordQuestionResult` 與 desktopRevision 測試；兩分支函式介面不同 | 已具備，不直接覆蓋函式 |
| 逐題錯鍵續玩、特訓不覆蓋主線 | rememberSession／begin／finish／failed 與 desktopRevision 測試 | 已具備，保留 |
| 敵人未倒下不得領獎 | awardStage 與 desktopRevision 測試 | 已具備，保留 |
| 暫停、隱藏分頁、失焦保留定身時間 | tick、battleTime 與 desktopRevision 測試 | 已具備；保留正式版受傷無敵 |
| 單字裝備擊退、多字題不打斷蓄力 | calculateAttackDamage、applyPlayerAttack 與桌面測試 | 已具備；正式版看破破綻規則不同，不以 beta 覆蓋 |
| 毒／火／冰需連續完成兩字解除 | 正式版已有處理器 | 補一組涵蓋三種狀態與中途錯鍵的測試 |
| 滿氣絕招、回春丹消耗與淨化 | 正式版已有處理器，且有防具血量上限 | 補兩組正式事件流程測試，保留 100／115／130 上限 |
| 最低 24 次正確按鍵與破防收招 | 正式交接明確排除，屬於玩法變更 | 不移入 |
| 英文加權連擊獎勵 | 正式版保留同名計算輔助函式與單元測試，但戰鬥 charComplete 流程未接入 beta rewardProgress；正式交接排除這項改動 | 不自行啟用或刪除 |
| PWA、manifest、圖示與 Service Worker | 正式交接明確未加入 | 不移入；若另做，須以正式版依賴重建離線清單並驗證更新與存檔 |
| 舊版平衡模擬器與平衡報告 | 依賴舊 beta 的測試載入器與戰鬥規則 | 不把舊模擬結論套用正式版 |
| 評估文件搬至 docs | 文件整理，與產品修正無關 | 保留既有分支內容 |

## 備份分支
`backup-local-20261011` 的 `d292c6f` 不在 master 或 beta 的祖先歷史中。差異包含 `gradeVocabulary.js` 詞句擴充、`textbooks.js` 年級與 difficultyTier 標記、`gradeQuestionMix.js` 優先抽題、`originalProse.js` 語境字音與難度標記、`adventureWorld.js` 關卡文字，以及舊評估文件。

這批差異會改變題庫與選題結果，尚未逐項驗證字音、六年級三境界比例、舊存檔與練習難度。本輪不將它當成純修復直接搬移；也沒有證據足以安全刪除備份。需要另行確認是否採用新的題庫分級規格。

## 本輪驗證與修改
- 正式版基準 `npm test`：94/94 通過。
- 在既有 `tests/desktopRevision.test.js` 新增三組狀態回歸：毒火冰連續解狀態；絕招非戰鬥／未滿氣／重複施放；丹藥血量上限／耗用／零庫存。
- 修改後 `npm test`：97/97 通過；`node --check tests/desktopRevision.test.js`、`git diff --check` 通過。
- 測試執行正式事件處理器，以隔離物件替代畫面、時鐘與儲存，未操作玩家存檔。
- 未改遊戲程式、版本、題庫、音效或美術；沒有 UI 異動，因此未另跑瀏覽器遊玩。

## Git 處置
master 與 beta 分歧為 12／5 個提交。既有 merge-tree 模擬列出八個衝突檔：HANDOFF.md、README.md、package.json、src/adventure.js、src/data/gradeQuestionMix.js、src/engine/AdventureEngine.js、tests/adventure.test.js、tests/helpers/adventureHarness.js。此輪不進行實際合併。

正式工作樹保留新增測試與本輪 HANDOFF；beta 僅更新交接與本審查文件。尚未提交、推送、建立標籤或發布；分支全部保留。

2026-10-22 交付補充：使用者已授權將正式版測試與 beta 審查文件分開提交推送；不合併、不刪分支、不升版。實際提交與同步狀態以 Git 及控制中心本輪紀錄為準。
