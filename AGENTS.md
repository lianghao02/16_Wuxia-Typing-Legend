# 16_Wuxia-Typing-Legend 專案規範 (Project Boundaries)

本專案為《武俠打字傳》（Wuxia Typing Legend），定位為「新國風仙俠 × 打字戰鬥 × 現代動畫演出」之教育向網頁遊戲，支援臺灣大千注音（免選字即時判定）、國小課本（康軒／翰林／南一）生字生詞、成語、唐詩及英語單字練習。

## 1. 核心架構邊界
- **職責分離（Separation of Concerns）**：
  - **DOM / HTML UI 層（`index.html`, `js/adventureApp.js`）**：專責題目顯示、原生 `<ruby>` 注音標註、單字染色、指法虛擬鍵盤、大地圖、客棧與傳書介面。主要打字題目嚴禁使用書法字體，一律使用高辨識度黑體／宋體。
  - **`TypingEngine` 輸入核心層（`js/core/TypingEngine.js`）**：純邏輯事件驅動（EventEmitter），負責大千注音實體鍵碼（`event.code`）映射、微軟注音 IME `composition` 攔截、英文字母判定與 Combo 統計。嚴禁在 Canvas 渲染層內部直接處理輸入法邏輯。
  - **`AdventureEngine` 冒險與 RPG 狀態層（`js/core/AdventureEngine.js`, `js/data/adventureWorld.js`）**：管理六章三十關進度、角色與流派（劍／刀／槍／馴獸師靈獸）、真實 RPG 傷害公式、敵人與 Boss 三階段 HP、動態題庫佇列與 `wuxia_adventure_v1` 存檔相容性。
  - **原生 HTML5 Canvas 2D 渲染層（`js/scenes/CanvasBattleScene.js`）**：專責戰鬥場景、少俠／靈獸與敵人動作、流派斬擊與靈獸特效、水墨粒子、Hit Stop（頓幀）與 Camera Shake（畫面震動）。本專案採用輕量原生 Canvas 2D，不引入 Phaser 或大型遊戲引擎。
- **兒童防挫折機制**：
  - 輸入錯誤（Miss）只中斷 Combo、播放架招音效並微幅推進敵方蓄力，嚴禁直接扣減玩家氣血（HP）或將全畫面染紅。
  - 支援免按退格鍵（Backspace）原地防呆校正。
- **年級與境界難度分離**：
  - **學年（Grade）**決定題目語料內容與題型長度比例。
  - **境界（Realm）**決定敵人攻擊節奏與戰場壓力，並透過學年公平係數調整有效傷害，避免低年級玩家因輸入較慢承受不對等懲罰。
- **存檔向下相容鐵律**：
  - 任何裝備、角色（如馴獸師與靈獸）或戰鬥機制擴充，必須無損讀取既有 `wuxia_adventure_v1` 存檔並自動補齊預設欄位，嚴禁清空玩家既有銅錢、文印或通關紀錄。
