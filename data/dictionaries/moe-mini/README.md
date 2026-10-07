# 教育部《國語小字典》離線資料

中華民國教育部（Ministry of Education, R.O.C.）。《國語小字典》（版本編號：2019_20260929）。網址：https://dict.mini.moe.edu.tw/

- 原始來源：https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/dict_mini_download.html
- 原始下載：https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/download/dict_mini_2019_20260929.zip
- 官方使用說明：[使用說明.pdf](使用說明.pdf)，完整保留，使用資料時須一併保留。
- 授權：創用 CC－姓名標示－禁止改作 3.0 臺灣。https://creativecommons.org/licenses/by-nd/3.0/tw/legalcode
- 下載日期：2026-10-07。
- 原始 Excel SHA-256：`94546b7d330a6334b828c1a8a516dd2378f9e0dfcf6ea1d301516fe5680c6edd`。
- 完整資料：4,311 個字、4,719 筆條目，涵蓋全部六欄與所有讀音；不宣稱等同任何年級必學字表。

`dict_mini_2019_20260929.xlsx` 為下載包內原始檔，未改動。`src/data/moeMiniRecords.js` 僅作完整欄位格式轉存，包含原始工作表名稱、表頭、部首、筆畫、注音與帶標記的全部釋義，未刪減或改寫內容。遊戲自行建立查詢索引及練習分組，不改動字典條目，不使用教育部名稱宣稱認證遊戲。

自訂詞彙優先使用字典中讀音唯一的完整例詞，其次沿用已有遊戲詞庫的完整標音（逐字檢查是否符合字典收音），再查單一讀音國字。無法判定語境的多音字提示全部候選讀音；不自行選取第一音。已有詞庫標音仍須依詞義校對，逐字符合並不等同完整語義審核。

需更新資料時，將新的官方原始檔與完整使用說明保留後，以具備 openpyxl 的 Python 執行 `scripts/import_moe_dictionary.py`，並更新版本資訊、來源與測試；遊戲執行不需要 Python、網路或 Excel。

## 出版社來源狀態

康軒、翰林、南一現有分類仍為自行整理且尚待核對的練習範例，未納入出版社正式教材資料；公開可查閱不表示可重製於遊戲。遊戲提供官方入口：

- 康軒：https://digitalmaster.knsh.com.tw/v3/
- 翰林：https://www.hle.com.tw/user-teacher.html ，授權條款：https://www.hle.com.tw/pricing-licensing/
- 南一：https://nanidigi.nani.com.tw/ （頁面附版權聲明）。

正式教材匯入須記錄可重製的授權依據、學年度、冊次、課次與原始來源；此資料包不包含正式教材。

## 詩詞語境補充

原遊戲「問渠那得清如許」的「那」保留 `ㄋㄚˇ`，屬小字典未收錄的古語讀音；教育部《重編國語辭典修訂本》「那得」條目可確認：https://dict.revised.moe.edu.tw/dictView.jsp?ID=56158&la=1&powerMode=0 。此項是遊戲詩詞標音的核對註記，不改動小字典原始資料。
