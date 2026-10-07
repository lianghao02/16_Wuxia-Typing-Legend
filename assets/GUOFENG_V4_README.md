# 新國風素材 v4：第二階段 24 件增補

## 本輪範圍與計數

依使用者正文第 1～14 項共生成 24 件，保留第一批 37 件，合計 61 件。表格另列的「大千注音鍵盤底紋」未含在正文 24 件內；若再增補，將是 62 件。

本批分類：結算與成就 7 件、主角姿態 4 件、對手特效 2 件、題庫與墨寶閣 4 件、鍵帽 4 件、技能橫幅與標題 2 件、首頁主視覺 1 件。新檔均以 `_v4.png` 命名。

## 交付與驗證

- 使用內建 image_gen 逐件生成，主角姿態與首頁參考初階 v3 立繪。完整實際提示詞見 `guofeng_v4_sources.json`。
- 24 件 PNG 的輸出尺寸通過實際檢查；23 件透明素材均為 RGBA，透明度範圍 0–255，非零透明度輪廓的四周至少留白 15%。首頁主視覺為 RGB。
- 原本 37 件 v3 檔案的 SHA-256 均與原清單相符，本輪未改動。
- 新增約 10.08 MiB。`guofeng_v4_manifest.json` 為本批清單；`guofeng_all_manifest.json` 為合併 61 件清單，均採相對路徑。
- `guofeng_all_preview.html` 可直接於瀏覽器開啟查看 61 件。
- 已目視檢查主要構圖、印章及標題文字，並重生偏離用途的印章、Logo 與首頁姿勢。尚未做遊戲內整合或不同螢幕實測。

## Antigravity 整合建議

### 角色狀態與接地

四張 hurt/block 圖僅支援初階布衣＋桃木劍。中、高階不可直接切換，避免服裝與武器跳回初階；可暫用現有階級立繪的小幅位移或旋轉回饋。

姿態 PNG 不是可直接等比例切換的動畫逐格表。各圖輪廓寬度會隨持劍姿態改變，請依頭部大小與鞋底位置校正顯示比例及錨點。manifest 的 alphaBounds 與 anchorSuggestion 是初始資料，不保證腳底或頭部完全對齊。可使用短時間狀態切換、再返回 idle；本輪不修改狀態程式。

遵守兒童防挫折規則：錯鍵只觸發 block／架招，不扣血、不整屏染紅；hurt 用於既有機制中真正的受擊情境。草木碎屑供練功靶使用，白光是可疊於各人型敵人的共用受擊貼圖，並非精準人體剪影。控制特效透明度、尺寸及停留時間，保持中央題目可讀。

### 鍵帽與教學文字

四張鍵帽皆刻意不畫固定字，程式需疊加「確切按鍵、注音／聲調、左右手及手指名稱」。左右手色彩只有類別訊息，不能代表八根手指各自的實體鍵對應；顏色也不可作為唯一提示。

聲調鍵每次疊加當下需要的 ˙、ˊ、ˇ 或 ˋ；一聲鍵顯示「空白鍵／一聲」。選取提示時務必使用目前待輸入字與鍵碼的同一份狀態，避免重現完成一字後仍提示前一字的問題。本輪未修改此操作邏輯；其他工作階段是否已修復，需另外確認。

三大出版社對應遊戲自創祕笈封面，未使用出版社商標。介面另顯示出版社、年級、冊次與書名，勿只靠圖內小字辨識，也勿讓裝飾暗示官方背書。

### 結算與首頁

三枚印章有既定文字；其觸發條件由遊戲設定與原本評分邏輯決定，不應由素材檔名推定。三枚境界徽章沒有畫固定名稱，請以介面文字補上「初出茅廬／名震江湖／一代宗師」。重整旗鼓維持鼓勵語氣。

卷軸中央留白供成績文字，使用清楚黑體或宋體。書法 Logo 僅用在品牌主標，不用於打字題目。技能橫幅無文字，可動態放招式名。圖外透明留白納入版面計算；文案位置應對齊可見內框，而非整張 PNG 的邊緣。

首頁背景左側留白供 Logo 與選單，兩位主角位於右側背靠背站立。不同螢幕優先保留人物與左側內容區，採等比例 contain 或經驗證的裁切錨點；窄螢幕可將選單移到背景下方。不要橫向拉伸 Logo、立繪或鍵帽。

## 素材清單

| 編號 | 素材 | 路徑 | 尺寸 |
|---|---|---|---|
| 38 | 甲上・完勝朱砂印章 | [ui/stamp_perfect_v4.png](ui/stamp_perfect_v4.png) | 512×512 |
| 39 | 登峰造極朱砂印章 | [ui/stamp_record_v4.png](ui/stamp_record_v4.png) | 512×512 |
| 40 | 重整旗鼓朱砂印章 | [ui/stamp_retry_v4.png](ui/stamp_retry_v4.png) | 512×512 |
| 41 | 通關境界卷軸底紋 | [ui/results_scroll_v4.png](ui/results_scroll_v4.png) | 1024×768 |
| 42 | 初出茅廬銅牌徽章 | [icons/realm_beginner_v4.png](icons/realm_beginner_v4.png) | 512×512 |
| 43 | 名震江湖銀紋佩玉 | [icons/realm_renowned_v4.png](icons/realm_renowned_v4.png) | 512×512 |
| 44 | 一代宗師蟠龍金令 | [icons/realm_grandmaster_v4.png](icons/realm_grandmaster_v4.png) | 512×512 |
| 45 | 雲清川・受擊後仰 | [characters/yun_wood_hurt_v4.png](characters/yun_wood_hurt_v4.png) | 1080×1440 |
| 46 | 雲清川・橫劍招架 | [characters/yun_wood_block_v4.png](characters/yun_wood_block_v4.png) | 1080×1440 |
| 47 | 蘇映雪・受擊後仰 | [characters/su_wood_hurt_v4.png](characters/su_wood_hurt_v4.png) | 1080×1440 |
| 48 | 蘇映雪・提劍格擋 | [characters/su_wood_block_v4.png](characters/su_wood_block_v4.png) | 1080×1440 |
| 49 | 草木碎屑飛濺 | [effects/training_debris_v4.png](effects/training_debris_v4.png) | 512×512 |
| 50 | 人型對手受擊白光 | [effects/humanoid_hit_flash_v4.png](effects/humanoid_hit_flash_v4.png) | 512×512 |
| 51 | 青囊玉笈線裝古書 | [icons/manual_kangxuan_v4.png](icons/manual_kangxuan_v4.png) | 512×512 |
| 52 | 文曲心經古樸竹簡 | [icons/manual_hanlin_v4.png](icons/manual_hanlin_v4.png) | 512×512 |
| 53 | 墨客奇經絲絹手抄本 | [icons/manual_nanyi_v4.png](icons/manual_nanyi_v4.png) | 512×512 |
| 54 | 墨寶閣硯台毛筆裝飾 | [ui/review_inkstone_v4.png](ui/review_inkstone_v4.png) | 768×768 |
| 55 | 左手黛藍鍵帽 | [ui/keycap_left_v4.png](ui/keycap_left_v4.png) | 256×256 |
| 56 | 右手碧玉鍵帽 | [ui/keycap_right_v4.png](ui/keycap_right_v4.png) | 256×256 |
| 57 | 聲調赤金鍵帽 | [ui/keycap_tone_v4.png](ui/keycap_tone_v4.png) | 256×256 |
| 58 | 一聲白玉空白鍵帽 | [ui/keycap_space_v4.png](ui/keycap_space_v4.png) | 256×256 |
| 59 | 水墨飛白招式橫幅 | [ui/skill_banner_v4.png](ui/skill_banner_v4.png) | 1200×300 |
| 60 | 武俠打字傳書法標題 | [ui/title_logo_v4.png](ui/title_logo_v4.png) | 1200×500 |
| 61 | 江湖大門首頁主視覺 | [backgrounds/home_hero_v4.png](backgrounds/home_hero_v4.png) | 1920×1080 |
