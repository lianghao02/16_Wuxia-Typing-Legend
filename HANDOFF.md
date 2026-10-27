# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：feat/jianghu-adventure
- **Commit SHA**：9713f8c（審查文件提交；本輪校正後最新提交以 Git 記錄為準）
- **Skill Version**：v1.0.0
- **Task Type**：AUDIT / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

---

## 目前狀態

審查文件已提交並推送（9713f8c）。2026-10-27 重新核對：origin/master 已前進至 8ada402（含 PR #1、#2 合併），beta 分支落後 master 19 個提交、領先 6 個且皆為 beta 專屬／文件提交；本機 `.codex/worktrees/wuxia-v2.2.3` 的 master 落後 origin/master 6 個提交，尚未快轉。
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
- **P2 (重要/當次)**：無。審查文件與正式版測試均已提交；僅剩本機 master 工作樹落後遠端 6 個提交，需要時再快轉。
- **P3 (改善建議/暫緩)**：PWA 與備份題庫分級屬於獨立功能決策；未驗證前保留分支。

## 驗證結果 (Validation)
### 已執行測試與結果
正式 master npm test 97/97、測試語法與 git diff --check 通過；本分支僅文件修改。
### 尚未驗證項目
未重跑 beta 測試、未 fetch 或驗證線上版本、未驗收備份題庫、未另跑瀏覽器。正式版 97 項測試不能視為 beta 或備份的驗證。
### 已知風險 (Known Risks)
相同功能曾以不同程式實作移入；不能僅憑 merge-base 或提交未合併就判定功能遺失。

## Git 狀態
- Commit：審查文件 9713f8c；本輪 HANDOFF 校正另以後續 docs 提交保存。
- Push：審查文件已推送；校正提交推送狀態以 `git status -sb` 為準。
- Working Tree：提交後 Clean。
- Branch：feat/jianghu-adventure。

## 下一步建議動作 (Next Recommended Action)
維持 master 為開發基準，不將 beta 併回，保留 beta 與備份，日後只依明確功能需求挑選移入。

## 發布狀態 (Release Status)
本輪未升版或發布；正式版仍 v2.2.3，beta 仍 v2.1.1-beta.1。
