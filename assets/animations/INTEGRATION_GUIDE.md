# 方案 B 美術交付與接入說明

交付對象：Antigravity。日期：2026-10-09。專案：`16_Wuxia-Typing-Legend`。

## 接手指令（可直接交給 Antigravity）

請將已驗收的方案 B 美術與目前專案結合。先讀取專案 AGENTS.md、HANDOFF.md 文末最新斷點及本說明，再以實際 Working Tree／Diff 確認版本。

**美術已完成，請繼承成果。這個本機工作目錄也已完成第一輪 Canvas 動畫整合；尚未 Commit／Push。** 若接手同一目錄，先驗證現有整合，不要重新製作動畫或把遠端較舊版本蓋回來。若接手不同版本，依目前專案程式逐段接入素材與必要動畫邏輯，不整份覆寫既有控制器。

以 `manifest.json` 為正式素材、錨點與驗收狀態的單一來源；只使用 `groups[].frames` 中 `approved: true` 的圖片。保留目前正式角色、武器及靈獸設定，不因個人審美全面重畫。禁止把 candidates 的早期試製圖混入正式版本。

完成後實際遊玩，檢查快打、Combo、大招、敵人受擊與敗退、角色／裝備／靈獸切換、鍵盤收合、主要視窗尺寸及減少動態。將結果更新到共用 HANDOFF.md；不要另建個人交接檔。使用者未要求 Commit／Push／Release，請勿自行發布。

## 美術交付清單

| 組別 ID | 數量 | 姿態 |
| --- | ---: | --- |
| yun_wood_sword、yun_qingfeng_sword、yun_xuantie_sword、yun_flame_saber、yun_thunder_spear | 5 組／20 張 | windup、attack、impact、recover |
| su_wood_sword、su_qingfeng_sword、su_xuantie_sword、su_flame_saber、su_thunder_spear | 5 組／20 張 | 同上 |
| mu_tamer | 1 組／4 張 | 同上 |
| beast_dog、beast_eagle、beast_toad、beast_wolf | 4 組／16 張 | 同上 |
| enemy_wood_dummy、enemy_bandit_scout、enemy_earth_puppet、enemy_blackwind_boss | 4 組／16 張 | hit、stagger、defeat、recover |

共 19 組、76 張正式透明 PNG。待機沿用原正式立繪。40 張原有人物、敵人及特效列 A 級保留，未修改原檔；既有局部修正 0、重製 0。新增圖曾修正劍尖／槍尖裁切與蒼狼多餘光弧，最終版本已複驗。

主要路徑均相對於 Repository 根目錄：

- `assets/animations/poses/{group}/{pose}_v1.png`：正式單張素材。
- `assets/animations/manifest.json`：尺寸、可見邊界、錨點、倍率、時間、來源、原圖雜湊及核准狀態。
- `assets/animations/sheets/{group}_v1.png`：最終來源圖集，供必要局部修正追溯。
- `assets/animations/sheet-generation-records.json`：正式組別提示詞與生成／修正來源。
- `assets/animations/review_1.jpg`、`review_2.jpg`、`review_3.jpg`：正式立繪與四姿態比較。
- `assets/animations/PHASE_A_REVIEW.md`：美術盤點、來源與驗收結果。
- `assets/animations/preview.html`：美術比較、背景切換與連續錨點預覽。
- `assets/animations/battle-preview.html`：正式渲染器預覽，需放在完整專案中使用。

`candidates/`、早期 `yun_wood_comparison.png` 及舊試製記錄只供追溯，不是正式交付姿態。不要按資料夾內所有 PNG 自動建立角色清單。

## 接入與繪製規則

1. 使用 Manifest 的完整透明畫布；不要自行去除留白、另行裁圖或按每張可見高度重新縮放，否則會破壞腳底錨點及整組比例。
2. `anchor.x/y` 為完整 PNG 的正規化座標；`anchor.scale` 為相對於遊戲角色基準高度的倍率。以同組固定基準高度播放，蹲身時自然降低，不拉成站立高度。
3. 若基準高度為 H，實際圖高為 `H * anchor.scale`，圖寬按 PNG 長寬比計算；繪製左上角為 `(腳底X - anchor.x * 圖寬, 腳底Y - anchor.y * 圖高)`。目前正式渲染器另外使用共用地面偏移 `+6`，接入時保持一致即可。
4. 靈獸的相對體型已包含在 `anchor.scale`，不要再乘一次原靈獸倍率。馴獸師與出戰靈獸使用同一攻擊階段。
5. 預留整組最大 `visibleBounds` 的水平輪廓，保護槍尖、劍尖與披風；不要依每張姿態改變腳底位置。窄畫面還須保護題目與鍵盤區。
6. 普通角色與靈獸依 windup → attack → impact → recover → idle 播放；敵人 hit／stagger → recover → idle。defeat 只能由勝利／擊敗事件觸發，保持到下一場。
7. 圖片未載入或失敗時，回到同角色／同武器正式待機圖；不得回退成另一個人物。動畫不得延遲或重複計算傷害。
8. 高速輸入只合併演出，遊戲傷害與題目進度照常處理；大招保持較高優先權。換裝、換角或換場清除舊動畫。

裝備／敵人別名：

| 專案鍵值 | 動畫組別 |
| --- | --- |
| yun_dragon_saber／su_dragon_saber | 對應角色 flame_saber |
| yun_iron_spear／su_iron_spear | 對應角色 thunder_spear |
| enemy_wood | enemy_wood_dummy |
| enemy_puppet | enemy_earth_puppet |
| enemy_boss | enemy_blackwind_boss |

## 已有程式整合（先確認，避免重做）

- `src/data/battleAnimations.js`：由 Manifest 產生的正式索引及別名，不是第二份手動維護的錨點來源。
- `src/scenes/BattlePoseAnimation.js`：純視覺時鐘、優先權、最多一筆待播合併、敗退保持。
- `src/scenes/CanvasBattleScene.js`：當前組別預載、人物／獸／敵人姿態、同身份回退、輪廓保護及減少動態。
- `src/adventure.js`：已有勝利敗退、前景演出重設與減少動態位移修正。
- `tests/battleAnimation.test.js`：8 項邊界測試，已加入 npm test。

本機檔案已整合，不能將「Git 未提交」理解為「尚未實作」。既有 Working Tree 還包含前輪 RPG、題庫、音訊與 v5 素材工作，不得抹除、stash 丟棄或以舊 HEAD 覆蓋。

## 接手驗證

由 Repository 根目錄執行：

```sh
npm test
```

使用已確認且可匯入 Pillow 的 Python 直譯器執行：

```sh
python scripts/validate_animation_assets.py
```

只有變更已驗收素材／錨點後才重建索引：

```sh
python scripts/build_animation_catalog.py
```

以上 Python 表示已確認的直譯器指令，不要求固定個人安裝路徑。一般接手不需要 `--approve-reviewed`，不得把此參數當成略過視覺驗收的捷徑。

以專案既有靜態 HTTP 服務開啟兩個預覽頁，並在正式遊戲實測。交接時的結果為 61／61 測試通過、117 張圖片檢查通過、40 張原圖雜湊不變；正式 Canvas 實際繪製全部 76 張，遊戲鍵盤、中文長句、英文含空白短句、Combo、大招、換裝、換角與重載已驗證。詳細證據與人工遊玩範圍見 `PHASE_B_REVIEW.md`，接入其他版本後仍須重新驗證。

## 交接包使用方式

交接 ZIP 保留 Repository 相對路徑，包含完整 `assets/animations/`、四個素材工具、正式索引與純視覺時鐘參考。不包含整份 `CanvasBattleScene.js`／`adventure.js` 或其他前輪未提交程式，避免覆蓋接手版本。

同一工作目錄直接讀現有檔案即可。不同工作目錄請先將 ZIP 解壓到獨立暫存位置，比對後再接入；不要直接覆蓋同名檔。原有正式角色、敵人、特效及 v5 素材由接手的完整專案提供；ZIP 是美術交接包，不是完整可獨立執行的遊戲。

本輪圖片由使用者授權，依正式參考透過 OpenAI image_gen 製作；來源記錄保留，使用界線依專案 `NOTICE.md`，不額外宣告 MIT 授權。對合格素材不進行無關重畫。
