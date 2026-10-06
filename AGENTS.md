# 16_Wuxia-Typing-Legend 專案規範 (Project Boundaries)

本專案為《武俠打字傳》（Wuxia Typing Legend），定位為「新國風仙俠 × 打字戰鬥 × 現代動畫演出」之教育向網頁遊戲，支援臺灣大千注音（免選字即時判定）、國小課本（康軒／翰林／南一）生字生詞、成語、唐詩及英語單字練習。

## 1. 核心架構邊界
- **職責分離（Separation of Concerns）**：
  - **DOM / HTML UI 層**：專責題目顯示、原生 `<ruby>` 注音標註、單字染色、指法虛擬鍵盤、選單與客棧介面。主要打字題目嚴禁使用書法字體，一律使用高辨識度黑體／宋體。
  - **`TypingEngine` 輸入核心層**：純邏輯事件驅動（EventEmitter），負責大千注音實體鍵碼（`event.code`）映射、微軟注音 IME `composition` 攔截、英文字母判定与 Combo 統計。嚴禁在 Phaser 內部直接處理輸入法邏輯。
  - **Phaser 3 渲染層**：專責戰鬥場景、少俠與敵人動作、劍氣斬擊（Slash Line）、水墨粒子、Hit Stop（頓幀）與 Camera Shake（畫面震動）。
- **兒童防挫折機制**：
  - 輸入錯誤（Miss）只中斷 Combo 並播放架招音效，嚴禁直接扣減玩家氣血（HP）或將全畫面染紅。
  - 支援免按退格鍵（Backspace）原地防呆校正。
