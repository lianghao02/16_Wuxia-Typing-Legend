# 《武俠打字傳》v2.1.0 RPG 遊戲深化－完整實作計畫 (Antigravity 執行規格書)

## 問題導向改善（本輪）

### 1. 系統概念與目標
以「孩子能看清題目、理解規則、獲得可信的學習與戰鬥回饋」為目標。基準為 `feat/jianghu-adventure`／`a6b63e5`；先修可重現的行為錯誤，暫不擴充角色、技能與選單。

| 範圍 | 問題與程式證據 | 改善方向 | 驗收條件／狀態 |
|---|---|---|---|
| 教學提示 | 同字 550ms 內再次錯鍵提前返回，提示計數不增加 | 提示、錯題與戰鬥懲罰分開計數 | 已修：快速連錯兩次仍達提示門檻，緩衝只保護戰鬥懲罰 |
| 學習紀錄 | 每題及通關各記一次；完成有錯的題目也扣除弱點次數 | 一題只記一次，後續零失誤作答才降低待複習次數 | 已修：錯一次再完成仍待複習；續玩保留當題錯鍵 |
| 攻擊 | 單字題固定退 10%，未套用武器、護腕的擊退量 | 單字題套用「10＋武器加成＋護腕加成」個百分點；多字詞不中斷集氣 | 已修：六階槍＋宗師護腕退 34 個百分點，多字詞仍為 0 |
| 防禦 | 錯鍵把 99% 蓄力變成 95%；異常化解中途錯鍵仍延續 | 錯鍵只推進蓄力且不直接扣血；化解須連續完成兩字 | 已修：90／95／99% 邊界與中途錯鍵均有行為測試 |
| 武功／技能 | 破綻計算回傳清空集氣，但正式多字詞不套用；技能效果容易與說明混淆 | 破綻維持增傷；一般詞句不清集氣。保留一個主動絕招入口，先驗證再決定是否調整 | 已修規則落差；滿氣、只消耗一次、8／10 秒定身、護印與流派回血已測。暫停期間定身是否保留列後續實測 |
| 角色 | 視覺體型、動作輪廓與靈獸組合在小螢幕可能擠壓題目；本輪未取得新畫面 | 先確保各套角色與靈獸可見；雲／蘇以造型選擇為主，兵器／靈獸提供戰鬥差異 | 待瀏覽器驗證三角色、六階裝備、同時攻擊、減少動態；不先增加角色能力分支 |
| 道具／商店 | 護腕文字承諾每字擊退，與整題制衝突 | 改為單字題效果，確認滿血不誤耗藥、淨化及恢復上限 | 已修說明；回春丹消耗、恢復與淨化已測。自動用藥節奏及商店文字密度待實玩 |
| 介面 | 缺少本輪跨尺寸畫面證據，不能沿用舊版「零遮擋」結論 | 題目與下一鍵為第一層；角色攻擊保留演出空間；統計與裝備細節放次級面板 | 待測：1920×1080、1366×650、1024×561、768×540、125%／150% 實際可用視窗；鍵盤開關、通知、商店、設定、結算 |
| 特訓／進度 | 特訓共用主線續玩與通關入口，可能覆寫存檔、取得主線印章 | 特訓僅記學習成果與 35 銅錢賞金，不改主線續玩／解鎖 | 已修：特訓完成、敗退及存檔不影響主線；日常任務仍可正常累計 |
| 通關／快取 | 敵人未倒下但十題仍可領賞；Service Worker 清除同網域其他快取 | RPG 通關必須擊敗對手；僅清除本遊戲舊快取 | 已修：十題但敵人有血拒絕領賞；保留其他專案快取 |
| 難度與黏著度 | 全關卡套用相同基礎循環；公式驗證不等於孩子感到有趣或公平 | 先量測各年級／境界的實際字數、按鍵量、過關時間、回擊與調息次數，再調參數 | 待實玩：新手／熟手、初階／高階裝備、單字／四字詞／長句；不能只憑題數或傷害推論難度 |

### 2. 運作邏輯與狀態
- 主線：首頁 → 關卡說明 → 戰鬥 → 敵人 HP 歸零 → 結算與解鎖；HP 未歸零不得領通關賞金。
- 錯鍵：記錄提示與弱點 → 重設連續化解進度 → 懲罰緩衝判斷 → 推進蓄力；不直接扣玩家氣血。
- 破題：記錄一次學習成果 → 套用傷害／單字題擊退 → 檢查敵人血量 → 下一題或結算。
- 特訓：主線暫停並保留 → 複習戰鬥 → 特訓賞金與學習成果 → 返回原主線；不取得文印或主線關卡紀錄。

### 3. 介面規格與參考
- 第一層為目前字、注音、下一鍵、敵人危險提示與必要氣血；第二層為進度、連擊與可施放絕招；裝備數值與長期統計維持次級入口。
- 沿用 `Tab` 開關鍵盤、`Alt+1` 絕招、`Alt+2` 回春丹、`Enter` 接續；避免為裝飾或角色特性再新增按鍵。
- 參考 [CrazyGames Technical requirements](https://docs.crazygames.com/requirements/technical/) 的桌面橫向、Chrome／Edge 相容與安全區原則，作為本案視窗驗收參考，不代表本遊戲已通過該平台審核。Poki UX 頁此次無法存取，未據此宣稱已完成案例研究。
- 本輪只調整必要提示與商店說明，未修改響應式配置；題目、人物大小與遮擋須有新截圖／邊界量測後再修。

### 4. 數值與防禦邊界
- 氣血 0～100、內力 0～5、蓄力 0～100；錯鍵從 99% 只會前進到 100%，不倒退。
- 單字題擊退最高 100 個百分點，詞句為 0；絕招維持既有獨立擊退與定身規則。
- 新存檔補存當題錯鍵數；舊存檔缺欄位且已有錯誤時保守判為非零失誤，不重設財產、關卡或注音位置。
- 不修改現有傷害曲線、怪物血量、素材、角色姿態與原版 `classic.html`；不以本輪單元測試代替真人難度評估。

### 5. 例外、驗證與停止條件
- 無效關卡、未擊敗對手、矛盾或非有限數值的 HP 不得領獎。
- 以正式事件處理器的隔離測試驗證行為；DOM／音效／儲存使用替身，不接觸使用者存檔。
- 本輪瀏覽器工具回報無可用瀏覽器；跨尺寸、實際字級、動畫遮擋、console error 與 PWA 更新／離線實玩仍待驗證，禁止標記已通過。
- 已確認錯誤修正且必要測試通過後停止擴充；下一輪先取得畫面與遊玩證據，再挑問題修訂。

### 戰鬥節奏診斷進展

- 第二輪已修正英文獎勵成本（純英文 20／40／60 字元發獎，中英混合加權）與收招門檻（24 正確按鍵＋完成當題）。原進度列顯示破防提示，不新增操作或設定。候選參數仍須真人與跨尺寸驗證。
- 同批 1,512 組複驗均無零題通關，所有通關案例符合最低練習量；80 項測試通過。英文宗師最終關、木劍、每秒兩鍵、不用絕招仍需調息，列為已知邊界而非擅自降低全體難度。
- 已完成 1,512 組固定速度／固定錯鍵比例的隔離模擬，方法、結果與限制見 [戰鬥節奏診斷](docs/battle-balance.md)。非學童實測，不用模擬通關率代替滿意度。
- 已修正：長句中途以絕招獲勝不虛增完成題數；定身改以有效戰鬥時間計算，選單、隱藏分頁與失焦不耗秒數。
- 下一輪優先以真人資料核對新獎勵成本、24 鍵練習門檻與宗師錯鍵容錯；基礎傷害與怪物血量暫不全面調整。介面仍待 Browser 實測。

---

- **規劃版本**：`v2.1.0`
- **既有基準**：`v2.0.0`「文印江湖」正式版（Commit `6d0a65d`）
- **任務性質**：既有架構延續開發、RPG 戰鬥與題庫機制深化、新角色「馴獸師」與四靈獸擴充
- **執行原則**：保留正常功能、100% 向下相容 `wuxia_adventure_v1` 舊存檔、最小必要修改、不引入外部大型框架

---

## 一、現有架構與本次修改界線

| 模組路徑 | 現有職責 | v2.1.0 修改範圍與界線 |
| :--- | :--- | :--- |
| [`AGENTS.md`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/AGENTS.md) | 專案架構邊界規範 | **已完成更新**：將舊版 Phaser 3 描述修正為實際使用之原生 HTML5 Canvas 2D（`CanvasBattleScene.js`），並納入年級／境界分離與存檔相容鐵律。 |
| [`js/core/TypingEngine.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/core/TypingEngine.js) | 大千注音、英文輸入、Combo 計算 | **原則保留不動**：維持既有按鍵事件（`correct_key`, `wrong_key`, `char_complete`, `word_complete`），不重寫輸入法核心。 |
| [`js/data/adventureWorld.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/data/adventureWorld.js) | 六章三十關世界觀、角色、裝備表 | 新增第三角色「馴獸師・林牧風（`mu_tamer`）」、四種靈獸定義表 `SPIRIT_BEASTS`、武器流派傷害係數、六章三十關敵人基礎 HP 與防禦設定。 |
| [`js/core/AdventureEngine.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/core/AdventureEngine.js) | 存檔、關卡狀態、裝備購買、傷害結算 | 實作統一 RPG 傷害公式 `calculateAttackDamage()`、Boss HP 比例三階段狀態機、毒蟾 DoT 持續傷害、存檔無損遷移 `migrateSaveState()`。 |
| [`js/utils/gradeQuestionMix.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/utils/gradeQuestionMix.js) | 年級題目分層抽樣 | 擴充四層防重（同場禁重、跨關近期 60 題排除、長期熟練度降權、錯題 `20%` 溫故知新複習）、中英分池防重、題庫不足自動放寬保護。 |
| [`js/scenes/CanvasBattleScene.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/scenes/CanvasBattleScene.js) | 原生 Canvas 2D 人物、場景、特效渲染 | 註冊 12 張 v5 國風水墨透明 PNG 與 `spriteAnchors`；新增「馴獸師＋靈獸」雙重站位渲染、靈獸撲擊／羽刃／毒霧／爪擊特效與傷害來源浮動字。 |
| [`js/core/AudioEngine.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/core/AudioEngine.js) | 合成音效、中英 TTS 朗讀 | 新增 5 種情境國風合成 BGM（首頁／一般戰鬥／Boss 戰／客棧／劇情）、流派與靈獸專屬音效、智慧朗讀優先權管理、四項獨立音訊設定持久化。 |
| [`js/adventureApp.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/adventureApp.js) & [`index.html`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/index.html) | DOM UI、戰鬥迴圈、客棧、設定面板 | 取消戰鬥關卡固定十題限制，改為 `enemyHp <= 0` 勝利與動態補題佇列；客棧依角色自動切換「神兵閣／靈獸欄」；新增四項音訊開關 UI。 |

---

## 二、已就緒之 v2.1.0 國風水墨美術資產清單（v5 Transparent RGBA PNGs）

所有新增角色與靈獸素材均已依 [`assets/GUOFENG_V4_README.md`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/GUOFENG_V4_README.md) 規格完成去背、邊緣羽化與透明留白（四周留白 `>= 16%`），並儲存於 `assets/` 目錄下，可直接於 `CanvasBattleScene.js` 與 `adventureWorld.js` 引用：

### 1. 角色與靈獸戰鬥立繪（`1080×1440` RGBA PNG，面向右側敵方）

| 資產鍵值 (`key`) | 檔案路徑 | 角色／靈獸名稱 | `visibleBounds` (`left, top, right, bottom`) | 建議 `spriteAnchors` (`{ x, y, scale }`) |
| :--- | :--- | :--- | :--- | :--- |
| `mu_tamer` | [`assets/characters/mu_tamer_idle_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/characters/mu_tamer_idle_v5.png) | 馴獸師・林牧風 | `314, 202, 765, 1180` (`452×979`) | `{ x: 0.51, y: 0.82, scale: 1.00 }` |
| `beast_dog` | [`assets/characters/beast_dog_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/characters/beast_dog_v5.png) | 追風靈犬 | `205, 521, 874, 1180` (`670×660`) | `{ x: 0.57, y: 0.82, scale: 0.72 }` |
| `beast_eagle` | [`assets/characters/beast_eagle_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/characters/beast_eagle_v5.png) | 穿雲靈鷹 | `183, 414, 895, 1122` (`713×709`) | `{ x: 0.48, y: 0.78, scale: 0.78 }` |
| `beast_toad` | [`assets/characters/beast_toad_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/characters/beast_toad_v5.png) | 碧玉毒蟾 | `216, 615, 863, 1180` (`648×566`) | `{ x: 0.45, y: 0.82, scale: 0.68 }` |
| `beast_wolf` | [`assets/characters/beast_wolf_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/characters/beast_wolf_v5.png) | 嘯月蒼狼 | `183, 495, 895, 1180` (`713×686`) | `{ x: 0.38, y: 0.82, scale: 0.80 }` |

### 2. 頭像、客棧圖示與戰鬥特效（`512×512` RGBA PNG）

| 資產鍵值 (`key`) | 檔案路徑 | 用途說明 | `visibleBounds` (`width×height`) |
| :--- | :--- | :--- | :--- |
| `mu_avatar` | [`assets/icons/mu_avatar_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/icons/mu_avatar_v5.png) | 馴獸師・林牧風選角與狀態列頭像 | `418×420` |
| `beast_dog_icon` | [`assets/icons/beast_dog_icon_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/icons/beast_dog_icon_v5.png) | 客棧靈獸欄：追風靈犬圖示 | `347×348` |
| `beast_eagle_icon` | [`assets/icons/beast_eagle_icon_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/icons/beast_eagle_icon_v5.png) | 客棧靈獸欄：穿雲靈鷹圖示 | `348×326` |
| `beast_toad_icon` | [`assets/icons/beast_toad_icon_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/icons/beast_toad_icon_v5.png) | 客棧靈獸欄：碧玉毒蟾圖示 | `348×342` |
| `beast_wolf_icon` | [`assets/icons/beast_wolf_icon_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/icons/beast_wolf_icon_v5.png) | 客棧靈獸欄：嘯月蒼狼圖示 | `347×348` |
| `beast_claw_fx` | [`assets/effects/beast_claw_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/effects/beast_claw_v5.png) | 靈犬／蒼狼破空爪擊特效 | `348×344` |
| `beast_dive_fx` | [`assets/effects/beast_dive_v5.png`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/assets/effects/beast_dive_v5.png) | 靈鷹穿雲俯衝羽刃特效 | `348×339` |

---

## 三、分階段詳細實作規格

### 第一階段：真正的 RPG 血量與傷害系統

#### 1. 戰鬥與非戰鬥關卡勝利判定分流
- **戰鬥關卡（`node.kind === 'battle' || node.kind === 'boss'`）**：
  - 取消「完成固定 10 題即直接過關」的舊規則。
  - **唯一勝利條件**：`battleState.enemyHp <= 0`。
  - **失敗／調息條件**：`battleState.playerHp <= 0`（進入調息結算畫面，保留已得銅錢之 `50%` 鼓勵金，不倒扣既有財產）。
- **非戰鬥關卡（`node.kind === 'study' || node.kind === 'trial' || node.kind === 'errand'`）**：
  - 練功（`study`）、旅程（`trial`）、委託（`errand`）維持任務目標制（完成指定題數 `targetCount` 即可過關），UI 將敵方血條改顯示為「修練／任務進度條」。

#### 2. 統一可追蹤傷害管線（`AdventureEngine.calculateAttackDamage(context)`）
所有傷害統一由單一純函式計算並回傳結構化明細，嚴禁在 UI 或 Canvas 重複扣血：

```javascript
/**
 * @param {Object} ctx
 * @param {'key'|'char'|'word'|'ult'|'dot'} ctx.triggerType - 觸發階段
 * @param {number} ctx.charCount - 題目國字數（英文則傳入單字字母數）
 * @param {boolean} ctx.isEnglish - 是否為英文題目
 * @param {number} ctx.combo - 當前連擊數
 * @param {string} ctx.grade - 當前學年 ('1'~'6' | 'all')
 * @param {Object} ctx.weapon - 當前武器或靈獸設定
 * @param {Object} ctx.enemy - 當前敵人狀態（含 defense, isBoss, bossPhaseIndex, maxHp）
 * @returns {{ totalDamage: number, chargeReduction: number, applyPoisonTurns: number, isMultiHit: boolean, breakdown: Object }}
 */
```

- **各輸入階段行為與題目長度公平公式**：
  1. **`triggerType === 'key'`（正確注音／英文字母按鍵）**：
     - 聚氣 `+2`，敵方蓄力微退 `1.5%`，`totalDamage = 0`（不扣敵人主血條，避免每個注音符號跳出大量微小傷害數字干擾視線）。
  2. **`triggerType === 'char'`（完成單一國字，且該題總字數 `>= 2`）**：
     - 觸發輕擊：`baseDamage = 6 + Math.round(weapon.atk * 0.25)`。
     - 若裝備「追風靈犬（`beast_dog`）」，額外附加 `beastBonus = 4` 點快速撕咬傷害。
  3. **`triggerType === 'word'`（完成整題：單字、詞語、成語、長句或英文單字）**：
     - **有效字數折算**：
       - 中文題：`effectiveChars = Math.max(1, charCount)`
       - 英文題：`effectiveChars = Math.max(1, letterCount / 3.5)`
     - **開根號飽和長度係數（防止長句無限增傷）**：
       $$\text{lengthMultiplier} = \min\left(2.50,\; 1.0 + 0.45 \times \sqrt{\max(0, \text{effectiveChars} - 1)}\right)$$
       - 1 字：`1.00x`｜2 字詞：`1.45x`｜4 字成語：`1.78x`｜7 字詩句：`2.10x`｜12 字長句：`2.49x`（上限 `2.50x`）。
     - **基礎招式傷害**：`rawBase = (18 + weapon.atk * 0.85) * lengthMultiplier`。
     - **流派／靈獸專屬加成（`schoolBonus`）**：
       - 劍系（`sword`）：連擊加成提高，每點 Combo 提供 `+1.8%`（上限 `+65%`，一般流派為每點 `+1.2%`、上限 `+40%`）。
       - 刀系（`blade`）：當 `effectiveChars >= 2` 時，觸發「烈焰重斬」額外乘算 `1.28x`。
       - 槍系（`spear`）：無視敵方防禦減傷（`ignoreDefense = true`），且削減敵方蓄力條 `18%`（一般為 `8%`）。
       - 靈獸系（`beast`）：依當前裝備之靈獸觸發對應特性（詳見第四階段）。
     - **學年公平係數（`gradeDamageScale`）**：
       - `G1: 1.25`, `G2: 1.20`, `G3: 1.12`, `G4: 1.05`, `G5: 1.00`, `G6: 1.00`, `all: 1.05`。
     - **敵方減傷（`enemyDefense`）**：
       - 最終傷害 `totalDamage = Math.max(1, Math.round(preDefenseDamage * (1 - effectiveDefense)))`。
  4. **`triggerType === 'ult'`（施放絕招）**：
     - 消耗 `100` 點內力，基礎絕招傷害 `ultBase = (55 + weapon.atk * 2.2) * gradeDamageScale`，並觸發流派／靈獸專屬控制或爆發效果。

#### 3. Boss 血量比例三階段狀態機
- 將 `AdventureEngine` 與 `adventureApp` 中原本依「已完成題數（如第 3 題、第 7 題）」推進的 Boss 階段，全面改為依 **`hpRatio = enemyHp / enemyMaxHp`** 觸發：
  - **階段 0「試探」（`1.00 >= hpRatio > 0.70`）**：基礎蓄力速率 `1.0x`，無額外減傷。
  - **階段 1「破防」（`0.70 >= hpRatio > 0.30`）**：蓄力速率提升至 `1.18x`，Boss 獲得 `10%` 護體減傷（槍系與靈鷹可無視）。
  - **階段 2「決勝」（`0.30 >= hpRatio > 0.00`）**：蓄力速率提升至 `1.32x`，護體減傷 `15%`，施放專屬決勝氣場與台詞。
- **跨階段跳躍保護**：若單次高爆發攻擊或絕招使 Boss 血量直接從 `75%` 降至 `25%`，狀態機直接將 `bossPhaseIndex` 更新為 `2`，**僅播放一次階段 2「決勝」轉場提示**，不補播階段 1 動畫。

---

### 第二階段：動態題數與四層題庫防重

#### 1. 動態補題佇列（`ensureBattleQuestionQueue()`）
- 戰鬥開始時先透過 `buildGradeQuestionSession()` 抽取初始 `12` 題。
- 每當玩家完成一題且 `enemyHp > 0` 時，檢查剩餘未打題目數 `remainingQuestions.length`：
  - 若 `remainingQuestions.length < 5`，立即呼叫 `replenishBattleQuestions(8)` 動態追加 `8` 題至佇列尾端。
  - UI 上方題號顯示改為「**第 N 招** · 敵方氣血剩餘 XX%」（非戰鬥關卡則維持「第 N / M 題」）。

#### 2. 四層防重與中英分池管理（`js/utils/gradeQuestionMix.js`）
- **中英歷史分池**：存檔中分別維護 `recentQuestionsZh`（最近 60 題中文題目）與 `recentQuestionsEn`（最近 60 題英文題目），互不擠占配額。
- **四層抽樣優先順序**：
  1. **錯題複習層（Layer 4 - 溫故知新）**：從玩家近期打錯字詞池 `mistakePool` 中，每波抽取最多 `20%` 題目（標記 `isReview: true`，UI 顯示「溫故知新」金色小籤），答對 2 次後自動移出 `mistakePool`。
  2. **同場戰鬥禁重（Layer 1 - `sessionUsedSet`）**：同一場戰鬥已出現過的題目優先 `100%` 排除。
  3. **相鄰關卡防重（Layer 2 - `recentQuestionsZh/En`）**：排除最近 60 題已打過的題目。
  4. **長期熟練度降權（Layer 3 - `practicedCounts`）**：依歷史完成次數計算抽樣權重 $w = \frac{1}{1 + 0.5 \times \text{count}}$，讓未練習過的新詞優先出現。
- **題庫不足自動放寬保護（Graceful Fallback）**：
  - 當特定年級／題型過濾後可用候選題數不足時，依序放寬：`放寬 Layer 3 權重 -> 放寬 Layer 2 近期排除（僅排除最近 15 題） -> 放寬 Layer 1 同場排除`，確保任何情況下皆不會無題可抽或陷入無窮迴圈。

---

### 第三階段：武器流派深化

調整 [`js/data/adventureWorld.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/data/adventureWorld.js) 中既有兵器的流派參數（`school`, `passiveDesc`, `ultName`, `ultDesc`），讓每把武器具備實質戰鬥手感差異：

| 流派 (`school`) | 代表兵器 | 核心戰鬥定位與被動機制 | 絕招 (`Space` / 滿氣施放) |
| :--- | :--- | :--- | :--- |
| **劍系 (`sword`)** | 青竹練習劍、松風鐵劍、寒玉青鋒劍、太虛星河劍 | **連擊增傷型**：Combo 每 +1 提升 `+1.8%` 傷害（上限 `+65%`），聚氣效率 `1.15x`。 | **萬劍歸宗**：多段水墨劍氣連斬，施放後額外贈送 `+5 Combo`。 |
| **刀系 (`blade`)** | 赤銅雁翎刀、烈焰斬馬刀 | **詞語爆發型**：基礎攻擊高，完成 2 字以上詞語／成語時觸發「烈焰重斬」額外 `+28%` 爆發傷害；聚氣效率 `0.90x`。 | **焚天烈焰斬**：單發巨額烈焰斬擊（`1.35x` 絕招倍率），對敵方造成灼燒破甲。 |
| **槍系 (`spear`)** | 白蠟長槍、雷霆破軍槍 | **破防斷招型**：完成題目額外削減敵方蓄力條 `18%`，且攻擊完全無視敵方防禦與 Boss 護體減傷。 | **雷霆破軍刺**：貫穿敵陣，削減敵方蓄力條 `60%` 並使敵方暈眩停滯 `2.2` 秒。 |

---

### 第四階段：新增第三角色「馴獸師・林牧風」與四種靈獸

#### 1. 角色定義（新增至 `PLAYABLE_CHARACTERS`）
```javascript
mu_tamer: {
  id: 'mu_tamer',
  name: '林牧風',
  title: '萬獸山莊少主',
  school: 'beast',
  avatar: 'assets/icons/mu_avatar_v5.png',
  spriteKey: 'mu_tamer',
  defaultBeastId: 'beast_dog',
  desc: '通曉百獸靈語的少年少主，以竹笛與獸鈴號令靈獸並肩作戰。'
}
```

#### 2. 四種靈獸完整規格（新增 `SPIRIT_BEASTS` 資料表）

| 靈獸 ID | 名稱 | 取得方式與價格 | 基礎攻撃 (`atk`) | 專屬戰鬥機制 | 靈獸絕招 | 對應立繪與圖示 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `beast_dog` | **追風靈犬** | 初始贈送（`0` 銅錢） | `14` | **疾風連咬**：每完成單一國字（`onCharComplete`）立即觸發快速撲咬，額外造成 `+4` 傷害並微退敵方蓄力 `3%`。 | **疾風連撲**：連續三段靈犬撲咬並回復玩家氣血 `+10`。 | `beast_dog_v5.png` / `beast_dog_icon_v5.png` |
| `beast_eagle` | **穿雲靈鷹** | 客棧購買（`180` 銅錢） | `22` | **穿雲俯衝**：完成詞語時從高空俯衝，無視敵方防禦並打斷敵方蓄力條 `22%`。 | **九霄穿雲擊**：金青羽刃俯衝貫穿，清空敵方蓄力條 `65%` 並緩速 `2.5` 秒。 | `beast_eagle_v5.png` / `beast_eagle_icon_v5.png` |
| `beast_toad` | **碧玉毒蟾** | 客棧購買（`260` 銅錢） | `26` | **碧玉奇毒**：完成詞語時施加 3 層劇毒，每完成下一題額外扣除敵方最大 HP `4%`（**Boss 單跳上限 `35` 點**），並降低敵方蓄力速度 `15%`。 | **萬毒碧霧陣**：引爆劇毒造成大額毒傷，立即刷新 4 層碧玉奇毒並削弱敵方攻擊。 | `beast_toad_v5.png` / `beast_toad_icon_v5.png` |
| `beast_wolf` | **嘯月蒼狼** | 高階客棧購買（`380` 銅錢） | `36` | **嘯月連爪**：每 5 Combo 提升 `+8%` 傷害（上限 `+56%`）；當 Combo 達 10 之倍數或完成 4 字以上題目時，追加「嘯月二連爪」（額外 `45%` 傷害）。 | **蒼狼嘯月斬**：銀藍月華五連爪擊（`1.40x` 絕招倍率），並直接疊加 `+8 Combo`。 | `beast_wolf_v5.png` / `beast_wolf_icon_v5.png` |

#### 3. 客棧分頁與戰鬥畫面演出規則
- **客棧分流**：當玩家目前選用角色為 `mu_tamer` 時，客棧原本的「兵器」頁籤標題自動顯示為「**靈獸**」，渲染 `SPIRIT_BEASTS` 清單，共用 `state.coins` 購買，並透過 `equipBeast(beastId)` 切換上場靈獸；切換回劍／刀／槍角色時則顯示原兵器頁。
- **Canvas 雙重站位與防遮擋演出（`CanvasBattleScene.js`）**：
  - 馴獸師位於左側後方（`x = width * 0.16, y = groundY`），當前裝備之靈獸位於左前衛（`x = width * 0.30, y = groundY`，靈鷹則懸浮於 `groundY - 38`）。
  - **輕量局部動畫原則**：平時打字（`onCorrectKey` / `onCharComplete`）馴獸師僅做微幅手勢／笛音光圈，靈獸原地短促前衝 `18px` 並於敵方身上綻放 `beast_claw_v5.png` 或 `beast_dive_v5.png` 特效，**絕不橫跨整個畫面來回奔跑遮擋上方題目框**。
  - 僅於整題完成（`onWordComplete`）、Combo 里程碑或施放絕招時，才播放靈獸完整突進與水墨氣場演出。

---

### 第五階段：情境背景音樂、流派音效與智慧朗讀

#### 1. 情境國風背景音樂（`AudioEngine.js`）
採用 Web Audio API 古風五聲音階（宮商角徵羽）合成器實作 5 首零外部檔案依賴之情境 BGM，切換場景時自動交叉淡入淡出：
- `bgm_title`：江湖首頁／大地圖（悠遠竹笛與古琴分解和弦）
- `bgm_battle`：一般戰鬥（輕快琵琶輪指與戰鼓節拍）
- `bgm_boss`：Boss 戰（緊湊急促的低音大鼓與箏曲張力）
- `bgm_inn`：客棧休整（溫暖輕柔的茶肆絲竹小調）
- `bgm_story`：劇情對話與通關結算（清朗鐘磬與水墨餘韻）

#### 2. 流派與靈獸專屬戰鬥音效（`playFactionStrikeSfx(styleKey)`）
- `sword`：清脆金屬劍鳴與破空聲
- `blade`：厚重刀鋒斬擊與烈焰爆鳴
- `spear`：長槍破風與雷鳴電流聲
- `beast_dog` / `beast_wolf`：利爪撕裂風聲與短促威武低鳴
- `beast_eagle`：高亢破空鷹嘯與羽刃風聲
- `beast_toad`：深沉鼓鳴與碧霧氣泡聲

#### 3. 中英朗讀優先權管理（`speakText(text, lang, options)`）
- **自動朗讀觸發時機**：
  - 單字、詞語、成語、英文單字於**整題完成（`onWordComplete`）**時自動朗讀完整詞彙。
  - **長句（字數 `>= 8`）預設不自動朗讀**，避免長句語音拖慢下一題節奏；玩家可隨時點擊「🔊 重聽」手動播放。
- **防截斷與防堆積佇列規則**：
  - **手動重聽（`options.manual = true`）**：最高優先權，立即呼叫 `speechSynthesis.cancel()` 並播放該題語音。
  - **自動朗讀（`options.manual = false`）**：若 `speechSynthesis.speaking` 為真且前一個完整詞語尚未播完，**不強制截斷前一個詞語，亦不排入長佇列**（直接略過本次自動語音或僅保留最新一筆待播），確保快速打字時語音乾淨不重疊。

#### 4. 四項獨立音訊設定與持久化
於頂部狀態列／設定面板提供四個獨立開關，即時寫入 `wuxia_adventure_v1.audioSettings`：
1. `bgmEnabled`（背景音樂，預設 `true`）
2. `sfxEnabled`（戰鬥音效，預設 `true`）
3. `ttsAutoEnabled`（完成自動朗讀，預設 `true`）
4. `masterMuted`（總靜音，預設 `false`）

---

### 第六階段：六章三十關數值平衡與存檔無損遷移

#### 1. 六章三十關敵人 HP 與學年平衡矩陣
於 `adventureWorld.js` 為所有戰鬥與 Boss 節點配置明確的 `enemyHp` 與 `defense`：

| 章節 | 章節主題 | 一般戰鬥節點 HP | 精英戰鬥節點 HP | 章節 Boss HP（含三階段） | 設計重點 |
| :--- | :--- | :---: | :---: | :---: | :--- |
| 第一章 | 山門初行 | `95 ~ 125` | `150` | `220`（試探／破防／決勝） | 新手熟悉注音與基礎攻擊，約 5～8 題擊敗一般敵人 |
| 第二章 | 竹海尋信 | `140 ~ 175` | `210` | `310` | 引導 Combo 累積與槍／靈鷹斷招破防 |
| 第三章 | 古驛燈火 | `190 ~ 235` | `280` | `420` | 客棧添購進階兵器／靈獸，體驗絕招爆發 |
| 第四章 | 襄陽會武 | `250 ~ 310` | `370` | `550` | 四大流派（劍／刀／槍／馴獸）特色全面展開 |
| 第五章 | 月下墨閣 | `330 ~ 400` | `470` | `700` | 持久戰與毒蟾／高階防具續航配合 |
| 第六章 | 雲海歸字 | `420 ~ 500` | `580` | `880` | 最終三階段完整 Boss 戰與大結局 |

#### 2. `wuxia_adventure_v1` 存檔向下相容與無損遷移
在 [`AdventureEngine.js`](file:///C:/Development/GitHub/16_Wuxia-Typing-Legend/js/core/AdventureEngine.js) 的 `_normalizeState(raw)` 中實作嚴格向後相容：
- 完整保留舊版玩家之 `coins`, `unlockedChapterIds`, `clearedNodeIds`, `nodeStars`, `collectedSeals`, `ownedWeaponIds`, `ownedArmorIds`, `equippedWeaponId`, `equippedArmorId`, `selectedGrade`, `selectedRealm`。
- 自動補齊 v2.1.0 新增欄位預設值：
  - `schemaVersion: 2`
  - `ownedBeastIds: Array.isArray(raw.ownedBeastIds) ? raw.ownedBeastIds : ['beast_dog']`
  - `equippedBeastId: raw.equippedBeastId || 'beast_dog'`
  - `recentQuestionsZh: Array.isArray(raw.recentQuestionsZh) ? raw.recentQuestionsZh : (Array.isArray(raw.recentQuestions) ? raw.recentQuestions : [])`
  - `recentQuestionsEn: Array.isArray(raw.recentQuestionsEn) ? raw.recentQuestionsEn : []`
  - `practicedCounts: (raw.practicedCounts && typeof raw.practicedCounts === 'object') ? raw.practicedCounts : {}`
  - `mistakePool: Array.isArray(raw.mistakePool) ? raw.mistakePool : []`
  - `audioSettings: { bgmEnabled: true, sfxEnabled: true, ttsAutoEnabled: true, masterMuted: false, ...(raw.audioSettings || {}) }`
- 寫入保護：若 `JSON.parse` 或遷移過程發生任何異常，先將原始字串備份至 `localStorage.getItem('wuxia_adventure_v1_backup')`，絕不直接覆寫清空玩家既有進度。

---

## 四、建議執行順序與自動化驗收標準

| 執行步驟 | 實作目標 | 驗收與單元測試條件（`npm test`） |
| :--- | :--- | :--- |
| **Step 1** | 擴充 `adventureWorld.js` 與 `AdventureEngine.js`（真實傷害管線、Boss HP 三階段、存檔遷移） | 新增單元測試驗證：1) `enemyHp <= 0` 才判定戰鬥勝利；2) 長句傷害受根號曲線封頂不爆表；3) 單次大招跨階段直接進入最終階段；4) v2.0.0 舊存檔無損升級。 |
| **Step 2** | 升級 `gradeQuestionMix.js`（動態補題、四層防重、中英分池、題庫不足降級） | 新增單元測試驗證：1) 連續補題 50 題無重複且不中斷；2) 小題庫極端情境自動放寬不拋錯；3) 錯題池以 `<= 20%` 比例混入並標記 `isReview`。 |
| **Step 3** | 實作第三角色「馴獸師・林牧風」與四種靈獸（含客棧靈獸欄切換、毒蟾 Boss 毒傷上限） | 新增單元測試驗證：1) 馴獸師購買與切換四靈獸正常；2) 毒蟾對 Boss 單跳毒傷不超過 `35`；3) 靈鷹與長槍破防削減蓄力正確。 |
| **Step 4** | 升級 `CanvasBattleScene.js` 與 `AudioEngine.js`（掛載 12 張 v5 透明資產、雙站位演出、5 首情境 BGM、智慧朗讀與四項音訊設定） | 瀏覽器實測與自動化測試：1) 12 張 v5 PNG 載入無 404；2) 馴獸師與靈獸同場渲染不遮擋題目；3) 音訊設定重新整理後持久化保留。 |
| **Step 5** | 執行完整測試套件（`npm test`）與 Playwright 畫面實測 | 既有 50 項測試 + 新增 v2.1.0 測試 `100%` 通過，零 Console Error。 |

---

## 方案 B：多姿態攻擊動畫（2026-10-09，目前執行工作）

### 目標與驗收條件
以既有正式立繪為基準，盤點及保留合格素材、修正確實有問題的素材，再補齊預備／攻擊／命中／收招。Phase A 須逐組實際檢視、透明邊界及腳底錨點驗證通過，才進入 Canvas 2D 整合。詳細規格以使用者本次方案 B 任務書及 A1-1 授權為準。

### 不做範圍
不重新設計正式角色、不翻新無關場景或 UI、不更換引擎、不修改打字判定、題庫、傷害及存檔規則。保留原始素材；未通過驗收的生成圖不接入遊戲。

### 現況與已確認決策
- Git 基準 master／6d0a65d；前輪 v2.1.0 有 17 個已追蹤異動與 12 張未追蹤素材，保留並排除本輪提交。
- 實際戰鬥圖片為雙主角各五組外觀（木劍／青鋒／玄鐵／刀／槍），龍刀共用刀立繪、鐵槍共用槍立繪，不另外假造裝備外觀。
- 林牧風與四靈獸已在現有未提交程式接入，需納入盤點，是否能完成新姿態以實際產出為準。
- 已檢視 19 張人物／靈獸、10 張敵人、11 張特效共 40 張；現有素材暫無需要全面重製的明顯視覺問題。
- 先以雲清川木劍單組驗證生成流程與身份一致性，再擴展其他組。生成後仍須驗收，不能以產出檔案視為完成。

### 工作清單
- [x] 讀取專案規範、交接、實際程式與 Git 現況。
- [x] 盤點戰鬥素材並建立原檔 SHA-256 基準。
- [x] 執行既有完整測試：53／53 通過。
- [x] 記錄 A～D 分級、來源與每組缺口，完成獨立預覽頁。
- [x] 完成雙主角各裝備姿態及逐組驗收。
- [x] 完成林牧風／靈獸與代表敵人必要姿態及驗收。
- [x] Phase A 通過後才整合動畫、快速打字銜接及減少動態效果。
- [x] 執行動畫測試、完整測試與隔離來源實際遊玩，更新交接。

### 風險與因應
生成圖可能發生臉型、武器、服裝漂移；使用正式立繪參考，逐組比較。不因個人偏好重畫合格素材；反覆無法達到身份一致性時，保留最佳可用圖並停止消耗，回報具體差異。
未提交的既有功能異動不得混入本輪提交。此段以追加方式保留前輪計畫。

### 驗證紀錄與剩餘問題
2026-10-09：Phase A 已驗收全部 19 組、76 張姿態；40 張原圖保留。Phase B 已整合正式 Canvas 2D：攻擊四姿態、敵人反應、快速輸入合併、大招優先、漏圖回退、輪廓邊界與減少動態。完整測試 61／61 通過；117 張圖片驗證通過；正式渲染器逐組繪製全部 76 張，遊戲鍵盤、中文長句、英文短句、Combo、絕招、換裝換角、重載、鍵盤收合與主要桌面／筆電尺寸實測通過。沒有未完成的必要新素材或本輪功能。詳細交付結果見 assets/animations/PHASE_A_REVIEW.md 與 PHASE_B_REVIEW.md。本輪未 Commit／Push，不混入前輪工作。
