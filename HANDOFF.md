# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：feat/jianghu-adventure
- **Commit SHA**：4a78588（本輪修改前基準；本輪文件尚未提交）
- **Skill Version**：v1.0.0
- **Task Type**：AUDIT / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

---

## 目前狀態

使用者已於本輪授權依專案／分支分開提交與推送；下列未提交描述為提交前斷點，最終提交與遠端同步結果見控制中心本輪計畫及 Git。
2026-10-22：已完成與正式 v2.2.3 的功能差異審查。beta 為 v2.1.1-beta.1，保留獨立分支；後續產品開發應以正式 master 為基準。

## 本輪目標
確認前輪未整合內容，避免重做已挑選移入的修正或整批合併舊玩法。

## 基準與已確認事實 (Baseline & Confirmed Facts)
master 為 91c604f／v2.2.3，beta 為 4a78588，備份為 d292c6f。本輪未 fetch，分支比較以這些固定提交為準。

## 已完成 (Completed)
- 逐項核對 beta 修復、正式版事件處理器與回歸測試；多數修復已於 0f53f79 移入正式版。
- 在正式工作樹既有測試檔補三組狀態回歸，94/94 提升為 97/97；產品程式不變。
- 完整處置與證據見 docs/branch-integration-review.md。
- 更正舊交接過時版本、未提交狀態與誤植的 Google 相簿待辦；歷史記錄保留於 Git。

## 異動檔案 (Changed Files)
本分支：HANDOFF.md、docs/branch-integration-review.md。正式 master 工作樹另有 tests/desktopRevision.test.js 與 HANDOFF.md 修改，不屬於本分支工作檔。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不整批合併、不刪除 beta 或備份；不加入 PWA、24 次按鍵門檻、英文加權獎勵，不覆蓋正式版裝備掉落、血量、音樂與動畫。19 排除。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：本輪審查無已確認未修阻斷。
- **P2 (重要/當次)**：兩工作樹修改尚未提交推送；正式版可獨立提交測試，本分支可獨立提交文件。
- **P3 (改善建議/暫緩)**：PWA 與備份題庫分級屬於獨立功能決策；未驗證前保留分支。

## 驗證結果 (Validation)
### 已執行測試與結果
正式 master npm test 97/97、測試語法與 git diff --check 通過；本分支僅文件修改。
### 尚未驗證項目
未重跑 beta 測試、未 fetch 或驗證線上版本、未驗收備份題庫、未另跑瀏覽器。正式版 97 項測試不能視為 beta 或備份的驗證。
### 已知風險 (Known Risks)
相同功能曾以不同程式實作移入；不能僅憑 merge-base 或提交未合併就判定功能遺失。

## Git 狀態
- Commit：本輪尚未提交；基準 4a78588。
- Push：否。
- Working Tree：Modified，僅本輪兩份文件。
- Branch：feat/jianghu-adventure。

## 下一步建議動作 (Next Recommended Action)
依授權分別提交正式版測試與本分支審查文件；維持 master 為開發基準，保留 beta 與備份，日後只依明確功能需求挑選移入。

## 發布狀態 (Release Status)
本輪未升版或發布；正式版仍 v2.2.3，beta 仍 v2.1.1-beta.1。
