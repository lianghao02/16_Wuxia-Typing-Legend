# 武俠打字傳 (Wuxia Typing Legend)

> **以字為劍，打出你的江湖。指尖起字，劍意行雲；打字，亦是修行。**

《武俠打字傳》是一款專為臺灣學童與打字修煉者打造的「**新國風仙俠 × 打字戰鬥 × 現代動畫演出**」教育網頁遊戲。採用 **Phaser 3（戰鬥渲染層）+ 原生 HTML DOM（高辨識題目與注音排版層）+ 事件驅動 `TypingEngine`** 三層解耦架構。

---

## 核心特色

1. **臺灣大千注音「免選字即時判定」引擎**：
   - 無論玩家處於純英數模式或開啟微軟新注音，皆直接透過實體鍵碼 (`KeyboardEvent.code`) 對應大千注音鍵位，**不跳出系統選字框干擾節奏**。
   - **一聲空白鍵智慧緩衝**：一聲字（如「山 `ㄕㄢ`」）打完後若因肌肉記憶多按空白鍵，系統自動吸收不扣連擊。
   - **原地防呆免按退格鍵（No-Backspace）**：按錯鍵僅短暫抖動提示並發出溫和金屬格擋聲，不扣玩家氣血、不需按 `Backspace`，直接改按正確鍵即可推進。
2. **雙語四階題庫 ＋ 國小三大出版社課本同步**：
   - 內建單鍵注音、單字拼音、四字成語、經典唐詩名句與基礎／進階英文單字。
   - 收錄 **康軒、翰林、南一** 國小國語課本各年級生字與生詞題庫。
   - **爸媽自訂祕笈書閣**：家長可直接貼上學校聯絡簿生字或圈詞（支援自動標註注音），一鍵生成專屬闖關副本。
3. **八階敵人與古驛客棧養成系統**：
   - 敵人成長階梯：**稻草人 $\to$ 少林木人樁 $\to$ 小山賊 $\to$ 裝備小山賊 $\to$ 中階山賊 $\to$ 大山賊 $\to$ 機關傀儡 $\to$ 山大王（黑風盜）**。
   - 雙主角自由切換：**雲清川**（青藍水墨劍氣）／**蘇映雪**（月白冰晶劍氣）。
   - 三階神兵換裝：**桃木短劍（布衣）$\to$ 三尺青鋒劍（俠客服）$\to$ 流雲玄鐵神劍（宗師披風）**，支援購買金創藥、九轉大還丹與靜心護身符。
4. **現代動畫打擊演出**：
   - 支援微觀聚氣星芒、中觀弧形劍光（Slash Line）、巨觀殘影突進（After Image）、0.075 秒頓幀（Hit Stop）、看破破綻（Parry Break）與 Combo $\times 20$「劍意狀態」。

---

## 目錄結構

```text
16_Wuxia-Typing-Legend/
├── index.html                # 完整 Phaser 3 + DOM 混合架構主遊戲入口
├── prototype-input.html      # Step 1：注音免選字輸入核心驗證與事件診斷實驗室
├── start_game.bat            # Windows 一鍵啟動本機 HTTP 伺服器並開啟瀏覽器
├── package.json              # 測試與開發腳本設定
├── css/
│   └── style.css             # 新國風仙俠 UI 樣式（宣紙米色、細金線、水墨虛擬鍵盤）
├── src/
│   ├── main.js               # 遊戲主控制器（串聯引擎、Phaser、DOM 與客棧商店）
│   ├── data/
│   │   ├── daqianLayout.js   # 臺灣標準大千注音鍵盤與手指指法對應表
│   │   ├── enemies.js        # 八階敵人、雙主角、三階武器與客棧丹藥設定
│   │   ├── vocabulary.js     # 雙語四階題庫、常用國字注音字典與自訂字串解析器
│   │   └── textbooks.js      # 康軒、翰林、南一國小課本生字與生詞題庫
│   ├── engine/
│   │   ├── TypingEngine.js   # 純邏輯事件驅動輸入判定引擎
│   │   ├── AudioEngine.js    # Web Audio API 原生五聲音階與刀劍音效合成器
│   │   └── StorageEngine.js  # LocalStorage 進度、星等、裝備與自訂題庫存檔
│   └── scenes/
│       └── BattleScene.js    # Phaser 3 戰鬥場景、水墨背景、角色動畫與粒子特效
└── tests/
    └── typingEngine.test.js  # TypingEngine 與題庫解析自動化單元測試
```

---

## 快速啟動與驗證方式

### 1. 啟動遊戲（Windows 本機）
雙擊執行專案根目錄的 [`start_game.bat`](file:///d:/Development/GitHub/16_Wuxia-Typing-Legend/start_game.bat)，或於終端機執行：
```powershell
python -m http.server 8765 --bind 127.0.0.1
```
接著於瀏覽器開啟：
- **完整武俠戰鬥版**：`http://127.0.0.1:8765/index.html`
- **Step 1 輸入核心診斷實驗室**：`http://127.0.0.1:8765/prototype-input.html`

### 2. 執行自動化測試
```powershell
node --test tests/typingEngine.test.js
```
