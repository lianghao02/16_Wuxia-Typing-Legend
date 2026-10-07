# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/16_Wuxia-Typing-Legend
- **Branch**：master
- **Commit SHA**：9d282c0（本輪小螢幕修復基準；最新修復提交見 master 紀錄）
- **Skill Version**：v1.0.0
- **Task Type**：FIX / IMPROVE / RELEASE / HANDOFF
- **Local Path Hint**：16_Wuxia-Typing-Legend

## 目前狀態
Beta.2 小螢幕鍵盤修復已完成本機驗證；本輪提交與部署對應 master 最新紀錄。前輪 Beta.2 已公開部署。

## 本輪目標
完成先前年級題庫及操作修復的發布，補齊計時、字典與背景載入改善。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- 實作基準 cfd4c8a，發布功能提交 0c10c5a。
- 公開遊戲：https://lianghao02.github.io/16_Wuxia-Typing-Legend/
- 原有 assets/ART_RULES_V2_HANDOFF.md 是其他工作階段修改，保留並排除提交。

## 已完成 (Completed)
- 年級十八組分層隨機抽題、每關十題；詞句依官方字音核對，舊隊列逐音續玩。
- 真實錯鍵紀錄、護身符仍收錄、英文／單音特訓、不覆蓋主線，只清本批錯題。
- 技能常駐、鍵盤一鍵收起、下一鍵與連錯提示整合、依實際底座高度配置。
- 第一個作答按鍵才計時，排除選單、商店、背景視窗時間；中文字／分、英文 WPM。
- 同步輕量字音／例詞索引 761,700 bytes，完整字典 3,488,357 bytes 改查詢時載入；失敗可重試。
- 單字依讀音顯示官方例詞；原條目無例詞時不捏造，保留題目說明。查字顯示完整釋義。
- 九張背景／地圖 WebP 共 3,073,898 bytes，原 PNG 共 42,500,022 bytes；戰鬥支援格式備援，原圖不變。
- README、CHANGELOG、IMPLEMENTATION_PLAN、評估處置與 package 版本同步 beta.2。

## 異動檔案 (Changed Files)
- src/main.js、TypingEngine.js、StorageEngine.js、CanvasBattleScene.js、index.html、style.css。
- 年級題庫／比例、輕量字典／索引及相關匯入快取參數。
- scripts/build_dictionary_index.mjs、scripts/build_webp.py、九張 WebP 衍生檔。
- tests/typingEngine.test.js、package.json 與核心文件。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 不改官方原始資料、原 PNG 或他人素材交接檔。
- 不減少每關十題，沿用使用者決定的裝備特效差異，未新增裝備被動或首領機制。
- 不冒稱自編內容是出版社完整教材；進度仍為同一瀏覽器與來源的本機存檔。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：新手專項入口、F／J 定位標記、獨立查字入口與首領玩法，屬後續功能擴充。

## 驗證結果 (Validation)
### 已執行測試與結果
- 39/39 自動測試通過，涵蓋配額、錯題、特訓、續玩、計時、官方字音、WebP 失敗退回 PNG。
- 本機網頁：行字三種讀音完整釋義、英文 seven 完成後進入第二題 water、商店、重新載入續玩、1440×900 鍵盤版面，最終頁面無 console error。
- 前輪本機已驗證 768／1024／1440 寬度配置、連錯提示、錯題特訓及技能操作。
- 主要模組語法與 git diff --check 通過；九張 WebP 尺寸和 PNG 相同。
### 尚未驗證項目
未量測跨校網路首屏秒數或真實學習成效。
### 已知風險 (Known Risks)
舊版最佳速度計算不同，保留既有歷史紀錄但不可直接比較；混合語言錯題特訓速度僅供當次參考。

## Git 狀態
- Commit：0c10c5a 功能提交；本輪追加部署驗證文件提交。
- Push：功能提交已推送；部署驗證文件另行同步 origin/master。
- Working Tree：文件同步後僅保留 assets/ART_RULES_V2_HANDOFF.md 的他人修改。
- Branch：master。

## 下一步建議動作 (Next Recommended Action)
目前版本可交付，停止擴大修改；保留 assets/ART_RULES_V2_HANDOFF.md，不納入提交。

## 發布狀態 (Release Status)
已公開發布：https://lianghao02.github.io/16_Wuxia-Typing-Legend/

GitHub Pages built 對應 0c10c5a6fb93cb26c1169e2819c6296775b7c860。公開頁面確認 beta2_final 腳本／樣式、六年級 381 題與 1／3／6 抽題配額、行字三音完整釋義，console error 為零；未更動公開存檔的作答位置。

## 最新斷點：小螢幕鍵盤遮擋修正
- 使用者照片反映低高度筆電展開鍵盤後題目被裁切，並建議縮小鍵盤比例。
- 580～700px 高度、至少 761px 寬度：縮小鍵帽／控制列，保留目前字卡、組數、下一鍵，暫收全文預覽與例詞。更低高度採左右配置；一般桌機維持原配置。
- main.js 低高度時不再強制題目最低 top 120px；樣式與主程式快取改 20261007_small_screen。
- 本機驗證：1024×580、1366×600、1024×561、768×540、1440×900，四字與長句下一鍵位於題目框內，題目／底座不重疊；39/39 測試、語法與差異格式檢查通過。
- 本輪異動：css/style.css、src/main.js、index.html、README.md、CHANGELOG.md、HANDOFF.md。保留 assets/ART_RULES_V2_HANDOFF.md。

## 最新客棧人物修正
- 基準：87ee124；調整 index.html 與 css/style.css 的店小二顯示框及樣式快取參數。
- 原始素材透明留白過大，加上低高度螢幕 150px 高度限制，使人物過小；改以顯示框略去透明區域，低高度桌機顯示框為 230px。
- 本機 Browser 實測 1024×580、1440×900、768×540：全身、茶盤與對話完整，商品可獨立捲動，console error 為零。
- 本輪僅 UI 樣式與文件更新，不改購買邏輯或原始圖片；其他工作階段的 ART_RULES_V2_HANDOFF.md 保留。

## 最新筆電中央配置修正（取代先前左右分欄）
- 基準：4cd8909。使用者實機認為左右題目／鍵盤配置遮住人物，取消高度低於 580px 的分欄規則。
- 可用高度 ≤700px 且寬度 ≥761px 收起技能列與說明，保留技能快捷鍵；題目及鍵盤置中、依寬度預留兩側各 240px。
- 寬度 761～960px 另精簡頂部狀態與字卡，避免四字分組及下一鍵被裁切。
- 本機五種尺寸：1280×561、1024×561、1024×580、768×540、1366×650。均上下置中、互不重疊、下一鍵完整可見；連錯提示、正確輸入及鍵盤關閉／Tab 重開正常，console error 為零。
- 僅修改樣式、index 快取參數及核心文件；不改題庫、存檔、人物素材與戰鬥規則。
