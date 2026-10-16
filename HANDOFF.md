# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：0f53f79496c649f1e4368c1679e66f8904faa1af（v2.2.3 發布提交；後續文件提交以 Git log 為準）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / HANDOFF
- **Local Path Hint**：.codex/worktrees/wuxia-v2.2.3

## 目前狀態
2026-10-16：v2.2.3 已正式提交並推送 master、建立標籤與正式 GitHub Release。Pages 工作 38886747909 成功，正式網站版本檔及遊戲程式與發布標籤位元組一致。原 beta 工作目錄與其未提交 HANDOFF.md 保留。

## 本輪目標
只移入經查證且適用電腦實體鍵盤的錯題、續玩、特訓、戰鬥狀態及領獎修正，作為新版本 v2.2.3。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 起始 origin/master：6c8830c；package.json 2.2.2；基準測試 78／78 通過。
- 從正式版建立獨立修訂工作目錄，沒有整批合併舊 beta。

## 已完成 (Completed)
- 錯鍵逐次記錄；作答歷史不消除錯題，後續零失誤才降低一次，結算不再重複計題；近期題目依真正重練順序排列。
- 保存逐題錯鍵數；特訓暫停、失敗與結算不覆寫主線續玩、印章或冒險氣血，不發主線通關／掉落賞金；返回主線不沿用特訓題庫。
- 修正快速連錯漏記、高蓄力按錯倒退、暫停消耗定身與敵人未倒下可領獎。
- 補回中文提示的 symLabel 定義；新增中文聲母、一聲、輕聲、二聲與英文的完整畫面渲染測試，修正前四項中文案例失敗，修正後全數通過。
- 單字題套用普通／附魔裝備與護腕擊退，多字詞保留增傷且不中斷蓄力；保留受傷無敵。
- 版本來源、README 與 CHANGELOG 對齊 v2.2.3，新增 16 項回歸測試納入 npm test。

## 異動檔案 (Changed Files)
docs/releases/v2.2.3.md、package.json、src/adventure.js、src/data/gradeQuestionMix.js、src/engine/AdventureEngine.js、tests/adventure.test.js、tests/combatUxEnhance.test.js、tests/desktopRevision.test.js、tests/helpers/adventureHarness.js、README.md、CHANGELOG.md、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
保留 v2.2.2 音樂音效、首領 20% 掉落、進度鎖、護甲血量、章節回血、重遊收益、美術素材與全螢幕。未加入 PWA、手機／平板改版、最低 24 按鍵門檻或英文獎勵倍率調整。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無已確認未處理阻斷問題。
- **P2 (重要/當次)**：無；正式 Release 與 Pages 已核對，驗收證據見 docs/releases/v2.2.3.md。
- **P3 (改善建議/暫緩)**：完整真人三十關遊玩、其他電腦與輸入法環境驗收。

## 驗證結果 (Validation)
### 已執行測試與結果
- npm test：94／94 通過，包含各年級三境界三十關實際鍵碼與傷害計算、既有素材／音效與掉落測試、新增桌面回歸。
- 內建瀏覽器於獨立 localhost：英文實際錯鍵及完成題目、離開後重新載入、逐字接續、錯題保留通過；console error 0。測試使用獨立來源的瀏覽器資料，不操作正式站存檔。
- 補驗中文實體按鍵：聲母提示、一聲空白鍵、題目推進與敵人血量同步更新通過；新分頁 console error 0。先前發布檢查發現的中文提示阻斷已排除。
### 尚未驗證項目
未逐關人工玩完三十關；未驗證正式部署與跨電腦環境。
### 已知風險 (Known Risks)
v2.2.3 已發布；舊版本已遺失的錯題與計數不會自動重建。

## Git 狀態
- Commit：發布內容 0f53f79；後續驗收文件另行提交。
- Push：是。
- Working Tree：本輪發布與驗收文件提交後應為 Clean，以 git status 為準。
- Branch：master；已同步 origin/master。

## 下一步建議動作 (Next Recommended Action)
維持正式 master 為開發基準。舊 beta 與其本機交接修改仍保留，清理須另依使用者指示。

## 發布狀態 (Release Status)
已正式發布：https://github.com/lianghao02/16_Wuxia-Typing-Legend/releases/tag/v2.2.3 。線上 Pages 已通過部署與程式雜湊核對。
